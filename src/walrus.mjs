// Walrus blob storage client + local fallback store.
// Real Walrus API (verified against the Walrus docs, docs.wal.app):
//   PUT {publisher}/v1/blobs?epochs=N   -> stores a blob, returns blob ID
//   GET {aggregator}/v1/blobs/<blobId>  -> reads a blob back
// Testnet endpoints:
//   Publisher:  https://publisher.walrus-testnet.walrus.space
//   Aggregator: https://aggregator.walrus-testnet.walrus.space
// No API key is needed on testnet. Blobs on Walrus are PUBLIC, so this
// auction only ever stores commitments (hashes) here, never bid amounts.
//
// Status at build time (2026-11-23, verified live from this VM):
//   - Official testnet publisher answers but returns HTTP 500
//     "could not find WAL coins with sufficient balance" (its own wallet is dry).
//   - Community publishers walrus-testnet-publisher.redundex.com and
//     wal-publisher-testnet.staketab.org timed out (60 s, no response).
// So WalrusBlobStore is real code against the documented API, but live
// Walrus writes are currently untested. LocalBlobStore has the identical
// interface (store -> blobId, read -> bytes) and is content-addressed
// (blobId = sha256 of the bytes), so swapping backends is a config change.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const TESTNET_PUBLISHER = "https://publisher.walrus-testnet.walrus.space";
export const TESTNET_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";

export function contentBlobId(bytes) {
  return createHash("sha256").update(bytes).digest("base64url");
}

export class WalrusBlobStore {
  constructor({ publisher = TESTNET_PUBLISHER, aggregator = TESTNET_AGGREGATOR, epochs = 1, timeoutMs = 15000 } = {}) {
    this.publisher = publisher;
    this.aggregator = aggregator;
    this.epochs = epochs;
    this.timeoutMs = timeoutMs;
    this.backend = "walrus-testnet";
  }

  async store(bytes) {
    const res = await fetch(`${this.publisher}/v1/blobs?epochs=${this.epochs}`, {
      method: "PUT",
      body: bytes,
      headers: { "Content-Type": "application/octet-stream" },
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Walrus publisher ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = await res.json();
    const blobId =
      data?.newlyCreated?.blobObject?.blobId ??
      data?.alreadyCertified?.blobId ??
      data?.blobId;
    if (!blobId) throw new Error(`Walrus publisher gave no blobId: ${JSON.stringify(data).slice(0, 200)}`);
    return { blobId, backend: this.backend, alreadyCertified: Boolean(data?.alreadyCertified) };
  }

  async read(blobId) {
    const res = await fetch(`${this.aggregator}/v1/blobs/${blobId}`, {
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) throw new Error(`Walrus aggregator ${res.status} for ${blobId}`);
    return Buffer.from(await res.arrayBuffer());
  }
}

export class LocalBlobStore {
  constructor(dir) {
    this.dir = dir;
    this.backend = "local";
  }

  async store(bytes) {
    await mkdir(this.dir, { recursive: true });
    const blobId = contentBlobId(bytes);
    await writeFile(join(this.dir, `${blobId}.blob`), bytes);
    return { blobId, backend: this.backend, alreadyCertified: false };
  }

  async read(blobId) {
    return readFile(join(this.dir, `${blobId}.blob`));
  }
}

// Tries real Walrus first (only when WALRUS_ENABLED=1), falls back to local
// with a plain-language note. Default is local, so the demo is fast and
// deterministic even while the public publisher is dry.
export async function openBlobStore(dir, { walrusEnabled = process.env.WALRUS_ENABLED === "1" } = {}) {
  const local = new LocalBlobStore(dir);
  if (!walrusEnabled) return { store: local, note: "Walrus off (WALRUS_ENABLED not set). Sealed bids stored in the local content-addressed blob store." };
  const walrus = new WalrusBlobStore();
  try {
    await walrus.store(Buffer.from("walrus-sealed-bid-auction connectivity probe"));
    return { store: walrus, note: "Walrus testnet publisher reachable. Sealed bids stored on Walrus testnet." };
  } catch (err) {
    return { store: local, note: `Walrus testnet publisher unreachable (${err.message}). Sealed bids stored in the local content-addressed blob store instead.` };
  }
}
