(() => {
	const U = ["B", "KB", "MB", "GB", "TB", "PB"];
	const toBytes = (t) => {
		const m = /([\d.,]+)\s*([KMGTP]?B)/i.exec(t || "");
		if (!m) return null;
		const i = U.indexOf(m[2].toUpperCase());
		return i < 0 ? null : parseFloat(m[1].replace(",", ".")) * Math.pow(1024, i);
	};
	const fmt = (b) => {
		let i = 0;
		while (b >= 1024 && i < U.length - 1) {
			b /= 1024;
			i++;
		}
		return Math.round(b) + " " + U[i];
	};
	const run = () => {
		document.querySelectorAll(":is(.MuiDrawer-paper, .MuiPopover-paper) div:has(> .MuiLinearProgress-root)").forEach((box) => {
			const cap = box.querySelector(":scope > .MuiTypography-caption");
			if (!cap) return;
			const raw = cap.textContent || "";
			const parts = raw.split("/");
			if (parts.length < 2) return;
			const used0 = parts[0].trim();
			const used = toBytes(used0) != null ? fmt(toBytes(used0)) : used0;
			const total = parts.slice(1).join("/").trim();
			const ub = toBytes(used);
			const tb = toBytes(total);
			const free = ub != null && tb != null ? fmt(Math.max(0, tb - ub)) : "";
			const key = raw;
			let row = cap.nextElementSibling && cap.nextElementSibling.classList.contains("cr-st-row") ? cap.nextElementSibling : null;
			if (!row) {
				row = document.createElement("div");
				row.className = "cr-st-row";
				row.innerHTML = "<span></span><span></span>";
				cap.after(row);
			}
			if (row.dataset.k !== key) {
				row.dataset.k = key;
				row.children[0].textContent = used + " used";
				row.children[1].textContent = free ? free + " free" : "";
			}
			const h = box.querySelector(".MuiTypography-subtitle2:not(a)");
			if (h) {
				let t = h.querySelector(":scope > .cr-st-total");
				if (!t) {
					t = document.createElement("span");
					t.className = "cr-st-total";
					h.appendChild(t);
				}
				const totalTxt = tb != null ? fmt(tb) : total;
				if (t.textContent !== totalTxt) t.textContent = totalTxt;
			}
		});
	};
	setInterval(run, 1000);
	run();
})();
