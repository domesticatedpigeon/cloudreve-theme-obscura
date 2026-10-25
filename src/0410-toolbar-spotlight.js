(() => {
	const SEL = "main .MuiContainer-root .MuiListItem-container .MuiButton-root, .MuiContainer-maxWidthXs > .MuiGrid-container > .MuiBox-root > .MuiPaper-root :is(.MuiButton-contained, .MuiButton-outlined), header.MuiAppBar-root .MuiIconButton-root:has(> svg > path[d^='M17.754 14a2.249']), .cr-vdock-g:not(.cr-vinfo-s), .cr-legend, html.cr-dock .cr-nav.cr-tbp > .cr-path + .MuiBox-root, html.cr-dock .cr-nav.cr-tbp > .cr-path + .MuiBox-root + .MuiBox-root:not(.cr-fade), [data-cr-selbar] .MuiStack-root:has(> .MuiButtonGroup-root), .cr-lp:not(.cr-vbtns > .cr-lp), .cr-tf, .cr-stabs, :is(main, .MuiDialog-paper) .MuiToggleButtonGroup-root.cr-tseg";
	const HALF = "html.cr-dock .cr-nav.cr-tbp > .cr-path + .MuiBox-root, html.cr-dock .cr-nav.cr-tbp > .cr-path + .MuiBox-root + .MuiBox-root:not(.cr-fade)";
	let cur = null;
	let group = [];
	const off = () => {
		group.forEach((g) => g.classList.remove("cr-spot-on"));
		group = [];
		cur = null;
	};
	document.addEventListener("pointermove", (e) => {
		if (e.pointerType !== "mouse") return;
		const el = e.target instanceof Element ? e.target.closest(SEL) : null;
		if (el !== cur) {
			off();
			cur = el;
			if (el) group = el.matches(HALF) ? [...document.querySelectorAll(HALF)] : [el];
		}
		if (!el) return;
		group.forEach((g) => {
			const r = g.getBoundingClientRect();
			g.style.setProperty("--cr-px", e.clientX - r.left + "px");
			g.style.setProperty("--cr-py", e.clientY - r.top + "px");
			g.classList.add("cr-spot-on");
		});
	}, { passive: true });
	document.addEventListener("pointerleave", off);
	window.addEventListener("blur", off);
})();
