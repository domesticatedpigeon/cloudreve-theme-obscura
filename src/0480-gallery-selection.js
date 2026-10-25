(() => {
	const html = document.documentElement;
	const OP0 = ':is([style*="opacity: 0;"], [style$="opacity: 0"])';
	const CHECK = '.MuiImageListItemBar-actionIcon .MuiBox-root[style*="opacity: 1"] > [data-testid="CheckCircleIcon"]';
	const flag = (c, on) => {
		if (html.classList.contains(c) !== on) html.classList.toggle(c, on);
	};
	let q = false;
	const sync = () => {
		q = false;
		document.querySelectorAll(".MuiImageListItem-root").forEach((it) => {
			const on = !!it.querySelector(CHECK);
			if (it.classList.contains("cr-gsel") !== on) it.classList.toggle("cr-gsel", on);
		});
		const portal = document.querySelector(".MuiBackdrop-root > .PhotoView-Portal");
		flag("cr-vside", !!portal && portal.matches('[style*="300px"]'));
		const tree = document.querySelector('.MuiPopover-paper [role="tree"]');
		const paper = tree && tree.closest(".MuiPopover-paper");
		const dlg = !html.classList.contains("cr-vopen") && [...document.querySelectorAll(".MuiDialog-root:not(.MuiModal-hidden) > .MuiDialog-container > .MuiDialog-paper")].some((d) => !d.matches(OP0) && !d.parentElement.matches(OP0));
		flag("cr-sbo", (!!paper && !paper.matches(OP0)) || dlg);
	};
	new MutationObserver(() => {
		if (q) return;
		q = true;
		requestAnimationFrame(sync);
	}).observe(html, { subtree: true, childList: true, attributes: true, attributeFilter: ["style"] });
	sync();
})();
