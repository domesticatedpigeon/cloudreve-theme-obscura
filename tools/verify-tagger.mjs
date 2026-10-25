import { readFileSync } from "node:fs";
import { join } from "node:path";
import { open, folder, openViewer, wheel, BASE, ROOT } from "./lib.mjs";

const src = readFileSync(join(ROOT, "src", "0050-class-tagger.js"), "utf8");
const rows = new Function("return " + /const H = (\[[\s\S]*?\n\t\]);/.exec(src)[1])();

const check = (p, label) => p.evaluate(([rows, label]) => {
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
	const flags = new Set((document.body.getAttribute("data-cr-h") || "").split(" ").filter(Boolean));
	const bad = [];
	for (const [a, h, cls, mode, sel] of rows) {
		if (mode === 4) {
			const want = root.matches(a + h);
			if (want !== flags.has(cls.slice(3))) bad.push(`${label}: ${cls} flag should be ${want}`);
			continue;
		}
		const want = collect(a, h, mode, sel);
		const have = new Set(document.getElementsByClassName(cls));
		const missing = [...want].filter((e) => !have.has(e)).length;
		const extra = [...have].filter((e) => !want.has(e)).length;
		if (missing || extra) bad.push(`${label}: ${cls} missing ${missing}, extra ${extra}`);
	}
	return bad;
}, [rows, label]);

const problems = [];
let checks = 0;
const at = async (p, label) => {
	await p.waitForTimeout(400);
	problems.push(...(await check(p, label)));
	checks++;
};
const flow = async (form) => {
	const { b, p } = await open({ form });
	await folder(p, "cloudreve://my");
	await at(p, form + " root");
	await folder(p, "cloudreve://my/Photos");
	await at(p, form + " photos");
	for (let i = 0; i < 6; i++) {
		await wheel(p, 4);
		await at(p, form + " photos scrolled " + i);
	}
	if (form === "desktop") {
		await p.locator("main [data-rect-id]").nth(2).click({ button: "right" });
		await at(p, form + " context menu");
		await p.keyboard.press("Escape");
		await at(p, form + " menu closed");
		await p.locator("main [data-rect-id]").nth(3).hover();
		await at(p, form + " hover");
	}
	await openViewer(p, 1);
	await at(p, form + " viewer");
	for (let i = 0; i < 4; i++) {
		await p.keyboard.press("ArrowRight");
		await at(p, form + " viewer next " + i);
	}
	await p.mouse.click(300, 300);
	await at(p, form + " viewer clean");
	await p.keyboard.press("Escape");
	await at(p, form + " viewer closed");
	await folder(p, "cloudreve://my/Documents");
	await at(p, form + " documents");
	if (form === "desktop") {
		await p.locator("button.cr-new").first().click();
		await at(p, form + " new menu");
		await p.keyboard.press("Escape");
		await p.getByText("Search files", { exact: true }).first().click();
		await at(p, form + " search");
		await p.keyboard.press("Escape");
	} else {
		await p.locator("header button").first().click();
		await at(p, form + " drawer");
		await p.keyboard.press("Escape");
	}
	await p.goto(BASE + "/settings");
	await p.waitForTimeout(3000);
	await at(p, form + " settings");
	await b.close();
};
await flow("desktop");
await flow("phone");
console.log(`${checks} checkpoints, ${problems.length} stale tagger results`);
problems.slice(0, 30).forEach((x) => console.log("  " + x));
process.exitCode = problems.length ? 1 : 0;
