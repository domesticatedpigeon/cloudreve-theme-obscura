(() => {
	if (!matchMedia("(pointer: coarse)").matches) return;
	const OVERLAY = ".MuiPopover-root, .MuiMenu-root, .MuiModal-root, .MuiDialog-root";
	const focus = HTMLElement.prototype.focus;
	HTMLElement.prototype.focus = function (opts) {
		if (this.closest && this.closest(OVERLAY)) return focus.call(this, Object.assign({ preventScroll: true }, opts));
		return focus.call(this, opts);
	};
	const TOOLBAR = "header.MuiAppBar-root button, .cr-tbp-m button, .cr-tbp-mc, .cr-tbp-av";
	const last = new WeakMap();
	let until = 0;
	let moved = false;
	const top = (el) => (el === document ? document.scrollingElement.scrollTop : el.scrollTop);
	document.addEventListener("scroll", (e) => {
		const el = e.target === document ? document : e.target;
		if (Date.now() < until && !moved && last.has(el)) {
			const want = last.get(el);
			if (top(el) !== want) {
				if (el === document) document.scrollingElement.scrollTop = want;
				else el.scrollTop = want;
				return;
			}
		}
		last.set(el, top(el));
	}, { capture: true, passive: true });
	const remember = () => {
		last.set(document, top(document));
		document.querySelectorAll("main, main .cr-explorer, main div:has(> .MuiContainer-root)").forEach((el) => last.set(el, el.scrollTop));
	};
	document.addEventListener("touchstart", (e) => {
		if (!(e.target instanceof Element) || !e.target.closest(TOOLBAR)) return;
		remember();
		moved = false;
		until = Date.now() + 800;
	}, { capture: true, passive: true });
	document.addEventListener("touchmove", () => {
		moved = true;
	}, { capture: true, passive: true });
	document.addEventListener("click", (e) => {
		if (!(e.target instanceof Element) || !e.target.closest(TOOLBAR)) return;
		remember();
		until = Date.now() + 800;
	}, true);
})();
