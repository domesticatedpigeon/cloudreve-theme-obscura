(() => {
	const html = document.documentElement;
	html.classList.add("cr-boot");
	const mq = matchMedia("(max-width: 599.95px)");
	const t0 = performance.now();
	let hold = 0;
	let seen = 0;
	const ready = () => {
		const root = document.getElementById("root");
		if (!root || !root.firstElementChild) return false;
		const header = [...document.querySelectorAll("header.MuiAppBar-root")].find((h) => !h.closest(".MuiDialog-root, .MuiPopover-root"));
		if (!seen) seen = performance.now();
		if (!header) return !!root.querySelector("main, .MuiContainer-root, .MuiPaper-root");
		if (performance.now() - seen > 900) return true;
		if (mq.matches) return !!header.querySelector(".cr-tbp-mc");
		return html.classList.contains("cr-dock") || !!header.querySelector(".cr-tbp-av");
	};
	const reveal = () => {
		html.classList.add("cr-booted");
		requestAnimationFrame(() => {
			html.classList.remove("cr-boot");
			setTimeout(() => html.classList.remove("cr-booted"), 400);
		});
	};
	const tick = () => {
		if (performance.now() - t0 > 2500) return reveal();
		if (ready()) hold++;
		else hold = 0;
		if (hold >= 3) return reveal();
		requestAnimationFrame(tick);
	};
	requestAnimationFrame(tick);
})();
