(() => {
	const SEL = ".cr-explorer, main div:has(> .MuiContainer-root)";
	const sync = () => {
		const dock = document.documentElement.classList.contains("cr-dock");
		document.querySelectorAll(SEL).forEach((el) => {
			const v = dock ? getComputedStyle(el).paddingTop : "0px";
			if (el.style.getPropertyValue("--cr-sbt") !== v) el.style.setProperty("--cr-sbt", v);
		});
	};
	let q = false;
	const schedule = () => {
		if (q) return;
		q = true;
		requestAnimationFrame(() => {
			q = false;
			sync();
		});
	};
	new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
	new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
	window.addEventListener("resize", schedule);
	sync();
})();
