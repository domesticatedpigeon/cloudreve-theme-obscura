(() => {
	const measure = () => {
		const html = document.documentElement;
		const row = !html.classList.contains("cr-dock") && document.querySelector("main > .MuiStack-root > .cr-h72.cr-nav");
		if (!row) return;
		const top = Math.round(row.parentElement.getBoundingClientRect().top + window.scrollY) + "px";
		const h = row.offsetHeight + "px";
		if (html.style.getPropertyValue("--cr-pb-top") !== top) html.style.setProperty("--cr-pb-top", top);
		if (html.style.getPropertyValue("--cr-pb-h") !== h) html.style.setProperty("--cr-pb-h", h);
	};
	let mq = false;
	new MutationObserver(() => {
		if (mq) return;
		mq = true;
		requestAnimationFrame(() => {
			mq = false;
			measure();
		});
	}).observe(document.body, { childList: true, subtree: true });
	const update = () => {
		const html = document.documentElement;
		if (html.classList.contains("cr-slock")) return;
		const ex = document.querySelector(".cr-explorer");
		const pg = document.querySelector("main > div:nth-child(2):has(> .MuiContainer-root)");
		const vs = ex && ex.querySelector("[data-virtuoso-scroller]");
		const on = (!!ex && ex.scrollTop > 6) || (!!vs && vs.scrollTop > 6) || (!!pg && pg.scrollTop > 6) || window.scrollY > 6;
		measure();
		if (html.classList.contains("cr-scrolled") !== on) html.classList.toggle("cr-scrolled", on);
	};
	document.addEventListener("scroll", (e) => {
		const t = e.target instanceof Element ? e.target : null;
		if (e.target === document || (t && (t.classList.contains("cr-explorer") || t.matches("main > div:nth-child(2), .cr-explorer [data-virtuoso-scroller]")))) update();
		else if (t && t.matches(':is(.MuiDrawer-paper, .MuiPopover-paper > .MuiBox-root) > .MuiStack-root')) t.classList.toggle("cr-scrolled", t.scrollTop > 6);
	}, { capture: true, passive: true });
	setInterval(update, 800);
	addEventListener("resize", update, { passive: true });
})();
