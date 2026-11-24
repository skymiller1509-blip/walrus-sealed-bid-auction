# CLAY Hackathon III — submission text, filled template

Source template: Eddie's screenshots of the Devpost submission form from the
Kiroween Crypt submission, same shape as the SLAY and Arbiter submissions,
adapted to CLAY's own 4-step form. CLAY is NOT on Devpost. The form is at
https://hackathon.lofitheyeti.com/ and asks for: title, description, logo
(1:1 JPG/PNG), public GitHub repo (required), demo video 3-5 min (YouTube
preferred), optional website, optional Package ID, optional extra docs.

Deadline: end of the year. No exact closing day or time is published, so
treat 31 Dec 2026 as the practical end.
Project: Walrus Sealed-Bid Auction House.
Track: Free Entry.
Form: https://hackathon.lofitheyeti.com/

## 1. Project title

```
Walrus Sealed-Bid Auction House
```

## 2. Description (paste this into the description field)

```
Sealed bids nobody can read until reveal. The highest honest bid wins.

A sealed-bid auction for CLAY Hackathon III, Free Entry track. Bidders lock their bid in a SHA-256 commitment that is stored as a blob. Nobody, not other bidders, not the seller, can see an amount until its owner reveals it. The highest valid revealed bid wins.

How it works: a bid is sealed as SHA-256 of the auction id, the bidder, the amount, and a secret salt. Only the commitment is stored. The amount and salt never leave the bidder until reveal. At reveal the bidder shows the amount and salt, the auction recomputes the hash, and the reveal is accepted only if it matches. A wrong amount or salt is rejected and the bid is void. One sealed bid per bidder, bids must meet the minimum, reveals only inside the reveal window. Winner is the highest valid revealed bid, and a tie goes to the earliest reveal.

How it was built: Node.js 20 and nothing else, zero dependencies. The auction logic is in src/auction.mjs, the Walrus client in src/walrus.mjs, a scripted end-to-end demo in demo.mjs, and a one-page web UI in server.mjs. 12 out of 12 tests pass. The demo runs end to end in under a second: three bidders seal bids, only hashes are visible, a tampered reveal with the wrong salt is rejected, all three reveal, and the winner is bola with 200 SUI.

Honest limits, stated plainly. Walrus storage is the untested part: the client is real code against the documented Walrus HTTP API, but live writes did not work on 23 Nov 2026 because the official testnet publisher answers with HTTP 500, its own wallet is dry, and the community publishers timed out. So sealed bids go to a local content-addressed blob store with the same store and read interface, and the same code stores real Walrus blobs once the public publisher is funded again. There is no on-chain Move contract yet, and no real payments: the winner is determined, but no SUI moves. Amounts are play SUI on testnet only.

Why Walrus fits: Walrus is named on the official CLAY page as part of the Sui Stack, and sealed bids are the honest use for it. Walrus blobs are public by design, which is why only commitments are ever stored, never amounts, never salts.
```

## 3. Project logo (1:1 JPG/PNG)

Upload the logo file. It is in the repo at `assets/logo.svg` (1:1). A PNG
export is saved next to it as `assets/logo.png` (1:1) if the form wants a
PNG. Upload one of them.

## 4. Public GitHub repo URL

LIVE 2026-11-24 (15 files, commit 85a8e147, verified by Mabel):

```
https://github.com/skymiller1509-blip/walrus-sealed-bid-auction
```

## 5. Demo video URL

TODO, film 3 to 5 minutes from VIDEO-SCRIPT.md and upload to YouTube
(preferred). The demo: run `node server.mjs`, place sealed bids from two
or three names, show only hashes visible, reveal, settle, winner.

## 6. Website (optional)

Leave blank for now. There is no hosted site yet. The repo will be the
link judges use.

## 7. Package ID (optional)

Leave blank. There is no on-chain Move contract in this build, so there is
no Package ID. The auction logic runs in Node and the sealed bids live in
blobs. A Sui Move contract holding the auction state and verifying
commitments on-chain is the natural next step, not shipped.

## 8. Extra docs (optional)

The README in the repo covers it: how sealing works, how to run it, the
test results, and the honest limits. Link the repo and leave this blank
unless the form wants a file.

## 9. Track

```
Free Entry
```

This entry is not a Lofi mini-game and not an AI product. It is Free Entry.

## 10. What the form will also ask (your own details)

The form will ask for the submitter's own name, email, and similar details.
Fill those yourself. Nothing about the project changes there.

Note: if the CLAY form asks something extra that is not covered here, send
Mabel a screenshot of that field and she will write the answer.
