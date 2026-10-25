(() => {
	const seen = new WeakSet();
	const isTag = (el) => {
		const k = Object.keys(el).find((x) => x.startsWith("__reactFiber$"));
		let f = k ? el[k] : null;
		for (let i = 0; f && i < 20; i++, f = f.return) if (f.memoizedProps && "tagColor" in f.memoizedProps) return true;
		return false;
	};
	const run = () => {
		for (const c of document.getElementsByClassName("MuiChip-root")) {
			if (seen.has(c)) continue;
			seen.add(c);
			if (isTag(c)) c.setAttribute("data-cr-tag", "");
		}
	};
	new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
	run();
})();
