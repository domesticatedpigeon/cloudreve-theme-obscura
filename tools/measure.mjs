import { open, folder, openViewer } from "./lib.mjs";

const form = process.argv[2] || "desktop";
const perf = process.argv.includes("--perf");
const { b, ctx, p } = await open({ form, perf });
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
const cdp = await ctx.newCDPSession(p);
if (form === "phone") await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await cdp.send("Performance.enable");
const metrics = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));

const begin = async () => {
	mark = await metrics();
	await start();
};
const start = () => p.evaluate(() => {
	window.__frames = [];
	let last = performance.now();
	const tick = (t) => {
		window.__frames.push(t - last);
		last = t;
		requestAnimationFrame(tick);
	};
	requestAnimationFrame(tick);
	window.__loaf = 0;
	try {
		new PerformanceObserver((l) => l.getEntries().forEach((e) => (window.__loaf += e.blockingDuration || 0))).observe({ type: "long-animation-frame" });
	} catch (e) {}
	if (window.crPerf) window.crPerf(true);
});
const KEYS = ["RecalcStyleDuration", "ScriptDuration", "LayoutDuration", "TaskDuration"];
let mark = null;
const totals = Object.fromEntries(KEYS.map((k) => [k, 0]));
const collect = async () => {
	const m = await metrics();
	for (const k of KEYS) totals[k] += m[k] - mark[k];
	return p.evaluate(() => ({ frames: window.__frames.slice(1), loaf: window.__loaf, perf: window.crPerf ? window.crPerf() : [] }));
};
const scroll = async (ms) => {
	const { x, y } = await p.evaluate(() => ({ x: Math.round(innerWidth / 2), y: Math.round(innerHeight / 2) }));
	const end = Date.now() + ms;
	for (let dir = 1, n = 0; Date.now() < end; n++) {
		if (form === "phone") await cdp.send("Input.synthesizeScrollGesture", { x, y, yDistance: -dir * 400, speed: 1600, gestureSourceType: "touch" });
		else {
			await p.mouse.move(x, y);
			await p.mouse.wheel(0, dir * 240);
			await p.waitForTimeout(40);
		}
		if (n % 25 === 24) dir = -dir;
	}
};

await folder(p, "cloudreve://my/Photos");
await p.waitForTimeout(3000);
const parts = [];
await begin();
await scroll(8000);
const viewer = await openViewer(p, 1);
if (!viewer) errors.push("viewer did not open");
await p.waitForTimeout(1200);
for (let i = 0; i < 12; i++) {
	await p.keyboard.press("ArrowRight");
	await p.waitForTimeout(450);
}
await p.keyboard.press("Escape");
await p.waitForTimeout(800);
parts.push(await collect());
await folder(p, "cloudreve://my/Documents");
await begin();
await scroll(5000);
parts.push(await collect());

const frames = parts.flatMap((x) => x.frames);
const ms = (k) => Math.round(totals[k] * 1000);
const res = {
	form,
	theme: perf ? "on, cr-perf" : "as installed",
	viewer,
	frames: frames.length,
	over50ms: frames.filter((d) => d > 50).length,
	worstMs: Math.round(Math.max(0, ...frames)),
	blockedMs: Math.round(parts.reduce((a, x) => a + x.loaf, 0)),
	styleMs: ms("RecalcStyleDuration"),
	scriptMs: ms("ScriptDuration"),
	layoutMs: ms("LayoutDuration"),
	taskMs: ms("TaskDuration"),
	errors: [...new Set(errors)],
};
console.log(JSON.stringify(res));
if (perf) {
	const rows = new Map();
	parts.forEach((x) => x.perf.forEach((r) => {
		const o = rows.get(r.source) || { source: r.source, calls: 0, ms: 0 };
		o.calls += r.calls;
		o.ms += r["ms total"];
		rows.set(r.source, o);
	}));
	[...rows.values()].sort((a, b) => b.ms - a.ms).slice(0, 20).forEach((r) => console.log(r.ms.toFixed(0).padStart(7), "ms", String(r.calls).padStart(6), "calls ", r.source));
}
await b.close();
