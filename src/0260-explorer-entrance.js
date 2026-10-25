(() => {
	const SHARE = "main .MuiContainer-root > .MuiGrid-container > .MuiGrid-item";
	const SEL = SHARE + ", main .MuiGrid-container [data-rect-id], .cr-explorer [data-rect-id], .cr-explorer [data-item-index], main .MuiImageListItem-root";
	const E = "cubic-bezier(0.32, 0.72, 0, 1)";
	const seen = new WeakSet();
	let lastScroll = 0;
	let queued = false;
	let shownPath = "";
	let shown = new Set();
	const keyOf = (el) => (el.getAttribute("data-rect-id") || el.getAttribute("data-item-index") || "") + "|" + (el.textContent || "").trim().slice(0, 120);
	const run = () => {
		queued = false;
		if (document.documentElement.classList.contains("cr-dragfiles")) return;
		const path = location.pathname + location.search;
		if (path !== shownPath) {
			shownPath = path;
			shown = new Set();
		}
		const quiet = Date.now() - lastScroll < 250 || matchMedia("(prefers-reduced-motion: reduce)").matches;
		const vh = window.innerHeight;
		const vw = window.innerWidth;
		const fresh = [];
		document.querySelectorAll(SEL).forEach((el) => {
			if (seen.has(el)) return;
			seen.add(el);
			const key = keyOf(el);
			if (shown.has(key)) return;
			shown.add(key);
			if (quiet) return;
			if (el.parentElement && el.parentElement.closest(SEL)) return;
			if (el.matches(SHARE) && el.querySelector(".MuiSkeleton-root")) return;
			const r = el.getBoundingClientRect();
			if (!r.width || !r.height || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) return;
			fresh.push([el, r]);
		});
		if (!fresh.length) return;
		fresh.sort((a, b) => Math.round(a[1].top - b[1].top) || a[1].left - b[1].left);
		fresh.forEach(([el], i) => {
			const a = el.animate([
				{ opacity: 0, transform: "translateY(6px) scale(0.985)" },
				{ opacity: 1, transform: "none" }
			], { duration: 420, delay: Math.min(i, 18) * 22, easing: E, fill: "backwards" });
			a.id = "cr-in";
		});
	};
	const queue = () => {
		if (queued) return;
		queued = true;
		requestAnimationFrame(run);
	};
	document.addEventListener("scroll", () => {
		lastScroll = Date.now();
	}, { capture: true, passive: true });
	new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
	queue();
})();
