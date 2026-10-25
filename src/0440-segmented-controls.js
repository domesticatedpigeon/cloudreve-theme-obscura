(() => {
	const CFG = [
		[".MuiPopover-paper .MuiToggleButtonGroup-root", ".MuiToggleButton-root"],
		[".cr-ptabs .MuiTabs-flexContainer", ".MuiTab-root"],
		[":is(main, .MuiDialog-paper) .MuiToggleButtonGroup-root", ".MuiToggleButton-root"],
		[".cr-stabs > .MuiTabs-flexContainer", ".MuiTab-root"],
		[".cr-bnav", ".cr-bnav-i"],
	];
	const sync = (g, anim) => {
		const B = g.dataset.crTsegBtn;
		const thumb = g.querySelector(":scope > .cr-tseg-thumb");
		if (!thumb || thumb.classList.contains("cr-drag")) return;
		const on = g.querySelector(":scope > " + B + ".Mui-selected");
		if (!anim) thumb.style.transition = "none";
		if (on && on.offsetWidth) {
			thumb.style.width = on.offsetWidth + "px";
			thumb.style.transform = "translateX(" + on.offsetLeft + "px)";
			thumb.style.opacity = "1";
		} else thumb.style.opacity = "0";
		if (!anim) {
			void thumb.offsetWidth;
			thumb.style.transition = "";
		}
	};
	const setup = (g, B) => {
		if (g.dataset.crTseg) return;
		const btns = g.querySelectorAll(":scope > " + B);
		if (btns.length < 2) return;
		g.dataset.crTseg = "1";
		g.dataset.crTsegBtn = B;
		g.classList.add("cr-tseg");
		const thumb = document.createElement("i");
		thumb.className = "cr-tseg-thumb";
		g.appendChild(thumb);
		sync(g, false);
		requestAnimationFrame(() => sync(g, false));
		new MutationObserver(() => {
			if (!g.contains(thumb)) g.appendChild(thumb);
			sync(g, true);
		}).observe(g, { attributes: true, subtree: true, attributeFilter: ["class", "aria-pressed"], childList: true });
		let dg = null;
		g.addEventListener("pointerdown", (e) => {
			if (e.button !== 0) return;
			const on = g.querySelector(":scope > " + B + ".Mui-selected");
			if (!on || !on.contains(e.target)) return;
			dg = { x0: e.clientX, s0: g.scrollLeft, left: on.offsetLeft, w: on.offsetWidth, moved: false, id: e.pointerId, on };
		});
		g.addEventListener("pointermove", (e) => {
			if (!dg || e.pointerId !== dg.id) return;
			const dx = e.clientX - dg.x0;
			if (!dg.moved) {
				if (Math.abs(dx) < 4) return;
				dg.moved = true;
				try {
					g.setPointerCapture(e.pointerId);
				} catch (err) {}
			}
			if (g.scrollWidth > g.clientWidth) {
				const gr = g.getBoundingClientRect();
				if (e.clientX < gr.left + 32) g.scrollLeft -= 10;
				else if (e.clientX > gr.right - 32) g.scrollLeft += 10;
			}
			const bs = [...g.querySelectorAll(":scope > " + B)].filter((b) => b.offsetWidth);
			const min = bs[0].offsetLeft;
			const last = bs[bs.length - 1];
			const max = last.offsetLeft + last.offsetWidth - dg.w;
			const x = Math.max(min - 6, Math.min(max + 6, dg.left + dx + g.scrollLeft - dg.s0));
			thumb.style.transition = "none";
			thumb.style.width = dg.w + "px";
			thumb.style.transform = "translateX(" + x + "px) scale(1.08, 0.88)";
			thumb.classList.add("cr-drag");
			dg.x = x;
		});
		const end = (e) => {
			if (!dg || e.pointerId !== dg.id) return;
			const d = dg;
			dg = null;
			thumb.classList.remove("cr-drag");
			thumb.style.transition = "";
			if (!d.moved) return;
			g.dataset.crNoclick = "1";
			const c = d.x + d.w / 2;
			let best = null;
			let bd = Infinity;
			g.querySelectorAll(":scope > " + B).forEach((b) => {
				if (!b.offsetWidth) return;
				const bc = b.offsetLeft + b.offsetWidth / 2;
				if (Math.abs(bc - c) < bd) {
					bd = Math.abs(bc - c);
					best = b;
				}
			});
			setTimeout(() => {
				delete g.dataset.crNoclick;
				if (best && best !== d.on) best.click();
				sync(g, true);
			}, 0);
		};
		g.addEventListener("pointerup", end);
		g.addEventListener("pointercancel", end);
		g.addEventListener("click", (e) => {
			if (g.dataset.crNoclick) {
				e.stopPropagation();
				e.preventDefault();
			}
		}, true);
	};
	const scan = () => CFG.forEach(([G, B]) => document.querySelectorAll(G).forEach((g) => setup(g, B)));
	let q = false;
	new MutationObserver(() => {
		if (q) return;
		q = true;
		requestAnimationFrame(() => {
			q = false;
			scan();
		});
	}).observe(document.body, { childList: true, subtree: true });
	scan();
})();
