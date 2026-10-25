import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const SRC = "src";
const OUT = "cloudreveCustomFooter.html";
const NAME = /^\d{4}-[a-z0-9-]+\.(css|js)$/;
const TAG = { css: "style", js: "script" };

const check = process.argv.includes("--check");
const errors = [];

const blocks = readdirSync(SRC).sort().map((file) => {
	const ext = NAME.exec(file)?.[1];
	if (!ext) {
		errors.push(`${file}: name must match NNNN-name.css or NNNN-name.js`);
		return "";
	}
	let body = readFileSync(`${SRC}/${file}`, "utf8");
	if (!body.endsWith("\n")) body += "\n";
	if (/<\/(style|script)/i.test(body)) errors.push(`${file}: contains a closing </style> or </script> tag`);
	if (ext === "js") {
		try {
			new Function(body);
		} catch (e) {
			errors.push(`${file}: ${e.message}`);
		}
	}
	const tag = TAG[ext];
	const url = ext === "js" ? `//# sourceURL=cr/${file}\n` : `/*# sourceURL=cr/${file} */\n`;
	return `<${tag}>\n${body}${url}</${tag}>`;
});

if (errors.length) {
	console.error(errors.join("\n"));
	process.exit(1);
}

const html = blocks.join("\n") + "\n";

if (check) {
	let current = "";
	try {
		current = readFileSync(OUT, "utf8");
	} catch (e) {}
	if (current !== html) {
		console.error(`${OUT} is out of date. Run: node build.mjs`);
		process.exit(1);
	}
	console.log(`${OUT} is up to date (${blocks.length} blocks)`);
} else {
	writeFileSync(OUT, html);
	console.log(`Wrote ${OUT} (${blocks.length} blocks)`);
}
