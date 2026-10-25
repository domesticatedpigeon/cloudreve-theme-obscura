(() => {
	const icons = () => {
		const store = cr.store();
		const c = store && store.getState().siteConfig;
		return (c && c.explorer && c.explorer.typed && c.explorer.typed.icons) || null;
	};
	const dark = matchMedia("(prefers-color-scheme: dark)");
	const typed = (name) => {
		const i = typeof name === "string" ? name.lastIndexOf(".") : -1;
		const map = i > 0 ? icons() : null;
		const o = map && map[name.slice(i + 1).toLowerCase()];
		return !!(o && (dark.matches ? o.color_dark || o.color : o.color));
	};
	const colorOf = (el) => {
		let f = cr.fiberOf(el);
		let sx = "";
		for (let i = 0; f && i < 6; i++) {
			const p = f.memoizedProps;
			if (p && typeof p.customizedColor === "string" && p.customizedColor) return p.customizedColor;
			if (p && "fileType" in p && "customizedColor" in p) return p.fileType !== 1 && sx && typed(p.name) ? sx : "";
			if (!sx && p && p.sx && typeof p.sx.color === "string") sx = p.sx.color;
			f = f.return;
		}
		return "";
	};
	let q = false;
	const paint = () => {
		q = false;
		document.querySelectorAll("svg.MuiSvgIcon-root, .iconify").forEach((el) => {
			if (el.dataset.crPin) return;
			const c = colorOf(el);
			if (c) {
				if (el.dataset.crColor !== c) {
					el.dataset.crColor = c;
					el.style.setProperty("color", c, "important");
					el.style.setProperty("fill", c, "important");
				}
			} else if (el.dataset.crColor) {
				delete el.dataset.crColor;
				el.style.removeProperty("color");
				el.style.removeProperty("fill");
			}
		});
	};
	new MutationObserver(() => {
		if (q) return;
		q = true;
		setTimeout(paint, 120);
	}).observe(document.body, { childList: true, subtree: true });
	dark.addEventListener("change", () => setTimeout(paint, 120));
	paint();
})();
