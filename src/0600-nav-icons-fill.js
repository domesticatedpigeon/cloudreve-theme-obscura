(() => {
	const FILL = [
		["M10.55 2.532", "M10.55 2.533a2.25 2.25 0 0 1 2.9 0l6.75 5.695c.508.427.8 1.056.8 1.72v9.802a1.75 1.75 0 0 1-1.75 1.75h-3a1.75 1.75 0 0 1-1.75-1.75v-5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0-.75.75v5a1.75 1.75 0 0 1-1.75 1.75h-3A1.75 1.75 0 0 1 3 19.75V9.947c0-.663.292-1.292.8-1.72l6.75-5.694Z"],
		["M14.754 10c", "M14.754 10c.966 0 1.75.784 1.75 1.75v4.749a4.501 4.501 0 0 1-9.002 0V11.75c0-.966.783-1.75 1.75-1.75h5.502Zm-7.623 0c-.35.422-.575.95-.62 1.53l-.01.22v4.749c0 .847.192 1.649.534 2.365A4.001 4.001 0 0 1 2 14.999V11.75a1.75 1.75 0 0 1 1.606-1.744L3.75 10h3.381Zm9.744 0h3.375c.966 0 1.75.784 1.75 1.75V15a4 4 0 0 1-5.03 3.866c.3-.628.484-1.32.525-2.052l.009-.315V11.75c0-.665-.236-1.275-.63-1.75ZM12 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm6.5 1a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm-13 0a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"]
	];
	const FOLDER = ["M8.207 4c", "M13.821 6.5h5.929a2.25 2.25 0 0 1 2.229 1.938l.016.158.005.154v9a2.25 2.25 0 0 1-2.096 2.245L19.75 20H4.25a2.25 2.25 0 0 1-2.245-2.096L2 17.75v-7.251l6.207.001.196-.009a2.25 2.25 0 0 0 1.088-.393l.156-.12L13.821 6.5ZM8.207 4c.46 0 .908.141 1.284.402l.156.12 2.103 1.751-3.063 2.553-.085.061a.75.75 0 0 1-.29.106L8.206 9 2 8.999V6.25a2.25 2.25 0 0 1 2.096-2.245L4.25 4h3.957Z"];
	const run = () => {
		document.querySelectorAll('[role="tree"] li[role="treeitem"] > .MuiTreeItem-content > .MuiBox-root svg:not(.MuiBadge-badge *) > path').forEach((p) => {
			const d0 = p.getAttribute("d") || "";
			if (d0.startsWith(FOLDER[0])) {
				p.setAttribute("d", FOLDER[1]);
				return;
			}
			if (!p.closest("span")) return;
			const li = p.closest('li[role="treeitem"]');
			const open = li.getAttribute("aria-expanded") === "true" && !!li.querySelector(':scope > [role="group"] li[role="treeitem"]');
			if (open) {
				if (p.dataset.crOrig) return;
				const d = p.getAttribute("d") || "";
				const m = FILL.find(([pre, full]) => d !== full && d.startsWith(pre));
				if (!m) return;
				p.dataset.crOrig = d;
				p.setAttribute("d", m[1]);
			} else if (p.dataset.crOrig) {
				p.setAttribute("d", p.dataset.crOrig);
				delete p.dataset.crOrig;
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
	}).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-expanded"] });
	run();
})();
