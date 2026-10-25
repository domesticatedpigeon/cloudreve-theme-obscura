(() => {
	let legend = null;
	let on = false;
	let state = "";
	let legendKey = "";
	let lastPt = null;
	const desktop = matchMedia("(hover: hover) and (pointer: fine)");
	const LICON = {"Click": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"6\" y=\"2\" width=\"12\" height=\"20\" rx=\"6\"/><path d=\"M12 2A6 6 0 0 0 6 8v3.5h6z\" fill=\"currentColor\"/><path d=\"M12 11.5h6\"/></svg>", "Double-click": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"8\" y=\"2\" width=\"12\" height=\"20\" rx=\"6\"/><path d=\"M14 2A6 6 0 0 0 8 8v3.5h6z\" fill=\"currentColor\"/><path d=\"M14 11.5h6\"/><path d=\"M3.2 2.8l2 1.8M2 7.5h2.6\"/></svg>", "Right-click": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"6\" y=\"2\" width=\"12\" height=\"20\" rx=\"6\"/><path d=\"M12 2A6 6 0 0 1 18 8v3.5h-6z\" fill=\"currentColor\"/><path d=\"M6 11.5h6\"/></svg>", "Drag or swipe": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.5 5.5h17M6.5 3l-3 2.5 3 2.5M17.5 3l3 2.5-3 2.5\"/><rect x=\"7.5\" y=\"11\" width=\"3.6\" height=\"10\" rx=\"1.8\"/><rect x=\"12.9\" y=\"11\" width=\"3.6\" height=\"10\" rx=\"1.8\"/></svg>", "Drag or swipe|Move": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9.5 5.5 12 3l2.5 2.5M9.5 18.5 12 21l2.5-2.5M5.5 9.5 3 12l2.5 2.5M18.5 9.5 21 12l-2.5 2.5M12 3.5v5M12 15.5v5M3.5 12h5M15.5 12h5\"/><circle cx=\"12\" cy=\"12\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/></svg>", "Scroll or pinch": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"6\" y=\"2\" width=\"12\" height=\"20\" rx=\"6\"/><path d=\"M12 6v5\" stroke-width=\"2.8\"/></svg>"};
	const TIPS = {
		close: [["Click", "Hide interface"], ["Drag or swipe", "Swipe images"], ["Scroll or pinch", "Zoom"]],
		closez: [["Click", "Hide interface"], ["Scroll or pinch", "Zoom"]],
		swipe: [["Click", "Hide interface"], ["Double-click", "Actual size"], ["Right-click", "Options"], ["Drag or swipe", "Swipe images"], ["Scroll or pinch", "Zoom"]],
		pan: [["Click", "Hide interface"], ["Double-click", "Fit to screen"], ["Right-click", "Options"], ["Drag or swipe", "Move"], ["Scroll or pinch", "Zoom"]],
		prev: [["Click", "Previous image"], ["Drag or swipe", "Swipe images"], ["Scroll or pinch", "Zoom"]],
		next: [["Click", "Next image"], ["Drag or swipe", "Swipe images"], ["Scroll or pinch", "Zoom"]]
	};
	const SKIP = ".cr-vdock, .cr-vtop, .PhotoView-Slider__BannerWrap, .PhotoView-Slider__BannerRight, .MuiIconButton-root, button, a, [role='button'], .cr-ctx";
	const fiberOf = (el) => {
		const k = el && Object.keys(el).find((x) => x.startsWith("__reactFiber$"));
		return k ? el[k] : null;
	};
	const stateOf = (el) => {
		let f = fiberOf(el);
		while (f) {
			let h = f.memoizedState;
			while (h && typeof h === "object" && "next" in h) {
				const v = h.memoizedState;
				if (v && typeof v === "object" && "naturalWidth" in v && "scale" in v && "width" in v) return v;
				h = h.next;
			}
			f = f.return;
		}
		return null;
	};
	const portalEl = () => document.querySelector(".PhotoView-Portal");
	const controlsShown = (portal) => {
		const b = portal && portal.querySelector(".PhotoView-Slider__BannerWrap");
		return !!b && !portal.classList.contains("PhotoView-Slider__clean") && !portal.classList.contains("PhotoView-Slider__willClose");
	};
	const imageAt = (portal, x, y) => {
		for (const img of portal.querySelectorAll(".PhotoView__Photo")) {
			const r = img.getBoundingClientRect();
			if (r.width && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return img;
		}
		return null;
	};
	const activeImg = (portal) => {
		const cx = window.innerWidth / 2;
		let first = null;
		for (const img of portal.querySelectorAll(".PhotoView__Photo")) {
			const r = img.getBoundingClientRect();
			if (!r.width) continue;
			if (!first) first = img;
			if (r.left <= cx && r.right >= cx) return img;
		}
		return first;
	};
	const zoomed = (img, portal) => {
		const st = stateOf(img);
		if (!st) return false;
		const sc = st.scale || 1;
		if (sc > 1.01) return true;
		const iw = window.innerWidth - (portal.matches('[style*="300px"]') ? 300 : 0);
		return (st.width || 0) * sc > iw + 1 || (st.height || 0) * sc > window.innerHeight + 1;
	};
	const pick = (portal, x, y) => {
		for (const a of portal.querySelectorAll(".PhotoView-Slider__ArrowLeft, .PhotoView-Slider__ArrowRight")) {
			const r = a.getBoundingClientRect();
			if (r.width && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom && getComputedStyle(a).pointerEvents !== "none") return a.classList.contains("PhotoView-Slider__ArrowLeft") ? "prev" : "next";
		}
		const img = imageAt(portal, x, y);
		if (img) return zoomed(img, portal) ? "pan" : "swipe";
		const a = activeImg(portal);
		return a && zoomed(a, portal) ? "closez" : "close";
	};
	const makeLegend = () => {
		legend = document.createElement("div");
		legend.className = "cr-legend";
		legend.setAttribute("aria-hidden", "true");
		document.body.appendChild(legend);
	};
	const fillLegend = (k) => {
		if (legendKey === k) return;
		legendKey = k;
		legend.textContent = "";
		TIPS[k].forEach(([a, r]) => {
			const it = document.createElement("span");
			const ic = document.createElement("i");
			ic.className = "cr-li";
			ic.innerHTML = LICON[a + "|" + r] || LICON[a] || "";
			const b = document.createElement("b");
			b.textContent = r;
			it.append(ic, b);
			legend.appendChild(it);
		});
	};
	const syncLegend = () => {
		const portal = portalEl();
		const show = !!portal && desktop.matches && controlsShown(portal);
		if (!show) {
			if (legend) legend.classList.remove("cr-on");
			if (!portal) legendKey = "";
			return;
		}
		if (!legend) makeLegend();
		let k = state;
		if (!k) {
			const a = activeImg(portal);
			k = a && zoomed(a, portal) ? "pan" : "swipe";
		}
		fillLegend(k);
		legend.classList.toggle("cr-side", portal.matches('[style*="300px"]'));
		legend.classList.add("cr-on");
	};
	setInterval(syncLegend, 150);
	const CUR = ["close", "hand", "grab", "prev", "next"];
	let cur = "";
	const setCur = (k) => {
		if (cur === k) return;
		const h = document.documentElement;
		if (cur) h.classList.remove("cr-cur-" + cur);
		cur = k;
		if (k) h.classList.add("cr-cur-" + k);
	};
	let down = false;
	const glyph = () => {
		if (!on || !state) return setCur("");
		if (state === "prev" || state === "next") return setCur(state);
		setCur(down ? "grab" : "hand");
	};
	const hide = () => {
		state = "";
		on = false;
		setCur("");
	};
	const setState = (k) => {
		if (state === k) return;
		state = k;
		glyph();
		syncLegend();
	};
	let pend = null;
	let raf = 0;
	const evaluate = () => {
		raf = 0;
		const e = pend;
		pend = null;
		if (!e) return;
		const t = e.target instanceof Element ? e.target : null;
		const portal = t && t.closest(".PhotoView-Portal");
		if (!portal || (e.buttons && !on) || t.closest(SKIP) || document.querySelector(".cr-ctx:not(.cr-ctx-out)")) return hide();
		on = true;
		if (!e.buttons) setState(pick(portal, e.clientX, e.clientY));
		glyph();
	};
	window.addEventListener("pointermove", (e) => {
		if (e.pointerType && e.pointerType !== "mouse") return hide();
		lastPt = [e.clientX, e.clientY];
		pend = e;
		if (!raf) raf = requestAnimationFrame(evaluate);
	}, { passive: true });
	window.addEventListener("pointerdown", (e) => {
		if (!on) return;
		if (e.button !== 0) return hide();
		down = true;
		glyph();
	}, true);
	window.addEventListener("pointerup", () => {
		if (!down) return;
		down = false;
		glyph();
	}, true);
	const reeval = () => {
		const portal = portalEl();
		if (!on || !portal || !lastPt) return;
		setState(pick(portal, lastPt[0], lastPt[1]));
	};
	let reT = 0;
	window.addEventListener("dblclick", () => {
		clearTimeout(reT);
		reT = setTimeout(reeval, 450);
	}, true);
	window.addEventListener("wheel", () => {
		clearTimeout(reT);
		reT = setTimeout(reeval, 200);
	}, { capture: true, passive: true });
	document.addEventListener("mouseleave", hide);
	window.addEventListener("blur", hide);
	new MutationObserver(() => {
		if (on && !portalEl()) hide();
	}).observe(document.body, { childList: true, subtree: true });
})();
