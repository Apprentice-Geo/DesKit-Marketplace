#!/usr/bin/env node
// Deep-checks a single plugins/<id>.json listing:
//   1. download the .deskit asset from downloadUrl (https only)
//   2. verify its sha256 matches the pinned digest
//   3. unzip in-memory and assert the package structure:
//        - deskit.json at the archive root
//        - manifest.id === listing.id, manifest.version === listing.version
//        - the file named by manifest.main exists in the archive
// Usage: node scripts/check-deskit.mjs plugins/com.alice.weather.json
import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import * as path from "node:path"
import process from "node:process"
import * as yauzl from "yauzl"

const MAX_BYTES = 25 * 1024 * 1024 // 25 MB safety ceiling for a plugin package

async function main() {
  const listingPath = process.argv[2]
  if (!listingPath) {
    console.error("usage: check-deskit.mjs <plugins/<id>.json>")
    process.exit(2)
  }

  const listing = JSON.parse(await readFile(listingPath, "utf-8"))
  const label = path.basename(listingPath)

  if (!/^https:\/\//.test(listing.downloadUrl)) {
    fail(label, `downloadUrl must be https: ${listing.downloadUrl}`)
  }

  console.log(`→ ${label}: downloading ${listing.downloadUrl}`)
  const res = await fetch(listing.downloadUrl, { redirect: "follow" })
  if (!res.ok) fail(label, `download failed: HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.byteLength > MAX_BYTES) fail(label, `package too large: ${buf.byteLength} bytes`)

  const digest = createHash("sha256").update(buf).digest("hex")
  if (digest !== listing.sha256) {
    fail(label, `sha256 mismatch:\n    expected ${listing.sha256}\n    actual   ${digest}`)
  }
  console.log(`  ✓ sha256 ${digest}`)

  const entries = await unzip(buf, label)
  const manifestRaw = entries.get("deskit.json")
  if (!manifestRaw) fail(label, "archive has no deskit.json at its root")

  let manifest
  try {
    manifest = JSON.parse(manifestRaw.toString("utf-8"))
  } catch (err) {
    fail(label, `deskit.json is not valid JSON: ${err.message}`)
  }

  if (manifest.id !== listing.id) {
    fail(label, `manifest id "${manifest.id}" !== listing id "${listing.id}"`)
  }
  if (manifest.version !== listing.version) {
    fail(label, `manifest version "${manifest.version}" !== listing version "${listing.version}"`)
  }
  const mainRel = typeof manifest.main === "string" ? manifest.main.replace(/^\.\//, "") : ""
  if (!mainRel || !entries.has(mainRel)) {
    fail(label, `manifest.main "${manifest.main}" is missing from the archive`)
  }

  console.log(`  ✓ package structure OK (main: ${mainRel})`)
  console.log(`✓ ${label} is a valid .deskit package`)
}

function unzip(buf, label) {
  return new Promise((resolve, reject) => {
    const files = new Map()
    yauzl.fromBuffer(buf, { lazyEntries: true }, (err, zip) => {
      if (err || !zip) return reject(err ?? new Error(`${label}: not a zip archive`))
      zip.on("entry", (entry) => {
        if (entry.fileName.endsWith("/")) return zip.readEntry()
        zip.openReadStream(entry, (streamErr, stream) => {
          if (streamErr || !stream) return reject(streamErr)
          const chunks = []
          stream.on("data", (c) => chunks.push(c))
          stream.on("end", () => {
            files.set(entry.fileName.replace(/\\/g, "/"), Buffer.concat(chunks))
            zip.readEntry()
          })
          stream.on("error", reject)
        })
      })
      zip.on("end", () => resolve(files))
      zip.on("error", reject)
      zip.readEntry()
    })
  })
}

function fail(label, message) {
  console.error(`✖ ${label}: ${message}`)
  process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
