(() => {
	const tag = () => {
		document.querySelectorAll('.MuiDialog-paper:has([role="tree"]) .MuiDialogContent-root .MuiStack-root').forEach((st) => {
			if (st.classList.contains("cr-subnav")) return;
			const kids = [...st.children];
			if (kids.length < 2 || !kids.some((k) => k.querySelector(".MuiButtonGroup-root"))) return;
			const first = kids[0];
			if (!first || first.querySelector(".MuiButtonGroup-root") || !first.querySelector(".MuiButton-root")) return;
			st.classList.add("cr-subnav");
			first.classList.add("cr-path");
		});
		document.querySelectorAll('.MuiDialog-paper:has([role="tree"])').forEach((paper) => {
			const title = paper.querySelector(".MuiDialogTitle-root");
			const nav = paper.querySelector(".cr-subnav");
			if (title && nav) {
				const nr = nav.getBoundingClientRect();
				const btn = title.querySelector(".MuiIconButton-root") || paper.querySelector(":scope > .MuiIconButton-root, .MuiDialogTitle-root ~ .MuiIconButton-root");
				if (btn) {
					const br = btn.getBoundingClientRect();
					const cur = parseFloat(nav.style.marginRight) || 0;
					const mr = Math.max(0, Math.round(nr.right + cur - br.left + 8));
					if (Math.abs(mr - cur) >= 2) nav.style.setProperty("margin-right", mr + "px", "important");
				}
			}
			const tile = paper.querySelector("[data-rect-id]");
			if (!tile) return;
			let el = tile.parentElement;
			while (el && el !== paper) {
				const oy = getComputedStyle(el).overflowY;
				if (oy === "auto" || oy === "scroll") break;
				el = el.parentElement;
			}
			if (el && el !== paper && !el.classList.contains("cr-subexplorer")) {
				paper.querySelectorAll(".cr-subexplorer").forEach((x) => x.classList.remove("cr-subexplorer"));
				el.classList.add("cr-subexplorer");
			}
		});
	};
	let papers = [];
	setInterval(() => {
		papers = [...document.querySelectorAll('.MuiDialog-paper:has([role="tree"])')];
	}, 300);
	let lastX = 0;
	let lastY = 0;
	let queued = false;
	const frame = () => {
		queued = false;
		const x = lastX;
		const y = lastY;
		const jobs = [];
		papers.forEach((paper) => {
			if (!paper.isConnected) return;
			const r = paper.getBoundingClientRect();
			const tiles = [...paper.querySelectorAll("[data-rect-id]")];
			jobs.push([paper, r, tiles, tiles.map((t) => t.getBoundingClientRect())]);
		});
		jobs.forEach(([paper, r, tiles, rects]) => {
			paper.style.setProperty("--cr-dx", x - r.left + "px");
			paper.style.setProperty("--cr-dy", y - r.top + "px");
			tiles.forEach((t, i) => {
				const tr = rects[i];
				if (tr.bottom < r.top || tr.top > r.bottom) return;
				t.style.setProperty("--cr-mx", x - tr.left + "px");
				t.style.setProperty("--cr-my", y - tr.top + "px");
			});
		});
	};
	window.addEventListener("pointermove", (e) => {
		if (!papers.length) return;
		lastX = e.clientX;
		lastY = e.clientY;
		if (queued) return;
		queued = true;
		requestAnimationFrame(frame);
	}, { capture: true, passive: true });
	setInterval(() => {
		if (document.querySelector(".MuiDialog-root")) tag();
	}, 250);
})();
