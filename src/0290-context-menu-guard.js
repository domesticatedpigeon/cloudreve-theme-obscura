(() => {
	window.addEventListener("contextmenu", (e) => {
		const t = e.target instanceof Element ? e.target : null;
		if (t && t.closest("input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea, [contenteditable=''], [contenteditable='true']")) return;
		e.preventDefault();
	}, true);
})();
