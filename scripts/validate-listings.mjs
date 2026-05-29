#!/usr/bin/env node
// Validates every plugins/*.json listing against the registry-entry schema
// and enforces conventions the schema can't express (filename === id).
// Network-free + deterministic: runs on every PR and on main. The deep
// .deskit download/sha256/unzip checks live in the workflow shell steps,
// keyed to the files a PR actually changed.
import { readdir, readFile } from "node:fs/promises"
import * as path from "node:path"
import process from "node:process"
import Ajv from "ajv"
import addFormats from "ajv-formats"

const ROOT = path.resolve(import.meta.dirname, "..")
const PLUGINS_DIR = path.join(ROOT, "plugins")

async function main() {
  const entrySchema = JSON.parse(
    await readFile(path.join(ROOT, "schema", "registry-entry.schema.json"), "utf-8")
  )
  const ajv = new Ajv({ allErrors: true, strict: false })
  addFormats(ajv)
  const validate = ajv.compile(entrySchema)

  let files
  try {
    files = (await readdir(PLUGINS_DIR)).filter((name) => name.endsWith(".json"))
  } catch {
    files = []
  }

  const problems = []
  for (const file of files) {
    const full = path.join(PLUGINS_DIR, file)
    let entry
    try {
      entry = JSON.parse(await readFile(full, "utf-8"))
    } catch (err) {
      problems.push(`${file}: not valid JSON — ${err.message}`)
      continue
    }

    if (!validate(entry)) {
      for (const e of validate.errors ?? []) {
        problems.push(`${file}: ${e.instancePath || "/"} ${e.message}`)
      }
      continue
    }

    const expected = `${entry.id}.json`
    if (file !== expected) {
      problems.push(`${file}: filename must equal "<id>.json" (id is "${entry.id}")`)
    }
  }

  if (problems.length > 0) {
    console.error(`✖ ${problems.length} listing problem(s):\n`)
    for (const p of problems) console.error(`  - ${p}`)
    process.exit(1)
  }
  console.log(`✓ ${files.length} listing(s) valid`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
