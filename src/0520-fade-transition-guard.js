(() => {
	const FADE = ".fade-enter, .fade-enter-active, .fade-enter-done, .fade-exit, .fade-exit-active";
	const guard = (e) => e.stopPropagation();
	const tag = () => {
		document.querySelectorAll(FADE).forEach((f) => {
			for (const c of f.children) {
				if (c.dataset.crFadeGuard) continue;
				c.dataset.crFadeGuard = "1";
				c.addEventListener("transitionend", guard);
				c.addEventListener("transitioncancel", guard);
			}
		});
	};
	cr.onDom(tag);
	tag();
})();
