# CLAUDE.md

Customization theme for Cloudreve v4, delivered as one HTML file that runs in Cloudreve's **Custom footer HTML** setting.

## Files
- `cloudreveCustomFooter.html`: the whole theme (~20k lines). A flat sequence of `<style>` and `<script>` blocks, nothing else.
- `architecture.md`: how each feature hooks into Cloudreve (fibers, store, viewer, layout modes, gotchas). Read the relevant section before touching a feature.
- `design-language.md`: visual rules (colour, type, corners, spacing, motion). Every UI change must follow it.
- `README.md`: install loader snippet and feature list.

## Runtime model
- The README loader fetches the file, moves each `<style>` into `<head>` and re-creates each `<script>` from its `textContent` at the end of `<body>`. Consequences:
	- Only `<style>` and `<script>` blocks survive. Never add markup, `<link>`, `<script src>`, `type="module"`, `import`/`export` or top-level `await`. Build DOM from scripts; load external CSS/fonts by appending `<link>` from a script (see the font loader block).
	- Scripts run after the app has booted and in file order. Never wait for `DOMContentLoaded`/`load`.
	- Every script is a self-contained IIFE: `(() => { ... })();`. No globals except deliberate shared helpers (`window.crT`).
- Cloudreve is a React 18 + MUI + Redux SPA built with Vite. Its DOM is re-rendered constantly, so:
	- Anything added (classes, nodes, attributes) must be re-applied idempotently from a `MutationObserver` and/or interval. Check before writing (`if (!el.classList.contains(c))`) to avoid observer feedback loops.
	- React rewrites `className` on re-render; MUI rewrites Modal root classes. Use `data-cr-*` attributes where a class would be wiped.
	- Never rely on hashed `.css-*` classes or positional children that Cloudreve may change. Target `.Mui*` classes, roles, `data-*` attributes, or structural `:has()` checks.
- Internals are reached through React fibers (`el[__reactFiber$…]`, root `__reactContainer$`) and the Redux store found on the root's children; see `architecture.md` → React and Redux access. Dispatch Cloudreve's own actions instead of reimplementing its logic.

## Conventions
- Prefix everything with `cr-`: classes (`.cr-*`), custom properties (`--cr-*`), html state classes (`html.cr-dock`, `html.cr-boot`), storage keys (`cr-recent:<userId>`), data attributes (`data-cr-*`).
- Hot `:has()` selectors are precomputed by the class tagger (the early script with array `H`) into `cr-h<N>` classes. Add a row there instead of writing an expensive `:has()` in CSS; reuse an existing `cr-h<N>` if one already matches. Never renumber existing ones.
- Colours, surfaces and radii come from `--cr-*` tokens. Dark values are the default in `:root`; light values override under `@media (prefers-color-scheme: light)`. Add a new token to both. The viewer has its own palette (`html.cr-vlight`); scripts that paint colours (e.g. the viewer's `PAL`) must change together with the CSS tokens.
- Reuse shared classes (`.cr-lp` pill, `.cr-tbp-mc`, `.cr-tseg-thumb`, spotlight `TILES`) rather than restyling a new element from scratch.
- Animated custom properties are registered with `@property` (e.g. `--cr-fo` for pill fades, so `backdrop-filter` keeps working). Animate `transform`/`scale`/`opacity` or registered properties only; easing `cubic-bezier(0.32,0.72,0,1)`.
- Hover effects only inside `@media (hover: hover)`. Mobile layout is `html:not(.cr-dock)` within `@media (max-width: 599.95px)`; desktop is `html.cr-dock`.
- `!important` is normal here (it has to beat MUI's emotion styles), but prefer a more specific existing hook over stacking more overrides.
- UI strings: use Cloudreve's own i18n keys via `crT(key, englishFallback)` / `crT.set(el, …)`; CSS strings via `--cr-t-*` variables. Record new keys in `architecture.md` → Translations.
- Style: tabs for indentation, double quotes, arrow functions, `const` by default, terse names matching nearby code, no comments. Wrap `localStorage`/`sessionStorage` access in `try/catch` (it throws in private modes).
- Performance: observers must be cheap. Debounce with `requestAnimationFrame`/`setTimeout`, call `mo.takeRecords()` after self-induced mutations, cap per-frame work, and filter `attributeFilter` tightly.

## Making changes
1. Find the feature: `grep -n` the `cr-` class or keyword in `cloudreveCustomFooter.html`, and read its `architecture.md` section.
2. Edit the existing block for that feature. Add a new `<style>`/`<script>` block only for a genuinely new feature, placed next to related blocks (order matters: earlier scripts define helpers, the boot gate and the class tagger).
3. Check both themes, desktop (≥600px) and phone widths, touch and mouse, and that the boot gate (`html.cr-boot`) still reveals without flashes or layout shifts.
4. Update `architecture.md` (behaviour, gotchas, why) and `design-language.md` (if a visual rule changed) in the same commit. Keep them as terse bullet lists.

## Testing
- No build, linter or test suite. Validate by loading the file into a Cloudreve v4 instance (paste the README loader pointing at a served copy of the file, or paste the file directly into Custom footer HTML).
- Quick syntax check of all scripts:
  `node -e 'const s=require("fs").readFileSync("cloudreveCustomFooter.html","utf8");[...s.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m,i)=>{try{new Function(m[1])}catch(e){console.log(i,e.message)}})'`
- Chromium + Playwright are available for screenshots; iOS Safari / Liquid Glass behaviour cannot be reproduced in Chrome (see `architecture.md` → iOS Safari).
