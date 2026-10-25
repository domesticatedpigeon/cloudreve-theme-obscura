(() => {
	const boxOf = (wrap) => {
		const f = cr.upFiber(wrap, (p) => "isActive" in p && p.onReachUp);
		if (!f) return null;
		let h = f.memoizedState;
		while (h) {
			const v = h.memoizedState;
			if (v && typeof v === "object" && "touched" in v && "maskTouched" in v && h.queue && h.queue.dispatch) return { active: f.memoizedProps.isActive, state: v, dispatch: h.queue.dispatch };
			h = h.next;
		}
		return null;
	};
	let timer = null;
	const settle = () => {
		const portal = document.querySelector(".PhotoView-Portal");
		if (!portal) return;
		const boxes = [...portal.querySelectorAll(".PhotoView__PhotoWrap")].map((w) => ({ wrap: w, box: boxOf(w) })).filter((x) => x.box);
		let stuck = false;
		boxes.forEach(({ box }) => {
			if (!box.active && (box.state.touched || box.state.maskTouched)) {
				box.dispatch({ touched: false, maskTouched: false, reach: undefined, pause: false, stopRaf: false });
				stuck = true;
			}
		});
		if (boxes.some(({ box }) => box.active && (box.state.touched || box.state.maskTouched))) return;
		const active = boxes.find(({ box }) => box.active);
		const offset = active ? Math.abs(active.wrap.getBoundingClientRect().left - portal.getBoundingClientRect().left) : 0;
		if (stuck || offset > 2) window.dispatchEvent(new Event("resize"));
	};
	const onUp = () => {
		if (!document.querySelector(".PhotoView-Portal")) return;
		clearTimeout(timer);
		timer = setTimeout(settle, 450);
	};
	["touchend", "mouseup"].forEach((type) => window.addEventListener(type, onUp, true));
	window.addEventListener("touchcancel", (e) => {
		if (document.querySelector(".PhotoView-Portal") && e.changedTouches && e.changedTouches.length) {
			const end = new Event("touchend", { bubbles: true, cancelable: true });
			Object.defineProperty(end, "changedTouches", { value: e.changedTouches });
			Object.defineProperty(end, "touches", { value: e.touches });
			window.dispatchEvent(end);
		}
		onUp();
	}, true);
})();
