(() => {
	const MAP = { "Keep physical files": "Keep actual files on disk" };
	const run = () => {
		document.querySelectorAll(".MuiDialog-root .MuiFormControlLabel-label").forEach((el) => {
			const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
			for (let n = w.nextNode(); n; n = w.nextNode()) {
				const v = MAP[n.nodeValue.trim()];
				if (v) n.nodeValue = v;
			}
		});
	};
	let q = false;
	new MutationObserver(() => {
		if (q) return;
		q = true;
		requestAnimationFrame(() => {
			q = false;
			run();
		});
	}).observe(document.body, { childList: true, subtree: true, characterData: true });
})();
