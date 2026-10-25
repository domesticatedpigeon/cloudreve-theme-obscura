(() => {
	const E = "cubic-bezier(0.32, 0.72, 0, 1)";
	const live = new WeakMap();
	const zero = (c) => /(^|;)\s*width:\s*0px/.test(c.getAttribute("style") || "");
	const check = (c) => {
		if (!c.classList.contains("MuiCollapse-horizontal") || !c.closest("main") || c.closest(".MuiBackdrop-root")) return;
		const s = live.get(c);
		if (zero(c)) {
			if (s || matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("cr-instant")) return;
			const frame = c.querySelector(".MuiCollapse-wrapperInner > .MuiBox-root");
			if (!frame) return;
			c.style.setProperty("transition", "width 0s linear 240ms", "important");
			const anim = frame.animate([
				{ opacity: 1, transform: "none" },
				{ opacity: 0, transform: "translateX(24px)" }
			], { duration: 230, easing: E, fill: "forwards" });
			live.set(c, anim);
		} else if (s) {
			live.delete(c);
			s.cancel();
			c.style.removeProperty("transition");
		}
	};
	new MutationObserver((list) => {
		for (const m of list) if (m.target.nodeType === 1) check(m.target);
	}).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["style"] });
})();
