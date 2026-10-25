(() => {
	const rerender = (f) => {
		for (let h = f.memoizedState; h; h = h.next) {
			const v = h.memoizedState;
			if (v && typeof v === "object" && typeof v.overlay === "boolean" && ("onScale" in v || "touched" in v) && h.queue && h.queue.dispatch) return h.queue.dispatch((x) => ({ overlay: x.overlay }));
		}
	};
	const backdropOf = (f) => {
		for (let i = 0; f && i < 20; i++, f = f.return) {
			for (let h = f.memoizedState; h && typeof h === "object" && "next" in h; h = h.next) {
				const v = h.memoizedState;
				if (v && v.current instanceof Element && v.current.classList.contains("MuiBackdrop-root")) return v.current;
			}
		}
		return null;
	};
	const apply = () => {
		const portal = document.querySelector(".PhotoView-Portal:not(.PhotoView-Slider__willClose)");
		const f = portal && cr.slider(portal);
		if (!f) return;
		const d = f.type.defaultProps;
		if (!d || d.loop !== false || d.maskClosable !== false) f.type.defaultProps = { ...d, loop: false, maskClosable: false };
		const bd = f.memoizedProps.portalContainer ? null : backdropOf(f.return);
		let changed = false;
		new Set([f.memoizedProps, f.pendingProps, f.alternate && f.alternate.memoizedProps, f.alternate && f.alternate.pendingProps]).forEach((p) => {
			if (!p || (p.maskClosable === false && p.loop === false && (!bd || p.portalContainer))) return;
			try {
				p.maskClosable = false;
				p.loop = false;
				if (bd && !p.portalContainer) p.portalContainer = bd;
				changed = true;
			} catch (e) {}
		});
		if (changed) rerender(f);
	};
	let q = false;
	new MutationObserver(() => {
		if (q) return;
		q = true;
		requestAnimationFrame(() => {
			q = false;
			apply();
		});
	}).observe(document.body, { childList: true, subtree: true });
	window.addEventListener("pointerdown", (e) => {
		if (e.target instanceof Element && e.target.closest(".PhotoView-Portal")) apply();
	}, true);
})();
