// End-to-end demo: one sealed-bid auction, start to finish.
// Run: node demo.mjs
// Uses a virtual clock (explicit `now` values) so the whole auction runs
// in under a second. Amounts are play SUI on testnet only — no real money.
import { openBlobStore } from "./src/walrus.mjs";
import { fileURLToPath } from "node:url";
import {
  commitmentFor,
  createAuction,
  listSealedBids,
  placeSealedBid,
  revealBid,
  settle,
} from "./src/auction.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { store, note } = await openBlobStore(fileURLToPath(new URL("./blobs", import.meta.url)));
  console.log(`Storage: ${note}\n`);

  const t0 = Date.now();
  const auction = createAuction({
    id: "yeti-snowboard-001",
    item: "Yeti Snowboard — signed by Lofi",
    description: "One of one. Winner pays their own bid after reveal.",
    minBid: 10,
    biddingSeconds: 60,
    revealSeconds: 60,
    now: t0,
  });
  console.log(`Auction created: ${auction.item} (min bid ${auction.minBid} SUI)`);
  console.log(`Bidding open until ${new Date(auction.biddingEndsAt).toISOString()}, reveal until ${new Date(auction.revealEndsAt).toISOString()}\n`);

  // Three bidders place sealed bids. Only commitments leave their hands.
  const bids = [
    { bidder: "ama", amount: 120, salt: "ama-secret-7" },
    { bidder: "bola", amount: 200, salt: "bola-secret-3" },
    { bidder: "chidi", amount: 150, salt: "chidi-secret-9" },
  ];
  for (const [i, b] of bids.entries()) {
    const sealed = await placeSealedBid(auction, store, { ...b, now: t0 + (i + 1) * 1000 });
    console.log(`${b.bidder} sealed a bid -> commitment ${sealed.commitment.slice(0, 16)}... (blob ${sealed.blobId.slice(0, 16)}..., ${sealed.backend})`);
  }

  console.log("\nWhat everyone can see while bidding is open (hashes only):");
  for (const s of listSealedBids(auction)) {
    console.log(`  ${s.bidder}: ${s.commitment}`);
  }
  // Prove no amount leaked into any stored blob.
  for (const s of auction.sealedBids) {
    const parsed = JSON.parse((await store.read(s.blobId)).toString("utf8"));
    if (parsed.amount !== undefined) throw new Error("LEAK: amount in sealed blob");
    if (parsed.commitment !== s.commitment) throw new Error("blob read-back mismatch");
  }
  console.log("  Verified: every stored blob holds only a commitment — no bid amounts anywhere.\n");

  // Reveal window. First, a tampered reveal: Bola tries a wrong salt.
  const tReveal = t0 + 61_000;
  try {
    await revealBid(auction, store, { bidder: "bola", amount: 200, salt: "wrong-salt", now: tReveal });
    throw new Error("tampered reveal was accepted — bug");
  } catch (err) {
    console.log(`Tampered reveal rejected as it should be: ${err.message}`);
  }
  // Honest reveals.
  for (const [i, b] of bids.entries()) {
    const r = await revealBid(auction, store, { ...b, now: tReveal + (i + 1) * 1000 });
    console.log(`${r.bidder} revealed ${r.amount} SUI (verified against the sealed commitment)`);
  }

  const winner = settle(auction, t0 + 121_000);
  console.log(`\nWinner: ${winner.bidder} with ${winner.amount} SUI (${winner.totalReveals} valid reveals)`);
  if (winner.bidder !== "bola" || winner.amount !== 200) {
    throw new Error(`wrong winner: expected bola/200, got ${winner.bidder}/${winner.amount}`);
  }
  console.log("DEMO OK — sealed bids stayed hidden until reveal, winner is correct.");
  await sleep(0);
}

main().catch((err) => {
  console.error(`DEMO FAILED: ${err.message}`);
  process.exit(1);
});
