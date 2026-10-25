(() => {
	const cache = {};
	const subs = new Set();
	const lang = () => {
		const h = document.documentElement.getAttribute("lang") || "";
		if (h.includes("-")) return h;
		try {
			const l = localStorage.getItem("i18nextLng");
			if (l) return l;
		} catch (e) {}
		return "en-US";
	};
	const notify = () => subs.forEach((f) => {
		try {
			f();
		} catch (e) {}
	});
	const load = (l, ns) => {
		const id = l + "-" + ns;
		if (id in cache) return cache[id];
		cache[id] = null;
		try {
			const raw = localStorage.getItem("i18next_res_" + id);
			if (raw) return (cache[id] = JSON.parse(raw));
		} catch (e) {}
		fetch("/locales/" + l + "/" + ns + ".json")
			.then((r) => (r.ok ? r.json() : null))
			.then((j) => {
				if (!j) return;
				cache[id] = j;
				notify();
			})
			.catch(() => {});
		return null;
	};
	const T = (key, fallback) => {
		const c = key.indexOf(":");
		const ns = c > 0 ? key.slice(0, c) : "application";
		const path = c > 0 ? key.slice(c + 1) : key;
		const v = path.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), load(lang(), ns));
		return typeof v === "string" && v ? v.replace(/\s*(\.\.\.|…)$/, "") : fallback;
	};
	const ATTR = { text: "crT", aria: "crTa", title: "crTt" };
	T.set = (el, key, fallback, what) => {
		const w = what || "text";
		el.dataset[ATTR[w]] = key + "|" + fallback;
		const v = T(key, fallback);
		if (w === "text") {
			if (el.textContent !== v) el.textContent = v;
		} else if (w === "aria") el.setAttribute("aria-label", v);
		else el.title = v;
		return el;
	};
	T.is = (text, key, fallback) => {
		const t = (text || "").trim().toLowerCase();
		return !!t && (t === T(key, fallback).trim().toLowerCase() || t === fallback.toLowerCase());
	};
	T.on = (fn) => subs.add(fn);
	const CSS = { "--cr-t-search": ["navbar.searchFiles", "Search"], "--cr-t-drop": ["fileManager.dropFileHere", "Drag and drop files here to upload"] };
	const apply = () => {
		Object.keys(ATTR).forEach((w) => document.querySelectorAll("[data-" + ATTR[w].replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()) + "]").forEach((el) => {
			const raw = el.dataset[ATTR[w]];
			const bar = raw.indexOf("|");
			T.set(el, raw.slice(0, bar), raw.slice(bar + 1), w);
		}));
		const root = document.documentElement.style;
		for (const k in CSS) {
			const [key, fb] = CSS[k];
			const v = T(key, fb);
			if (root.getPropertyValue(k) !== JSON.stringify(v)) root.setProperty(k, JSON.stringify(v));
		}
	};
	T.on(apply);
	let lng = lang();
	new MutationObserver(() => {
		const l = lang();
		if (l === lng) return;
		lng = l;
		notify();
	}).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
	window.crT = T;
	apply();
})();
