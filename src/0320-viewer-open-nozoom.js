(() => {
	let openedAt = 0;
	const seen = new WeakSet();
	const run = () => {
		const portal = document.querySelector(".PhotoView-Portal:not(.PhotoView-Slider__willClose):not(.cr-vghost)");
		if (!portal) {
			openedAt = 0;
			return;
		}
		const now = Date.now();
		if (!openedAt) openedAt = now;
		for (const w of portal.querySelectorAll(".PhotoView__PhotoWrap")) {
			if (seen.has(w)) continue;
			seen.add(w);
			if (now - openedAt < 600) continue;
			w.setAttribute("data-cr-nozoom", "");
			setTimeout(() => w.removeAttribute("data-cr-nozoom"), 800);
		}
	};
	new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
})();
