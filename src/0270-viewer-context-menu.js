(() => {
	const DL = "M18.25 20.5a.75.75";
	const ICONS = {
		download: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.25 20.5a.75.75 0 1 1 0 1.5l-13 .005a.75.75 0 1 1 0-1.5zM11.648 2.014l.102-.007a.75.75 0 0 1 .743.648l.007.102l-.001 13.685l3.722-3.72a.75.75 0 0 1 .976-.073l.085.073a.75.75 0 0 1 .072.976l-.073.084l-4.997 4.997a.75.75 0 0 1-.976.073l-.085-.073l-5.003-4.996a.75.75 0 0 1 .976-1.134l.084.072l3.719 3.714L11 2.756a.75.75 0 0 1 .648-.743l.102-.007z"/></svg>',
		actual: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3.75 5.75h16.5v12.5H3.75z"/><path d="M7 10.25l1.5-1.25v6M15.5 10.25l1.5-1.25v6"/><path d="M12 10.5v.01M12 13.5v.01" stroke-width="2" stroke-linecap="round"/></svg>',
		fit: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 5.75c0-.69.56-1.25 1.25-1.25h2a.75.75 0 0 0 0-1.5h-2A2.75 2.75 0 0 0 3 5.75v2a.75.75 0 0 0 1.5 0zm0 12.5c0 .69.56 1.25 1.25 1.25h2a.75.75 0 0 1 0 1.5h-2A2.75 2.75 0 0 1 3 18.25v-2a.75.75 0 0 1 1.5 0zM18.25 4.5c.69 0 1.25.56 1.25 1.25v2a.75.75 0 0 0 1.5 0v-2A2.75 2.75 0 0 0 18.25 3h-2a.75.75 0 0 0 0 1.5zm1.25 13.75c0 .69-.56 1.25-1.25 1.25h-2a.75.75 0 0 0 0 1.5h2A2.75 2.75 0 0 0 21 18.25v-2a.75.75 0 0 0-1.5 0z"/></svg>'
	};
	let menu = null;
	const fiberOf = (el) => {
		const k = Object.keys(el).find((x) => x.startsWith("__reactFiber$"));
		return k ? el[k] : null;
	};
	const photoBox = (el) => {
		let f = fiberOf(el);
		while (f) {
			let h = f.memoizedState;
			let methods = null;
			let state = null;
			while (h && typeof h === "object" && "next" in h) {
				const v = h.memoizedState;
				if (v && v.current && v.current.curr && typeof v.current.curr.onScale === "function") methods = v.current.curr;
				if (v && typeof v === "object" && "naturalWidth" in v && "scale" in v) state = v;
				h = h.next;
			}
			if (methods && state) return { methods, state };
			f = f.return;
		}
		return null;
	};
	const close = () => {
		if (!menu) return;
		const m = menu;
		menu = null;
		m.classList.add("cr-ctx-out");
		setTimeout(() => m.remove(), 130);
	};
	const open = (x, y, target) => {
		close();
		const box = photoBox(target);
		const img = target.closest(".PhotoView__PhotoBox")?.querySelector("img") || null;
		const st = box && box.state;
		const nw = (img && img.naturalWidth) || (st && st.naturalWidth) || 0;
		const scale = st ? st.scale : 1;
		const shown = img ? img.getBoundingClientRect().width : 0;
		const w = (st && st.width) || (shown ? shown / scale : 0);
		const actual = nw && w ? nw / w : 0;
		const atActual = !!(nw && shown && Math.abs(shown - nw) <= Math.max(2, nw * 0.01));
		const portal = target.closest(".PhotoView-Portal");
		const dlBtn = portal ? [...portal.querySelectorAll(".PhotoView-Slider__BannerRight .MuiIconButton-root")].find((b) => b.querySelector(`path[d^="${DL}"]`)) : null;
		const items = [
			{ icon: "download", label: crT("fileManager.download", "Download"), off: !dlBtn, run: () => dlBtn && dlBtn.click() },
			null,
			{ icon: "actual", label: "Actual size (100%)", off: !box || !actual || atActual || Math.abs(scale - actual) < 0.01, run: () => {
				if (img) {
					const ev = new WheelEvent("wheel", { deltaY: (scale - actual) * 200, deltaMode: 0, clientX: x, clientY: y, bubbles: true, cancelable: true });
					ev.crSynth = true;
					img.dispatchEvent(ev);
				} else box.methods.onScale(actual);
			} },
			{ icon: "fit", label: "Zoom to fit", off: !box || Math.abs(scale - 1) < 0.01, run: () => {
				box.methods.onScale(1);
				if (img) img.dispatchEvent(new CustomEvent("cr-viewer-settle", { bubbles: true }));
			} }
		];
		const m = document.createElement("div");
		m.className = "cr-ctx";
		m.setAttribute("role", "menu");
		items.forEach((it) => {
			if (!it) {
				const sep = document.createElement("div");
				sep.className = "cr-ctx-sep";
				m.appendChild(sep);
				return;
			}
			const el = document.createElement("div");
			el.className = "cr-ctx-item";
			el.setAttribute("role", "menuitem");
			if (it.off) el.setAttribute("aria-disabled", "true");
			el.innerHTML = ICONS[it.icon] + "<span></span>";
			el.lastChild.textContent = it.label;
			el.addEventListener("click", (e) => {
				e.stopPropagation();
				close();
				try {
					it.run();
				} catch (err) {}
			});
			m.appendChild(el);
		});
		document.body.appendChild(m);
		const r = m.getBoundingClientRect();
		const left = Math.min(x, window.innerWidth - r.width - 8);
		const top = Math.min(y, window.innerHeight - r.height - 8);
		m.style.left = Math.max(8, left) + "px";
		m.style.top = Math.max(8, top) + "px";
		m.style.setProperty("--cr-ctx-ox", (left < x ? "100%" : "0"));
		m.style.setProperty("--cr-ctx-oy", (top < y ? "100%" : "0"));
		menu = m;
	};
	const onPhoto = (t) => t instanceof Element && t.closest(".PhotoView-Portal") ? t.closest(".PhotoView__PhotoBox") : null;
	let swallow = 0;
	const eat = (e) => {
		if (!swallow || Date.now() - swallow > 800) {
			swallow = 0;
			return;
		}
		if (e.target instanceof Element && e.target.closest(".cr-ctx")) return;
		e.stopImmediatePropagation();
		if (e.cancelable) e.preventDefault();
		if (e.type === "click") swallow = 0;
	};
	window.addEventListener("pointerdown", (e) => {
		if (menu && !menu.contains(e.target) && e.button !== 2) {
			close();
			swallow = Date.now();
			eat(e);
		}
	}, true);
	["mousedown", "pointerup", "mouseup", "click", "dblclick", "touchend"].forEach((t) => window.addEventListener(t, eat, true));
	window.addEventListener("mousedown", (e) => {
		if (menu && !menu.contains(e.target)) close();
		if (e.button === 2 && onPhoto(e.target)) e.stopPropagation();
	}, true);
	window.addEventListener("contextmenu", (e) => {
		const p = onPhoto(e.target);
		if (!p) return;
		e.preventDefault();
		e.stopPropagation();
		open(e.clientX, e.clientY, e.target);
	}, true);
	window.addEventListener("keydown", (e) => {
		if (menu && e.key === "Escape") {
			e.preventDefault();
			e.stopImmediatePropagation();
			close();
		}
	}, true);
	window.addEventListener("wheel", (e) => {
		if (!menu) return;
		e.stopImmediatePropagation();
		if (e.cancelable) e.preventDefault();
	}, { capture: true, passive: false });
	window.addEventListener("resize", close);
	window.addEventListener("blur", close);
	new MutationObserver(() => {
		if (menu && !document.querySelector(".PhotoView-Portal")) close();
	}).observe(document.body, { childList: true, subtree: true });
})();
