(() => {
	const touch = matchMedia("(hover: none) and (pointer: coarse)");
	const KEYS = ["position", "top", "left", "right", "bottom", "width", "height"];
	let st = null;
	const unclip = () => {
		if (!st || st.saved) return;
		st.saved = [];
		for (let a = st.bd.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
			const cs = getComputedStyle(a);
			if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
			st.saved.push([a, a.style.getPropertyValue("overflow"), a.style.getPropertyPriority("overflow"), a.scrollTop, a.scrollLeft]);
			a.style.setProperty("overflow", "visible", "important");
		}
		st.wy = window.scrollY;
		st.pre = true;
		size();
		window.scrollTo(0, LIFT);
		st.pre = false;
		size();
	};
	const drop = () => {
		if (!st) return;
		(st.saved || []).forEach(([el, v, p, t, l]) => {
			if (v) el.style.setProperty("overflow", v, p);
			else el.style.removeProperty("overflow");
			el.scrollTop = t;
			el.scrollLeft = l;
		});
		st.orig.forEach(([el, k, v, p]) => {
			if (v) el.style.setProperty(k, v, p);
			else el.style.removeProperty(k);
		});
		if (st.saved && !st.back) window.scrollTo(0, st.wy);
		st = null;
	};
	const LIFT = 200;
	const size = () => {
		if (!st) return;
		const bd = st.bd;
		bd.style.setProperty("top", "0px", "important");
		bd.style.setProperty("left", "0px", "important");
		const r = bd.getBoundingClientRect();
		bd.style.setProperty("top", (st.pre ? LIFT - window.scrollY : 0) - r.top + "px", "important");
		bd.style.setProperty("left", -r.left + "px", "important");
		if (bd !== st.portal) bd.style.setProperty("width", window.innerWidth + "px", "important");
		bd.style.setProperty("height", window.innerHeight + "px", "important");
	};
	const lift = () => {
		const portal = touch.matches ? document.querySelector(".PhotoView-Portal:not(.PhotoView-Slider__willClose)") : null;
		const bd = portal ? (portal.parentElement.classList.contains("MuiBackdrop-root") ? portal.parentElement : portal) : null;
		if (!bd && st && st.bd.isConnected && (st.bd.matches(".PhotoView-Portal") || st.bd.querySelector(".PhotoView-Portal"))) {
			if (st.saved && !st.back) {
				st.back = true;
				window.scrollTo(0, st.wy);
				size();
			}
			return;
		}
		if (st && st.bd === bd) {
			if (document.documentElement.classList.contains("cr-vopen")) unclip();
			return;
		}
		drop();
		if (!bd) return;
		const orig = [];
		new Set([bd, portal]).forEach((el) => KEYS.forEach((k) => orig.push([el, k, el.style.getPropertyValue(k), el.style.getPropertyPriority(k)])));
		bd.style.setProperty("position", "absolute", "important");
		bd.style.setProperty("right", "auto", "important");
		bd.style.setProperty("bottom", "auto", "important");
		if (bd !== portal) {
			portal.style.setProperty("position", "absolute", "important");
			portal.style.setProperty("top", "0px", "important");
			portal.style.setProperty("left", "0px", "important");
			portal.style.setProperty("width", "100%", "important");
			portal.style.setProperty("height", "100%", "important");
		}
		st = { bd, portal, saved: null, orig };
		size();
		if (document.documentElement.classList.contains("cr-vopen")) unclip();
	};
	let q = false;
	const queue = () => {
		if (q) return;
		q = true;
		requestAnimationFrame(() => {
			q = false;
			lift();
		});
	};
	new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
	new MutationObserver(lift).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
	window.addEventListener("scroll", () => {
		if (st && st.saved) size();
	}, { passive: true });
	window.addEventListener("resize", () =>
		requestAnimationFrame(() => {
			if (!st) return;
			if (st.saved && !st.back) {
				st.pre = true;
				size();
				window.scrollTo(0, LIFT);
				st.pre = false;
			}
			size();
		})
	);
})();
