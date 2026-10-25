(() => {
	window.addEventListener("click", (e) => {
		if (document.documentElement.classList.contains("cr-dock")) return;
		const t = e.target instanceof Element ? e.target : null;
		if (!t || !t.closest(".cr-path") || t.closest("button, .MuiButtonBase-root, input")) return;
		e.stopPropagation();
	}, true);
	["mouseover", "pointerover", "focusin", "touchstart"].forEach((type) => window.addEventListener(type, (e) => {
		if (document.documentElement.classList.contains("cr-dock")) return;
		const t = e.target instanceof Element ? e.target : null;
		if (t && t.closest(".cr-path")) e.stopPropagation();
	}, { capture: true, passive: true }));
})();
