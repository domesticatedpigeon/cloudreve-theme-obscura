(() => {
	const touch = matchMedia("(hover: none) and (pointer: coarse)");
	const PAD = 140;
	let z = null;
	const sliderState = (portal) => {
		const f = cr.slider(portal);
		for (let h = f && f.memoizedState; h; h = h.next) {
			const v = h.memoizedState;
			if (v && typeof v === "object" && typeof v.onScale === "function" && typeof v.scale === "number") return Object.assign({}, v, { set: h.queue && h.queue.dispatch });
		}
		return null;
	};
	const nums = (t) => (t.match(/-?[\d.]+(e-?\d+)?/g) || []).map(Number);
	const near = (a, b) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 0.5);
	const toggleUi = () => {
		const ss = z && sliderState(z.portal);
		if (ss && ss.set) ss.set((x) => ({ overlay: !x.overlay }));
	};
	const livePortal = () => document.querySelector(".PhotoView-Portal:not(.PhotoView-Slider__willClose)");
	const activeBox = (portal) => [...portal.querySelectorAll(".PhotoView__PhotoBox")].find((b) => b.style.willChange === "transform") || null;
	const vw = () => z.portal.clientWidth;
	const vh = () => z.portal.clientHeight;
	const pos = () => {
		const W = z.fw * z.s;
		const H = z.fh * z.s;
		return [W < vw() ? (vw() - W) / 2 : -z.sc.scrollLeft, H < vh() ? (vh() - H) / 2 : -z.sc.scrollTop, W, H];
	};
	const place = (s, left, top) => {
		z.s = s;
		const W = z.fw * s;
		const H = z.fh * s;
		z.img.style.width = W + "px";
		z.img.style.height = H + "px";
		z.sc.scrollLeft = W < vw() ? 0 : Math.min(Math.max(-left, 0), W - vw());
		z.sc.scrollTop = H < vh() ? 0 : Math.min(Math.max(-top, 0), H - vh());
	};
	const reveal = (cur, instant) => {
		delete cur.box.dataset.crZ;
		if (instant) cur.sc.remove();
		else setTimeout(() => cur.sc.remove(), 200);
	};
	const finish = (instant) => {
		if (!z) return;
		const cur = z;
		z = null;
		cancelAnimationFrame(cur.raf);
		cur.sc.style.pointerEvents = "none";
		clearTimeout(cur.tapT);
		if (cur.mode === "mirror") {
			if (instant) reveal(cur, true);
			else {
				cur.sc.style.opacity = "0";
				delete cur.box.dataset.crZ;
				setTimeout(() => cur.sc.remove(), 200);
			}
			return;
		}
		const tr = cur.tr || [cur.box.style.getPropertyValue("transition"), cur.box.style.getPropertyPriority("transition")];
		cur.box.style.setProperty("transition", "none", "important");
		const ss = sliderState(cur.portal);
		if (ss && ss.scale !== 1) ss.onScale(1);
		const done = () => {
			if (tr[0]) cur.box.style.setProperty("transition", tr[0], tr[1]);
			else cur.box.style.removeProperty("transition");
			reveal(cur, instant);
		};
		if (instant) {
			done();
			return;
		}
		const t0 = performance.now();
		const wait = () => {
			const m = nums(getComputedStyle(cur.box).transform);
			const w = nums(cur.box.style.transform);
			const fitted = m.length === 6 && w.length === 6 && Math.abs(m[0] - 1) < 0.01 && near(m, w);
			if (fitted || performance.now() - t0 > 600) requestAnimationFrame(done);
			else requestAnimationFrame(wait);
		};
		requestAnimationFrame(wait);
	};
	const toFit = () => {
		if (!z || z.mode !== "scroll" || z.anim) return;
		const cur = z;
		cur.anim = true;
		clearTimeout(cur.tapT);
		const ss = sliderState(cur.portal);
		if (ss && ss.set && !ss.overlay) ss.set({ overlay: true });
		const [l, t, W, H] = pos();
		const im = cur.img;
		im.style.transition = "none";
		im.style.width = W + "px";
		im.style.height = H + "px";
		im.style.transform = "translate(" + l + "px, " + (t + PAD) + "px)";
		cur.sc.classList.add("cr-zm");
		cur.sc.scrollLeft = 0;
		cur.sc.scrollTop = 0;
		cur.tr = [cur.box.style.getPropertyValue("transition"), cur.box.style.getPropertyPriority("transition")];
		cur.box.style.setProperty("transition", "none", "important");
		if (ss && ss.scale !== 1) ss.onScale(1);
		const t0 = performance.now();
		const go = () => {
			if (z !== cur) return;
			const m = nums(getComputedStyle(cur.box).transform);
			const w = nums(cur.box.style.transform);
			if (!(m.length === 6 && w.length === 6 && Math.abs(m[0] - 1) < 0.01 && near(m, w)) && performance.now() - t0 < 300) {
				requestAnimationFrame(go);
				return;
			}
			const r = cur.src.getBoundingClientRect();
			const pr = cur.portal.getBoundingClientRect();
			im.style.transition = "transform 0.34s cubic-bezier(0.32, 0.72, 0, 1), filter 0.35s ease";
			im.style.transform = "translate(" + (r.left - pr.left) + "px, " + (r.top - pr.top + PAD) + "px) scale(" + r.width / W + ")";
			let ended = false;
			const end = () => {
				if (ended) return;
				ended = true;
				if (z === cur) finish(false);
			};
			im.addEventListener("transitionend", (e) => e.propertyName === "transform" && end());
			setTimeout(end, 420);
		};
		requestAnimationFrame(go);
	};
	const follow = () => {
		if (!z || z.mode !== "mirror") return;
		const r = z.src.getBoundingClientRect();
		const pr = z.portal.getBoundingClientRect();
		if (r.width > z.iw * 1.02) {
			z.iw = Math.min(r.width * 1.5, Math.max(z.nat, r.width));
			z.img.style.width = z.iw + "px";
			z.img.style.height = z.iw * (z.fh / z.fw) + "px";
		}
		z.img.style.transform = "translate(" + (r.left - pr.left) + "px, " + (r.top - pr.top + PAD) + "px) scale(" + r.width / z.iw + ")";
		z.raf = requestAnimationFrame(follow);
	};
	const mirror = (portal, box, img, scale) => {
		const sc = document.createElement("div");
		sc.className = "cr-zs cr-zm";
		const c = document.createElement("div");
		c.className = "cr-zc";
		const im = document.createElement("img");
		im.src = img.currentSrc || img.src;
		im.alt = "";
		im.draggable = false;
		c.appendChild(im);
		sc.appendChild(c);
		const fw = img.offsetWidth;
		const fh = img.offsetHeight;
		const nat = img.naturalWidth || fw;
		z = { mode: "mirror", portal, box, src: img, sc, img: im, fw, fh, nat, iw: Math.min(fw * Math.max(2, scale * 1.5), Math.max(nat, fw * scale)), s: scale, raf: 0, anim: false, pinch: null, tap: 0, tx: 0, ty: 0, moved: false };
		im.style.width = z.iw + "px";
		im.style.height = z.iw * (fh / fw) + "px";
		const cur = z;
		requestAnimationFrame(track);
		const show = () => {
			if (z !== cur) return;
			sc.style.opacity = "0";
			portal.appendChild(sc);
			follow();
			requestAnimationFrame(() => {
				if (z !== cur) return;
				sc.style.opacity = "1";
				box.dataset.crZ = "1";
			});
		};
		(im.decode ? im.decode() : Promise.resolve()).then(show, show);
		bind(cur);
	};
	let lastPt = [0, 0];
	const bounce = (el, name, ox, oy, dur = 0.42) => {
		el.style.transformOrigin = ox + "px " + oy + "px";
		el.style.animation = "none";
		void el.offsetWidth;
		el.style.animation = name + " " + dur + "s cubic-bezier(0.25, 1, 0.5, 1) both";
		setTimeout(() => {
			el.style.animation = "";
			el.style.transformOrigin = "";
		}, dur * 1000 + 40);
	};
	const tapIn = (portal, box, img, ss) => {
		const w = nums(box.style.transform);
		const m = nums(getComputedStyle(box).transform);
		if (w.length !== 6 || m.length !== 6 || !m[0]) return;
		const sf = w[0];
		const k = sf / m[0];
		const rc = img.getBoundingClientRect();
		const o = box.parentElement.getBoundingClientRect();
		const pr = portal.getBoundingClientRect();
		const left = o.left + k * (rc.left - o.left - m[4]) + w[4] - pr.left;
		const top = o.top + k * (rc.top - o.top - m[5]) + w[5] - pr.top;
		const sc = document.createElement("div");
		sc.className = "cr-zs";
		const c = document.createElement("div");
		c.className = "cr-zc";
		const im = document.createElement("img");
		im.src = img.currentSrc || img.src;
		im.alt = "";
		im.draggable = false;
		c.appendChild(im);
		sc.appendChild(c);
		const fw = img.offsetWidth;
		const fh = img.offsetHeight;
		z = { mode: "scroll", portal, box, src: img, sc, img: im, fw, fh, nat: img.naturalWidth || fw, iw: 0, s: sf, raf: 0, anim: false, pinch: null, tap: 0, tx: 0, ty: 0, moved: false };
		const cur = z;
		requestAnimationFrame(track);
		const [px, py] = [lastPt[0] - pr.left, lastPt[1] - pr.top];
		const show = () => {
			if (z !== cur) return;
			portal.appendChild(sc);
			place(sf, left, top);
			box.dataset.crZn = "1";
			box.dataset.crZ = "1";
			requestAnimationFrame(() => delete box.dataset.crZn);
			bounce(c, "cr-zbin", px + sc.scrollLeft, py + PAD + sc.scrollTop);
		};
		(im.decode ? im.decode() : Promise.resolve()).then(show, show);
		bind(cur);
	};
	const tapOut = (pt) => {
		if (!z || z.mode !== "scroll" || z.anim) return;
		const cur = z;
		cur.anim = true;
		clearTimeout(cur.tapT);
		cur.sc.style.pointerEvents = "none";
		const ss = sliderState(cur.portal);
		if (ss && ss.set && !ss.overlay) ss.set({ overlay: true });
		const pr = cur.portal.getBoundingClientRect();
		const [l0, t0p, W0, H0] = pos();
		const u = Math.min(1, Math.max(0, (pt[0] - pr.left - l0) / W0));
		const v = Math.min(1, Math.max(0, (pt[1] - pr.top - t0p) / H0));
		place(1, 0, 0);
		const [l1, t1, W1, H1] = pos();
		bounce(cur.img.parentElement, "cr-zbout", l1 + u * W1 + cur.sc.scrollLeft, t1 + v * H1 + PAD + cur.sc.scrollTop);
		const tr = [cur.box.style.getPropertyValue("transition"), cur.box.style.getPropertyPriority("transition")];
		cur.box.style.setProperty("transition", "none", "important");
		if (ss && ss.scale !== 1) ss.onScale(1);
		const t0 = performance.now();
		const go = () => {
			if (z !== cur) return;
			const m = nums(getComputedStyle(cur.box).transform);
			const w = nums(cur.box.style.transform);
			const fitted = m.length === 6 && w.length === 6 && Math.abs(m[0] - 1) < 0.01 && near(m, w);
			if ((!fitted && performance.now() - t0 < 700) || performance.now() - t0 < 480) {
				requestAnimationFrame(go);
				return;
			}
			z = null;
			if (tr[0]) cur.box.style.setProperty("transition", tr[0], tr[1]);
			else cur.box.style.removeProperty("transition");
			cur.box.dataset.crZn = "1";
			delete cur.box.dataset.crZ;
			cur.sc.remove();
			requestAnimationFrame(() => delete cur.box.dataset.crZn);
		};
		requestAnimationFrame(go);
	};
	const settle = (cur, scale) => {
		if (z !== cur || cur.mode !== "mirror") return;
		cancelAnimationFrame(cur.raf);
		const r = cur.src.getBoundingClientRect();
		const pr = cur.portal.getBoundingClientRect();
		cur.mode = "scroll";
		cur.s = scale;
		cur.img.style.transform = "";
		cur.sc.classList.remove("cr-zm");
		place(scale, r.left - pr.left, r.top - pr.top);
	};
	const bind = (cur) => {
		const sc = cur.sc;
		const pr = () => cur.portal.getBoundingClientRect();
		const mid = (a, b) => {
			const p = pr();
			return [(a.clientX + b.clientX) / 2 - p.left, (a.clientY + b.clientY) / 2 - p.top];
		};
		const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
		sc.addEventListener(
			"touchstart",
			(e) => {
				if (z !== cur || cur.mode !== "scroll" || cur.anim) return;
				if (e.touches.length === 2) {
					const [a, b] = e.touches;
					const [fx, fy] = mid(a, b);
					const [l, t, W, H] = pos();
					cur.pinch = { d: dist(a, b), s: cur.s, u: (fx - l) / W, v: (fy - t) / H };
					cur.moved = true;
				} else if (e.touches.length === 1) {
					cur.moved = false;
					cur.tx = e.touches[0].clientX;
					cur.ty = e.touches[0].clientY;
				}
			},
			{ passive: true }
		);
		let raf = 0;
		let last = null;
		sc.addEventListener(
			"touchmove",
			(e) => {
				if (z !== cur || cur.mode !== "scroll") return;
				if (e.touches.length === 1 && Math.hypot(e.touches[0].clientX - cur.tx, e.touches[0].clientY - cur.ty) > 8) cur.moved = true;
				if (e.touches.length !== 2 || !cur.pinch) return;
				e.preventDefault();
				last = [e.touches[0], e.touches[1]];
				if (raf) return;
				raf = requestAnimationFrame(() => {
					raf = 0;
					if (z !== cur || !cur.pinch || !last) return;
					const [a, b] = last;
					const maxS = Math.max(4, (cur.nat / cur.fw) * 2);
					const s = Math.min(Math.max(cur.pinch.s * (dist(a, b) / cur.pinch.d), 0.6), maxS);
					const [fx, fy] = mid(a, b);
					place(s, fx - cur.pinch.u * cur.fw * s, fy - cur.pinch.v * cur.fh * s);
				});
			},
			{ passive: false }
		);
		sc.addEventListener(
			"touchend",
			(e) => {
				if (z !== cur || cur.mode !== "scroll") return;
				if (e.touches.length < 2) cur.pinch = null;
				if (e.touches.length) return;
				if (cur.s <= 1.02) {
					toFit();
					return;
				}
				if (!cur.moved) {
					const now = performance.now();
					clearTimeout(cur.tapT);
					if (now - cur.tap < 300) {
						cur.tap = 0;
						tapOut([e.changedTouches[0].clientX, e.changedTouches[0].clientY]);
					} else {
						cur.tap = now;
						cur.tapT = setTimeout(toggleUi, 300);
					}
				}
			},
			{ passive: true }
		);
	};
	const begin = () => {
		if (z || !touch.matches) return null;
		const portal = livePortal();
		const box = portal && activeBox(portal);
		const img = box && box.querySelector("img.PhotoView__Photo");
		const ss = portal && sliderState(portal);
		if (!img || !img.complete || !img.offsetWidth || !ss || !(ss.scale > 1.01)) return null;
		mirror(portal, box, img, ss.scale);
		return z;
	};
	const watch = () => {
		if (!z) {
			if (!touch.matches) return;
			const portal = livePortal();
			const box = portal && activeBox(portal);
			const img = box && box.querySelector("img.PhotoView__Photo");
			const ss = portal && sliderState(portal);
			if (img && img.complete && img.offsetWidth && ss && ss.scale > 1.01) tapIn(portal, box, img, ss);
			return;
		}
		const cur = z.mode === "mirror" ? z : null;
		if (!cur) return;
		let prev = null;
		const t0 = performance.now();
		const wait = () => {
			if (z !== cur || cur.mode !== "mirror" || !cur.box.isConnected) return;
			if (cur.touching) {
				prev = null;
				requestAnimationFrame(wait);
				return;
			}
			const want = nums(cur.box.style.transform);
			const now = nums(getComputedStyle(cur.box).transform);
			const done = near(want, now) && prev && near(now, prev);
			prev = now;
			if (done || performance.now() - t0 > 900) {
				const ss = sliderState(cur.portal);
				if (ss && ss.scale > 1.01) settle(cur, ss.scale);
				else finish(false);
				return;
			}
			requestAnimationFrame(wait);
		};
		requestAnimationFrame(wait);
	};
	let mq = false;
	window.addEventListener(
		"touchmove",
		() => {
			if (z || mq) return;
			mq = true;
			requestAnimationFrame(() => {
				mq = false;
				const cur = begin();
				if (cur) cur.touching = true;
			});
		},
		{ capture: true, passive: true }
	);
	window.addEventListener(
		"touchstart",
		(e) => {
			if (z && z.mode === "mirror") z.touching = true;
			if (!touch.matches || !(e.target instanceof Element)) return;
			const wrap = e.target.closest(".PhotoView__PhotoWrap");
			if (!wrap) return;
			const portal = wrap.closest(".PhotoView-Portal");
			const box = portal && activeBox(portal);
			if (!box || !wrap.contains(box)) return;
			const img = box.querySelector("img.PhotoView__Photo");
			const holder = img && img.parentElement;
			if (!holder || holder.contains(e.target)) return;
			const f = cr.fiberOf(holder);
			const h = f && f.memoizedProps && f.memoizedProps.onTouchStart;
			if (typeof h !== "function") return;
			e.stopPropagation();
			h({ touches: e.touches, targetTouches: e.targetTouches, changedTouches: e.changedTouches, nativeEvent: e, target: img, currentTarget: img, stopPropagation() {}, preventDefault() {} });
		},
		{ capture: true, passive: true }
	);
	let checkT = 0;
	window.addEventListener(
		"touchend",
		(e) => {
			if (e.touches.length) return;
			if (e.changedTouches[0]) lastPt = [e.changedTouches[0].clientX, e.changedTouches[0].clientY];
			if (z && z.mode === "mirror") z.touching = false;
			if (z && z.mode === "scroll") return;
			cancelAnimationFrame(checkT);
			checkT = requestAnimationFrame(watch);
		},
		{ capture: true, passive: true }
	);
	const guard = () => {
		if (!z) return;
		if (!z.portal.isConnected || z.portal.classList.contains("PhotoView-Slider__willClose") || !z.box.isConnected || activeBox(z.portal) !== z.box) finish(true);
	};
	const track = () => {
		if (!z) return;
		guard();
		requestAnimationFrame(track);
	};
	new MutationObserver(() => requestAnimationFrame(guard)).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
	setInterval(guard, 500);
	window.addEventListener("resize", () => finish(true));
	let refit = 0;
	let refitting = false;
	window.addEventListener("resize", () => {
		if (refitting) return;
		clearTimeout(refit);
		refit = setTimeout(() => {
			if (!document.querySelector(".PhotoView-Portal")) return;
			refitting = true;
			window.dispatchEvent(new Event("resize"));
			refitting = false;
		}, 180);
	});
})();
