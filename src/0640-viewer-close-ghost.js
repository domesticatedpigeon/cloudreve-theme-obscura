(() => {
	let last = null;
	let ghost = null;
	let pairs = [];
	const hold = (portal, tfs) => {
		if (portal.dataset.crHold) return;
		portal.dataset.crHold = "1";
		portal.querySelectorAll(".PhotoView__PhotoBox").forEach((b, i) => {
			const tf = tfs ? tfs[i] : getComputedStyle(b).transform;
			if (!tf) return;
			b.style.setProperty("--cr-tf", tf);
			b.dataset.crTf = "1";
		});
	};
	const find = (n) => (n.nodeType === 1 ? (n.matches(".PhotoView-Portal") ? n : n.querySelector(".PhotoView-Portal")) : null);
	new MutationObserver((ms) => {
		for (const m of ms) {
			if (m.type === "attributes") {
				if (m.target.classList.contains("PhotoView-Portal") && m.target.classList.contains("PhotoView-Slider__willClose")) hold(m.target);
				continue;
			}
			m.removedNodes.forEach((n) => {
				const p = find(n);
				if (p && !p.classList.contains("PhotoView-Slider__willClose") && !p.classList.contains("cr-vghost")) {
					last = [...p.querySelectorAll(".PhotoView__PhotoBox")].map((b) => b.style.transform);
					ghost = p;
				}
			});
			m.addedNodes.forEach((n) => {
				const p = find(n);
				if (!p) return;
				if (!p.classList.contains("PhotoView-Slider__willClose")) {
					if (!p.classList.contains("cr-vghost")) document.querySelectorAll(".cr-vghost").forEach((g) => g.remove());
					return;
				}
				hold(p, last);
				if (ghost && p.parentElement) {
					ghost.classList.add("cr-vghost", "PhotoView-Slider__willClose");
					["position", "top", "left", "right", "bottom", "height"].forEach((k) => ghost.style.removeProperty(k));
					p.parentElement.insertBefore(ghost, p);
					pairs.push([p, ghost]);
				}
				ghost = null;
			});
			if (pairs.length && m.removedNodes.length) {
				pairs = pairs.filter(([p, g]) => {
					if (p.isConnected) return true;
					g.remove();
					return false;
				});
			}
		}
	}).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
})();
