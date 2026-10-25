import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../src/", import.meta.url));

const split = (s, test) => {
	const out = [];
	let depth = 0, quote = null, cur = "";
	for (const c of s) {
		if (quote) {
			cur += c;
			if (c === quote) quote = null;
			continue;
		}
		if (c === '"' || c === "'") quote = c;
		if (c === "(") depth++;
		if (c === ")") depth--;
		if (!quote && depth === 0 && test(c)) {
			out.push(cur);
			cur = "";
		} else cur += c;
	}
	out.push(cur);
	return out.map((x) => x.trim()).filter(Boolean);
};
const outside = (c) => {
	let o = "", depth = 0;
	for (const ch of c) {
		if (ch === "(") depth++;
		if (depth === 0) o += ch;
		if (ch === ")") depth--;
	}
	return o.replace(/::?[\w-]+/g, "");
};
const keyed = (c) => /[#.[]/.test(outside(c)) || /^[a-z]/i.test(outside(c)) || /:(is|where)\((?=[^)]*\.)/.test(c);

const found = [];
for (const f of readdirSync(dir).filter((x) => x.endsWith(".css")).sort()) {
	const txt = readFileSync(join(dir, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
	let buf = "", line = 1, start = 1;
	for (const c of txt) {
		if (c === "\n") line++;
		if (c === "{") {
			const head = buf.trim();
			if (head && !head.startsWith("@")) {
				for (const sel of split(head, (x) => x === ",")) {
					const parts = split(sel, (x) => " >+~".includes(x));
					if (parts.length < 2) continue;
					const right = parts[parts.length - 1];
					if (parts.slice(0, -1).some((x) => x.includes(":has(")) && !keyed(right)) found.push(`${f}:${start}  ${sel.replace(/\s+/g, " ")}`);
				}
			}
			buf = "";
			continue;
		}
		if (c === "}" || c === ";") {
			buf = "";
			start = line;
			continue;
		}
		if (!buf.trim()) start = line;
		buf += c;
	}
}
if (found.length) {
	console.error(`${found.length} selector(s) put :has() in an ancestor compound above a rightmost compound with no class, id, attribute or tag.\nChrome restyles the whole subtree for these on every DOM change. Use a class tagger row instead (architecture.md → Style recalc cost):\n`);
	found.forEach((x) => console.error("  " + x));
	process.exit(1);
}
console.log("No whole-subtree :has() selectors");
