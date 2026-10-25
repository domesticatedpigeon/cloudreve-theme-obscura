(() => {
	const html = document.documentElement;
	let t = 0;
	let down = false;
	const on = () => {
		if (down) return;
		if (!html.classList.contains("cr-scrolling")) html.classList.add("cr-scrolling");
		clearTimeout(t);
		t = setTimeout(() => html.classList.remove("cr-scrolling"), 140);
	};
	document.addEventListener("scroll", on, { passive: true, capture: true });
	document.addEventListener("wheel", on, { passive: true, capture: true });
	window.addEventListener("pointerdown", () => {
		down = true;
		clearTimeout(t);
		html.classList.remove("cr-scrolling");
	}, true);
	["pointerup", "pointercancel"].forEach((ev) => window.addEventListener(ev, () => (down = false), true));
})();
