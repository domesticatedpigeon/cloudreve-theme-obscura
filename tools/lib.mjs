import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const { chromium, devices } = createRequire(import.meta.url)("playwright");
export const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
export const OUT = process.env.CR_OUT || join(ROOT, "tools", ".out");
export const BASE = process.env.CR_URL || "http://127.0.0.1:5212";
export const SERVE = process.env.CR_SERVE || "http://127.0.0.1:8099";
export const EMAIL = process.env.CR_EMAIL || "admin@example.com";
export const PASS = process.env.CR_PASS || "obscura-test";

export const api = async (method, path, body, tok) => {
	const r = await fetch(BASE + "/api/v4" + path, { method, headers: { "content-type": "application/json", ...(tok ? { authorization: "Bearer " + tok } : {}) }, body: body ? JSON.stringify(body) : undefined });
	const o = await r.json();
	if (o.code !== 0) throw new Error(path + " " + JSON.stringify(o).slice(0, 200));
	return o.data;
};

export const login = () => api("POST", "/session/token", { email: EMAIL, password: PASS });

export const open = async ({ form = "desktop", scheme = "light", perf = false } = {}) => {
	const b = await chromium.launch();
	const opts = form === "phone" ? { ...devices["iPhone 13"] } : { viewport: { width: 1440, height: 900 } };
	delete opts.defaultBrowserType;
	const ctx = await b.newContext({ ...opts, colorScheme: scheme });
	const p = await ctx.newPage();
	const l = await login();
	await p.goto(BASE + "/404-blank");
	await p.evaluate(([l, perf]) => {
		localStorage.setItem("cloudreve_session", JSON.stringify({ current: l.user.id, sessions: { [l.user.id]: { ...l, settings: {} } }, anonymousSettings: {} }));
		if (perf) localStorage.setItem("cr-perf", "1");
		else localStorage.removeItem("cr-perf");
	}, [l, perf]);
	return { b, ctx, p };
};

export const folder = async (p, path) => {
	await p.goto(BASE + "/home?path=" + encodeURIComponent(path));
	await p.waitForSelector("main [data-rect-id], main .MuiImageListItem-root, main [data-index]", { timeout: 20000 }).catch(() => {});
	await p.waitForTimeout(2500);
};

export const themed = (p) => p.evaluate(() => !!window.cr);

export const openViewer = async (p, n = 0) => {
	const t = p.locator("main [data-rect-id], main .MuiImageListItem-root").nth(n);
	if (await themed(p)) await t.click();
	else await t.dblclick();
	const pick = p.getByText("Image Viewer", { exact: true });
	if (await pick.waitFor({ timeout: 2500 }).then(() => true).catch(() => false)) {
		await pick.click();
		await p.getByText("Always", { exact: true }).click();
	}
	return p.waitForSelector(".PhotoView-Portal", { timeout: 10000 }).then(() => true).catch(() => false);
};

export const trace = async (ctx, p, categories, fn) => {
	const cdp = await ctx.newCDPSession(p);
	const events = [];
	cdp.on("Tracing.dataCollected", (d) => events.push(...d.value));
	const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
	await cdp.send("Tracing.start", { traceConfig: { includedCategories: categories } });
	await fn();
	await cdp.send("Tracing.end");
	await done;
	return events;
};

export const wheel = async (p, steps, dy = 240) => {
	const { x, y } = await p.evaluate(() => ({ x: innerWidth / 2, y: innerHeight / 2 }));
	for (let i = 0; i < steps; i++) {
		await p.mouse.move(x + (i % 5) * 20, y);
		await p.mouse.wheel(0, i % 20 < 10 ? dy : -dy);
		await p.waitForTimeout(50);
	}
};
