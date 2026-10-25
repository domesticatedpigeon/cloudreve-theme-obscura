(() => {
	const synth = new WeakSet();
	const fiberOf = (el) => {
		const k = el && Object.keys(el).find((x) => x.startsWith("__reactFiber$"));
		return k ? el[k] : null;
	};
	const hookOf = (el) => {
		let f = fiberOf(el);
		while (f) {
			let h = f.memoizedState;
			while (h && typeof h === "object" && "next" in h) {
				const v = h.memoizedState;
				if (v && typeof v === "object" && "naturalWidth" in v && "scale" in v && "width" in v && h.queue && h.queue.dispatch) return { state: v, dispatch: h.queue.dispatch };
				h = h.next;
			}
			f = f.return;
		}
		return null;
	};
	let g = null;
	let burst = { last: 0, kind: "" };
	const send = (img, from, to, x, y) => {
		const hk = hookOf(img);
		const now = hk && hk.state.scale ? hk.state.scale : from;
		const ev = new WheelEvent("wheel", { deltaY: (now - to) * 200, deltaMode: 0, clientX: x, clientY: y, bubbles: true, cancelable: true });
		synth.add(ev);
		img.dispatchEvent(ev);
	};
	let S = null;
	const release = (portal) => {
		if (!g && !P && !S && portal) portal.classList.remove("cr-zooming");
	};
	const stopSpring = () => {
		if (!S) return;
		cancelAnimationFrame(S.raf);
		S = null;
	};
	const snapTo = (img, portal) => {
		stopSpring();
		const hk = hookOf(img);
		if (!hk) return release(portal);
		const st = hk.state;
		const [ox, oy] = bounds(st, portal);
		const x = st.x || 0;
		const y = st.y || 0;
		const tx = Math.max(-ox, Math.min(ox, x));
		const ty = Math.max(-oy, Math.min(oy, y));
		if (Math.abs(tx - x) < 0.5 && Math.abs(ty - y) < 0.5) return release(portal);
		portal.classList.add("cr-zooming");
		const sp = { img, portal, x, y, vx: 0, vy: 0, tx, ty, t: performance.now(), raf: 0 };
		S = sp;
		const step = (now) => {
			if (S !== sp) return;
			const dt = Math.min(0.032, (now - sp.t) / 1000);
			sp.t = now;
			const k = 210;
			const c = 19;
			sp.vx += (-(sp.x - sp.tx) * k - sp.vx * c) * dt;
			sp.vy += (-(sp.y - sp.ty) * k - sp.vy * c) * dt;
			sp.x += sp.vx * dt;
			sp.y += sp.vy * dt;
			const done = Math.abs(sp.x - sp.tx) < 0.3 && Math.abs(sp.y - sp.ty) < 0.3 && Math.abs(sp.vx) < 4 && Math.abs(sp.vy) < 4;
			if (done) {
				sp.x = sp.tx;
				sp.y = sp.ty;
			}
			const h = hookOf(sp.img);
			if (h) h.dispatch({ x: sp.x, y: sp.y, lastX: sp.x, lastY: sp.y });
			if (done || !h) {
				S = null;
				release(sp.portal);
				return;
			}
			sp.raf = requestAnimationFrame(step);
		};
		sp.raf = requestAnimationFrame(step);
	};
	const end = () => {
		if (!g) return;
		const z = g;
		g = null;
		if (!P) snapTo(z.img, z.portal);
	};
	document.addEventListener("cr-viewer-settle", (e) => {
		const img = e.target instanceof Element ? e.target : null;
		const portal = img && img.closest(".PhotoView-Portal");
		if (portal) setTimeout(() => {
			if (!g && !P) snapTo(img, portal);
		}, 430);
	});
	const tick = () => {
		if (!g) return;
		if (!g.img.isConnected) return end();
		const diff = Math.log(g.target / g.cur);
		const next = Math.abs(diff) < 0.002 ? g.target : g.cur * Math.exp(diff * 0.32);
		if (next !== g.cur) {
			send(g.img, g.cur, next, g.x, g.y);
			g.cur = next;
		}
		if (g.cur === g.target && performance.now() - g.last > 160) return end();
		requestAnimationFrame(tick);
	};
	const classify = (e, dx, dy) => {
		if (e.deltaMode !== 0) return "wheel";
		const w = e.wheelDeltaY;
		if (dx === 0 && typeof w === "number" && w !== 0 && w % 120 === 0 && Math.abs(w) !== Math.round(Math.abs(dy) * 3)) return "wheel";
		return "touch";
	};
	const zoom = (e, img, portal, dy) => {
		stopSpring();
		if (!g || g.img !== img) {
			const hk = hookOf(img);
			if (!hk || !hk.state.width || !hk.state.naturalWidth) return;
			end();
			const sc = hk.state.scale || 1;
			g = { img, portal, cur: sc, target: sc, max: Math.max(6, hk.state.naturalWidth / hk.state.width), x: e.clientX, y: e.clientY, last: 0 };
			portal.classList.add("cr-zooming");
			requestAnimationFrame(tick);
		}
		const k = e.ctrlKey ? 0.012 : Math.abs(dy) >= 50 ? 0.0022 : 0.004;
		const step = Math.max(-0.35, Math.min(0.35, -dy * k));
		g.target = Math.max(1, Math.min(g.max, g.target * Math.exp(step)));
		g.x = e.clientX;
		g.y = e.clientY;
		g.last = performance.now();
	};
	let P = null;
	const bounds = (st, portal) => {
		const sc = st.scale || 1;
		const iw = window.innerWidth - (portal.matches('[style*="300px"]') ? 300 : 0);
		return [Math.max(0, (st.width * sc - iw) / 2), Math.max(0, ((st.height || 0) * sc - window.innerHeight) / 2)];
	};
	const rubber = (v, d, lim) => {
		const over = v > lim ? v - lim : v < -lim ? -lim - v : 0;
		const out = (v > lim && d > 0) || (v < -lim && d < 0);
		if (!out) return v + d;
		return v + d * 0.3 * Math.max(0, 1 - over / 140);
	};
	const flush = () => {
		if (!P) return;
		P.raf = 0;
		const hk = hookOf(P.img);
		if (!hk) return;
		if (hk.state.x !== P.x || hk.state.y !== P.y) hk.dispatch({ x: P.x, y: P.y, lastX: P.x, lastY: P.y });
	};
	const settle = () => {
		if (!P) return;
		const p = P;
		P = null;
		if (p.raf) cancelAnimationFrame(p.raf);
		if (g) return;
		snapTo(p.img, p.portal);
	};
	let toastEl = null;
	let toastT = 0;
	const toast = (text) => {
		if (!toastEl) {
			toastEl = document.createElement("div");
			toastEl.className = "cr-wrap-toast";
			toastEl.setAttribute("role", "status");
			toastEl.innerHTML = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="square"><path d="M10.5 6a4.5 4.5 0 1 1-1.32-3.18M10.5 1.5v2.25H8.25"/></svg><span></span>';
			document.body.appendChild(toastEl);
		}
		toastEl.lastChild.textContent = text;
		toastEl.classList.remove("cr-on");
		void toastEl.offsetWidth;
		toastEl.classList.add("cr-on");
		clearTimeout(toastT);
		toastT = setTimeout(() => toastEl && toastEl.classList.remove("cr-on"), 1800);
	};
	const SW = { ax: 0, ay: 0, last: 0, at: 0, min: Infinity, rise: 0, ema: 0, fired: false };
	let lastIdx = null;
	setInterval(() => {
		const portal = document.querySelector(".PhotoView-Portal");
		if (!portal) {
			lastIdx = null;
			return;
		}
		const sl = slider(portal);
		if (!sl) return;
		ghosts(portal, sl);
		const real = sl.images.filter((x) => !x.loadMorePlaceholder).length;
		const more = real !== sl.count;
		if (lastIdx !== null && sl.index !== lastIdx && !more && sl.loop && real >= 3) {
			if (lastIdx === real - 1 && sl.index === 0) toast("Restarted from the first image");
			else if (lastIdx === 0 && sl.index === real - 1) toast("Jumped to the last image");
		}
		lastIdx = sl.index;
	}, 100);
	const slider = (portal) => {
		let f = fiberOf(portal);
		while (f) {
			const pr = f.memoizedProps;
			if (pr && Array.isArray(pr.images) && typeof pr.index === "number" && pr.onIndexChange) {
				let h = f.memoizedState;
				while (h && typeof h === "object" && "next" in h) {
					const v = h.memoizedState;
					if (v && v.current && v.current.curr && typeof v.current.curr.changeIndex === "function") {
						const real = pr.images.filter((x) => !x.loadMorePlaceholder).length;
						return { index: pr.index, count: pr.images.length, last: real - 1, more: real !== pr.images.length, images: pr.images, loop: typeof pr.loop === "boolean" ? pr.loop : pr.images.length > (pr.loop ?? 3), go: v.current.curr.changeIndex };
					}
					h = h.next;
				}
			}
			f = f.return;
		}
		return null;
	};
	const swipe = (portal, dx, dy) => {
		const now = performance.now();
		if (now - SW.last > 220) {
			SW.ax = 0;
			SW.ay = 0;
			SW.fired = false;
		}
		SW.last = now;
		const mag = Math.abs(dx) + Math.abs(dy);
		SW.ema = SW.fired ? SW.ema * 0.6 + mag * 0.4 : mag;
		if (SW.fired) {
			SW.min = Math.min(SW.min, SW.ema);
			SW.rise = now - SW.at > 300 && SW.ema >= 10 && SW.ema > SW.min * 2.5 + 5 ? SW.rise + 1 : 0;
			if (SW.rise < 2) return;
			SW.fired = false;
			SW.rise = 0;
			SW.ax = 0;
			SW.ay = 0;
		}
		SW.ax += dx;
		SW.ay += dy;
		if (Math.abs(SW.ax) < 60 || Math.abs(SW.ax) < Math.abs(SW.ay) * 1.5) return;
		SW.fired = true;
		SW.at = now;
		SW.min = Infinity;
		SW.rise = 0;
		const sl = slider(portal);
		if (!sl) return;
		const dir = SW.ax > 0 ? 1 : -1;
		const next = sl.index + dir;
		if (sl.loop || (next >= 0 && next < sl.count)) return sl.go(next);
		wrapGo(portal, sl, dir);
	};
	const wrapGo = (portal, sl, dir) => {
		if (sl.last < 1) return;
		toast(dir < 0 ? "Jumped to the last image" : "Restarted from the first image");
		sl.go(dir < 0 ? sl.last : 0, true);
		requestAnimationFrame(() => requestAnimationFrame(() => {
			const cx = window.innerWidth / 2;
			for (const w of portal.querySelectorAll(".PhotoView__PhotoWrap")) {
				const r = w.getBoundingClientRect();
				if (r.left <= cx && r.right >= cx) {
					const b = w.querySelector(".PhotoView__PhotoBox");
					if (b) b.animate([{ opacity: 0, translate: `${dir * 48}px 0` }, { opacity: 1, translate: "0 0" }], { duration: 380, easing: "cubic-bezier(0.32, 0.72, 0, 1)" });
					break;
				}
			}
		}));
	};
	const atEdge = (sl, dir) => !sl.loop && sl.last >= 1 && (dir > 0 ? !sl.more && sl.index === sl.last : sl.index === 0);
	window.addEventListener("keydown", (e) => {
		if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
		const portal = document.querySelector(".PhotoView-Portal");
		if (!portal || (e.target instanceof Element && e.target.closest("input, textarea, [contenteditable]"))) return;
		const sl = slider(portal);
		const dir = e.key === "ArrowRight" ? 1 : -1;
		if (!sl || !atEdge(sl, dir)) return;
		e.stopImmediatePropagation();
		e.preventDefault();
		wrapGo(portal, sl, dir);
	}, true);
	let DG = null;
	window.addEventListener("pointerdown", (e) => {
		DG = null;
		if (e.button !== 0 || !(e.target instanceof Element)) return;
		const portal = e.target.closest(".PhotoView-Portal");
		if (!portal || !e.target.closest(".PhotoView__PhotoWrap")) return;
		DG = { portal, x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
	}, true);
	window.addEventListener("pointercancel", () => {
		DG = null;
	}, true);
	window.addEventListener("pointerup", (e) => {
		const d = DG;
		DG = null;
		if (!d || e.pointerId !== d.id || !d.portal.isConnected) return;
		const dx = e.clientX - d.x;
		const dy = e.clientY - d.y;
		const ax = Math.abs(dx);
		if (ax < Math.abs(dy) * 1.5) return;
		if (ax < 60 && !(ax > 24 && ax / Math.max(1, performance.now() - d.t) > 0.5)) return;
		const sl = slider(d.portal);
		const dir = dx < 0 ? 1 : -1;
		if (!sl || !atEdge(sl, dir)) return;
		const cx = window.innerWidth / 2;
		for (const w of d.portal.querySelectorAll(".PhotoView__PhotoWrap")) {
			const r = w.getBoundingClientRect();
			if (r.left <= cx && r.right >= cx) {
				const img = w.querySelector("img");
				const hk = img && hookOf(img);
				if (hk && (hk.state.scale || 1) > 1.01) return;
				break;
			}
		}
		wrapGo(d.portal, sl, dir);
	}, true);
	const ghosts = (portal, sl) => {
		["Left", "Right"].forEach((side) => {
			const dir = side === "Left" ? -1 : 1;
			const cls = "PhotoView-Slider__Arrow" + side;
			const real = [...portal.querySelectorAll("." + cls)].some((x) => !x.dataset.crGhost);
			let gh = portal.querySelector("." + cls + "[data-cr-ghost]");
			if (real || !atEdge(sl, dir)) {
				if (gh) gh.remove();
				return;
			}
			if (gh) return;
			const other = [...portal.querySelectorAll(".PhotoView-Slider__Arrow" + (side === "Left" ? "Right" : "Left"))].find((x) => !x.dataset.crGhost);
			if (!other) return;
			gh = other.cloneNode(true);
			gh.className = other.className.replace(/PhotoView-Slider__Arrow(Left|Right)/, cls);
			gh.dataset.crGhost = "1";
			gh.addEventListener("click", (e) => {
				e.stopPropagation();
				const s2 = slider(portal);
				if (s2 && atEdge(s2, dir)) wrapGo(portal, s2, dir);
			});
			other.parentNode.insertBefore(gh, other);
		});
	};
	const pan = (img, portal, dx, dy) => {
		stopSpring();
		if (!P || P.img !== img) {
			const hk = hookOf(img);
			if (!hk) return;
			const [ox, oy] = bounds(hk.state, portal);
			if (!ox && !oy) return swipe(portal, dx, dy);
			if (P) settle();
			P = { img, portal, x: hk.state.x || 0, y: hk.state.y || 0, ox, oy, raf: 0, timer: 0 };
			portal.classList.add("cr-zooming");
		}
		P.x = P.ox ? rubber(P.x, -dx, P.ox) : 0;
		P.y = P.oy ? rubber(P.y, -dy, P.oy) : 0;
		if (!P.raf) P.raf = requestAnimationFrame(flush);
		clearTimeout(P.timer);
		P.timer = setTimeout(settle, 120);
	};
	window.addEventListener("wheel", (e) => {
		if (synth.has(e) || e.crSynth) return;
		const under = document.elementFromPoint(e.clientX, e.clientY);
		const t = under || (e.target instanceof Element && e.target.isConnected ? e.target : null);
		const portal = (t && t.closest(".PhotoView-Portal")) || (e.target instanceof Element && !e.target.isConnected ? document.querySelector(".PhotoView-Portal") : null);
		if (!portal) return;
		let box = t && portal.contains(t) ? t.closest(".PhotoView__PhotoBox") : null;
		if (!box) {
			const cx = window.innerWidth / 2;
			for (const w of portal.querySelectorAll(".PhotoView__PhotoWrap")) {
				const r = w.getBoundingClientRect();
				if (r.left <= cx && r.right >= cx) {
					box = w.querySelector(".PhotoView__PhotoBox");
					break;
				}
			}
		}
		const img = box && box.querySelector(".PhotoView__Photo");
		if (!img) return;
		e.stopPropagation();
		if (e.cancelable) e.preventDefault();
		let dy = e.deltaY;
		let dx = e.deltaX;
		if (e.deltaMode === 1) {
			dy *= 16;
			dx *= 16;
		} else if (e.deltaMode === 2) {
			dy *= 400;
			dx *= 400;
		}
		const now = performance.now();
		if (now - burst.last > 250 || !burst.kind) burst.kind = classify(e, dx, dy);
		burst.last = now;
		if (e.ctrlKey || e.metaKey || burst.kind === "wheel") {
			if (!e.ctrlKey && !e.metaKey && Math.abs(dx) > Math.abs(dy)) return;
			zoom(e, img, portal, dy);
		} else pan(img, portal, dx, dy);
	}, { capture: true, passive: false });
})();
