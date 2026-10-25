(() => {
	const SEL = ".cr-recent-i, .MuiGrid-container [data-rect-id]";
	let el = null;
	const release = () => {
		if (el) el.removeAttribute("data-cr-press");
		el = null;
	};
	window.addEventListener("pointerdown", (e) => {
		release();
		if (e.pointerType === "touch") return;
		const t = document.elementFromPoint(e.clientX, e.clientY);
		el = t && t.closest(SEL);
		if (el) el.setAttribute("data-cr-press", "");
	}, true);
	["pointerup", "pointercancel"].forEach((ev) => window.addEventListener(ev, release, true));
	window.addEventListener("contextmenu", (e) => {
		if (!el || !e.isTrusted || el.contains(e.target)) return;
		e.preventDefault();
		e.stopImmediatePropagation();
		el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY, screenX: e.screenX, screenY: e.screenY, button: 2, buttons: e.buttons }));
	}, true);
})();
