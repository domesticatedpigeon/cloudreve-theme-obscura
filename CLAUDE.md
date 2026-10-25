# CLAUDE.md

Customization theme for Cloudreve v4, delivered as one HTML file that runs in Cloudreve's **Custom footer HTML** setting.

## Files
- `src/`: the theme source. One file per block: `NNNN-name.css` becomes a `<style>`, `NNNN-name.js` a `<script>`. The number sets load order.
- `build.mjs`: joins `src/` in filename order into `cloudreveCustomFooter.html` and syntax-checks every script. `node build.mjs --check` fails if the output is stale (CI runs it).
- `cloudreveCustomFooter.html`: build output (~20k lines), the file users install. Committed because the README loader fetches it from `main`. Never edit it by hand.
- `architecture.md`: how each feature hooks into Cloudreve (fibers, store, viewer, layout modes, gotchas). Read the relevant section before touching a feature.
- `design-language.md`: visual rules (colour, type, corners, spacing, motion). Every UI change must follow it.
- `README.md`: install loader snippet and feature list.
- `tools/`: dev-only scripts that run the theme in a real Cloudreve with headless Chromium (visual regression check, performance measurement, `:has()` lint). See `tools/README.md`.

## Runtime model
- The README loader fetches the file, moves each `<style>` into `<head>` and re-creates each `<script>` from its `textContent` at the end of `<body>`. Consequences:
	- Only `<style>` and `<script>` blocks survive. Never add markup, `<link>`, `<script src>`, `type="module"`, `import`/`export` or top-level `await`. Build DOM from scripts; load external CSS/fonts by appending `<link>` from a script (see the font loader block).
	- Scripts run after the app has booted and in file order. Never wait for `DOMContentLoaded`/`load`.
	- Every script is a self-contained IIFE: `(() => { ... })();`. No globals except deliberate shared helpers (`window.crT`, `window.crApi`, `window.cr`).
- Cloudreve is a React 18 + MUI + Redux SPA built with Vite. Its DOM is re-rendered constantly, so:
	- Anything added (classes, nodes, attributes) must be re-applied idempotently from a `MutationObserver` and/or interval. Check before writing (`if (!el.classList.contains(c))`) to avoid observer feedback loops.
	- React rewrites `className` on re-render; MUI rewrites Modal root classes. Use `data-cr-*` attributes where a class would be wiped.
	- Never rely on hashed `.css-*` classes or positional children that Cloudreve may change. Target `.Mui*` classes, roles, `data-*` attributes, or structural `:has()` checks.
- Internals are reached through React fibers and the Redux store via the `window.cr` helpers (`cr.fiberOf`, `cr.up`, `cr.store()`, …); never read `__react*` keys directly. See `architecture.md` → React and Redux access. Dispatch Cloudreve's own actions instead of reimplementing its logic.

## Conventions
- Prefix everything with `cr-`: classes (`.cr-*`), custom properties (`--cr-*`), html state classes (`html.cr-dock`, `html.cr-boot`), storage keys (`cr-recent:<userId>`), data attributes (`data-cr-*`).
- Hot `:has()` selectors are precomputed by the class tagger (the early script with array `H`) into `cr-h<N>` classes. Add a row there instead of writing an expensive `:has()` in CSS; reuse an existing `cr-h<N>` if one already matches. Never renumber existing ones.
- Never put `:has()` in an ancestor compound (`X:has(…) Y`), above all when `Y` has no class (`*`, `:nth-child()`, `:not()`): it makes Chrome restyle the whole subtree on every DOM change. Use a tagger class. Give each selector's rightmost compound a class where possible. See `architecture.md` → Style recalc cost.
- Colours, surfaces and radii come from `--cr-*` tokens. Dark values are the default in `:root`; light values override under `@media (prefers-color-scheme: light)`. Add a new token to both; a mode-independent token (e.g. the accent `--cr-accent` / `--cr-accent-rgb`) goes in `:root` only. Never type the accent's value: only data URIs, where `var()` can't reach, repeat it as `%23E989B4`. The viewer has its own palette (`html.cr-vlight`); scripts that paint colours (e.g. the viewer's `PAL`) must change together with the CSS tokens.
- Reuse shared classes (`.cr-lp` pill, `.cr-tbp-mc`, `.cr-tseg-thumb`, spotlight `TILES`) rather than restyling a new element from scratch.
- Animated custom properties are registered with `@property` (e.g. `--cr-fo` for pill fades, so `backdrop-filter` keeps working). Animate `transform`/`scale`/`opacity` or registered properties only; easing `cubic-bezier(0.32,0.72,0,1)`.
- Hover effects only inside `@media (hover: hover)`. Mobile layout is `html:not(.cr-dock)` within `@media (--cr-phone)`; desktop is `html.cr-dock`.
- Width breakpoints are named in `src/0001-breakpoints.css` (`@custom-media --cr-phone (max-width: 599.95px);` etc.) and `build.mjs` expands them; never write a literal width in a CSS `@media`. Scripts can't use the names: `matchMedia` strings must repeat the same values (`599.95px` for phones, never `599px`).
- `!important` is normal here (it has to beat MUI's emotion styles), but prefer a more specific existing hook over stacking more overrides.
- UI strings: use Cloudreve's own i18n keys via `crT(key, englishFallback)` / `crT.set(el, …)`; CSS strings via `--cr-t-*` variables. Record new keys in `architecture.md` → Translations.
- Style: tabs for indentation, double quotes, arrow functions, `const` by default, terse names matching nearby code, no comments. Wrap `localStorage`/`sessionStorage` access in `try/catch` (it throws in private modes).
- Performance: observers must be cheap. Debounce with `requestAnimationFrame`/`setTimeout`, call `mo.takeRecords()` after self-induced mutations, cap per-frame work, and filter `attributeFilter` tightly.

## Making changes
1. Find the feature: `grep -rn` the `cr-` class or keyword in `src/`, and read its `architecture.md` section.
2. Edit the existing file for that feature. Add a new file only for a genuinely new feature, numbered next to related files (order matters: earlier scripts define helpers, the boot gate and the class tagger). Pick an unused number between neighbours (e.g. `0385-` between `0380-` and `0390-`); never renumber existing files.
3. Check both themes, desktop (≥600px) and phone widths, touch and mouse, and that the boot gate (`html.cr-boot`) still reveals without flashes or layout shifts.
4. Run `node build.mjs` and commit `src/` together with the rebuilt `cloudreveCustomFooter.html`.
5. Update `architecture.md` (behaviour, gotchas, why) and `design-language.md` (if a visual rule changed) in the same commit. Keep them as terse bullet lists.

## Testing
- No unit tests. Validate in a real Cloudreve v4: `tools/cloudreve.sh start`, `node tools/serve.mjs`, `node tools/seed.mjs`, then browse it or run the checks in `tools/README.md`. For CSS or class tagger changes, run the visual regression check (capture before/after, `tools/compare.mjs`).
- `node tools/lint-has.mjs` (CI) rejects whole-subtree `:has()` selectors.
- `node build.mjs` syntax-checks every script and names the failing file.
- Script cost per file: see `architecture.md` → Performance measurement (`localStorage cr-perf` + `crPerf()`).
- Chromium + Playwright are available for screenshots; iOS Safari / Liquid Glass behaviour cannot be reproduced in Chrome (see `architecture.md` → iOS Safari).
