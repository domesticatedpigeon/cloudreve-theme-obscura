(() => {
	const ITEM = ".MuiTreeItem-content, .MuiButtonBase-root:not(.MuiIconButton-root)";
	let stack = null;
	let hot = null;
	const clear = () => {
		if (hot) hot.classList.remove("cr-side-hot");
		if (stack) stack.classList.remove("cr-side-focus");
		hot = null;
		stack = null;
	};
	document.addEventListener("pointermove", (e) => {
		if (e.pointerType && e.pointerType !== "mouse") {
			if (stack) clear();
			return;
		}
		const el = e.target instanceof Element ? e.target : null;
		const st = el ? el.closest(".MuiDrawer-paper > .MuiStack-root") : null;
		if (!st) {
			if (stack) clear();
			return;
		}
		if (el.closest(".cr-storage-link")) {
			if (stack) clear();
			return;
		}
		const item = el.closest(ITEM);
		if (item && st.contains(item) && item !== hot) {
			if (hot) hot.classList.remove("cr-side-hot");
			hot = item;
			hot.classList.add("cr-side-hot");
		}
		if (hot && !hot.isConnected) hot = null;
		if (hot && stack !== st) {
			stack = st;
			st.classList.add("cr-side-focus");
		} else if (hot && !st.classList.contains("cr-side-focus")) st.classList.add("cr-side-focus");
		if (hot && !hot.classList.contains("cr-side-hot")) hot.classList.add("cr-side-hot");
	}, { passive: true });
	document.addEventListener("mouseout", (e) => {
		if (!e.relatedTarget) clear();
	});
	window.addEventListener("blur", clear);
})();
