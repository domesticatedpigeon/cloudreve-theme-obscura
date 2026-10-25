(() => {
	if (!matchMedia("(pointer: coarse)").matches) return;
	const warmed = new WeakSet();
	let timer = 0;
	const schedule = () => {
		if (!timer) timer = setTimeout(warm, 300);
	};
	const warm = () => {
		timer = 0;
		if (document.documentElement.classList.contains("cr-scrolling") || document.querySelector(".PhotoView-Portal")) {
			schedule();
			return;
		}
		const t0 = performance.now();
		for (const el of document.querySelectorAll(".MuiGrid-container [data-rect-id].MuiButtonBase-root")) {
			if (warmed.has(el)) continue;
			warmed.add(el);
			el.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
			if (performance.now() - t0 > 8) {
				schedule();
				return;
			}
		}
	};
	new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
	schedule();
})();
