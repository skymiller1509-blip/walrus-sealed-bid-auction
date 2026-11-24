# Walrus Sealed-Bid Auction House

Sealed bids nobody can read until reveal — the highest honest bid wins.

## Demo video

> TODO — record the 3–5 minute demo video (see `VIDEO-SCRIPT.md`) and paste the public YouTube link here.

## What it does and why

A sealed-bid auction for **CLAY Hackathon III (Free Entry track)**. Bidders lock
their bid in a SHA-256 commitment that is stored as a blob. Nobody — not other
bidders, not the seller — can see an amount until its owner reveals it. The
highest valid revealed bid wins.

## Tech stack

- Node.js 20+, zero dependencies
- SHA-256 bid commitments (`auctionId | bidder | amount | salt`)
- Walrus HTTP API client (`src/walrus.mjs`) plus a local content-addressed blob store with the same interface
- One-page web UI (`server.mjs` + `public/index.html`)

## Rules (verified live, 2026-11-23)

- **Hackathon:** CLAY Hackathon III, Lofi × Sui, hosted by Lofi the Yeti.
  Official page: https://hackathon.lofitheyeti.com/
- **Status:** LIVE. Round III runs **16 Nov through the end of the year**.
  No exact closing day or time is published anywhere — the organisers say
  only "through the end of the year". Treat 31 Dec 2026 as the practical end.
- **Prize pool: $2,450 total — 1st $1,500, 2nd $700, 3rd $250.**
  Confirmed from the official @lofitheyeti announcement (as mirrored by
  Sui Community) and from a live Round III entry page (Lofi Flurry Dash),
  which states the same split. The $2,450 figure is the sum of that split.
  The official hackathon page itself names no fixed amount ("the prize pool
  scales up as the hackathon grows").
- **Solo:** explicitly allowed ("Enter on your own, or compete as part of a
  team or community project" — official page).
- **Tracks:** Mini-game (featuring Lofi), AI Product, Free Entry. This entry
  is **Free Entry** — it is not a Lofi mini-game and not an AI product.
- **Submission needs (official page checklist):** project title, description,
  project logo (1:1 JPG/PNG), public GitHub repo (required), demo video
  3–5 min (YouTube preferred), optional website, optional Package ID,
  optional extra docs. Submission is a 4-step form on the official site.
- **Why Walrus fits:** Walrus (decentralised storage) is named on the official
  page as part of the Sui Stack, alongside Sui and Deepbook.

## How sealing works

```
commitment = SHA-256(auctionId | bidder | amount | salt)
```

Only the commitment is stored. The amount and salt never leave the bidder
until reveal. At reveal the bidder shows amount + salt; the auction
recomputes the hash and accepts the reveal only if it matches the stored
commitment. A wrong amount or salt is rejected and the bid is void.

Phases: **bidding → reveal → settled**. One sealed bid per bidder, bids must
meet the minimum, reveals only inside the reveal window. Winner = highest
valid revealed bid; a tie goes to the earliest reveal.

## Run it

Zero dependencies, Node 20+ only. Amounts are play SUI on testnet only —
no real money, no mainnet.

```bash
node --test test.mjs   # 12 tests
node demo.mjs          # full auction end to end in under a second
node server.mjs        # web UI at http://localhost:8787
```

Server windows default to 5 minutes of bidding + 5 minutes of reveal
(`BIDDING_SECONDS` / `REVEAL_SECONDS` override them for filming).

To attempt real Walrus testnet storage instead of the local blob store:

```bash
WALRUS_ENABLED=1 node demo.mjs
```

## Files

- `src/auction.mjs` — auction logic (create, seal, list, reveal, settle).
- `src/walrus.mjs` — Walrus HTTP client (PUT/GET blobs) + local blob store
  with the identical interface. Blob IDs are content-addressed (SHA-256).
- `demo.mjs` — scripted end-to-end demo (3 bidders, tampered reveal rejected).
- `test.mjs` — 12 tests.
- `server.mjs` + `public/index.html` — minimal web UI for the demo video.
- `assets/logo.svg` — 1:1 project logo.

## Honest limits

- **Walrus storage is the untested part.** The Walrus client is real code
  against the documented HTTP API (verified against docs.wal.app), but live
  writes did not work from this machine on 2026-11-23:
  - Official testnet publisher (`publisher.walrus-testnet.walrus.space`)
    answers but returns HTTP 500: "could not find WAL coins with sufficient
    balance" — the operator's own wallet is dry.
  - Community testnet publishers (`walrus-testnet-publisher.redundex.com`,
    `wal-publisher-testnet.staketab.org`) timed out with no response in 60 s.
  - So sealed bids are stored in the local content-addressed blob store
    (`blobs/`), which has the same store/read interface. Flip
    `WALRUS_ENABLED=1` once the public publisher is funded again and the
    same code stores real Walrus blobs. The read path (aggregator) could not
    be tested either without a stored blob.
- **Walrus blobs are public by design.** That is why only commitments are
  ever stored — never amounts, never salts. Do not store a plaintext bid.
- **No on-chain Move contract yet.** The auction logic runs in Node and the
  sealed bids live in blobs. A Sui Move contract holding the auction state
  and verifying commitments on-chain is the natural next step, not shipped.
- **No real payments.** The winner is determined, but no SUI moves. Payment
  and settlement are out of scope for this build.
- **Demo UI is minimal.** One page, no accounts, no wallet connection.

## Still needed from Eddie

1. Create the public GitHub repo (he creates repos) and push this folder.
2. Demo video, 3–5 minutes (YouTube preferred): run `node server.mjs`,
   place sealed bids from two or three names, show only hashes visible,
   reveal, settle, winner.
3. Project logo is included as `assets/logo.svg`; a PNG version can be
   exported from it if the form wants one.
4. Submit via the 4-step form at https://hackathon.lofitheyeti.com/ before
   the end of the year. Needs: title, description, repo link, demo video link.
