(() => {
	let prev = {};
	let unsub = null;
	const watch = () => {
		const st = cr.store();
		if (!st || unsub) return;
		unsub = st.subscribe(() => {
			const s = st.getState();
			const fm = s.fileManager && s.fileManager[0];
			const sel = (fm && fm.selected) || {};
			if (sel === prev) return;
			const old = prev;
			prev = sel;
			const g = s.globalState || {};
			if (!g.sidebarOpen || document.querySelector(".PhotoView-Portal")) return;
			const keys = Object.keys(sel);
			if (!keys.length) return;
			let file = null;
			const added = keys.filter((k) => !(k in old));
			if (keys.length === 1) file = sel[keys[0]];
			else if (added.length) file = sel[added[added.length - 1]];
			if (!file) return;
			const cur = g.sidebarTarget;
			if (cur && typeof cur === "object" && cur.path === file.path) return;
			st.dispatch({ type: "globalState/setSidebar", payload: { open: true, target: file } });
		});
	};
	let vOpen = false;
	let instT = 0;
	let saved = null;
	let unsubV = null;
	const watchViewer = () => {
		const st = cr.store();
		if (!st || unsubV) return;
		unsubV = st.subscribe(() => {
			const g = st.getState().globalState || {};
			const open = !!(g.imageViewer && g.imageViewer.open);
			if (open === vOpen) return;
			vOpen = open;
			if (open) {
				saved = null;
				if (g.sidebarOpen) {
					saved = { target: g.sidebarTarget };
					const h = document.documentElement;
					h.classList.add("cr-instant");
					clearTimeout(instT);
					instT = setTimeout(() => h.classList.remove("cr-instant"), 900);
					st.dispatch({ type: "globalState/closeSidebar" });
				}
				return;
			}
			const s0 = saved;
			saved = null;
			if (!s0) return;
			let n = 0;
			const restore = () => {
				if (document.querySelector(".PhotoView-Portal") && ++n < 40) return setTimeout(restore, 50);
				const g2 = st.getState().globalState || {};
				if (!g2.sidebarOpen && !(g2.imageViewer && g2.imageViewer.open)) st.dispatch({ type: "globalState/setSidebar", payload: { open: true, target: s0.target } });
			};
			setTimeout(restore, 50);
		});
	};
	const t = setInterval(() => {
		watch();
		watchViewer();
		if (unsub && unsubV) clearInterval(t);
	}, 500);
})();
