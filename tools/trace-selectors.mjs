import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { open, folder, trace, wheel, ROOT } from "./lib.mjs";

const limit = +(process.argv[2] || 40);
const { b, ctx, p } = await open();
await folder(p, "cloudreve://my/Photos");
await p.waitForTimeout(3000);
const events = await trace(ctx, p, ["disabled-by-default-blink.debug"], () => wheel(p, 12));
await b.close();

const stats = new Map();
let total = 0;
for (const e of events) {
	const list = e.args && e.args.selector_stats && e.args.selector_stats.selector_timings;
	if (!list) continue;
	for (const t of list) {
		const o = stats.get(t.selector) || { us: 0, tries: 0, hits: 0 };
		o.us += t["elapsed (us)"] || 0;
		o.tries += t.match_attempts || 0;
		o.hits += t.match_count || 0;
		stats.set(t.selector, o);
		total += t["elapsed (us)"] || 0;
	}
}
const flat = (s) => s.replace(/"/g, "").replace(/\s+/g, " ");
const dir = join(ROOT, "src");
const files = readdirSync(dir).filter((f) => f.endsWith(".css")).map((f) => [f.slice(0, 4), flat(readFileSync(join(dir, f), "utf8"))]);
const theme = [...stats].filter(([s]) => !/\.css-[\w-]+/.test(s)).sort((a, b) => b[1].us - a[1].us);
console.log(`Selector matching: ${(total / 1000).toFixed(0)} ms over ${stats.size} selectors during 12 wheel steps (theme: ${(theme.reduce((a, [, o]) => a + o.us, 0) / 1000).toFixed(0)} ms)`);
for (const [s, o] of theme.slice(0, limit)) {
	const frag = flat(s).slice(0, 45);
	const where = files.filter(([, t]) => t.includes(frag)).map(([n]) => n).join(",") || "?";
	console.log((o.us / 1000).toFixed(0).padStart(5), "ms", String(o.tries).padStart(8), "tries", where.padEnd(10), s.slice(0, 160));
}
