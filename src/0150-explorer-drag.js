(() => {
	const hookValues = (fiber) => {
		const out = [];
		let h = fiber && fiber.memoizedState;
		let guard = 0;
		while (h && typeof h === "object" && "next" in h && guard++ < 100) {
			const v = h.memoizedState;
			out.push(Array.isArray(v) ? v[0] : v);
			h = h.next;
		}
		return out;
	};
	const findSpec = (el, test) => {
		let f = cr.fiberOf(el);
		while (f) {
			for (const v of hookValues(f)) if (v && typeof v === "object" && test(v)) return v;
			f = f.return;
		}
		return null;
	};
	const dragSpecOf = (el) => findSpec(el, (v) => v.type === "file" && typeof v.end === "function" && v.item);
	const dropTargetAt = (x, y, item) => {
		let el = document.elementFromPoint(x, y);
		while (el && el !== document.body) {
			let f = cr.fiberOf(el);
			f = f && f.return;
			while (f && typeof f.type !== "string") {
				for (const v of hookValues(f)) {
					if (v && typeof v === "object" && v.accept === "file" && typeof v.drop === "function") {
						let ok = true;
						try {
							ok = typeof v.canDrop !== "function" || v.canDrop(item, {});
						} catch (e) {
							ok = false;
						}
						if (ok) return { el, spec: v };
					}
				}
				f = f.return;
			}
			el = el.parentElement;
		}
		return null;
	};
	const fm = () => {
		const s = cr.store();
		return s ? s.getState().fileManager[0] : null;
	};
	const selectedMap = () => (fm() && fm().selected) || {};
	const listFiles = () => (fm() && fm().list && fm().list.files) || [];
	const setSelected = (value) => {
		const s = cr.store();
		if (s) s.dispatch({ type: "fileManagerSlice/setSelected", payload: { index: 0, value } });
	};
	const TILE = ".MuiImageListItem-root, .MuiGrid-container [data-rect-id]";
	const galleryList = () => document.querySelector(".MuiImageList-root") || (document.querySelector(".cr-explorer .MuiGrid-container [data-rect-id]") ? document.querySelector(".cr-explorer") : null);
	const isGrid = (li) => !!li && !li.classList.contains("MuiImageListItem-root");
	const checkOf = (li) => {
		if (!li) return null;
		if (!isGrid(li)) return li.querySelector(".MuiImageListItemBar-actionIcon");
		const header = li.firstElementChild && li.firstElementChild.firstElementChild;
		return header ? header.firstElementChild : null;
	};
	const onCheckOf = (li, t) => {
		const c = checkOf(li);
		return !!c && c.contains(t);
	};
	const ignoredAt = (t, li) => {
		const ig = t.closest(ignored);
		return !!ig && ig !== li;
	};
	const frameOf = (list) => {
		let el = list;
		while (el && el !== document.body) {
			const p = cr.propsOf(el);
			if (p && typeof p.onContextMenu === "function") return el;
			el = el.parentElement;
		}
		return list.parentElement;
	};
	const ignored = "button, input, textarea, a, [role='button'], .MuiPopover-root, .MuiDialog-root, .MuiMenu-root, .MuiModal-root, .cr-recent";
	let anchor = null;
	const rangeSelect = (file) => {
		const files = listFiles();
		const bi = files.findIndex((f) => f.path === file.path);
		const ai = anchor ? files.findIndex((f) => f.path === anchor) : -1;
		const current = selectedMap();
		if (bi < 0) return;
		if (ai < 0) {
			anchor = file.path;
			setSelected(Object.values(current).filter((f) => f.path !== file.path).concat([file]));
			return;
		}
		const range = files.slice(Math.min(ai, bi), Math.max(ai, bi) + 1);
		setSelected(Object.values(current).filter((f) => !range.some((r) => r.path === f.path)).concat(range));
	};
	let state = null;
	let suppressClick = false;
	const endSuppress = () => {
		suppressClick = true;
		setTimeout(() => (suppressClick = false), 0);
	};
	const updateSelect = () => {
		const d = state;
		const top = d.area ? d.area.scrollTop : 0;
		const x1 = Math.min(d.sx, d.cx);
		const x2 = Math.max(d.sx, d.cx);
		const y1 = Math.min(d.sy, d.cy + top);
		const y2 = Math.max(d.sy, d.cy + top);
		if (!d.box) {
			if (x2 - x1 < 4 && y2 - y1 < 4) return;
			d.box = document.createElement("div");
			d.box.className = "cr-drag-box";
			document.body.appendChild(d.box);
			document.body.style.userSelect = "none";
		}
		Object.assign(d.box.style, { left: x1 + "px", top: y1 - top + "px", width: x2 - x1 + "px", height: y2 - y1 + "px" });
		const files = [];
		d.list.querySelectorAll(TILE).forEach((li) => {
			const r = li.getBoundingClientRect();
			if (r.left < x2 && r.right > x1 && r.top + top < y2 && r.bottom + top > y1) {
				const file = cr.fileOf(li);
				if (file) files.push(file);
			}
		});
		d.hits = files;
		const key = files.map((f) => f.path).join("|");
		if (key === d.key) return;
		d.key = key;
		setSelected(d.additive ? Object.values(d.base).concat(files.filter((f) => !d.base[f.path])) : files);
	};
	const setDragging = (dragging) => {
		const s = cr.store();
		if (s) s.dispatch({ type: "globalState/setDragging", payload: { dragging, draggingWithSelected: true } });
	};
	const buildPreview = (li, file) => {
		const count = Math.max(1, Object.keys(selectedMap()).length);
		const bodyStyle = getComputedStyle(document.body);
		const paper = bodyStyle.backgroundColor;
		const text = bodyStyle.color;
		const wrap = document.createElement("div");
		wrap.className = "cr-drag-preview";
		for (let i = Math.min(2, count - 1); i >= 1; i--) {
			const back = document.createElement("div");
			back.className = "cr-card";
			back.style.background = paper;
			back.style.top = i * 4 + "px";
			back.style.left = i * 4 + "px";
			wrap.appendChild(back);
		}
		const card = document.createElement("div");
		card.className = "cr-card";
		card.style.background = paper;
		card.style.color = text;
		const icon = document.createElement("div");
		icon.className = "cr-card-icon";
		const source = li.querySelector("img:not(.MuiAvatar-img)") || li.querySelector("svg");
		if (source) icon.appendChild(source.cloneNode(true));
		const name = document.createElement("div");
		name.className = "cr-card-name";
		name.textContent = file.name;
		card.appendChild(icon);
		card.appendChild(name);
		wrap.appendChild(card);
		if (count > 1) {
			const badge = document.createElement("div");
			badge.className = "cr-badge";
			badge.textContent = String(count);
			wrap.appendChild(badge);
		}
		return wrap;
	};
	const clearOver = () => {
		if (state && state.over) state.over.classList.remove("cr-drop-over");
		if (state) state.over = null;
	};
	const updateMove = (x, y) => {
		const d = state;
		if (!d.ghost) {
			if (Math.abs(x - d.sx) < 5 && Math.abs(y - d.sy0) < 5) return;
			d.ghost = buildPreview(d.li, d.file);
			document.body.appendChild(d.ghost);
			setDragging(true);
		}
		d.ghost.style.transform = "translate(" + x + "px, " + y + "px)";
		const target = dropTargetAt(x, y, d.item);
		const sel = selectedMap();
		let el = target ? target.el : null;
		if (el) {
			const f = cr.fileOf(el);
			if ((f && sel[f.path]) || el.contains(d.li)) el = null;
		}
		if (el !== d.over) {
			clearOver();
			if (el) el.classList.add("cr-drop-over");
			d.over = el;
			d.target = el ? target.spec : null;
		}
	};
	document.addEventListener("dragstart", (e) => {
		const li = e.target instanceof Element ? e.target.closest(TILE) : null;
		if (li && dragSpecOf(li)) e.preventDefault();
	}, true);
	let pt = "mouse";
	document.addEventListener("pointerdown", (e) => {
		pt = e.pointerType || "mouse";
	}, true);
	document.addEventListener("mousedown", (e) => {
		if (e.button !== 0 || pt !== "mouse") return;
		const list = galleryList();
		if (!list) return;
		const t = e.target instanceof Element ? e.target : null;
		if (!t) return;
		const frame = frameOf(list);
		if (!frame || !frame.contains(t)) return;
		const li = t.closest(TILE);
		if (ignoredAt(t, li) || t.closest(".cr-grid-more, .cr-more")) return;
		if (isGrid(li) && onCheckOf(li, t)) return;
		const grid = !list.classList.contains("MuiImageList-root");
		const editingPath = !!document.querySelector(".cr-path input, .cr-nav .MuiInputBase-root input");
		if (grid && !t.closest(TILE) && !editingPath) e.stopPropagation();
		const file = li ? cr.fileOf(li) : null;
		const modifier = e.ctrlKey || e.metaKey || e.shiftKey;
		if (li && file && !modifier && selectedMap()[file.path]) {
			const spec = dragSpecOf(li);
			if (!spec) return;
			e.preventDefault();
			state = { mode: "move", li, file, item: { target: file, includeSelected: true }, spec, sx: e.clientX, sy0: e.clientY, ghost: null, over: null, target: null };
			return;
		}
		if (li) e.preventDefault();
		const top = frame.scrollTop;
		state = { mode: "select", list, area: frame, startFile: file, sx: e.clientX, sy: e.clientY + top, cx: e.clientX, cy: e.clientY, box: null, key: null, hits: [], additive: modifier, base: modifier ? Object.assign({}, selectedMap()) : {} };
		frame.addEventListener("scroll", updateSelect);
	}, true);
	document.addEventListener("mousemove", (e) => {
		if (!state) return;
		if (state.mode === "select") {
			state.cx = e.clientX;
			state.cy = e.clientY;
			updateSelect();
		} else {
			updateMove(e.clientX, e.clientY);
		}
	});
	document.addEventListener("mouseup", () => {
		if (!state) return;
		const d = state;
		if (d.mode === "select") {
			if (d.box) {
				d.box.remove();
				endSuppress();
				if (d.startFile && d.hits.some((f) => f.path === d.startFile.path)) anchor = d.startFile.path;
				else if (d.hits.length) {
					const files = listFiles();
					const idx = d.hits.map((h) => files.findIndex((f) => f.path === h.path)).filter((i) => i >= 0);
					if (idx.length) anchor = files[Math.min(...idx)].path;
				}
			}
			d.area.removeEventListener("scroll", updateSelect);
		} else if (d.ghost) {
			d.ghost.remove();
			setDragging(false);
			const target = d.target;
			clearOver();
			endSuppress();
			if (target) {
				try {
					const result = target.drop(d.item, {});
					if (result && result.uri) d.spec.end(d.item, { getDropResult: () => result, didDrop: () => true });
				} catch (err) {
					console.warn("Gallery drop failed", err);
				}
			}
		}
		document.body.style.userSelect = "";
		state = null;
	});
	document.addEventListener("click", (e) => {
		if (suppressClick) {
			e.stopPropagation();
			e.preventDefault();
			suppressClick = false;
			return;
		}
		const list = galleryList();
		if (!list || e.button !== 0) return;
		const t = e.target instanceof Element ? e.target : null;
		if (!t) return;
		const frame = frameOf(list);
		if (!frame || !frame.contains(t)) return;
		if (t.closest(".cr-more, .cr-grid-more")) return;
		const li = t.closest(TILE);
		if (li) {
			const file = cr.fileOf(li);
			if (!file) return;
			const onCheckButton = onCheckOf(li, t);
			if (isGrid(li) && !onCheckButton && !e.shiftKey && !e.ctrlKey && !e.metaKey && !file.placeholder && !t.closest("input, textarea")) {
				e.stopPropagation();
				e.preventDefault();
				li.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY, detail: 2 }));
				return;
			}
			if (file.type === 1 && !onCheckButton && !e.shiftKey && !e.ctrlKey && !e.metaKey && matchMedia("(pointer: coarse)").matches) {
				const router = cr.router();
				if (router) {
					e.stopPropagation();
					e.preventDefault();
					const meta = file.metadata || {};
					const path = meta["sys:shared_redirect"] || file.path;
					router.navigate("/home?" + new URLSearchParams({ path }).toString());
					return;
				}
			}
			if (e.shiftKey && !e.ctrlKey && !e.metaKey) {
				e.stopPropagation();
				e.preventDefault();
				rangeSelect(file);
				return;
			}
			const onCheck = onCheckButton;
			const toggleKey = /Mac|iPhone|iPad/.test(navigator.platform) ? e.metaKey : e.ctrlKey;
			if (!onCheck && toggleKey && !e.shiftKey) {
				e.stopPropagation();
				e.preventDefault();
				const current = selectedMap();
				anchor = file.path;
				if (current[file.path]) setSelected(Object.values(current).filter((f) => f.path !== file.path));
				else setSelected(Object.values(current).concat([file]));
				return;
			}
			if (onCheck || e.ctrlKey || e.metaKey || file.type === 1) anchor = file.path;
			return;
		}
		if (t.closest(ignored)) return;
		if (!e.shiftKey && !e.ctrlKey && !e.metaKey && Object.keys(selectedMap()).length) setSelected([]);
	}, true);
	document.addEventListener("dblclick", (e) => {
		if (!e.isTrusted) return;
		const t = e.target instanceof Element ? e.target : null;
		const li = t && t.closest(".MuiGrid-container [data-rect-id]");
		if (!li || onCheckOf(li, t) || t.closest("input, textarea")) return;
		e.stopPropagation();
		e.preventDefault();
	}, true);
	document.addEventListener("contextmenu", (e) => {
		const t = e.target instanceof Element ? e.target : null;
		if (!t) return;
		const root = t.closest(".MuiPopover-root, .MuiMenu-root");
		if (!root || t.closest(".MuiPaper-root")) return;
		e.preventDefault();
		e.stopPropagation();
		const x = e.clientX;
		const y = e.clientY;
		const prev = root.style.pointerEvents;
		root.style.pointerEvents = "none";
		const under = document.elementFromPoint(x, y);
		root.style.pointerEvents = prev;
		const backdrop = root.querySelector(".MuiBackdrop-root") || root;
		backdrop.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, clientX: x, clientY: y }));
		backdrop.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: x, clientY: y }));
		if (!under || under.closest(".MuiPopover-root, .MuiMenu-root")) return;
		requestAnimationFrame(() => {
			under.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: x, clientY: y, screenX: e.screenX, screenY: e.screenY, button: 2, buttons: 2 }));
		});
	}, true);
})();
