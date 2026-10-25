(() => {
	let over = null;
	const set = (el) => {
		if (over === el) return;
		if (over) over.classList.remove("cr-path-over");
		over = el;
		if (el) el.classList.add("cr-path-over");
	};
	document.addEventListener("dragover", (e) => {
		const t = e.target instanceof Element ? e.target.closest(".cr-path .MuiButton-root") : null;
		set(t);
	}, true);
	["drop", "dragend"].forEach((ev) => document.addEventListener(ev, () => set(null), true));
	document.addEventListener("dragleave", (e) => {
		if (!e.relatedTarget || !(e.relatedTarget instanceof Element) || !e.relatedTarget.closest(".cr-path .MuiButton-root")) set(null);
	}, true);
})();
