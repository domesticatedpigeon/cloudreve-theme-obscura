(() => {
	const tag = () => {
		if (!window.crIsVideo) return;
		document.querySelectorAll(".MuiGrid-container [data-rect-id]").forEach((t) => {
			const f = cr.fileOf(t, 30);
			const v = !!f && f.type === 0 && window.crIsVideo(f.name || "");
			if (t.classList.contains("cr-vid") !== v) t.classList.toggle("cr-vid", v);
		});
	};
	let q = false;
	new MutationObserver(() => {
		if (q) return;
		q = true;
		requestAnimationFrame(() => {
			q = false;
			tag();
		});
	}).observe(document.body, { childList: true, subtree: true });
	tag();
})();
