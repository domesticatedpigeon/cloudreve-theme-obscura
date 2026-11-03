(() => {
	const tag = () => {
		if (!window.crIsVideo) return;
		document.querySelectorAll(".MuiGrid-container [data-rect-id]").forEach((t) => {
			const f = cr.fileOf(t, 30);
			const v = !!f && f.type === 0 && window.crIsVideo(f.name || "");
			if (t.classList.contains("cr-vid") !== v) t.classList.toggle("cr-vid", v);
		});
	};
	cr.onDom(tag);
	tag();
})();
