# Test tools

Scripts that run the theme in a real Cloudreve v4 with headless Chromium, so a change can be checked for visual regressions and measured before it ships. None of them are needed to build the theme.

## Setup
- Needs Node 22, Go, Yarn, git, zip, and Playwright with Chromium (`npm i --no-save playwright && npx playwright install chromium`, or a global install).
- `tools/cloudreve.sh build` clones Cloudreve and its frontend into `~/.cache/obscura-cloudreve` (override with `CR_DIR`) and builds one binary (~10 min). The frontend's `webworkify-webpack` dependency is fetched with `git clone` instead of a GitHub tarball, which some proxies block.
- `tools/cloudreve.sh start` runs it on `http://127.0.0.1:5212` (`CR_PORT` to change; SQLite and `conf.ini` in `$CR_DIR/data`), building first if needed.
- `node tools/serve.mjs [file]` serves `cloudreveCustomFooter.html` (or `file`) at `http://127.0.0.1:8099/theme.html`, re-reading it on every request, so rebuilding or copying another build in is enough to switch.
- `node tools/seed.mjs` registers the admin (first user, `admin@example.com` / `obscura-test`), sets Custom footer HTML to the README loader pointing at the server above, and uploads 240 generated photos to Photos and 300 empty files to Documents.
- Override with `CR_URL` (e.g. `http://127.0.0.1:5213` with `CR_PORT=5213`), `CR_SERVE`, `CR_EMAIL`, `CR_PASS`. Output goes to `tools/.out` (`CR_OUT`).

## Visual regression check
1. Serve the build before the change: `node tools/capture.mjs before`, then again as `node tools/capture.mjs noise`.
2. Serve the build after the change: `node tools/capture.mjs after`.
3. `node tools/compare.mjs before after noise -v`
- Captures 32 states (My Files, the Photos grid scrolled and not, Documents, viewer and next image, context menu, New menu, avatar menu, search, rename dialog, settings, shared links; desktop and phone, light and dark) as the computed style of every element, `::before` and `::after` included, plus a screenshot each.
- The second capture of the old build marks elements that differ between identical runs (async text, sub-pixel progress bars); `compare.mjs` ignores them. Animations are finished or paused before capture, signed thumbnail URLs and `cr-h<N>` tagger classes are ignored.
- Re-capture one state to check a suspected timing difference: `node tools/capture.mjs probe phone-light-settings`.
- Not covered: hover, focus, drag, and anything Safari-specific.

## Performance
- `node tools/measure.mjs desktop|phone [--perf]`: scrolls Photos for 8 s, opens the viewer and pages through 12 images, scrolls Documents for 5 s. Prints frames drawn, frames over 50 ms, main-thread time blocked by long frames, and Chrome's style, script and layout time. `phone` emulates an iPhone 13 with the CPU slowed 4x. `--perf` turns on `cr-perf` and lists script time per src file.
- `node tools/trace-selectors.mjs [n]`: per-selector match time during 12 wheel steps (Chrome SelectorStats), with the src file each selector comes from.
- `node tools/trace-restyles.mjs`: how many elements each style recalc touched, which rules forced whole-subtree restyles, and which changes triggered them.
- Compare against the same numbers with no theme (serve an empty file) to see how much of the cost is the theme's. Absolute numbers depend on the machine; compare runs on the same one.

## Lint
- `node tools/lint-has.mjs` (also run in CI) fails on selectors that put `:has()` in an ancestor compound above a rightmost compound with no class, id, attribute or tag. See `architecture.md` → Style recalc cost.
