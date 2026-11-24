# Demo video script — Walrus Sealed-Bid Auction House (CLAY Hackathon III)

- Target length: **about 4 minutes** (event needs 3–5 minutes, YouTube preferred).
- Format: screen recording of the web UI (`node server.mjs`, http://localhost:8787) with short bidding/reveal windows, read aloud in plain words. Amounts are play SUI on testnet only — no real money.
- The sentence a judge should repeat an hour later: **"Nobody could see a single bid — only hashes — until reveal, and the highest honest bid won."**

## Hook options — pick the clearest, say it aloud, keep the best take

1. "Three bids are in. Nobody can see a single amount. Only these hashes."
2. "The highest bid wins — but nobody knows what anyone bid until reveal."
3. "This bid is 200 SUI. Prove it — without showing the number first."

## Shot-by-shot script

### 0:00–0:05 — Hook (sound off must still work)

- On screen, big text: **"3 BIDS IN. 0 AMOUNTS VISIBLE."**
- Behind the text: the auction page showing three sealed bids as hash strings only.
- Say: "Three bids are in. Nobody can see a single amount. Only these hashes."

### 0:05–0:20 — Problem, one sentence, one named user

- On screen: the auction page, item "Yeti Snowboard — signed by Lofi", minimum bid 10 SUI.
- Say: "Lofi is auctioning a signed snowboard. In an open auction, the first big bid scares everyone else off, and people bid against each other instead of bidding what the item is worth to them. This is a sealed-bid auction on Walrus: your bid stays hidden until reveal, and the highest honest bid wins. Free Entry track, CLAY Hackathon 3."

### 0:20–2:45 — The one live flow

Before recording, start the server with short windows so the whole auction fits the video: `BIDDING_SECONDS=60 REVEAL_SECONDS=60 node server.mjs`. Use the three bidders from the demo — ama 120, bola 200, chidi 150. Keep the bids on screen as you place them.

- **Place the sealed bids (0:20–1:10).** Place one bid each for ama (120 SUI), bola (200 SUI), and chidi (150 SUI). After each one, point at the list: only a hash appears, no amount. Say: "Ama seals a bid. Bola seals a bid. Chidi seals a bid. Look at the list — hashes only. Not even the seller can see an amount."
- **Show the sealed store (1:10–1:30).** Show the stored blob contents for one bid — commitment hash only, no amount, no salt. Say: "This is what is actually stored: a hash, nothing else. The amount and the secret word never leave the bidder until reveal."
- **Tampered reveal rejected (1:30–2:00).** In the reveal window, first try a wrong reveal for bola — the right amount, 200, with the wrong secret word. It is rejected. Say: "Now reveal. First, a cheat: bola's amount is right, but the secret word is wrong. Rejected — the hash does not match, so the bid is void."
- **Honest reveals and the winner (2:00–2:45).** Reveal honestly for ama (120), bola (200), and chidi (150). The page settles: winner bola, 200 SUI. Say: "Honest reveals: ama 120, bola 200, chidi 150. The winner is bola, with 200 SUI. The highest honest bid wins, and nobody knew a number until now."

### 2:45–3:15 — How it works (30 seconds, plain words)

- On screen: the commitment formula `SHA-256(auctionId | bidder | amount | salt)`, then the three phases: bidding, reveal, settled.
- Say: "Underneath, each bid is locked with a SHA-256 hash of the auction, the bidder, the amount, and a secret word. Only the hash is stored — as a blob on Walrus. At reveal you show the amount and the secret word, the auction re-computes the hash, and it only counts if it matches. Wrong amount or wrong secret word, and the bid is void. One sealed bid per bidder, bids must meet the minimum, and a tie goes to the earliest reveal."

### 3:15–3:40 — Honest limits (say them out loud)

- Say: "Two honest limits. First, the bids in this video are stored in a local blob store, not on live Walrus — the public testnet publisher was out of funds when I tried it, so the same code will store real Walrus blobs once the publisher is funded again. Second, there is no on-chain contract yet and no real payment: the winner is decided, but no SUI moves. This is play SUI, not real money."

### 3:40–4:00 — What's next, and the close

- Say: "Next is flipping the switch to real Walrus storage once the publisher is funded, and then a Move contract that holds the auction and checks the hashes on chain. Walrus Sealed-Bid Auction House — nobody sees a bid until reveal, and the highest honest bid wins."
- End screen, big text: **"SEALED. REVEALED. BOLA WINS — 200 SUI."**

## What NOT to say or show

- Do NOT say the bids were stored on Walrus. They were stored in the local blob store — say so.
- Do not claim a Move contract exists, or that any SUI was paid. Neither is true yet.
- Do not show the secret words (salts) as if they were public — they are the bidders' secrets. Showing them in the reveal step is fine because that is what a reveal is, but do not paste them into the video description or the form.
- Do not claim the amounts are real money. They are play SUI.

## Recording notes (phone)

- Android screen recorder: swipe down twice, tap Screen record, microphone ON, wait for the countdown.
- Turn on Do Not Disturb first, so no notification lands mid-take.
- Film in landscape. Browser zoom 100–125%, full screen, bookmarks bar hidden, extra tabs closed, so the hashes and amounts are readable.
- Start the server BEFORE recording with the short windows: `BIDDING_SECONDS=60 REVEAL_SECONDS=60 node server.mjs`. Rehearse the three bids once so the typing is smooth — the 60-second bidding window is tight, so have the three bids ready (ama 120, bola 200, chidi 150).
- If a window runs out mid-take, restart the server and record again — do not fake the timer.
- Add captions in CapCut (free) after recording — judges may watch with sound off.
- Record the hook (0:00–0:05) two or three times and keep the best take.
- Also run `node demo.mjs` once and save its terminal output as a backup: it runs the whole auction end to end in under a second and prints the same winner (bola, 200 SUI).
