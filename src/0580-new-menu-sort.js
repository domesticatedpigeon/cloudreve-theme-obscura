(() => {
	const RULES = [
		[/^new folder$/i, 0, false],
		[/^upload files?$/i, 1, true],
		[/^upload folder$/i, 2, false],
		[/markdown/i, 3, true],
		[/draw\.?io/i, 4, false],
		[/^refresh$/i, 9, true]
	];
	const HIDE = [/^new file$/i, /clipboard/i, /remote download/i];
	let q = false;
	const sort = () => {
		q = false;
		document.querySelectorAll(".MuiPopover-paper [role='menu']").forEach((ul) => {
			const items = [...ul.children];
			const texts = items.map((li) => (li.textContent || "").trim());
			if (!texts.some((t) => /^new folder$/i.test(t))) {
				if (ul.classList.contains("cr-ctxsort")) {
					ul.classList.remove("cr-ctxsort");
					items.forEach((li) => {
						li.classList.remove("cr-ctx-hide", "cr-ctx-sep");
						li.style.order = "";
					});
				}
				return;
			}
			ul.classList.add("cr-ctxsort");
			items.forEach((li, i) => {
				const t = texts[i];
				li.classList.toggle("cr-ctx-hide", HIDE.some((r) => r.test(t)));
				const r = RULES.find((x) => x[0].test(t));
				const ord = r ? r[1] : 5;
				if (li.style.order !== String(ord)) li.style.order = String(ord);
				li.classList.toggle("cr-ctx-sep", !!r && r[2]);
			});
		});
	};
	new MutationObserver(() => {
		if (q) return;
		q = true;
		requestAnimationFrame(sort);
	}).observe(document.body, { childList: true, subtree: true });
})();
