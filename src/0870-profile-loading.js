(() => {
	const html = document.documentElement;
	let path = "";
	let start = 0;
	let t = 0;
	const ready = () => {
		const c = document.querySelector("main div.cr-h29 > .MuiContainer-root");
		if (!c) return false;
		if (c.querySelector(".MuiSkeleton-root")) return false;
		const h = c.querySelector("h1, h2, h3, h4, h5");
		if (h && /^[\s\-–—]*$/.test(h.textContent)) return false;
		const img = c.querySelector(".MuiAvatar-root img");
		return !img || img.complete;
	};
	const check = () => {
		const on = location.pathname.startsWith("/profile");
		if (!on) {
			path = "";
			if (html.classList.contains("cr-pf-wait")) html.classList.remove("cr-pf-wait");
			return;
		}
		if (location.pathname !== path) {
			path = location.pathname;
			start = performance.now();
		}
		const wait = performance.now() - start < 1500 && !ready();
		if (html.classList.contains("cr-pf-wait") !== wait) html.classList.toggle("cr-pf-wait", wait);
		clearTimeout(t);
		if (wait) t = setTimeout(check, 100);
	};
	new MutationObserver(check).observe(document.body, { childList: true, subtree: true });
	document.addEventListener("load", (e) => {
		if (e.target instanceof HTMLImageElement) check();
	}, true);
	document.addEventListener("error", (e) => {
		if (e.target instanceof HTMLImageElement) check();
	}, true);
	check();
})();
