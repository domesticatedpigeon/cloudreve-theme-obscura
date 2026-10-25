(() => {
	const html = document.documentElement;
	const mq = matchMedia("(max-width: 599.95px)");
	const INPUT = ".MuiDialog-paper > .MuiBox-root:first-child > .MuiTextField-root input";
	const PAPER = ".MuiDialog-root:not(.MuiModal-hidden) > .MuiDialog-container > .MuiDialog-paper:has(> .MuiBox-root:first-child > .MuiTextField-root + .MuiIconButton-root)";
	let y = null;
	let mo = null;
	let q = false;
	const unlock = () => {
		if (mo) mo.disconnect();
		mo = null;
		html.classList.remove("cr-srch");
		if (y === null) return;
		const sy = y;
		y = null;
		html.classList.remove("cr-slock");
		html.style.removeProperty("--cr-sy");
		window.scrollTo(0, sy);
	};
	const check = () => {
		q = false;
		const p = document.querySelector(PAPER);
		if (!p) return unlock();
		html.classList.toggle("cr-srch", !p.closest('[style*="opacity: 0"]'));
	};
	const watch = () => {
		html.classList.add("cr-srch");
		if (mo) return;
		mo = new MutationObserver(() => {
			if (q) return;
			q = true;
			requestAnimationFrame(check);
		});
		mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] });
	};
	const lock = () => {
		watch();
		if (y !== null) return;
		y = window.scrollY;
		html.style.setProperty("--cr-sy", -y + "px");
		html.classList.add("cr-slock");
	};
	const focus = HTMLElement.prototype.focus;
	HTMLElement.prototype.focus = function (o) {
		if (!mq.matches || html.classList.contains("cr-dock")) return focus.call(this, o);
		if (this.matches(INPUT)) {
			lock();
			return focus.call(this, Object.assign({}, o, { preventScroll: true }));
		}
		if (y !== null) return focus.call(this, Object.assign({}, o, { preventScroll: true }));
		return focus.call(this, o);
	};
})();
