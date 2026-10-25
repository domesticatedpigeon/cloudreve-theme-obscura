import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const SRC = "src";
const OUT = "cloudreveCustomFooter.html";
const NAME = /^\d{4}-[a-z0-9-]+\.(css|js)$/;
const TAG = { css: "style", js: "script" };
const CUSTOM_MEDIA = /^@custom-media\s+(--[\w-]+)\s+([^;]+);[ \t]*\n?/gm;

const check = process.argv.includes("--check");
const errors = [];

const files = readdirSync(SRC).sort().map((file) => {
	const ext = NAME.exec(file)?.[1];
	if (!ext) errors.push(`${file}: name must match NNNN-name.css or NNNN-name.js`);
	return { file, ext, body: readFileSync(`${SRC}/${file}`, "utf8") };
});

const media = new Map();
for (const f of files.filter((x) => x.ext === "css")) {
	f.body = f.body.replace(CUSTOM_MEDIA, (m, name, query) => {
		if (media.has(name)) errors.push(`${f.file}: @custom-media ${name} is defined twice`);
		media.set(name, query.trim());
		return "";
	});
}
const expand = (file, body) => body.replace(/@media[^{;]*/g, (prelude) => prelude.replace(/\((--[\w-]+)\)/g, (m, name) => {
	if (media.has(name)) return media.get(name);
	errors.push(`${file}: unknown custom media ${name}`);
	return m;
}));

const blocks = files.filter((f) => f.ext && f.body.trim()).map(({ file, ext, body }) => {
	if (!body.endsWith("\n")) body += "\n";
	if (/<\/(style|script)/i.test(body)) errors.push(`${file}: contains a closing </style> or </script> tag`);
	if (ext === "css") body = expand(file, body);
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
