(() => {
	const touch = matchMedia("(hover: none)");
	let trap = null;
	let until = 0;
	const SELI = ".MuiDialog-root .MuiDialog-paper .MuiFilledInput-root :is(input, textarea)";
	const tick = () => {
		const inp = document.querySelector(SELI);
		if (inp) {
			if (document.activeElement !== inp) inp.focus();
			return;
		}
		if (Date.now() < until) requestAnimationFrame(tick);
		else if (trap && document.activeElement === trap) trap.blur();
	};
	window.addEventListener("click", (e) => {
		if (!touch.matches || !(e.target instanceof Element)) return;
		const t = e.target.closest(".MuiPopover-root .MuiMenuItem-root");
		if (!t || !(/^rename/i.test((t.textContent || "").trim()) || crT.is(t.textContent, "fileManager.rename", "Rename"))) return;
		if (!trap) {
			trap = document.createElement("input");
			trap.type = "text";
			trap.tabIndex = -1;
			trap.setAttribute("aria-hidden", "true");
			trap.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;border:0;padding:0;font-size:16px;pointer-events:none;";
			document.body.appendChild(trap);
		}
		trap.focus({ preventScroll: true });
		until = Date.now() + 2500;
		requestAnimationFrame(tick);
	}, true);
})();
