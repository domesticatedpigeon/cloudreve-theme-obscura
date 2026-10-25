(() => {
	const iconFiber = (el) => cr.upFiber(el, (p) => p.file && p.file.path && ("selected" in p || ("isSelected" in p && "noThumb" in p)));
	const hostOf = (f) => {
		let h = f.child;
		while (h && typeof h.type !== "string") h = h.child;
		return h ? h.stateNode : null;
	};
	const setHovered = (path, hovered) => {
		const s = cr.store();
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
