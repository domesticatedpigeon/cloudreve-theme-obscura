(() => {
	const run = () => {
		const nav = document.querySelector(".cr-nav");
		if (nav && !nav.classList.contains("cr-tbp")) nav.classList.add("cr-tbp");
		document.querySelectorAll("header.MuiAppBar-root .MuiIconButton-root:has(> .MuiAvatar-root):not(.cr-tbp-av), header.MuiAppBar-root .MuiIconButton-root:has(> .MuiAvatar-root):not(.cr-lp)").forEach((av) => av.classList.add("cr-tbp-av", "cr-lp"));
		document.querySelectorAll("html.cr-dock header.MuiAppBar-root .MuiIconButton-root:has(> .MuiBadge-root):not(.cr-lp)").forEach((el) => el.classList.add("cr-lp"));
		document.querySelectorAll("html.cr-shares main .MuiContainer-maxWidthLg > .MuiBox-root:first-child :is(.MuiTypography-h4 + .MuiIconButton-root, .MuiFormControl-root > .MuiOutlinedInput-root):not(.cr-lp), .MuiDialog-root .MuiDialogTitle-root .MuiButtonGroup-root > .MuiButton-root:not(.cr-lp), .MuiDialog-root .MuiDialogActions-root .MuiButton-root:not(.cr-lp), main .MuiContainer-maxWidthLg > .MuiBox-root > .MuiBox-root:has(> .MuiTypography-h4) > .MuiButton-root:not(.cr-lp), main .MuiContainer-maxWidthLg > .MuiBox-root > .MuiBox-root:has(> .MuiTypography-h4) > .MuiFormControl-root > .MuiOutlinedInput-root:not(.cr-lp), html.cr-settings main .MuiContainer-root > .MuiBox-root:last-child .MuiOutlinedInput-root.MuiSelect-root:not(.cr-lp), html.cr-settings main .MuiListItemSecondaryAction-root > .MuiIconButton-root:not(.cr-lp), main .MuiContainer-root:not(.MuiContainer-maxWidthXs) .MuiButton-root:not(.cr-lp):not(.MuiGrid-item > .MuiButtonBase-root):not(.MuiButtonGroup-grouped), .MuiContainer-maxWidthXs > .MuiGrid-container > .MuiBox-root > .MuiPaper-root > .MuiBox-root:first-child > .MuiIconButton-root:not(.cr-lp)").forEach((el) => el.classList.add("cr-lp"));
		document.querySelectorAll(".MuiOutlinedInput-root:not(.cr-tf):not(.cr-lp), .MuiFilledInput-root:not(.cr-tf), .MuiInput-root:not(.cr-tf)").forEach((el) => {
			if (el.closest(".cr-path")) return;
			const box = el.closest(".MuiDialog-paper > .MuiBox-root:first-child");
			if (box && box.querySelector(":scope > .MuiTextField-root + .MuiIconButton-root")) return;
			el.classList.add("cr-tf");
		});
		document.querySelectorAll(".cr-path").forEach((el) => el.classList.toggle("cr-tf", el.matches("html.cr-dock .cr-nav.cr-tbp > .cr-path")));
		const anon = document.querySelector('header.MuiAppBar-root .MuiIconButton-root:has(> svg > path[d^="M17.754 14a2.249"])');
		if (anon && !anon.dataset.crAnon) {
			anon.dataset.crAnon = "1";
			anon.addEventListener("click", (e) => {
				const svg = anon.querySelector(":scope > svg");
				if (svg && e.target === anon) svg.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
			});
		}
	};
	setInterval(run, 400);
	let rq = false;
	let rLoc = location.pathname + location.search;
	let rLocAt = 0;
	new MutationObserver(() => {
		const loc = location.pathname + location.search;
		if (loc !== rLoc) {
			rLoc = loc;
			rLocAt = Date.now();
		}
		if (Date.now() - rLocAt < 800) {
			run();
			return;
		}
		if (rq || document.documentElement.classList.contains("cr-dragfiles")) return;
		rq = true;
		requestAnimationFrame(() => {
			rq = false;
			run();
		});
	}).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
	const t0 = performance.now();
	const boot = () => {
		run();
		if (performance.now() - t0 < 4000) requestAnimationFrame(boot);
	};
	boot();
})();
