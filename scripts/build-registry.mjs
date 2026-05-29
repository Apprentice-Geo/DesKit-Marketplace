#!/usr/bin/env node
// Regenerates registry.json from the per-plugin plugins/*.json listings.
// Keeps the hand-edited listings as the source of truth and the index as
// a derived artifact, so the client only fetches one file.
import { readdir, readFile, writeFile } from "node:fs/promises"
import * as path from "node:path"
import process from "node:process"

const ROOT = path.resolve(import.meta.dirname, "..")
const PLUGINS_DIR = path.join(ROOT, "plugins")
const OUT = path.join(ROOT, "registry.json")

async function main() {
  let files = []
  try {
    files = (await readdir(PLUGINS_DIR)).filter((name) => name.endsWith(".json")).sort()
  } catch {
    files = []
  }

  const plugins = []
  for (const file of files) {
    plugins.push(JSON.parse(await readFile(path.join(PLUGINS_DIR, file), "utf-8")))
  }

  const registry = {
    version: 1,
    plugins,
  }
  await writeFile(OUT, `${JSON.stringify(registry, null, 2)}\n`, "utf-8")
  console.log(`✓ registry.json rebuilt from ${plugins.length} listing(s)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
