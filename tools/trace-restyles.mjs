import { open, folder, trace, wheel } from "./lib.mjs";

const { b, ctx, p } = await open();
await folder(p, "cloudreve://my/Photos");
await p.waitForTimeout(3000);
const elements = await p.evaluate(() => document.querySelectorAll("*").length);
const events = await trace(ctx, p, ["devtools.timeline", "disabled-by-default-devtools.timeline.invalidationTracking"], () => wheel(p, 30));
await b.close();

const sorted = events.filter((e) => e.ts).sort((a, b) => a.ts - b.ts);
const whole = elements * 0.75;
const triggers = {};
const subtree = {};
let recalcs = 0, restyled = 0, ms = 0, big = 0, win = [];
const node = (n) => (n || "").replace(/ class='([^']*)'/, (m, c) => "." + c.split(" ").filter((x) => !x.startsWith("css-")).slice(0, 3).join(".")).slice(0, 60);
for (const e of sorted) {
	if (e.name === "UpdateLayoutTree" && e.ph === "X") {
		const c = (e.args && e.args.elementCount) || 0;
		recalcs++;
		restyled += c;
		ms += (e.dur || 0) / 1000;
		if (c > whole) big++;
		const keys = new Set();
		for (const w of win) {
			const d = (w.args && w.args.data) || {};
			if (/invalidates subtree/.test(d.reason || "") && d.selectors) for (const x of d.selectors) subtree[x.selector] = (subtree[x.selector] || 0) + 1;
			if (w.name !== "ScheduleStyleInvalidationTracking" && w.name !== "StyleRecalcInvalidationTracking") continue;
			const why = d.changedClass ? "class " + d.changedClass : d.changedAttribute ? "attr " + d.changedAttribute : d.changedPseudo ? "pseudo " + d.changedPseudo : d.reason || "?";
			keys.add(why + " @ " + node(d.nodeName));
		}
		for (const k of keys) triggers[k] = (triggers[k] || 0) + c / keys.size;
		win = [];
	} else if (/Invalidation/.test(e.name)) win.push(e);
}
console.log(`Page has ${elements} elements. 30 wheel steps: ${recalcs} style recalcs, ${restyled} elements restyled, ${ms.toFixed(0)} ms, ${big} restyled most of the page.`);
console.log("\nRules forcing whole-subtree restyles (count):");
Object.entries(subtree).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([s, n]) => console.log(String(n).padStart(6), s.slice(0, 170)));
console.log("\nWhat triggered restyles (elements restyled, shared between causes of one recalc):");
Object.entries(triggers).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([k, v]) => console.log(String(Math.round(v)).padStart(7), k));
