(() => {
	const SPOT = "html:is(.cr-shares, .cr-profile) main .MuiContainer-root > .MuiGrid-container > .MuiGrid-item > .MuiButtonBase-root, .MuiDialog-paper:has(> .MuiBox-root:first-child > .MuiTextField-root + .MuiIconButton-root) .MuiListItemButton-root, .MuiDialog-paper [role='tree'] .MuiTreeItem-content, .cr-ctx-item, .MuiGrid-container [data-rect-id], .MuiImageListItem-root, .MuiPopover-paper .MuiMenuItem-root, .MuiPopover-paper .MuiListItemButton-root, .MuiDialog-paper .MuiAccordion-root .MuiListItemButton-root, .MuiDialogContent-root .MuiAccordionSummary-root .MuiListItemButton-root, .MuiPopover-paper > .cr-h84 > .MuiBox-root > .MuiBox-root > .MuiButtonBase-root, .MuiPopover-paper > .cr-acct, html.cr-settings main .MuiPaper-root .MuiTableBody-root > .MuiTableRow-root";
	const ZONE = ".MuiDialog-paper:has([role='tree']), .MuiDrawer-paper, .cr-nav, header.MuiAppBar-root, .cr-explorer, main";
	let cur = null;
	const clearTile = () => {
		if (cur) cur.classList.remove("cr-spot");
		cur = null;
	};
	const clear = () => {
		clearTile();
		document.documentElement.classList.remove("cr-tb-on");
	};
	const PAINT = ".MuiDrawer-paper, .MuiPopover-paper:has([role='tree']) > .MuiBox-root, .cr-nav, .cr-fade, .cr-fade > i:first-child, .cr-explorer, main .MuiCollapse-horizontal .MuiCollapse-wrapperInner > .MuiBox-root, .cr-nav + .MuiBox-root, .cr-nav + .MuiBox-root > :not(.cr-explorer)";
	const TILES = ".MuiGrid-container [data-rect-id], .cr-recent-i, .cr-explorer [data-testid=virtuoso-item-list] > [data-index] > .MuiBox-root, .MuiImageListItem-root, html:is(.cr-shares, .cr-profile) main .MuiContainer-root > .MuiGrid-container > .MuiGrid-item > .MuiButtonBase-root";
	let painters = [];
	let tiles = [];
	let lit = new Set();
	let paintAt = 0;
	const refresh = () => {
		const now = Date.now();
		if (now - paintAt > 500 || painters.some((p) => !p.isConnected)) {
			painters = [...document.querySelectorAll(PAINT)].filter((p) => !p.querySelector(":scope > .cr-explorer"));
			tiles = [...document.querySelectorAll(TILES)];
			paintAt = now;
		}
	};
	new MutationObserver(() => {
		paintAt = 0;
	}).observe(document.body, { childList: true, subtree: true });
	const anims = new WeakMap();
	const WK = navigator.vendor === "Apple Computer, Inc.";
	if (!WK) ["--cr-tx", "--cr-ty"].forEach((name) => {
		try {
			CSS.registerProperty({ name, syntax: "<length>", inherits: false, initialValue: "-999px" });
		} catch (e) {}
	});
	const kf = (x, y) => [{ "--cr-tx": x, "--cr-ty": y }, { "--cr-tx": x, "--cr-ty": y }];
	const put = (el, x, y) => {
		if (WK) {
			el.style.setProperty("--cr-tx", x);
			el.style.setProperty("--cr-ty", y);
			return;
		}
		const a = anims.get(el);
		if (a && a.playState !== "idle") {
			a.effect.setKeyframes(kf(x, y));
			return;
		}
		const n = el.animate(kf(x, y), { duration: 1, fill: "forwards" });
		n.id = "cr-tx";
		n.pause();
		anims.set(el, n);
	};
	const drop = (el) => {
		if (WK) {
			el.style.removeProperty("--cr-tx");
			el.style.removeProperty("--cr-ty");
			return;
		}
		const a = anims.get(el);
		if (a) a.cancel();
		anims.delete(el);
	};
	const light = (cx, cy) => {
		refresh();
		const x = cx + "px";
		const y = cy + "px";
		painters.forEach((p) => put(p, x, y));
		const next = new Set();
		for (const t of tiles) {
			const r = t.getBoundingClientRect();
			if (cx > r.left - 150 && cx < r.right + 150 && cy > r.top - 150 && cy < r.bottom + 150) {
				put(t, cx - r.left + "px", cy - r.top + "px");
				next.add(t);
			}
		}
		lit.forEach((t) => {
			if (!next.has(t)) drop(t);
		});
		lit = next;
	};
	let lastEv = null;
	let pending = false;
	document.addEventListener("pointermove", (e) => {
		if (e.pointerType && e.pointerType !== "mouse") return;
		lastEv = e;
		if (pending) return;
		pending = true;
		requestAnimationFrame(() => {
			pending = false;
			if (lastEv) move(lastEv);
		});
	}, { passive: true });
	const move = (e) => {
		const el = e.target instanceof Element ? e.target : null;
		if (el && el.closest(".PhotoView-Portal, .MuiBackdrop-root")) {
			if (document.documentElement.classList.contains("cr-tb-on")) document.documentElement.classList.remove("cr-tb-on");
			clearTile();
			return;
		}
		const zone = el ? el.closest(ZONE) : null;
		const html = document.documentElement;
		if (zone && (!zone.closest(".MuiDialog-root") || zone.matches(".MuiDialog-paper"))) {
			light(e.clientX, e.clientY);
			if (!html.classList.contains("cr-tb-on")) html.classList.add("cr-tb-on");
		} else if (html.classList.contains("cr-tb-on")) html.classList.remove("cr-tb-on");
		const t = el ? el.closest(SPOT) : null;
		if (cur && cur !== t) clearTile();
		if (!t) return;
		cur = t;
		const r = t.getBoundingClientRect();
		t.style.setProperty("--cr-mx", e.clientX - r.left + "px");
		t.style.setProperty("--cr-my", e.clientY - r.top + "px");
		if (!t.classList.contains("cr-spot")) t.classList.add("cr-spot");
	};
	let scrollQ = false;
	document.addEventListener("scroll", () => {
		if (scrollQ) return;
		scrollQ = true;
		requestAnimationFrame(() => {
			scrollQ = false;
			if (lastEv && document.documentElement.classList.contains("cr-tb-on")) light(lastEv.clientX, lastEv.clientY);
		});
	}, { capture: true, passive: true });
	document.addEventListener("mouseout", (e) => {
		if (!e.relatedTarget) clear();
	});
	document.addEventListener("pointerdown", (e) => {
		if (e.pointerType && e.pointerType !== "mouse" && stack) clear();
	}, { passive: true, capture: true });
	window.addEventListener("blur", clear);
})();
