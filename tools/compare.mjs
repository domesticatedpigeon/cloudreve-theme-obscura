import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { OUT } from "./lib.mjs";

const args = process.argv.slice(2);
const verbose = args.includes("-v");
const [a, b, noise] = args.filter((x) => !x.startsWith("-"));
if (!a || !b) {
	console.error("usage: node tools/compare.mjs <before> <after> [noise-baseline] [-v]");
	process.exit(1);
}
const PROPS = ["display", "position", "visibility", "opacity", "color", "background-color", "background-image", "border-top-left-radius", "border-bottom-right-radius", "border-top-color", "border-top-width", "padding-top", "padding-left", "margin-top", "margin-left", "width", "height", "top", "left", "transform", "box-shadow", "font-size", "font-weight", "line-height", "z-index", "backdrop-filter", "cursor", "pointer-events", "overflow-x", "overflow-y", "gap", "flex-direction", "justify-content", "align-items", "grid-template-columns", "object-fit", "filter", "content", "mask-image", "outline-color", "text-align", "white-space", "transition-property", "animation-name", "scale", "translate"];
const load = (dir, f) => {
	const o = JSON.parse(readFileSync(join(OUT, dir, f), "utf8"));
	for (const k in o) o[k] = o[k].replace(/url\("[^"]*?\/([^/"?]+\.(?:jpg|png|webp))[^"]*"\)/g, 'url("$1")');
	return o;
};

let total = 0;
for (const f of readdirSync(join(OUT, a)).filter((x) => x.endsWith(".json")).sort()) {
	if (!existsSync(join(OUT, b, f))) {
		console.log("Missing in", b + ":", f);
		continue;
	}
	const A = load(a, f);
	const B = load(b, f);
	const N = noise && existsSync(join(OUT, noise, f)) ? load(noise, f) : null;
	const diffs = Object.keys(A).filter((k) => k in B && A[k] !== B[k] && !(N && (!(k in N) || N[k] !== A[k])));
	const onlyA = Object.keys(A).filter((k) => !(k in B)).length;
	const onlyB = Object.keys(B).filter((k) => !(k in A)).length;
	total += diffs.length;
	console.log(f.replace(/\.json$/, "").padEnd(30), "elements", String(Object.keys(A).length).padStart(5), "  diffs", String(diffs.length).padStart(4), "  only-before/after", onlyA, "/", onlyB);
	if (!verbose) continue;
	for (const k of diffs.slice(0, 8)) {
		const x = A[k].split("~");
		const y = B[k].split("~");
		console.log("   ", k.slice(-100), " .", x[0].slice(0, 70));
		if (x[0] !== y[0]) console.log("      classes", JSON.stringify(x[0]), "→", JSON.stringify(y[0]));
		["", "::before", "::after"].forEach((pseudo, j) => {
			const pa = x[j + 1].split("|");
			const pb = y[j + 1].split("|");
			pa.forEach((v, i) => {
				if (v !== pb[i]) console.log("     ", pseudo + PROPS[i] + ":", JSON.stringify(v).slice(0, 80), "→", JSON.stringify(pb[i]).slice(0, 80));
			});
		});
	}
}
console.log("Total differing elements:", total);
process.exitCode = total ? 1 : 0;
