(() => {
	const GRIP = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';
	const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
	const pinPath = (li) => {
		const p = cr.up(li, (x) => x.pinned === true && typeof x.path === "string", 30);
		return p ? p.path : null;
	};
	const topItems = (tree) => [...tree.querySelectorAll('[role="treeitem"]')].filter((li) => !li.parentElement.closest('[role="group"]') && pinPath(li));
	const domPins = () => {
		const t = document.querySelector('[role="tree"]');
		return t ? topItems(t).map(pinPath) : [];
	};
	let session = null;
	let sessionAt = 0;
	const isSession = (v) => v && typeof v === "object" && v.user && typeof v.user === "object" && v.user.id && v.token && typeof v.token === "object";
	const fits = (s) => {
		if (!Array.isArray(s.user.pined)) return false;
		const dom = domPins();
		if (!dom.length) return true;
		const set = new Set(s.user.pined.map((p) => p.uri));
		return dom.every((u) => set.has(u)) && set.size === dom.length;
	};
	const findSession = () => {
		if (session && Date.now() - sessionAt < 4000 && fits(session)) return session;
		const start = cr.rootFiber();
		const stack = start ? [start] : [];
		const seen = new Set();
		let n = 0;
		while (stack.length && n < 60000) {
			const f = stack.pop();
			n++;
			if (typeof f.type === "function") {
				let h = f.memoizedState;
				for (let i = 0; h && typeof h === "object" && "next" in h && i < 50; i++, h = h.next) {
					const v = h.memoizedState;
					if (isSession(v) && !seen.has(v)) {
						seen.add(v);
						if (fits(v)) {
							session = v;
							sessionAt = Date.now();
							return v;
						}
					}
				}
			}
			if (f.sibling) stack.push(f.sibling);
			if (f.child) stack.push(f.child);
		}
		session = null;
		return null;
	};
	const keyFor = (s) => "cr-pin-order:" + s.user.id;
	const loadOrder = (s) => {
		try {
			const v = JSON.parse(localStorage.getItem(keyFor(s)) || "null");
			return Array.isArray(v) ? v : null;
		} catch (e) {
			return null;
		}
	};
	const saveOrder = (s, order) => {
		try {
			localStorage.setItem(keyFor(s), JSON.stringify(order));
		} catch (e) {}
	};
	const sortPined = (s) => {
		if (!s || !Array.isArray(s.user.pined)) return false;
		const order = loadOrder(s);
		if (!order) return false;
		const arr = s.user.pined;
		const base = arr.slice();
		const rank = (p) => {
			const i = order.indexOf(p.uri);
			return i < 0 ? 100000 + base.indexOf(p) : i;
		};
		const sorted = base.slice().sort((a, b) => rank(a) - rank(b));
		if (sorted.every((p, i) => p === arr[i])) return false;
		if (!Object.isFrozen(arr)) {
			try {
				arr.splice(0, arr.length, ...sorted);
				return true;
			} catch (e) {}
		}
		try {
			s.user = Object.assign({}, s.user, { pined: sorted });
		} catch (err) {}
		return s.user.pined === sorted;
	};
	const bump = () => {
		const st = cr.store();
		if (st) st.dispatch({ type: "globalState/increasePinedGeneration" });
	};
	let gen = null;
	let subscribed = false;
	const ensureSub = () => {
		if (subscribed) return;
		const st = cr.store();
		if (!st) return;
		subscribed = true;
		st.subscribe(() => {
			const gs = st.getState().globalState;
			const g = gs && gs.pinedGeneration;
			if (g !== gen) {
				gen = g;
				if (session) sortPined(session);
			}
		});
	};
	let drag = null;
	let busy = false;
	const startDrag = (e, grip) => {
		if (busy || drag) return;
		const li = grip.closest('[role="treeitem"]');
		const tree = li && li.closest('[role="tree"]');
		const s = findSession();
		if (!tree || !s) return;
		const items = topItems(tree);
		const idx = items.indexOf(li);
		if (idx < 0 || items.length < 2) return;
		e.preventDefault();
		e.stopPropagation();
		const rects = items.map((x) => x.getBoundingClientRect());
		drag = { li, tree, items, idx, rects, target: idx, y0: e.clientY, id: e.pointerId, s };
		try {
			grip.setPointerCapture(e.pointerId);
		} catch (err) {}
		items.forEach((x) => x.classList.add("cr-pin-item"));
		tree.classList.add("cr-pin-sorting");
		li.classList.add("cr-pin-drag");
		document.documentElement.classList.add("cr-pin-dragging");
	};
	const moveDrag = (e) => {
		if (!drag || e.pointerId !== drag.id) return;
		const { items, idx, rects, li } = drag;
		const h = rects[idx].height;
		const minDy = rects[0].top - rects[idx].top;
		const maxDy = rects[rects.length - 1].bottom - rects[idx].bottom;
		const dy = Math.max(minDy, Math.min(maxDy, e.clientY - drag.y0));
		li.style.transform = "translateY(" + dy + "px)";
		const c = rects[idx].top + dy + h / 2;
		let t = idx;
		for (let j = 0; j < idx; j++) if (c <= rects[j].top + rects[j].height / 2) {
			t = j;
			break;
		}
		for (let j = items.length - 1; j > idx; j--) if (c >= rects[j].top + rects[j].height / 2) {
			t = j;
			break;
		}
		drag.target = t;
		items.forEach((x, j) => {
			if (j === idx) return;
			let s = 0;
			if (j >= t && j < idx) s = rects[j + 1].top - rects[j].top;
			else if (j <= t && j > idx) s = rects[j - 1].top - rects[j].top;
			x.style.transform = s ? "translateY(" + s + "px)" : "";
		});
	};
	const settle = (d, expected, changed) => {
		const old = new Map();
		d.items.forEach((x) => old.set(pinPath(x), x.getBoundingClientRect().top));
		let tries = 0;
		const step = () => {
			const now = topItems(d.tree);
			if (changed && now.map(pinPath).join("\n") !== expected.join("\n") && ++tries < 20) return requestAnimationFrame(step);
			document.querySelectorAll(".cr-pin-item").forEach((x) => {
				x.style.transition = "none";
				x.style.transform = "";
				x.classList.remove("cr-pin-drag");
			});
			d.tree.classList.remove("cr-pin-sorting");
			void d.tree.offsetHeight;
			now.forEach((x) => {
				const t = old.get(pinPath(x));
				if (t == null) return;
				const dy = t - x.getBoundingClientRect().top;
				if (Math.abs(dy) > 0.5) x.animate([{ transform: "translateY(" + dy + "px)" }, { transform: "translateY(0)" }], { duration: 240, easing: EASE });
			});
			requestAnimationFrame(() => {
				document.querySelectorAll(".cr-pin-item").forEach((x) => (x.style.transition = ""));
				busy = false;
			});
		};
		requestAnimationFrame(step);
	};
	const endDrag = (e) => {
		if (!drag || e.pointerId !== drag.id) return;
		const d = drag;
		drag = null;
		busy = true;
		document.documentElement.classList.remove("cr-pin-dragging");
		const uris = d.items.map(pinPath);
		let changed = false;
		if (d.target !== d.idx) {
			const moved = uris.splice(d.idx, 1)[0];
			uris.splice(d.target, 0, moved);
			saveOrder(d.s, uris);
			changed = sortPined(d.s);
		}
		settle(d, uris, changed);
		if (changed) bump();
	};
	window.addEventListener("pointermove", moveDrag, true);
	window.addEventListener("pointerup", endDrag, true);
	window.addEventListener("pointercancel", endDrag, true);
	const block = (e) => {
		if (e.target.closest && e.target.closest(".cr-pin-grip")) {
			e.stopPropagation();
			e.preventDefault();
		}
	};
	["mousedown", "click", "dblclick", "dragstart", "contextmenu"].forEach((t) => document.addEventListener(t, block, true));
	document.addEventListener("touchstart", block, { capture: true, passive: false });
	document.addEventListener("pointerdown", (e) => {
		const g = e.target.closest && e.target.closest(".cr-pin-grip");
		if (!g) return;
		e.stopPropagation();
		if (e.button === 0) startDrag(e, g);
		else e.preventDefault();
	}, true);
	const inject = () => {
		ensureSub();
		if (drag || busy) return;
		const tree = document.querySelector('[role="tree"]');
		if (!tree) return;
		const items = topItems(tree);
		if (!items.length) return;
		const s = findSession();
		if (!s) return;
		if (sortPined(s)) {
			bump();
			return;
		}
		const allowed = new Set(s.user.pined.map((p) => p.uri));
		document.querySelectorAll('.MuiDialog-root [role="tree"] .cr-pin-grip').forEach((g) => g.remove());
		document.querySelectorAll('[role="tree"]:not(.MuiDialog-root *)').forEach((t) => {
			topItems(t).forEach((li) => {
				li.classList.add("cr-pin-item");
				if (li.style.transform) li.style.transform = "";
				const c = li.querySelector(":scope > .MuiTreeItem-content");
				if (!c) return;
				const has = c.querySelector(":scope > .cr-pin-grip");
				const ok = allowed.has(pinPath(li)) && allowed.size > 1;
				if (!ok) {
					if (has) has.remove();
					return;
				}
				if (has) return;
				const g = document.createElement("span");
				g.className = "cr-pin-grip";
				g.title = "Drag to reorder";
				g.setAttribute("aria-hidden", "true");
				g.innerHTML = GRIP;
				c.appendChild(g);
			});
		});
	};
	setInterval(inject, 500);
	let iq = false;
	new MutationObserver(() => {
		if (iq) return;
		const pt = document.querySelector('.MuiPopover-root [role="tree"]');
		if (!pt || pt.querySelector(".cr-pin-grip")) return;
		iq = true;
		requestAnimationFrame(() => {
			iq = false;
			try {
				inject();
			} catch (e) {}
		});
	}).observe(document.body, { childList: true, subtree: true });
})();
