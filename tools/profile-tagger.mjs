import { readFileSync } from "node:fs";
import { join } from "node:path";
import { open, folder, openViewer, BASE, ROOT } from "./lib.mjs";

const src = readFileSync(join(ROOT, "src", "0050-class-tagger.js"), "utf8");
const rows = new Function("return " + /const H = (\[[\s\S]*?\n\t\]);/.exec(src)[1])();
const RUNS = 20;

const profile = (p) => p.evaluate(([rows, RUNS]) => {
	const root = document.documentElement;
	const collect = (a, h, mode, sel) => {
		const next = new Set();
		if (mode === 0) {
			document.querySelectorAll(a + h).forEach((e) => next.add(e));
			return next;
		}
		if (mode === 3) {
			for (const e of document.querySelectorAll(a)) if (e.matches(h)) next.add(e);
			return next;
		}
		const full = a + h;
		const seen = new Set();
		for (const n of document.querySelectorAll(sel)) {
			let q = n.parentElement;
			while (q && !seen.has(q)) {
				seen.add(q);
				if (q.matches(a) && q.matches(full)) next.add(q);
				if (mode === 2) break;
				q = q.parentElement;
			}
		}
		return next;
	};
	return rows.map(([a, h, cls, mode, sel]) => {
		const t = performance.now();
		let hits = 0;
		for (let i = 0; i < RUNS; i++) {
			try {
				hits = mode === 4 ? +root.matches(a + h) : collect(a, h, mode, sel).size;
			} catch (e) {
				hits = -1;
			}
		}
		return { cls, mode, ms: (performance.now() - t) / RUNS, hits };
	});
}, [rows, RUNS]);

const results = {};
const states = [
	["desktop photos", "desktop", (p) => folder(p, "cloudreve://my/Photos")],
	["desktop viewer", "desktop", async (p) => { await folder(p, "cloudreve://my/Photos"); await openViewer(p, 1); await p.waitForTimeout(2500); }],
	["desktop settings", "desktop", async (p) => { await p.goto(BASE + "/settings"); await p.waitForTimeout(3500); }],
	["phone photos", "phone", (p) => folder(p, "cloudreve://my/Photos")],
];
for (const [name, form, go] of states) {
	const { b, p } = await open({ form });
	await go(p);
	const elements = await p.evaluate(() => document.querySelectorAll("*").length);
	const r = await profile(p);
	results[name] = { elements, total: r.reduce((x, y) => x + y.ms, 0), rows: r };
	await b.close();
}

const names = Object.keys(results);
console.log("Class tagger: time for one full pass, per state (ms):");
names.forEach((n) => console.log(`  ${n.padEnd(18)} ${results[n].total.toFixed(2).padStart(7)} ms   ${results[n].elements} elements`));
console.log("\nRows by worst cost (ms per pass in each state, hits in the first):");
const byRow = rows.map((row, i) => ({ row, cost: names.map((n) => results[n].rows[i].ms), hits: results[names[0]].rows[i].hits }));
byRow.sort((a, b) => Math.max(...b.cost) - Math.max(...a.cost));
for (const { row, cost, hits } of byRow.slice(0, +(process.argv[2] || 30))) {
	const [a, h, cls, mode] = row;
	console.log(cost.map((c) => c.toFixed(2).padStart(6)).join(" "), " ", cls.padEnd(8), "m" + mode, String(hits).padStart(4), " ", (a + h).slice(0, 120));
}
