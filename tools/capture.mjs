import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { open, folder, openViewer, BASE, OUT } from "./lib.mjs";

const [label, only] = process.argv.slice(2);
if (!label) {
	console.error("usage: node tools/capture.mjs <label> [state-filter]");
	process.exit(1);
}
const dir = join(OUT, label);
mkdirSync(dir, { recursive: true });

const PROPS = ["display", "position", "visibility", "opacity", "color", "background-color", "background-image", "border-top-left-radius", "border-bottom-right-radius", "border-top-color", "border-top-width", "padding-top", "padding-left", "margin-top", "margin-left", "width", "height", "top", "left", "transform", "box-shadow", "font-size", "font-weight", "line-height", "z-index", "backdrop-filter", "cursor", "pointer-events", "overflow-x", "overflow-y", "gap", "flex-direction", "justify-content", "align-items", "grid-template-columns", "object-fit", "filter", "content", "mask-image", "outline-color", "text-align", "white-space", "transition-property", "animation-name", "scale", "translate"];

const snap = async (p, name) => {
	const data = await p.evaluate((PROPS) => {
		for (const an of document.getAnimations()) {
			try {
				if (an.effect.getComputedTiming().endTime === Infinity) {
					an.pause();
					an.currentTime = 0;
				} else an.finish();
			} catch (e) {}
		}
		const keyOf = (e) => {
			const parts = [];
			for (let n = e; n && n !== document.documentElement; n = n.parentElement) {
				let i = 0;
				for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++;
				parts.push(n.tagName.toLowerCase() + ":" + i);
			}
			return parts.reverse().join("/");
		};
		const pick = (cs) => PROPS.map((k) => cs.getPropertyValue(k)).join("|");
		const out = { html: "~" + pick(getComputedStyle(document.documentElement)) + "~~" };
		for (const e of document.body.querySelectorAll("*")) {
			if (e.closest("svg") && e.tagName.toLowerCase() !== "svg") continue;
			const cls = [...e.classList].filter((c) => !/^css-/.test(c) && !/^cr-h\d+$/.test(c)).sort().join(".");
			out[keyOf(e)] = cls + "~" + pick(getComputedStyle(e)) + "~" + pick(getComputedStyle(e, "::before")) + "~" + pick(getComputedStyle(e, "::after"));
		}
		return out;
	}, PROPS);
	writeFileSync(join(dir, name + ".json"), JSON.stringify(data));
	await p.screenshot({ path: join(dir, name + ".png") });
};

const settle = (p, ms = 2500) => p.waitForTimeout(ms);
const esc = async (p) => {
	await p.keyboard.press("Escape");
	await settle(p, 600);
};

const core = [
	["root", (p) => folder(p, "cloudreve://my")],
	["photos", (p) => folder(p, "cloudreve://my/Photos")],
	["photos-scrolled", async (p) => {
		await folder(p, "cloudreve://my/Photos");
		await p.mouse.move(700, 500);
		for (let i = 0; i < 6; i++) {
			await p.mouse.wheel(0, 400);
			await p.waitForTimeout(100);
		}
		await settle(p);
	}],
	["viewer", async (p) => {
		await folder(p, "cloudreve://my/Photos");
		await openViewer(p, 1);
		await settle(p, 3000);
	}],
	["viewer-next", async (p) => {
		await p.keyboard.press("ArrowRight");
		await settle(p);
	}],
];
const desktopExtra = [
	["documents", (p) => folder(p, "cloudreve://my/Documents")],
	["ctxmenu", async (p) => {
		await folder(p, "cloudreve://my/Photos");
		await p.locator("main [data-rect-id]").nth(2).click({ button: "right" });
		await settle(p, 1500);
	}],
	["newmenu", async (p) => {
		await folder(p, "cloudreve://my");
		await p.locator("button.cr-new").first().click();
		await settle(p, 1500);
	}],
	["avatar", async (p) => {
		await esc(p);
		await p.locator("header .MuiAvatar-root, .MuiAvatar-root").first().click();
		await settle(p, 1500);
	}],
	["search", async (p) => {
		await esc(p);
		await p.getByText("Search files", { exact: true }).first().click();
		await settle(p, 1500);
	}],
	["settings", async (p) => {
		await p.goto(BASE + "/settings");
		await settle(p, 3500);
	}],
	["shared", async (p) => {
		await p.goto(BASE + "/shares");
		await settle(p, 3000);
	}],
	["rename", async (p) => {
		await folder(p, "cloudreve://my/Photos");
		await p.locator("main [data-rect-id]").nth(3).click({ button: "right" });
		await settle(p, 1200);
		await p.getByText("Rename", { exact: true }).first().click();
		await settle(p, 1500);
	}],
];
const phoneExtra = [
	["documents", (p) => folder(p, "cloudreve://my/Documents")],
	["fab", async (p) => {
		await folder(p, "cloudreve://my");
		const v = p.viewportSize();
		await p.mouse.click(v.width - 42, v.height - 33);
		await settle(p, 1500);
	}],
	["drawer", async (p) => {
		await esc(p);
		await p.locator("header button").first().click();
		await settle(p, 1500);
	}],
	["settings", async (p) => {
		await p.goto(BASE + "/settings");
		await settle(p, 3500);
	}],
];

const run = async (form, scheme, states) => {
	const ids = states.map(([name]) => `${form}-${scheme}-${name}`);
	if (only && !ids.some((id) => id.includes(only))) return;
	const { b, p } = await open({ form, scheme });
	for (const [name, fn] of states) {
		const id = `${form}-${scheme}-${name}`;
		if (only && !id.includes(only)) continue;
		try {
			await fn(p);
			await snap(p, id);
		} catch (e) {
			console.log("State failed:", id, e.message.split("\n")[0]);
		}
	}
	await b.close();
};

await run("desktop", "light", [...core, ...desktopExtra]);
await run("desktop", "dark", core);
await run("phone", "light", [...core, ...phoneExtra]);
await run("phone", "dark", core);
console.log("Captured", label, "in", dir);
