(() => {
	let drag = null;
	const snapX = (sl, x) => {
		const n = parseFloat(sl.style.getPropertyValue("--cr-n"));
		if (!(n > 0)) return x;
		const r = sl.getBoundingClientRect();
		const f = Math.min(1, Math.max(0, (x - r.left) / r.width));
		return r.left + (Math.round(f * n) / n) * r.width;
	};
	const clone = (e, x) => new MouseEvent(e.type, { bubbles: true, cancelable: true, clientX: x, clientY: e.clientY, screenX: e.screenX, screenY: e.screenY, button: e.button, buttons: e.buttons, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey, metaKey: e.metaKey, view: window });
	window.addEventListener("mousedown", (e) => {
		if (!e.isTrusted || e.button !== 0) return;
		const sl = e.target instanceof Element ? e.target.closest(".MuiPopover-paper .MuiSlider-root[data-cr-ticks]") : null;
		if (!sl) return;
		drag = sl;
		e.stopImmediatePropagation();
		e.preventDefault();
		e.target.dispatchEvent(clone(e, snapX(sl, e.clientX)));
	}, true);
	["mousemove", "mouseup"].forEach((type) => {
		window.addEventListener(type, (e) => {
			if (!drag || !e.isTrusted) return;
			const sl = drag;
			if (type === "mouseup") drag = null;
			e.stopImmediatePropagation();
			(e.target instanceof Element ? e.target : document).dispatchEvent(clone(e, snapX(sl, e.clientX)));
		}, true);
	});
})();
