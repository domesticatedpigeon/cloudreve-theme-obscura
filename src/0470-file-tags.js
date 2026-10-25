(() => {
	const seen = new WeakSet();
	const isTag = (el) => !!cr.up(el, (p) => "tagColor" in p, 20);
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
