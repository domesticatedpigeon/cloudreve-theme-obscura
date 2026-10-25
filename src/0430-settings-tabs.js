(() => {
	const SEL = "main .MuiContainer-root > .MuiBox-root > .MuiTabs-root:not(.cr-stabs)";
	const NS = "http://www.w3.org/2000/svg";
	const tabsOf = (el) => cr.up(el, (p) => Array.isArray(p.tabs) && typeof p.onChange === "function", 14);
	const call = (t, p, d) => {
		if (typeof t === "function") return t(p, null);
		if (t && typeof t.render === "function") return t.render(p, null);
		if (t && t.type && d < 4) return call(t.type, p, d + 1);
		return null;
	};
	const iconOf = (ic) => {
		if (!ic || !ic.type || typeof ic.type === "string") return null;
		const paths = [];
		let vb = null;
		const walk = (e, d) => {
			if (!e || d > 6) return;
			if (Array.isArray(e)) return e.forEach((x) => walk(x, d + 1));
			if (typeof e !== "object") return;
			const p = e.props || {};
			if (p.viewBox && !vb) vb = p.viewBox;
			if (e.type === "path" && p.d) {
				paths.push(p);
				return;
			}
			const n = paths.length;
			walk(p.children, d + 1);
			if (paths.length === n && e.type && typeof e.type !== "string" && d < 4) {
				try {
					walk(call(e.type, p, 0), d + 1);
				} catch (err) {}
			}
		};
		try {
			walk(call(ic.type, ic.props, 0), 0);
		} catch (err) {}
		if (!paths.length) return null;
		const svg = document.createElementNS(NS, "svg");
		svg.setAttribute("viewBox", vb || "0 0 24 24");
		svg.setAttribute("aria-hidden", "true");
		paths.forEach((p) => {
			const path = document.createElementNS(NS, "path");
			path.setAttribute("d", p.d);
			if (p.fillRule) path.setAttribute("fill-rule", p.fillRule);
			if (p.clipRule) path.setAttribute("clip-rule", p.clipRule);
			svg.appendChild(path);
		});
		return svg;
	};
	const fade = (fc) => {
		const tabs = fc.querySelectorAll(":scope > .MuiTab-root");
		const last = tabs[tabs.length - 1];
		const max = last ? last.offsetLeft + last.offsetWidth + (parseFloat(getComputedStyle(fc).paddingRight) || 0) - fc.clientWidth : 0;
		fc.style.setProperty("--cr-sl", (fc.scrollLeft > 1 ? 28 : 0) + "px");
		fc.style.setProperty("--cr-sr", (fc.scrollLeft < max - 1 ? 28 : 0) + "px");
	};
	const reveal = (fc, b, smooth) => {
		const l = b.offsetLeft - 28;
		const r = b.offsetLeft + b.offsetWidth + 28;
		const behavior = smooth ? "smooth" : "auto";
		if (l < fc.scrollLeft) fc.scrollTo({ left: l, behavior });
		else if (r > fc.scrollLeft + fc.clientWidth) fc.scrollTo({ left: r - fc.clientWidth, behavior });
	};
	const build = (mui) => {
		const p = tabsOf(mui);
		if (!p) return;
		let bar = mui.nextElementSibling;
		if (!bar || !bar.classList.contains("cr-stabs")) {
			bar = document.createElement("div");
			bar.className = "MuiTabs-root cr-stabs";
			const fc = document.createElement("div");
			fc.className = "MuiTabs-flexContainer";
			fc.setAttribute("role", "tablist");
			fc.addEventListener("scroll", () => fade(fc), { passive: true });
			fc.crRo = new ResizeObserver(() => fade(fc));
			fc.crRo.observe(fc);
			fc.addEventListener("wheel", (e) => {
				if (fc.scrollWidth <= fc.clientWidth || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
				e.preventDefault();
				fc.scrollLeft += e.deltaY;
			}, { passive: false });
			bar.appendChild(fc);
			mui.after(bar);
		}
		mui.classList.add("cr-stabs-src");
		const fc = bar.firstElementChild;
		const sig = p.tabs.map((t) => String(t.value) + "\u0001" + (typeof t.label === "string" ? t.label : "")).join("\u0002");
		if (bar.dataset.sig !== sig) {
			bar.dataset.sig = sig;
			delete bar.dataset.cur;
			fc.querySelectorAll(":scope > .MuiTab-root").forEach((b) => b.remove());
			const th = fc.querySelector(":scope > .cr-tseg-thumb");
			p.tabs.forEach((t) => {
				const b = document.createElement("button");
				b.type = "button";
				b.className = "MuiButtonBase-root MuiTab-root";
				b.setAttribute("role", "tab");
				b.dataset.v = String(t.value);
				const svg = iconOf(t.icon);
				if (svg) b.appendChild(svg);
				b.appendChild(document.createTextNode(typeof t.label === "string" ? t.label : String(t.value)));
				b.addEventListener("click", (e) => {
					const q = tabsOf(mui);
					if (q && String(q.value) !== String(t.value)) q.onChange(e, t.value);
					requestAnimationFrame(() => build(mui));
				});
				fc.insertBefore(b, th);
				fc.crRo.observe(b);
			});
		}
		const cur = String(p.value);
		let on = null;
		fc.querySelectorAll(":scope > .MuiTab-root").forEach((b) => {
			const s = b.dataset.v === cur;
			if (b.classList.contains("Mui-selected") !== s) b.classList.toggle("Mui-selected", s);
			b.setAttribute("aria-selected", s ? "true" : "false");
			if (s) on = b;
		});
		if (on && bar.dataset.cur !== cur) {
			reveal(fc, on, bar.dataset.cur !== undefined);
			bar.dataset.cur = cur;
		}
		fade(fc);
	};
	const scan = () => document.querySelectorAll(SEL).forEach(build);
	let q = false;
	const schedule = () => {
		if (q) return;
		q = true;
		requestAnimationFrame(() => {
			q = false;
			scan();
		});
	};
	new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
	window.addEventListener("resize", schedule);
	window.addEventListener("popstate", schedule);
	if (document.fonts) {
		document.fonts.addEventListener("loadingdone", schedule);
		document.fonts.ready.then(schedule);
	}
	scan();
})();
