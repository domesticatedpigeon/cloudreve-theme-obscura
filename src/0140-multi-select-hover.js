(() => {
	const fiberOf = (el) => {
		const k = Object.keys(el).find((x) => x.startsWith("__reactFiber$"));
		return k ? el[k] : null;
	};
	let store = null;
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
	const iconFiber = (el) => {
		let f = fiberOf(el);
		while (f) {
			const p = f.memoizedProps;
			if (p && p.file && p.file.path && ("selected" in p || ("isSelected" in p && "noThumb" in p))) return f;
			f = f.return;
		}
		return null;
	};
	const hostOf = (f) => {
		let h = f.child;
		while (h && typeof h.type !== "string") h = h.child;
		return h ? h.stateNode : null;
	};
	const setHovered = (path, hovered) => {
		const s = getStore();
		if (!s) return;
		if (!hovered) {
			const fm = s.getState().fileManager;
			if (fm && fm[0] && Object.keys(fm[0].selected || {}).length > 0) return;
		}
		s.dispatch({ type: "fileManagerSlice/setMultiSelectHovered", payload: { index: 0, value: [path, hovered] } });
	};
	let cur = null;
	document.addEventListener("mouseover", (e) => {
		const t = e.target instanceof Element ? e.target : null;
		if (cur && t && cur.host.contains(t)) return;
		if (cur) {
			setHovered(cur.path, false);
			cur = null;
		}
		if (!t || matchMedia("(pointer: coarse)").matches) return;
		const f = iconFiber(t);
		if (!f) return;
		const host = hostOf(f);
		if (!host || !host.contains(t)) return;
		const r = host.getBoundingClientRect();
		if (r.width > 64 || r.height > 64) return;
		cur = { host, path: f.memoizedProps.file.path };
		setHovered(cur.path, true);
	});
})();
