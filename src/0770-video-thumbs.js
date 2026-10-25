(() => {
	const fileOf = (el) => {
		const k = Object.keys(el).find((x) => x.startsWith("__reactFiber$"));
		let f = k ? el[k] : null;
		for (let i = 0; f && i < 30; i++, f = f.return) if (f.memoizedProps && f.memoizedProps.file) return f.memoizedProps.file;
		return null;
	};
	const tag = () => {
		if (!window.crIsVideo) return;
		document.querySelectorAll(".MuiGrid-container [data-rect-id]").forEach((t) => {
			const f = fileOf(t);
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
