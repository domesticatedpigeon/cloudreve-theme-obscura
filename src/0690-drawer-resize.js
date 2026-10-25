(() => {
	const RESIZE = /cursor:\s*(col-resize|ew-resize|e-resize|w-resize)/;
	const ONLY = /^\.css-[\w-]+(?::{1,2}[\w-]+(?:\([^)]*\))?)*$/;
	const found = new Set();
	let style = null;
	let seen = 0;
	const scan = () => {
		let n = 0;
		for (const sh of document.styleSheets) {
			let rules;
			try {
				rules = sh.cssRules;
			} catch (e) {
				continue;
			}
			n += rules.length;
			for (const r of rules) {
				if (!r.selectorText || !RESIZE.test(r.cssText)) continue;
				r.selectorText.split(",").forEach((sel) => {
					sel = sel.trim();
					if (ONLY.test(sel)) found.add(sel.replace(/:.*$/, ""));
				});
			}
		}
		if (n === seen) return;
		seen = n;
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
