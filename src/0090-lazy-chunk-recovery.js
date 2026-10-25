(() => {
	const KEY = "cr-preload-reload";
	setTimeout(() => {
		try {
			sessionStorage.removeItem(KEY);
		} catch (e) {}
	}, 15000);
	const restyle = (href, n) => {
		const l = document.createElement("link");
		l.rel = "stylesheet";
		l.href = n ? href + (href.includes("?") ? "&" : "?") + "r=" + n : href;
		l.onerror = () => {
			l.remove();
			if (n < 3) setTimeout(() => restyle(href, n + 1), 1000 * (n + 1));
		};
		document.head.appendChild(l);
	};
	window.addEventListener("vite:preloadError", (e) => {
		const msg = String((e.payload && e.payload.message) || "");
		const css = /preload CSS for (\S+)/.exec(msg);
		if (css) {
			e.preventDefault();
			console.warn("Stylesheet failed to load, retrying:", css[1]);
			setTimeout(() => restyle(css[1], 1), 500);
			return;
		}
		try {
			if (sessionStorage.getItem(KEY)) return;
			sessionStorage.setItem(KEY, "1");
		} catch (err) {
			return;
		}
		e.preventDefault();
		location.reload();
	});
})();
