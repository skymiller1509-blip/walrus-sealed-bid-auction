# Submission checklist — Walrus Sealed-Bid Auction House (CLAY Hackathon III)

Event: CLAY Hackathon III (Lofi × Sui), Free Entry track. Round III runs 16 Nov through the end of the year.
Deadline: **no exact closing day or time is published** — the organisers say only "through the end of the year". Treat **31 Dec 2026** as the practical end and submit well before it.
Prize pool: $2,450 total — 1st $1,500, 2nd $700, 3rd $250.
Official page / submission form: https://hackathon.lofitheyeti.com/ (4-step form)

## Status key

- `[x] done` — verified finished
- `[ ] todo` — still to do
- `[E]` Eddie's step — only he can do it
- `[M]` Mabel's step

## Criterion zero — eligibility floor (check first)

- [x] done — Build is complete: 12/12 tests pass, `node demo.mjs` runs end to end, winner bola with 200 SUI
- [x] done — Solo is explicitly allowed ("Enter on your own, or compete as part of a team or community project")
- [x] done — Track is Free Entry (not a Lofi mini-game, not an AI product)
- [x] done — README has tagline, demo-video slot, what/why, tech stack, try-it-yourself, honest limits
- [ ] todo — Public GitHub repo (required by the official checklist)
- [ ] todo — Demo video 3–5 minutes, YouTube preferred (record per `VIDEO-SCRIPT.md`)
- [ ] todo — Project logo as 1:1 JPG/PNG — `assets/logo.svg` exists; a PNG export is still needed if the form wants one
- [ ] todo — 4-step form submitted at https://hackathon.lofitheyeti.com/ before the end of the year

## Submission items (official page checklist)

- [x] done — Project title: Walrus Sealed-Bid Auction House
- [x] done — Description: sealed bids as SHA-256 commitments stored as blobs; nobody sees an amount until reveal; highest valid revealed bid wins (see README)
- [x] done — Logo source: `assets/logo.svg` (1:1)
- [ ] todo — PNG export of the logo (1:1 JPG/PNG) if the form requires it [M]
- [ ] todo — Public GitHub repo created and this folder pushed [E]
- [ ] todo — Demo video link (3–5 min, YouTube preferred) pasted into README and into the form [E]
- [ ] todo — Optional website link (only if a live demo is hosted; do not invent one)
- [ ] todo — Optional Package ID — none exists; leave blank (no Move contract yet, no on-chain package)
- [ ] todo — Optional extra docs — link the README
- [ ] todo — Open every link after submitting and check each one works

## Honest limits to keep in the submission text

- Walrus storage is untested live: the public testnet publisher was dry (HTTP 500) and community publishers timed out on 2026-11-23, so sealed bids go to a local blob store; flip `WALRUS_ENABLED=1` once the publisher is funded.
- No on-chain Move contract yet; no real payments — the winner is decided, but no SUI moves. Amounts are play SUI only.

## Eddie's steps [E]

- [E] Create the public GitHub repo and push this folder
- [E] Record the 3–5 minute demo video (script in `VIDEO-SCRIPT.md`; start the server with `BIDDING_SECONDS=60 REVEAL_SECONDS=60`)
- [E] Submit via the 4-step form at https://hackathon.lofitheyeti.com/ before the end of the year

## Mabel's steps [M]

- [M] Export the logo to 1:1 PNG from `assets/logo.svg` if the form needs it
- [M] Draft the form description from the README
- [M] Re-check the official page for an exact closing date if one appears — update the deadline line here if it does

## Payout / KYC

- [ ] todo — Prize split confirmed ($1,500 / $700 / $250). Payout route (wallet, token, KYC) not published on the official page — check the form and any organiser announcement before submitting, and record it here.

## Do-not-touch rule

- After submitting, do not edit the repo, the demo, or the video until winners are announced.
