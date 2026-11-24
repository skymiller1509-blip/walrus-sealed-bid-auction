// Tiny demo server for the auction UI. Zero dependencies, Node stdlib only.
// Run: node server.mjs   (then open http://localhost:8787)
// One live auction in memory. Bidding and reveal windows default to 5 minutes
// each so the flow can be filmed; override with BIDDING_SECONDS / REVEAL_SECONDS.
// Amounts are play SUI on testnet only — no real money.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { openBlobStore } from "./src/walrus.mjs";
import {
  createAuction,
  listSealedBids,
  phaseOf,
  placeSealedBid,
  revealBid,
  settle,
} from "./src/auction.mjs";

const PORT = Number(process.env.PORT ?? 8787);
const biddingSeconds = Number(process.env.BIDDING_SECONDS ?? 300);
const revealSeconds = Number(process.env.REVEAL_SECONDS ?? 300);

const { store, note } = await openBlobStore(new URL("./blobs", import.meta.url).pathname);
console.log(`Storage: ${note}`);

const auction = createAuction({
  id: "yeti-snowboard-001",
  item: "Yeti Snowboard — signed by Lofi",
  description: "One of one. Sealed bids only — nobody sees an amount until reveal.",
  minBid: 10,
  biddingSeconds,
  revealSeconds,
});
console.log(`Auction live: ${auction.item} (bidding ${biddingSeconds}s, reveal ${revealSeconds}s)`);

function publicState() {
  return {
    id: auction.id,
    item: auction.item,
    description: auction.description,
    minBid: auction.minBid,
    phase: phaseOf(auction),
    biddingEndsAt: auction.biddingEndsAt,
    revealEndsAt: auction.revealEndsAt,
    sealedBids: listSealedBids(auction),
    reveals: auction.reveals.map(({ bidder, amount, revealedAt }) => ({ bidder, amount, revealedAt })),
    winner: auction.winner,
    storageNote: note,
  };
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    if (req.method === "GET" && req.url === "/") {
      const html = await readFile(new URL("./public/index.html", import.meta.url), "utf8");
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
      return;
    }
    if (req.method === "GET" && req.url === "/api/state") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(publicState()));
      return;
    }
    if (req.method === "POST" && req.url === "/api/bid") {
      const body = await readJson(req);
      const sealed = await placeSealedBid(auction, store, {
        bidder: String(body.bidder ?? "").trim(),
        amount: Number(body.amount),
        salt: String(body.salt ?? "").trim(),
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, sealed }));
      return;
    }
    if (req.method === "POST" && req.url === "/api/reveal") {
      const body = await readJson(req);
      const reveal = await revealBid(auction, store, {
        bidder: String(body.bidder ?? "").trim(),
        amount: Number(body.amount),
        salt: String(body.salt ?? "").trim(),
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, reveal: { bidder: reveal.bidder, amount: reveal.amount } }));
      return;
    }
    if (req.method === "POST" && req.url === "/api/settle") {
      const winner = settle(auction);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, winner }));
      return;
    }
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "not found" }));
  } catch (err) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: err.message }));
  }
});

server.listen(PORT, () => console.log(`Open http://localhost:${PORT}`));
