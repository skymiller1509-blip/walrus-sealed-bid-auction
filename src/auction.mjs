// Sealed-bid auction core logic (pure, no I/O except the blob store).
//
// How sealing works — a commitment scheme, not encryption:
//   commitment = SHA-256(auctionId | bidder | amount | salt)
// The bidder keeps `amount` and `salt` secret. Only the commitment is
// stored (in a Walrus blob, or the local blob store). Nobody — not other
// bidders, not the seller, not anyone reading the public Walrus blobs —
// can learn the amount from the commitment, and the bidder cannot change
// their bid later: at reveal they must produce the exact amount + salt
// that hash to the stored commitment, or the reveal is rejected.
//
// Phases (times are epoch ms; the demo uses short windows):
//   bidding -> reveal -> settled
// Rules:
//   - One sealed bid per bidder. Amount must be >= minBid.
//   - Reveal only inside the reveal window, only for a bid that was sealed.
//   - Wrong amount or salt at reveal = rejected, bid is void.
//   - Winner = highest valid revealed bid. Tie = earliest reveal wins.
//   - No bid amount is ever written to a blob or to the state file before
//     its owner reveals it.
import { createHash } from "node:crypto";

export function commitmentFor({ auctionId, bidder, amount, salt }) {
  return createHash("sha256")
    .update(`${auctionId}|${bidder}|${amount}|${salt}`, "utf8")
    .digest("hex");
}

export function phaseOf(auction, now = Date.now()) {
  if (now < auction.biddingEndsAt) return "bidding";
  if (now < auction.revealEndsAt) return "reveal";
  return "settled";
}

export function createAuction({ id, item, description, minBid, biddingSeconds = 3600, revealSeconds = 3600, now = Date.now() }) {
  if (!id || !item) throw new Error("auction needs an id and an item");
  if (!(minBid > 0)) throw new Error("minBid must be > 0");
  return {
    id,
    item,
    description: description ?? "",
    minBid,
    createdAt: now,
    biddingEndsAt: now + biddingSeconds * 1000,
    revealEndsAt: now + (biddingSeconds + revealSeconds) * 1000,
    sealedBids: [], // { bidder, commitment, blobId, backend, placedAt }
    reveals: [], // { bidder, amount, salt, revealedAt, valid }
    winner: null,
  };
}

// Stores the sealed-bid blob {auctionId, bidder, commitment, placedAt}
// via the blob store. Returns the sealed bid record (no amount inside).
export async function placeSealedBid(auction, store, { bidder, amount, salt, now = Date.now() }) {
  if (phaseOf(auction, now) !== "bidding") throw new Error("bidding is closed for this auction");
  if (!bidder || !salt) throw new Error("bidder and salt are required");
  if (!(amount >= auction.minBid)) throw new Error(`bid ${amount} is below the minimum ${auction.minBid}`);
  if (auction.sealedBids.some((b) => b.bidder === bidder)) throw new Error(`${bidder} already placed a sealed bid`);
  const commitment = commitmentFor({ auctionId: auction.id, bidder, amount, salt });
  const blob = Buffer.from(JSON.stringify({ auctionId: auction.id, bidder, commitment, placedAt: now }));
  const { blobId, backend } = await store.store(blob);
  const sealed = { bidder, commitment, blobId, backend, placedAt: now };
  auction.sealedBids.push(sealed);
  return sealed;
}

// What everyone can see while bidding is open: hashes only, no amounts.
export function listSealedBids(auction) {
  return auction.sealedBids.map(({ bidder, commitment, blobId, backend, placedAt }) => ({
    bidder,
    commitment,
    blobId,
    backend,
    placedAt,
  }));
}

// Reveal: the bidder shows amount + salt. Accepted only if they hash to
// the stored commitment, and only inside the reveal window.
export async function revealBid(auction, store, { bidder, amount, salt, now = Date.now() }) {
  if (phaseOf(auction, now) !== "reveal") throw new Error("not in the reveal window");
  const sealed = auction.sealedBids.find((b) => b.bidder === bidder);
  if (!sealed) throw new Error(`${bidder} has no sealed bid to reveal`);
  if (auction.reveals.some((r) => r.bidder === bidder)) throw new Error(`${bidder} already revealed`);
  const commitment = commitmentFor({ auctionId: auction.id, bidder, amount, salt });
  if (commitment !== sealed.commitment) {
    throw new Error(`reveal rejected for ${bidder}: amount/salt do not match the sealed commitment (bid void)`);
  }
  const blob = Buffer.from(JSON.stringify({ auctionId: auction.id, bidder, amount, revealedAt: now }));
  const { blobId, backend } = await store.store(blob);
  const reveal = { bidder, amount, salt, revealedAt: now, valid: true, blobId, backend };
  auction.reveals.push(reveal);
  return reveal;
}

// Settles after the reveal window. Highest valid reveal wins;
// ties go to the earliest reveal.
export function settle(auction, now = Date.now()) {
  if (phaseOf(auction, now) !== "settled") throw new Error("cannot settle before the reveal window ends");
  if (auction.winner) return auction.winner;
  const valid = [...auction.reveals].filter((r) => r.valid).sort((a, b) => b.amount - a.amount || a.revealedAt - b.revealedAt);
  const winner = valid.length
    ? { bidder: valid[0].bidder, amount: valid[0].amount, revealedAt: valid[0].revealedAt, totalReveals: valid.length }
    : { bidder: null, amount: null, revealedAt: null, totalReveals: 0 };
  auction.winner = winner;
  return winner;
}
