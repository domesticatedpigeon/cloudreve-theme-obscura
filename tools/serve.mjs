import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, SERVE } from "./lib.mjs";

const file = resolve(process.argv[2] || resolve(ROOT, "cloudreveCustomFooter.html"));
const { hostname, port } = new URL(SERVE);
createServer((q, s) => {
	let body = "";
	try {
		body = readFileSync(file);
	} catch (e) {}
	s.writeHead(200, { "content-type": "text/html", "access-control-allow-origin": "*", "cache-control": "no-store" });
	s.end(body);
}).listen(+port, hostname, () => console.log(`Serving ${file} at ${SERVE}/theme.html (re-read on every request)`));
