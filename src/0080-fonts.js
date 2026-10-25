(() => {
	const add = (href, rel) => {
		if (document.head.querySelector(`link[href="${href}"]`)) return;
		const l = document.createElement("link");
		l.rel = rel || "stylesheet";
		l.href = href;
		if (rel === "preconnect") l.crossOrigin = "";
		document.head.appendChild(l);
	};
	add("https://fonts.googleapis.com", "preconnect");
	add("https://fonts.gstatic.com", "preconnect");
	add("https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap");
	add("https://fonts.googleapis.com/css2?family=Boldonse&display=swap");
	add("https://cdn.jsdelivr.net/npm/@fontsource/boldonse@5/index.css");
	if (document.fonts && document.fonts.load) document.fonts.load('400 24px "Boldonse"').catch(() => {});
})();
