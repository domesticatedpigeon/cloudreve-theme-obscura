(() => {
	const TABS = [
		{ path: "cloudreve://my", key: "navbar.myFiles", label: "My Files", match: (p) => !p || /^cloudreve:\/\/my(\/|$|\?)/.test(p), icon: ["M10.55 2.532a2.25 2.25 0 0 1 2.9 0l6.75 5.692c.507.428.8 1.057.8 1.72v9.803a1.75 1.75 0 0 1-1.75 1.75h-3.5a1.75 1.75 0 0 1-1.75-1.75v-5.5a.25.25 0 0 0-.25-.25h-3.5a.25.25 0 0 0-.25.25v5.5a1.75 1.75 0 0 1-1.75 1.75h-3.5A1.75 1.75 0 0 1 3 19.747V9.944c0-.663.293-1.292.8-1.72l6.75-5.692Zm1.933 1.147a.75.75 0 0 0-.966 0L4.767 9.37a.75.75 0 0 0-.267.573v9.803c0 .138.112.25.25.25h3.5a.25.25 0 0 0 .25-.25v-5.5c0-.967.784-1.75 1.75-1.75h3.5c.966 0 1.75.783 1.75 1.75v5.5c0 .138.112.25.25.25h3.5a.25.25 0 0 0 .25-.25V9.944a.75.75 0 0 0-.267-.573l-6.75-5.692Z", "M10.55 2.533a2.25 2.25 0 0 1 2.9 0l6.75 5.695c.508.427.8 1.056.8 1.72v9.802a1.75 1.75 0 0 1-1.75 1.75h-3a1.75 1.75 0 0 1-1.75-1.75v-5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0-.75.75v5a1.75 1.75 0 0 1-1.75 1.75h-3A1.75 1.75 0 0 1 3 19.75V9.947c0-.663.292-1.292.8-1.72l6.75-5.694Z"] },
		{ path: "cloudreve://shared_with_me", key: "navbar.sharedWithMe", label: "Shared with me", match: (p) => /^cloudreve:\/\/shared_with_me/.test(p), icon: ["M5.5 8a2.5 2.5 0 1 1 5 0a2.5 2.5 0 0 1-5 0M8 4a4 4 0 1 0 0 8a4 4 0 0 0 0-8m7.5 5a1.5 1.5 0 1 1 3 0a1.5 1.5 0 0 1-3 0M17 6a3 3 0 1 0 0 6a3 3 0 0 0 0-6m-2.752 13.038c.703.285 1.604.462 2.753.462c2.282 0 3.586-.697 4.297-1.558c.345-.418.52-.84.61-1.163a2.728 2.728 0 0 0 .093-.573v-.027A2.179 2.179 0 0 0 19.822 14H14.18c-.028 0-.055 0-.082.002c.394.41.68.925.816 1.498h4.908c.372 0 .674.299.679.669a1.236 1.236 0 0 1-.04.212a1.6 1.6 0 0 1-.32.605c-.35.426-1.172 1.014-3.14 1.014c-.98 0-1.676-.146-2.17-.345c-.108.4-.286.883-.583 1.383M4.25 14A2.25 2.25 0 0 0 2 16.25v.278a2.073 2.073 0 0 0 .014.208a4.487 4.487 0 0 0 .778 2.07C3.61 19.974 5.172 21 8 21c2.828 0 4.39-1.025 5.208-2.195a4.484 4.484 0 0 0 .778-2.07a2.992 2.992 0 0 0 .014-.207v-.278A2.25 2.25 0 0 0 11.75 14zm-.75 2.507v-.257a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 .75.75v.257l-.007.08a2.986 2.986 0 0 1-.514 1.358C11.486 18.65 10.422 19.5 8 19.5s-3.486-.85-3.98-1.555a2.986 2.986 0 0 1-.513-1.358a1.527 1.527 0 0 1-.007-.08", "M8 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8m9 0a3 3 0 1 0 0-6a3 3 0 0 0 0 6M4.25 14A2.25 2.25 0 0 0 2 16.25v.25S2 21 8 21s6-4.5 6-4.5v-.25A2.25 2.25 0 0 0 11.75 14zM17 19.5c-1.171 0-2.068-.181-2.755-.458a5.503 5.503 0 0 0 .736-2.207A3.987 3.987 0 0 0 15 16.55v-.3a3.24 3.24 0 0 0-.902-2.248A2.32 2.32 0 0 1 14.2 14h5.6a2.2 2.2 0 0 1 2.2 2.2s0 3.3-5 3.3"] }
	];
	const signedIn = () => {
		try {
			const o = JSON.parse(localStorage.getItem("cloudreve_session") || "null");
			const cur = o && o.current && o.sessions && o.sessions[o.current];
			return !!(cur && cur.user && cur.user.id && !cur.signedOut);
		} catch (e) {
			return false;
		}
	};
	const navPath = () => {
		try {
			return new URLSearchParams(location.search).get("path") || "";
		} catch (e) {
			return "";
		}
	};
	let bar = null;
	const make = () => {
		bar = document.createElement("nav");
		bar.className = "cr-tbp-m cr-bnav";
		bar.setAttribute("aria-label", "Sections");
		TABS.forEach((t) => {
			const b = document.createElement("button");
			b.type = "button";
			b.className = "cr-bnav-i";
			b.innerHTML = t.icon.map((d) => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>').join("");
			const l = document.createElement("span");
			crT.set(l, t.key, t.label);
			b.appendChild(l);
			b.addEventListener("click", () => {
				const r = cr.router();
				if (r) r.navigate("/home?" + new URLSearchParams({ path: t.path }).toString());
			});
			bar.appendChild(b);
		});
		document.body.appendChild(bar);
	};
	const sync = () => {
		const p = navPath();
		const html = document.documentElement;
		const on = signedIn();
		html.classList.toggle("cr-bnav-on", on);
		if (!on) return;
		if (!bar || !bar.isConnected) make();
		const fab = document.querySelector(".cr-new");
		const fr = fab && getComputedStyle(fab).display !== "none" ? fab.getBoundingClientRect() : null;
		const wide = !(fr && fr.width);
		if (html.classList.contains("cr-bnav-wide") !== wide) html.classList.toggle("cr-bnav-wide", wide);
		if (bar.classList.contains("cr-wide") !== wide) bar.classList.toggle("cr-wide", wide);
		bar.querySelectorAll(":scope > .cr-bnav-i").forEach((b, i) => {
			const sel = location.pathname.startsWith("/home") && TABS[i].match(p);
			if (b.classList.contains("Mui-selected") !== sel) b.classList.toggle("Mui-selected", sel);
			b.setAttribute("aria-current", sel ? "page" : "false");
		});
	};
	let q = false;
	new MutationObserver(() => {
		if (q) return;
		q = true;
		requestAnimationFrame(() => {
			q = false;
			sync();
		});
	}).observe(document.body, { childList: true, subtree: true });
	new MutationObserver(() => {
		if (q) return;
		q = true;
		requestAnimationFrame(() => {
			q = false;
			sync();
		});
	}).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
	window.addEventListener("popstate", sync);
	sync();
})();
