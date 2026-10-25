(() => {
	const H = [
		[".MuiStack-root", ":has(> .MuiBox-root:first-child .MuiTreeView-root)", "cr-h1", 1, ".MuiTreeView-root"],
		[".MuiBadge-root", ":has(> .MuiPaper-elevation3)", "cr-h2", 2, ".MuiPaper-elevation3"],
		[".PhotoView-Slider__clean", ":has(> .PhotoView-Slider__fadeIn)", "cr-h3", 2, ".PhotoView-Slider__fadeIn"],
		[".MuiBackdrop-root", ":has(> .cr-vghost)", "cr-h4", 2, ".cr-vghost"],
		["html", ":has(.PhotoView-Slider__willClose)", "cr-h5", 4, ""],
		[".MuiPopover-paper", ":has([role=\"tree\"])", "cr-h6", 1, "[role=\"tree\"]"],
		["html.cr-dock .cr-nav.cr-tbp", ":has(+ .MuiBox-root .cr-explorer .MuiGrid-container [data-rect-id])", "cr-h7", 3, ""],
		[":is(.MuiDrawer-paper, .MuiPopover-paper) > .MuiStack-root", ":has(> .MuiBox-root > [role=\"tree\"])", "cr-h8", 1, "[role=\"tree\"]"],
		["*", ":is(.MuiPopover-paper:has([role=\"tree\"]) > .MuiBox-root, .MuiPopover-paper)", "cr-h9", 0, ""],
		[".cr-h9 > .MuiStack-root", ":has(> .MuiBox-root > [role=\"tree\"])", "cr-h10", 1, "[role=\"tree\"]"],
		[".MuiDrawer-paper > .MuiStack-root > .MuiBox-root", ":has(> .MuiButtonBase-root svg.iconify)", "cr-h11", 1, "svg.iconify"],
		[".MuiPopover-paper.cr-h6 > .MuiBox-root > .MuiStack-root > .MuiBox-root", ":has(> .MuiButtonBase-root svg.iconify)", "cr-h12", 1, "svg.iconify"],
		["*", ":is(.MuiDrawer-paper, .MuiPopover-paper:has([role=\"tree\"]))", "cr-h13", 0, ""],
		["[data-rect-id]", ":has(path[d^=\"M9 3h6a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V9a6 6 0 0 1 6-6Zm7.28\"])", "cr-h14", 1, "path[d^=\"M9 3h6a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V9a6 6 0 0 1 6-6Zm7.28\"]"],
		[".MuiDrawer-paper > .MuiStack-root > div", ":has(> .MuiLinearProgress-root)", "cr-h15", 2, ".MuiLinearProgress-root"],
		[".MuiPopover-paper.cr-h6 > .MuiBox-root > .MuiStack-root > div", ":has(> .MuiLinearProgress-root)", "cr-h16", 2, ".MuiLinearProgress-root"],
		[".MuiGrid-container [data-rect-id]", ":has(path[d^=\"M9 3h6a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V9a6 6 0 0 1 6-6Zm7.28\"])", "cr-h17", 1, "path[d^=\"M9 3h6a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V9a6 6 0 0 1 6-6Zm7.28\"]"],
		["div", ":has(> .MuiTypography-h4)", "cr-h18", 2, ".MuiTypography-h4"],
		["html", ":has(.PhotoView-Portal)", "cr-h19", 4, ""],
		[".MuiDrawer-root .MuiPaper-root.MuiPopover-paper", ":has([role=\"tree\"])", "cr-h20", 1, "[role=\"tree\"]"],
		[".MuiDrawer-root.MuiDrawer-docked .MuiPopover-paper", ":has([role=\"tree\"])", "cr-h21", 1, "[role=\"tree\"]"],
		["header.MuiAppBar-root .MuiIconButton-root", ":has(.MuiAvatar-root)", "cr-h22", 1, ".MuiAvatar-root"],
		[".MuiPopover-paper > .MuiBox-root:first-child", ":has(.MuiTypography-caption)", "cr-h23", 1, ".MuiTypography-caption"],
		[".MuiTreeItem-content", ":has(.MuiBadge-badge:not(.cr-pin-badge))", "cr-h24", 1, ".MuiBadge-badge:not(.cr-pin-badge)"],
		[".MuiTreeItem-content", ":has(> .MuiBox-root .MuiTypography-root:not(.MuiBadge-badge *))", "cr-h25", 1, ".MuiTypography-root:not(.MuiBadge-badge *)"],
		["html", ":has(header.MuiAppBar-root .MuiIconButton-root > svg > path[d^=\"M17.754 14a2.249\"])", "cr-h26", 4, ""],
		["html.cr-dock header.MuiAppBar-root:not(.MuiDialog-root *) .MuiIconButton-root", ":has(> .MuiBadge-root > svg > path[d^=\"M5.25 20.5h13.498\"])", "cr-h27", 1, "path[d^=\"M5.25 20.5h13.498\"]"],
		[".MuiDialog-paper", ":has(> .MuiAccordion-root)", "cr-h28", 2, ".MuiAccordion-root"],
		["main div", ":has(> .MuiContainer-root)", "cr-h29", 2, ".MuiContainer-root"],
		["html:not(.cr-vlight)", ":has(.PhotoView-Portal)", "cr-h30", 4, ""],
		[".MuiPopover-root", ":has([role=\"tree\"])", "cr-h31", 1, "[role=\"tree\"]"],
		["html:not(.cr-sbo) .MuiPopover-root", ":has([role=\"tree\"])", "cr-h32", 1, "[role=\"tree\"]"],
		["main .MuiCollapse-horizontal .MuiCollapse-wrapperInner > .MuiBox-root", ":has(.MuiTabs-root)", "cr-h33", 1, ".MuiTabs-root"],
		[".MuiContainer-maxWidthXs > .MuiGrid-container > .MuiBox-root", ":has(> .MuiPaper-root)", "cr-h34", 2, ".MuiPaper-root"],
		["main .MuiContainer-root", ":has(.MuiTabs-root)", "cr-h35", 1, ".MuiTabs-root"],
		["main .MuiContainer-root:not(.cr-h35) > .MuiBox-root", ":has(.MuiAvatar-root)", "cr-h36", 1, ".MuiAvatar-root"],
		["main .MuiContainer-root:not(.cr-h35) > .MuiBox-root", ":has(.MuiTypography-h4)", "cr-h37", 1, ".MuiTypography-h4"],
		["html:not(.cr-shares) main .MuiBox-root", ":has(> .MuiFormControl-root)", "cr-h38", 2, ".MuiFormControl-root"],
		["*", ":is(.MuiDrawer-paper, .MuiPopover-paper:has([role=\"tree\"]) > .MuiBox-root)", "cr-h39", 0, ""],
		[".cr-h39 > .MuiStack-root > .MuiBox-root:last-child", ":has(> div:not([class]))", "cr-h40", 2, "div:not([class])"],
		[".MuiDialog-paper", ":has([role=\"tree\"])", "cr-h41", 1, "[role=\"tree\"]"],
		["html body .MuiDialog-paper", ":has([role=\"tree\"])", "cr-h42", 1, "[role=\"tree\"]"],
		[".MuiDialog-root .MuiPaper-root.MuiDialog-paper", ":has([role=\"tree\"])", "cr-h43", 1, "[role=\"tree\"]"],
		[".MuiBox-root:not(.MuiDialog-root *)", ":has(> .MuiGrid-container > .MuiGrid-item > [data-rect-id])", "cr-h44", 1, "[data-rect-id]"],
		["html", ":has(.MuiDialog-root .MuiDialog-paperWidthSm .MuiFilledInput-root)", "cr-h45", 4, ""],
		["html", ":has(.PhotoView-Portal.PhotoView-Slider__clean)", "cr-h46", 4, ""],
		[":is(.MuiDrawer-paper, .MuiPopover-paper) div", ":has(> .MuiLinearProgress-root)", "cr-h47", 2, ".MuiLinearProgress-root"],
		["html body main .MuiBox-root:last-child", ":has(> .MuiGrid-container > .MuiGrid-item > [data-rect-id])", "cr-h48", 1, "[data-rect-id]"],
		["html.cr-my", ":has(.MuiDialog-root .MuiDialog-paper > .MuiAccordion-root)", "cr-h49", 4, ""],
		["html body[data-cr-h~=\"h19\"] .MuiDialog-root", ":has(.MuiDialog-paperWidthSm .MuiFilledInput-root)", "cr-h50", 1, ".MuiFilledInput-root"],
		["html body main .MuiContainer-root", ":has(.MuiTabs-root)", "cr-h51", 1, ".MuiTabs-root"],
		["html body main .MuiContainer-root.cr-h51 .MuiList-root .MuiListItem-root", ":has(> .MuiListItemAvatar-root)", "cr-h52", 2, ".MuiListItemAvatar-root"],
		["html:not(.cr-vlight) body[data-cr-h~=\"h30\"] .MuiDialog-root", ":has(.MuiDialog-paperWidthSm .MuiFilledInput-root)", "cr-h53", 1, ".MuiFilledInput-root"],
		["html:not(.cr-vlight) body[data-cr-h~=\"h30\"] .MuiDialog-root", ":has([role=\"tree\"])", "cr-h54", 1, "[role=\"tree\"]"],
		["html:not(.cr-vlight) body[data-cr-h~=\"h30\"] .MuiDialog-root", ":has(.MuiDialog-paperWidthSm .MuiFilledInput-root)", "cr-h55", 1, ".MuiFilledInput-root"],
		["html:not(.cr-vlight) body[data-cr-h~=\"h30\"] .MuiDialog-root", ":has([role=\"tree\"])", "cr-h56", 1, "[role=\"tree\"]"],
		["html.cr-vlight", ":has(.PhotoView-Portal)", "cr-h57", 4, ""],
		["html.cr-vlight body[data-cr-h~=\"h57\"] .MuiDialog-root", ":has(.MuiDialog-paperWidthSm .MuiFilledInput-root)", "cr-h58", 1, ".MuiFilledInput-root"],
		["html.cr-vlight body[data-cr-h~=\"h57\"] .MuiDialog-root", ":has([role=\"tree\"])", "cr-h59", 1, "[role=\"tree\"]"],
		["html.cr-vlight body[data-cr-h~=\"h57\"] .MuiDialog-root", ":has(.MuiDialog-paperWidthSm .MuiFilledInput-root)", "cr-h60", 1, ".MuiFilledInput-root"],
		["html.cr-vlight body[data-cr-h~=\"h57\"] .MuiDialog-root", ":has([role=\"tree\"])", "cr-h61", 1, "[role=\"tree\"]"],
		["html body .MuiDialog-root .MuiDialog-paper.MuiDialog-paperWidthSm", ":has(.MuiFilledInput-root)", "cr-h62", 1, ".MuiFilledInput-root"],
		["html body .MuiDialog-root .MuiDialog-paper.MuiDialog-paperWidthSm", ":has([role=\"tree\"])", "cr-h63", 1, "[role=\"tree\"]"],
		["html body .MuiDialog-root .MuiDialog-paper", ":has(> .MuiBox-root:first-child > .MuiTextField-root + .MuiIconButton-root)", "cr-h64", 1, ".MuiIconButton-root"],
		["html body main .MuiContainer-root:not(.cr-h51) > .MuiBox-root", ":has(.MuiAvatar-root)", "cr-h65", 1, ".MuiAvatar-root"],
		["html body main .MuiContainer-root:not(.cr-h51) > .MuiBox-root", ":has(.MuiTypography-h4)", "cr-h66", 1, ".MuiTypography-h4"],
		["html body *", ":is(.MuiDrawer-paper, .MuiPopover-paper:has([role=\"tree\"]))", "cr-h67", 0, ""],
		["html body *", ":is(.MuiDrawer-paper > .MuiStack-root, .MuiPopover-paper:has([role=\"tree\"]) > .MuiBox-root > .MuiStack-root)", "cr-h68", 0, ""],
		["html body .cr-h68 > div", ":has(> .MuiLinearProgress-root)", "cr-h69", 2, ".MuiLinearProgress-root"],
		["html body header.MuiAppBar-root .MuiIconButton-root.MuiIconButton-root.MuiIconButton-root", ":has(> svg > path[d^=\"M17.754 14a2.249\"])", "cr-h70", 1, "path[d^=\"M17.754 14a2.249\"]"],
		["html:not(.cr-dock) body header.MuiAppBar-root:not(.MuiDialog-root *) > .MuiToolbar-root .MuiIconButton-root", ":has(> .MuiAvatar-root)", "cr-h71", 2, ".MuiAvatar-root"],
		["html:not(.cr-dock) body main .MuiStack-root", ":has(> .cr-tbp-m)", "cr-h72", 2, ".cr-tbp-m"],
		[".MuiDialog-root .MuiDialog-paper", ":has(> .MuiBox-root:first-child > .MuiDialogTitle-root + .MuiDivider-root)", "cr-h73", 1, ".MuiDivider-root"],
		[".MuiDialog-paper", ":has(> .MuiBox-root:first-child > .MuiTextField-root + .MuiIconButton-root)", "cr-h74", 1, ".MuiIconButton-root"],
		[".MuiFormControl-root", ":has(> .cr-tf.MuiOutlinedInput-root)", "cr-h75", 2, ".cr-tf.MuiOutlinedInput-root"],
		[".MuiFormControl-root", ":has(> .cr-tf.MuiOutlinedInput-root.Mui-focused)", "cr-h76", 2, ".cr-tf.MuiOutlinedInput-root.Mui-focused"],
		[".MuiDialog-paper", ":has(.MuiAlert-standardInfo)", "cr-h77", 1, ".MuiAlert-standardInfo"],
		[".MuiDialog-paper.cr-h77 .MuiDialogContent-root .MuiAccordion-root", ":has(.MuiAccordionDetails-root .MuiCheckbox-root)", "cr-h78", 1, ".MuiCheckbox-root"],
		[".MuiGrid-container [data-rect-id]", ":has(> div > :nth-child(2))", "cr-h79", 3, ""],
		[".MuiDialogActions-root > .MuiBox-root:first-child", ":has(.MuiButton-root)", "cr-h80", 1, ".MuiButton-root"],
		[".MuiPopover-paper > .MuiBox-root:first-child", ":has(> .MuiBox-root > .MuiBox-root > .MuiButtonBase-root > .MuiCheckbox-root)", "cr-h84", 1, ".MuiCheckbox-root"],
		[".MuiDialogActions-root", ":has(> .MuiBox-root:first-child .MuiButton-root)", "cr-h81", 1, ".MuiButton-root"],
		["html:not(.cr-dock) body header.MuiAppBar-root > .MuiToolbar-root > .MuiStack-root:last-child .MuiIconButton-root", ":has(path[d^=\"M8 12a2 2 0 1\"])", "cr-h82", 1, "path[d^=\"M8 12a2 2 0 1\"]"],
		["html:not(.cr-dock) body header.MuiAppBar-root > .MuiToolbar-root > .MuiStack-root:last-child", ":has(> .MuiBox-root:first-child:is(.fade-exit, .fade-enter:not(.fade-enter-active)))", "cr-h83", 2, ".MuiBox-root:first-child:is(.fade-exit, .fade-enter:not(.fade-enter-active))"],
		["html.cr-settings main .MuiContainer-root > .MuiBox-root:last-child > .MuiBox-root > .MuiStack-root", ":has(> .MuiGrid2-direction-xs-row-reverse)", "cr-h85", 2, ".MuiGrid2-direction-xs-row-reverse"],
		["html.cr-settings body main .MuiContainer-root > .MuiBox-root:last-child > .MuiBox-root > .MuiStack-root", ":has(input[type=\"file\"])", "cr-h86", 1, "input[type=\"file\"]"],
		["html.cr-settings body main .MuiStack-root", ":has(> .MuiGrid2-container input[type=\"file\"])", "cr-h87", 1, "input[type=\"file\"]"],
		["html.cr-settings body main .MuiGrid2-root", ":has(input[type=\"file\"])", "cr-h88", 1, "input[type=\"file\"]"],
		[".MuiDialog-root .MuiDialog-paper > .MuiBox-root:first-child > .MuiDialogTitle-root", ":has(> :nth-child(3))", "cr-h89", 3, ""],
		[".cr-explorer [data-index] > .MuiBox-root > :first-child > p > .MuiBox-root", ":has(> .cr-lcb)", "cr-h90", 2, ".cr-lcb"],
		["div", ":has(> div > div > .MuiToggleButtonGroup-root path[d^=\"M11.997 18.532\"]):not(:has(> .MuiGrid2-container))", "cr-h91", 1, "path[d^=\"M11.997 18.532\"]"],
		[".MuiGrid2-container", ":has(> .MuiGrid2-root > .MuiToggleButtonGroup-root path[d^=\"M11.997 18.532\"])", "cr-h92", 1, "path[d^=\"M11.997 18.532\"]"],
		[":is(.notistack-MuiContent, .MuiSnackbarContent-root) > :last-child:not(.MuiSnackbarContent-message)", ":has(.MuiButton-root)", "cr-h93", 3, ""],
		["html:not(.cr-dock) body main > .MuiStack-root", ":has(> .cr-h72.cr-nav)", "cr-h94", 2, ".cr-h72.cr-nav"],
		[".MuiBox-root", ":has([data-virtuoso-scroller])", "cr-h95", 1, "[data-virtuoso-scroller]"],
		[".MuiBox-root", ":has(> [data-virtuoso-scroller])", "cr-h96", 2, "[data-virtuoso-scroller]"],
		["html.cr-dock .cr-nav + .MuiBox-root > *", ":not(.cr-explorer)", "cr-h98", 3, ""],
		[".cr-explorer div", ":has(> .MuiStack-root > div > .MuiGrid-container)", "cr-h100", 1, ".MuiGrid-container"],
		["div", ":has(> header.MuiAppBar-root:not(.MuiDialog-root *))", "cr-h101", 2, "header.MuiAppBar-root"],
		["div", ":has(> .MuiContainer-maxWidthXs > .MuiGrid-container)", "cr-h102", 1, ".MuiContainer-maxWidthXs"],
		[":is(.MuiDrawer-paper, .MuiPopover-paper > .MuiBox-root) > div:first-child", ":has(+ .MuiStack-root)", "cr-h103", 3, ""],
		[":is(.MuiDrawer-paper, .MuiPopover-paper > .MuiBox-root) > div:first-child", ":has(+ .MuiStack-root.cr-scrolled)", "cr-h104", 3, ""],
		["[data-rect-id] *", ":has(> img:not(.MuiAvatar-img):not([draggable=\"false\"]))", "cr-h105", 2, "[data-rect-id] img:not(.MuiAvatar-img):not([draggable=\"false\"])"],
		["*", ":is(main .MuiCollapse-horizontal .MuiCollapse-wrapperInner > .MuiBox-root .MuiTabs-root, .MuiDialog-paperFullScreen .MuiTabs-root)", "cr-ptabs", 0, ""],
		[".MuiBox-root", ":has(> .MuiTabs-root.cr-ptabs)", "cr-h99", 2, ".MuiTabs-root.cr-ptabs"]
	];
	const root = document.documentElement;
	const collect = (a, h, mode, sel) => {
		const next = new Set();
		if (mode === 0) {
			document.querySelectorAll(a + h).forEach((e) => next.add(e));
			return next;
		}
		if (mode === 3) {
			for (const e of document.querySelectorAll(a)) if (e.matches(h)) next.add(e);
			return next;
		}
		const full = a + h;
		const seen = new Set();
		for (const n of document.querySelectorAll(sel)) {
			let p = n.parentElement;
			while (p && !seen.has(p)) {
				seen.add(p);
				if (p.matches(a) && p.matches(full)) next.add(p);
				if (mode === 2) break;
				p = p.parentElement;
			}
		}
		return next;
	};
	const sync = () => {
		const flags = [];
		for (const [a, h, cls, mode] of H) {
			if (mode !== 4) continue;
			try {
				if (root.matches(a + h)) flags.push(cls.slice(3));
			} catch (e) {}
		}
		const v = flags.join(" ");
		const body = document.body;
		if (body && (body.getAttribute("data-cr-h") || "") !== v) {
			if (v) body.setAttribute("data-cr-h", v);
			else body.removeAttribute("data-cr-h");
		}
		for (const [a, h, cls, mode, sel] of H) {
			if (mode === 4) continue;
			let next;
			try {
				next = collect(a, h, mode, sel);
			} catch (e) {
				continue;
			}
			for (const e of [...document.getElementsByClassName(cls)]) if (!next.has(e)) e.classList.remove(cls);
			next.forEach((e) => {
				if (!e.classList.contains(cls)) e.classList.add(cls);
			});
		}
		mo.takeRecords();
	};
	const named = new Set(H.flatMap(([a, h, , , sel]) => (a + h + " " + sel).match(/\.[A-Za-z_][\w-]*/g) || []).map((c) => c.slice(1)));
	const changed = (m) => {
		if (m.type === "childList") return true;
		if (m.attributeName === "d") return !(m.target.closest && m.target.closest(".cr-wave"));
		if (m.attributeName !== "class") return true;
		const now = m.target.getAttribute("class");
		if ((m.oldValue === null) !== (now === null)) return true;
		const before = new Set((m.oldValue || "").split(/\s+/));
		const after = new Set((now || "").split(/\s+/));
		for (const c of before) if (c && !after.has(c) && named.has(c)) return true;
		for (const c of after) if (c && !before.has(c) && named.has(c)) return true;
		return false;
	};
	const mo = new MutationObserver((muts) => {
		if (muts.some(changed)) sync();
	});
	mo.observe(root, { subtree: true, childList: true, attributes: true, attributeOldValue: true, attributeFilter: ["class", "role", "data-rect-id", "d"] });
	sync();
})();
