import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, BASE, SERVE, EMAIL, PASS, api, login, chromium } from "./lib.mjs";

const PHOTOS = 240;
const DOCS = 300;

await api("POST", "/user", { email: EMAIL, password: PASS }).catch((e) => console.log("Admin exists or registration closed:", e.message.slice(0, 80)));
const tok = (await login()).token.access_token;

const readme = readFileSync(join(ROOT, "README.md"), "utf8");
const loader = /```html\n([\s\S]*?)```/.exec(readme)[1].replace(/const url = "[^"]*";/, `const url = "${SERVE}/theme.html";`);
await api("PATCH", "/admin/settings", { settings: { siteScript: loader } }, tok);
console.log("Custom footer HTML set to the README loader, pointing at", SERVE + "/theme.html");

const list = await api("GET", "/file?uri=" + encodeURIComponent("cloudreve://my") + "&page_size=50", null, tok);
if (list.files && list.files.some((f) => f.name === "Photos")) {
	console.log("Test files already exist, skipping upload");
	process.exit(0);
}
const policy = list.storage_policy.id;
for (const f of ["Photos", "Documents", "Music", "Projects", "Archive"]) await api("POST", "/file/create", { uri: "cloudreve://my/" + f, type: "folder" }, tok);
for (let i = 0; i < DOCS; i++) await api("POST", "/file/create", { uri: `cloudreve://my/Documents/Report ${String(i).padStart(3, "0")}.txt`, type: "file" }, tok);

const b = await chromium.launch();
const p = await b.newPage();
for (let i = 0; i < PHOTOS; i++) {
	const b64 = await p.evaluate((seed) => {
		let s = seed + 1;
		const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
		const [w, h] = [[1600, 1200], [1200, 1600], [1920, 1080], [1080, 1350]][Math.floor(rnd() * 4)];
		const c = document.createElement("canvas");
		c.width = w;
		c.height = h;
		const g = c.getContext("2d");
		const col = () => `rgb(${Math.floor(rnd() * 255)},${Math.floor(rnd() * 255)},${Math.floor(rnd() * 255)})`;
		g.fillStyle = col();
		g.fillRect(0, 0, w, h);
		for (let k = 0; k < 12; k++) {
			g.fillStyle = col();
			g.beginPath();
			g.arc(rnd() * w, rnd() * h, 40 + rnd() * 360, 0, Math.PI * 2);
			g.fill();
		}
		return c.toDataURL("image/jpeg", 0.8).split(",")[1];
	}, i);
	const buf = Buffer.from(b64, "base64");
	const name = `IMG_${String(i).padStart(4, "0")}.jpg`;
	const s = await api("PUT", "/file/upload", { uri: "cloudreve://my/Photos/" + name, size: buf.length, policy_id: policy, mime_type: "image/jpeg", last_modified: Date.now() }, tok);
	const chunk = s.chunk_size || buf.length;
	for (let o = 0, k = 0; o < buf.length; o += chunk, k++) {
		const r = await fetch(`${BASE}/api/v4/file/upload/${s.session_id}/${k}`, { method: "POST", headers: { authorization: "Bearer " + tok, "content-type": "application/octet-stream" }, body: buf.subarray(o, o + chunk) });
		const j = await r.json();
		if (j.code !== 0) throw new Error("upload " + name + " " + JSON.stringify(j));
	}
}
await b.close();
console.log(`Uploaded ${PHOTOS} photos and created ${DOCS} documents`);
