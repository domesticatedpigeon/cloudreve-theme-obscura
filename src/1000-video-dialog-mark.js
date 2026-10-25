(() => {
	const mark = () => {
		if (!window.crIsVideo) return;
		document.querySelectorAll(".MuiDialog-root:not(.cr-vdark)").forEach((d) => {
			const title = d.querySelector(".MuiDialog-paper > .MuiBox-root:first-child > .MuiDialogTitle-root + .MuiDivider-root") && d.querySelector(".MuiDialogTitle-root");
			if (title && [...title.querySelectorAll(".MuiTypography-root")].some((t) => window.crIsVideo(t.textContent.trim()))) d.classList.add("cr-vdark");
		});
	};
	new MutationObserver(mark).observe(document.body, { childList: true, subtree: true });
	mark();
})();
