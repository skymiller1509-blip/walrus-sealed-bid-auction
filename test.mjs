// Tests for the sealed-bid auction. Run: node --test test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  commitmentFor,
  createAuction,
  placeSealedBid,
  revealBid,
  settle,
} from "./src/auction.mjs";
import { LocalBlobStore, WalrusBlobStore, openBlobStore } from "./src/walrus.mjs";

const base = { id: "a1", item: "Test item", minBid: 10, biddingSeconds: 60, revealSeconds: 60, now: 1_000_000 };

async function withStore(fn) {
  const dir = await mkdtemp(join(tmpdir(), "sealed-bid-test-"));
  try {
    await fn(new LocalBlobStore(dir));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("commitment is deterministic for the same inputs", () => {
  const a = commitmentFor({ auctionId: "a1", bidder: "ama", amount: 120, salt: "s1" });
  const b = commitmentFor({ auctionId: "a1", bidder: "ama", amount: 120, salt: "s1" });
  assert.equal(a, b);
});

test("commitment hides the amount: same amount, different salt -> different hash; hash never contains the amount", () => {
  const a = commitmentFor({ auctionId: "a1", bidder: "ama", amount: 120, salt: "s1" });
  const b = commitmentFor({ auctionId: "a1", bidder: "ama", amount: 120, salt: "s2" });
  assert.notEqual(a, b);
  assert.ok(!a.includes("120"));
});

test("bid below the minimum is rejected", async () => {
  await withStore(async (store) => {
    const auction = createAuction(base);
    await assert.rejects(
      placeSealedBid(auction, store, { bidder: "ama", amount: 5, salt: "s1", now: 1_000_100 }),
      /below the minimum/,
    );
  });
});

test("one sealed bid per bidder", async () => {
  await withStore(async (store) => {
    const auction = createAuction(base);
    await placeSealedBid(auction, store, { bidder: "ama", amount: 120, salt: "s1", now: 1_000_100 });
    await assert.rejects(
      placeSealedBid(auction, store, { bidder: "ama", amount: 130, salt: "s2", now: 1_000_200 }),
      /already placed/,
    );
  });
});

test("late bid after the bidding window is rejected", async () => {
  await withStore(async (store) => {
    const auction = createAuction(base);
    await assert.rejects(
      placeSealedBid(auction, store, { bidder: "ama", amount: 120, salt: "s1", now: 1_060_001 }),
      /bidding is closed/,
    );
  });
});

test("reveal before the reveal window is rejected", async () => {
  await withStore(async (store) => {
    const auction = createAuction(base);
    await placeSealedBid(auction, store, { bidder: "ama", amount: 120, salt: "s1", now: 1_000_100 });
    await assert.rejects(
      revealBid(auction, store, { bidder: "ama", amount: 120, salt: "s1", now: 1_000_200 }),
      /not in the reveal window/,
    );
  });
});

test("wrong salt or amount at reveal is rejected and the bid stays void", async () => {
  await withStore(async (store) => {
    const auction = createAuction(base);
    await placeSealedBid(auction, store, { bidder: "ama", amount: 120, salt: "s1", now: 1_000_100 });
    await assert.rejects(
      revealBid(auction, store, { bidder: "ama", amount: 120, salt: "wrong", now: 1_061_000 }),
      /do not match the sealed commitment/,
    );
    await assert.rejects(
      revealBid(auction, store, { bidder: "ama", amount: 999, salt: "s1", now: 1_061_000 }),
      /do not match the sealed commitment/,
    );
    assert.equal(auction.reveals.length, 0);
  });
});

test("highest valid reveal wins; tie goes to the earliest reveal", async () => {
  await withStore(async (store) => {
    const auction = createAuction(base);
    await placeSealedBid(auction, store, { bidder: "ama", amount: 120, salt: "s1", now: 1_000_100 });
    await placeSealedBid(auction, store, { bidder: "bola", amount: 120, salt: "s2", now: 1_000_200 });
    await placeSealedBid(auction, store, { bidder: "chidi", amount: 90, salt: "s3", now: 1_000_300 });
    // Bola reveals first at the same amount, so bola wins the tie.
    await revealBid(auction, store, { bidder: "bola", amount: 120, salt: "s2", now: 1_061_000 });
    await revealBid(auction, store, { bidder: "ama", amount: 120, salt: "s1", now: 1_062_000 });
    await revealBid(auction, store, { bidder: "chidi", amount: 90, salt: "s3", now: 1_063_000 });
    const winner = settle(auction, 1_121_000);
    assert.equal(winner.bidder, "bola");
    assert.equal(winner.amount, 120);
    assert.equal(winner.totalReveals, 3);
  });
});

test("no reveals means no winner", async () => {
  await withStore(async (store) => {
    const auction = createAuction(base);
    await placeSealedBid(auction, store, { bidder: "ama", amount: 120, salt: "s1", now: 1_000_100 });
    const winner = settle(auction, 1_121_000);
    assert.equal(winner.bidder, null);
    assert.equal(winner.totalReveals, 0);
  });
});

test("settle before the reveal window ends is rejected", async () => {
  await withStore(async (store) => {
    const auction = createAuction(base);
    await placeSealedBid(auction, store, { bidder: "ama", amount: 120, salt: "s1", now: 1_000_100 });
    assert.throws(() => settle(auction, 1_061_000), /cannot settle/);
  });
});

test("local blob store round-trips bytes and is content-addressed", async () => {
  await withStore(async (store) => {
    const bytes = Buffer.from(JSON.stringify({ hello: "walrus" }));
    const { blobId } = await store.store(bytes);
    const back = await store.read(blobId);
    assert.equal(back.toString("utf8"), bytes.toString("utf8"));
    const again = await store.store(bytes);
    assert.equal(again.blobId, blobId, "same bytes -> same blob id");
  });
});

test("Walrus store falls back to local when the publisher is unreachable", async () => {
  const dir = await mkdtemp(join(tmpdir(), "sealed-bid-walrus-"));
  try {
    // Point the probe at a dead local port so it fails fast with no network.
    const { WalrusBlobStore } = await import("./src/walrus.mjs");
    const dead = new WalrusBlobStore({ publisher: "http://127.0.0.1:1", timeoutMs: 2000 });
    await assert.rejects(dead.store(Buffer.from("x")));
    const { store, note } = await openBlobStore(dir, { walrusEnabled: false });
    assert.equal(store.backend, "local");
    assert.match(note, /local content-addressed blob store/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
