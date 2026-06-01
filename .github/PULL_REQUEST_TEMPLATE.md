<!--
  Thanks for submitting a plugin to the DesKit Marketplace! This repo only stores listing metadata — your plugin code stays in your own repository and ships as a GitHub Release .deskit asset. Fill in the checklist below; the validate-listings CI will verify it.
-->

## Listing

- **Plugin id:** <!-- e.g. com.alice.weather (must match the manifest id) -->
- **Version:** <!-- e.g. 1.2.0 -->
- **Source repo:** <!-- https://github.com/<you>/<plugin> -->

## Type of change

- [ ] 🆕 New plugin listing (`plugins/<id>.json` added)
- [ ] ⬆️ Version bump / metadata update to an existing listing
- [ ] 🗑️ Remove a listing
- [ ] 🔧 Repo tooling / docs

## Submission checklist

- [ ] The listing file is named exactly `plugins/<id>.json` where `<id>` equals the `id` field.
- [ ] `downloadUrl` is an **https** link to a GitHub Release `.deskit` asset (not a source-repo link that needs building).
- [ ] `sha256` is the lowercase hex digest of that exact asset (`sha256sum <file>.deskit`, or copied from the template's release workflow output).
- [ ] `version` matches the `version` inside the plugin's `deskit.json`.
- [ ] I ran `npm run build-registry` and committed the regenerated `registry.json` (or I left it for a maintainer — note which below).
- [ ] My plugin was built from the [deskit-plugin-template](https://github.com/WiIIiamWei/deskit-plugin-template) (or otherwise produces a structurally identical `.deskit`).

## Notes

<!-- Anything reviewers should know. For removals, say why. -->
