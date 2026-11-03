(() => {
	const is = (key, fallback) => (t) => crT.is(t, key, fallback);
	const re = (r) => (t) => r.test(t);
	const RULES = [
		[is("fileManager.newFolder", "New folder"), 0, false],
		[is("fileManager.uploadFiles", "Upload files"), 1, true],
		[is("fileManager.uploadFolder", "Upload folder"), 2, false],
		[re(/markdown/i), 3, true],
		[re(/draw\.?io/i), 4, false],
		[is("fileManager.refresh", "Refresh"), 9, true]
	];
	const HIDE = [is("fileManager.newFile", "New file"), is("uploader.uploadFromClipboard", "Upload from clipboard"), is("fileManager.newRemoteDownloads", "New remote download")];
	const sort = () => {
		document.querySelectorAll(".MuiPopover-paper [role='menu']").forEach((ul) => {
			const items = [...ul.children];
			const texts = items.map((li) => (li.textContent || "").trim());
			if (!texts.some(RULES[0][0])) {
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
				li.classList.toggle("cr-ctx-hide", HIDE.some((h) => h(t)));
				const r = RULES.find((x) => x[0](t));
				const ord = r ? r[1] : 5;
				if (li.style.order !== String(ord)) li.style.order = String(ord);
				li.classList.toggle("cr-ctx-sep", !!r && r[2]);
			});
		});
	};
	cr.onDom(sort);
})();
