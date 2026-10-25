(() => {
	const TILE = ".MuiGrid-container [data-rect-id], .MuiImageListItem-root, .cr-explorer [data-rect-id]";
	const rects = new WeakMap();
	let explorer = null;
	let ro = null;
	let lastW = 0;
	let queued = false;
	const reduce = matchMedia("(prefers-reduced-motion: reduce)");
	const tiles = () => (explorer ? [...explorer.querySelectorAll(TILE)] : []);
	let flipT = 0;
	let navPath = location.pathname + location.search;
	let navAt = 0;
	const layout = (el) => ({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, p: el.offsetParent });
	const measure = () => {
		if (!explorer) return;
		tiles().forEach((el) => rects.set(el, layout(el)));
	};
	const current = (el) => {
		const t = getComputedStyle(el).transform;
		if (!t || t === "none") return { tx: 0, ty: 0, s: 1 };
		const m = t.match(/matrix\(([^)]+)\)/);
		if (!m) return { tx: 0, ty: 0, s: 1 };
		const v = m[1].split(",").map(parseFloat);
		return { tx: v[4] || 0, ty: v[5] || 0, s: v[0] || 1 };
	};
	const flip = () => {
		const path = location.pathname + location.search;
		if (path !== navPath) {
			navPath = path;
			navAt = Date.now();
		}
		if (!explorer || reduce.matches || document.documentElement.classList.contains("cr-instant") || Date.now() - navAt < 900) {
			measure();
			return;
		}
		const top = explorer.scrollTop;
		const h = explorer.clientHeight;
		const html = document.documentElement;
		html.classList.add("cr-flipping");
		clearTimeout(flipT);
		flipT = setTimeout(() => html.classList.remove("cr-flipping"), 380);
		tiles().forEach((el) => {
			const old = rects.get(el);
			const now = layout(el);
			rects.set(el, now);
			if (!old || old.p !== now.p) return;
			if (el.getAnimations().some((a) => a.id === "cr-in" && a.playState === "running")) return;
			const running = el.getAnimations().filter((a) => a.id === "cr-flip");
			const c = running.length ? current(el) : { tx: 0, ty: 0, s: 1 };
			running.forEach((a) => a.cancel());
			const fx = old.x + c.tx;
			const fy = old.y + c.ty;
			const fw = old.w * c.s;
			const visible = (y) => y > top - 300 && y < top + h + 300;
			if (!visible(fy) && !visible(now.y)) return;
			const dx = fx - now.x;
			const dy = fy - now.y;
			const sx = now.w > 0 && fw > 0 ? fw / now.w : 1;
			if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.005) return;
			const anim = el.animate([{ transformOrigin: "0 0", transform: "translate(" + dx + "px, " + dy + "px) scale(" + sx + ")" }, { transformOrigin: "0 0", transform: "none" }], { duration: 340, easing: "cubic-bezier(0.32, 0.72, 0, 1)" });
			anim.id = "cr-flip";
		});
	};
	const attach = () => {
		const ex = document.querySelector(".cr-explorer");
		if (ex === explorer) return;
		if (ro) ro.disconnect();
		explorer = ex;
		lastW = 0;
		if (!ex) return;
		ro = new ResizeObserver((entries) => {
			const w = Math.round(entries[0].contentRect.width);
			if (lastW && Math.abs(w - lastW) > 2) flip();
			else measure();
			lastW = w;
		});
		ro.observe(ex);
		measure();
	};
	new MutationObserver(() => {
		if (queued) return;
		queued = true;
		requestAnimationFrame(() => {
			queued = false;
			if (document.documentElement.classList.contains("cr-dragfiles")) return;
			const path = location.pathname + location.search;
			if (path !== navPath) {
				navPath = path;
				navAt = Date.now();
			}
			attach();
			measure();
		});
	}).observe(document.body, { childList: true, subtree: true });
	setInterval(attach, 1000);
})();
