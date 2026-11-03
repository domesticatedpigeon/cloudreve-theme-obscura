(() => {
	const RESIZE = /^(col|ew|e|w)-resize$/;
	const ONLY = /^\.css-[\w-]+(?::{1,2}[\w-]+(?:\([^)]*\))?)*$/;
	const found = new Set();
	let style = null;
	let seen = 0;
	const scan = () => {
		const sheets = [];
		let n = 0;
		for (const sh of document.styleSheets) {
			try {
				n += sh.cssRules.length;
				sheets.push(sh.cssRules);
			} catch (e) {}
		}
		if (n === seen) return;
		seen = n;
		for (const rules of sheets) {
			for (const r of rules) {
				if (!r.selectorText || !r.style || !RESIZE.test(r.style.cursor)) continue;
				r.selectorText.split(",").forEach((sel) => {
					sel = sel.trim();
					if (ONLY.test(sel)) found.add(sel.replace(/:.*$/, ""));
				});
			}
		}
		if (!found.size) return;
		if (!style) {
			style = document.createElement("style");
			document.head.appendChild(style);
		}
		const sel = [...found].map((s) => "#root " + s).join(", ");
		const css = sel + " { pointer-events: none !important; cursor: inherit !important; opacity: 0 !important; }";
		if (style.textContent !== css) style.textContent = css;
	};
	const width = () => {
		const s = cr.store();
		const g = s && s.getState().globalState;
		if (g && typeof g.drawerWidth === "number" && g.drawerWidth !== 240) s.dispatch({ type: "globalState/setDrawerWidth", payload: 240 });
	};
	const tick = () => {
		scan();
		width();
	};
	tick();
	setInterval(tick, 1000);
})();
