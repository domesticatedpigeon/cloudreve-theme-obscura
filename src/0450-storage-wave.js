(() => {
	const NS = "http://www.w3.org/2000/svg";
	const SEL = ".MuiDrawer-paper > .MuiStack-root > div > .MuiLinearProgress-root, .MuiPopover-paper:has([role='tree']) > .MuiBox-root > .MuiStack-root > div > .MuiLinearProgress-root, html.cr-settings main .MuiGrid2-root > p.MuiTypography-body2 + .MuiBox-root > .MuiBox-root:first-child:has(+ .MuiStack-root > .MuiTypography-caption > .MuiBox-root:first-child)";
	const still = matchMedia("(prefers-reduced-motion: reduce)");
	const items = new Map();
	const attach = () => {
		document.querySelectorAll(SEL).forEach((p) => {
			if (items.has(p)) return;
			const svg = document.createElementNS(NS, "svg");
			svg.setAttribute("class", "cr-wave");
			svg.setAttribute("aria-hidden", "true");
			const path = document.createElementNS(NS, "path");
			svg.appendChild(path);
			p.appendChild(svg);
			items.set(p, { svg, path, w: 0, k: 0, v: 0, ph: 0, lt: 0 });
		});
		for (const [p, it] of items) if (!p.isConnected) items.delete(p);
	};
	const draw = (t) => {
		for (const [p, it] of items) {
			if (!p.offsetParent) continue;
			if (!p.contains(it.svg)) p.appendChild(it.svg);
			const lp = p.hasAttribute("aria-valuenow");
			if (!lp && !p.classList.contains("cr-qbar")) p.classList.add("cr-qbar");
			const u = lp ? null : p.firstElementChild;
			const v = lp ? parseFloat(p.getAttribute("aria-valuenow")) : u && p.clientWidth ? (u.getBoundingClientRect().width / p.clientWidth) * 100 : NaN;
			const pct = isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
			const target = Math.max(28, (p.clientWidth * pct) / 100);
			it.w += (target - it.w) * 0.12;
			if (Math.abs(target - it.w) < 0.2) it.w = target;
			const W = it.w;
			const h = p.clientHeight || 10;
			const mid = h / 2;
			const box = p.closest(".cr-storage-link");
			const hov = !!box && box.matches(":hover");
			const tg = hov ? 1 : 0;
			if (hov) {
				it.v = (it.v + (tg - it.k) * 0.06) * 0.82;
				it.k += it.v;
			} else {
				it.v = 0;
				it.k += (tg - it.k) * 0.1;
			}
			if (Math.abs(tg - it.k) < 0.002 && Math.abs(it.v) < 0.002) {
				it.k = tg;
				it.v = 0;
			}
			const dt = it.lt ? Math.min(100, t - it.lt) : 0;
			it.lt = t;
			it.ph += (dt / 1000) * 2 * Math.PI * 0.32 * (1 + 1.8 * it.k);
			const amp = Math.min(1.9, mid - 1.4) * (1 + 0.9 * it.k);
			const lambda = 20;
			const phase = still.matches ? 0 : it.ph;
			const breathe = still.matches ? 1 : 0.88 + 0.12 * Math.sin(t / 2600);
			let d = "M1 " + mid.toFixed(2);
			for (let x = 1; x <= W; x += 1) {
				const ramp = Math.min(1, (x - 1) / 9) * Math.min(1, (W - x) / 9 + 0.0001);
				const e = ramp * ramp * (3 - 2 * ramp);
				const y = mid + amp * breathe * e * Math.sin((2 * Math.PI * x) / lambda - phase);
				d += "L" + x.toFixed(1) + " " + y.toFixed(2);
			}
			it.path.setAttribute("d", d);
			p.style.setProperty("--cr-wave-w", W.toFixed(1) + "px");
		}
		requestAnimationFrame(draw);
	};
	let q = false;
	new MutationObserver(() => {
		if (q) return;
		q = true;
		setTimeout(() => {
			q = false;
			attach();
		}, 250);
	}).observe(document.body, { childList: true, subtree: true });
	attach();
	requestAnimationFrame(draw);
})();
