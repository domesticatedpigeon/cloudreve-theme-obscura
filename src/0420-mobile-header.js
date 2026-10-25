(() => {
	const mq = matchMedia("(max-width: 599.95px)");
	const tag = (el, c) => {
		if (el && !el.classList.contains(c)) el.classList.add(c);
	};
	const fadeBc = (sc) => {
		const max = sc.scrollWidth - sc.clientWidth;
		sc.style.setProperty("--cr-bcl", (sc.scrollLeft > 1 ? 24 : 0) + "px");
		sc.style.setProperty("--cr-bcr", (sc.scrollLeft < max - 1 ? 24 : 0) + "px");
	};
	let store = null;
	let obsTb = null;
	let pend = false;
	const obs = new MutationObserver(() => {
		if (pend) return;
		pend = true;
		requestAnimationFrame(() => {
			pend = false;
			run();
		});
	});
	let cm = null;
	const getStore = () => {
		if (store) return store;
		const root = document.getElementById("root");
		const k = root && Object.keys(root).find((x) => x.startsWith("__reactContainer$"));
		let f = k ? (root[k].stateNode && root[k].stateNode.current) || root[k] : null;
		while (f) {
			const p = f.memoizedProps;
			if (p && p.store && p.store.dispatch && p.store.getState) return (store = p.store);
			f = f.child;
		}
		return null;
	};
	const ctxRoot = () => {
		if (cm && cm.isConnected) return cm;
		cm = [...document.querySelectorAll("body > .MuiMenu-root")].find((m) => {
			const k = Object.keys(m).find((x) => x.startsWith("__reactFiber$"));
			let f = k ? m[k] : null;
			for (let i = 0; f && i < 12; i++, f = f.return) {
				const p = f.memoizedProps;
				if (p && p.anchorReference === "anchorPosition" && p.keepMounted && p.disableAutoFocusItem) return true;
			}
			return false;
		}) || null;
		return cm;
	};
	const onStore = () => {
		const fm = store.getState().fileManager;
		const s = fm && fm[0];
		if (!s || !s.contextMenuOpen) return;
		const r = ctxRoot();
		const on = s.contextMenuType === "new" && mq.matches && !document.documentElement.classList.contains("cr-dock");
		if (r && r.hasAttribute("data-cr-fabm") !== on) r.toggleAttribute("data-cr-fabm", on);
	};
	const run = () => {
		if (!store && getStore()) store.subscribe(onStore);
		if (!mq.matches || document.documentElement.classList.contains("cr-dock")) return;
		const tb = document.querySelector("header.MuiAppBar-root:not(.MuiDialog-root *) > .MuiToolbar-root");
		if (tb && tb !== obsTb) {
			obsTb = tb;
			obs.disconnect();
			obs.observe(tb, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
			const hp = tb.parentElement && tb.parentElement.parentElement;
			if (hp) obs.observe(hp, { childList: true });
		}
		if (tb) {
			tag(tb.firstElementChild && tb.firstElementChild.querySelector(".MuiIconButton-root"), "cr-tbp-mc");
			const rs = tb.lastElementChild;
			if (rs && rs.classList.contains("MuiStack-root")) {
				[...rs.querySelectorAll(".MuiIconButton-root")].forEach((b) => {
					if (b.querySelector(".MuiAvatar-root, .MuiSkeleton-root")) b.classList.remove("cr-tbp-mc");
					else if (b.querySelector(':scope > svg > path[d^="M11.883 3.007"]')) {
						b.classList.remove("cr-tbp-mc");
						tag(b, "cr-lp");
						tag(b, "cr-new");
					} else tag(b, "cr-tbp-mc");
				});
			}
		}
		const gb = document.querySelector("main .MuiButtonGroup-root");
		if (gb && !gb.closest(".MuiDialog-root, .MuiPopover-root")) {
			const box = gb.parentElement;
			tag(box, "cr-tbp-m");
			const row = box && box.parentElement;
			const sc = row && row.firstElementChild !== box && row.firstElementChild.querySelector(":scope > .MuiBox-root");
			if (sc) {
				if (!sc.dataset.crBc) {
					sc.dataset.crBc = "1";
					sc.addEventListener("scroll", () => fadeBc(sc), { passive: true });
				}
				const key = location.search + "|" + sc.scrollWidth;
				if (sc.dataset.crBcKey !== key) {
					sc.dataset.crBcKey = key;
					sc.scrollLeft = sc.scrollWidth;
				}
				fadeBc(sc);
			}
		}
	};
	let band = null;
	document.addEventListener("transitionrun", (e) => {
		const pp = e.target;
		if (!(pp instanceof HTMLElement) || !pp.classList.contains("MuiMenu-paper")) return;
		const mr = pp.closest(".MuiMenu-root");
		if (!mq.matches || document.documentElement.classList.contains("cr-dock") || !mr || mr.hasAttribute("data-cr-fabm")) {
			if (pp.style.translate) pp.style.removeProperty("translate");
			return;
		}
		if (!band) {
			band = document.createElement("div");
			band.style.cssText = "position:fixed;left:0;width:0;visibility:hidden;pointer-events:none;top:calc(env(safe-area-inset-top) + 8px);bottom:calc(100% - var(--cr-fab-top) + 8px)";
			document.body.appendChild(band);
		}
		const lim = band.getBoundingClientRect();
		const t = pp.offsetTop;
		const h = pp.offsetHeight;
		let dy = 0;
		if (t + h > lim.bottom) dy = lim.bottom - t - h;
		if (t + dy < lim.top) dy = lim.top - t;
		if (dy) pp.style.setProperty("translate", "0 " + Math.round(dy) + "px");
		else if (pp.style.translate) pp.style.removeProperty("translate");
	}, true);
	setInterval(run, 400);
	const t0 = performance.now();
	const boot = () => {
		run();
		if (performance.now() - t0 < 4000) requestAnimationFrame(boot);
	};
	boot();
})();
