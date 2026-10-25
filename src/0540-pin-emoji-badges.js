(() => {
	const cache = new Map();
	const session = () => {
		try {
			const o = JSON.parse(localStorage.getItem("cloudreve_session") || "null");
			if (!o) return null;
			const ss = o.sessions || {};
			return ss[o.current] || Object.values(ss)[0] || null;
		} catch (e) {
			return null;
		}
	};
	const prefetch = () => {
		const cur = session();
		const list = cur && cur.user && cur.user.pined;
		if (Array.isArray(list)) list.forEach((p) => p && p.uri && load(p.uri));
	};
	const load = (uri) => {
		let entry = cache.get(uri);
		if (entry && (entry.busy || Date.now() - entry.at < 300000)) return entry;
		if (!entry) {
			entry = { pending: true, busy: false, at: 0, color: "", emoji: "", shared: false };
			cache.set(uri, entry);
		}
		entry.busy = true;
		crApi("file/info", { uri, extended: "true" })
			.then((j) => {
				const d = (j && j.data) || {};
				const m = d.metadata || {};
				entry.color = m["customize:icon_color"] || "";
				entry.emoji = m["customize:emoji"] || "";
				entry.shared = !!d.shared;
			})
			.catch(() => {})
			.finally(() => {
				entry.pending = false;
				entry.busy = false;
				entry.at = Date.now();
				apply();
			});
		return entry;
	};
	const apply = () => {
		document.querySelectorAll(':is(.MuiDrawer-paper, .MuiPopover-paper) [role="tree"] li[id*="Pined"]').forEach((li) => {
			const uri = li.id.slice(li.id.indexOf("Pined") + 5);
			const c = li.querySelector(":scope > .MuiTreeItem-content");
			if (!c || !uri) return;
			const e = load(uri);
			if (e.pending) return;
			c.querySelectorAll(".MuiBadge-badge [data-cr-pin], .MuiBadge-badge .cr-pin-emoji").forEach((x) => (x.classList.contains("cr-pin-emoji") ? x.remove() : (delete x.dataset.crPin, x.style.removeProperty("display"))));
			const svg = c.querySelector(":scope > .MuiBox-root :is(svg.MuiSvgIcon-root, .iconify):not(.MuiBadge-badge *)");
			const box = c.querySelector(":scope > .MuiBox-root");
			let bd = c.querySelector(".cr-pin-badge");
			const native = c.querySelector(".MuiBadge-badge:not(.cr-pin-badge)");
			if (e.shared && !native && box) {
				if (!bd) {
					bd = document.createElement("span");
					bd.className = "MuiBadge-badge cr-pin-badge";
					bd.innerHTML = '<div class="MuiAvatar-root"><svg class="MuiSvgIcon-root" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3.002a2.998 2.998 0 1 1-2.148 5.09l-5.457 3.12a3.002 3.002 0 0 1 0 1.577l5.458 3.119a2.998 2.998 0 1 1-.746 1.304l-5.457-3.12a2.998 2.998 0 1 1 0-4.184l5.457-3.12A2.998 2.998 0 0 1 17 3.002Z"></path></svg></div>';
					box.appendChild(bd);
				}
			} else if (bd) bd.remove();
			let em = c.querySelector(":scope .cr-pin-emoji");
			if (e.emoji && !svg) {
				if (em) em.remove();
			} else if (e.emoji) {
				if (svg) {
					svg.dataset.crPin = "1";
					svg.style.setProperty("display", "none", "important");
					if (!em) {
						em = document.createElement("span");
						em.className = "cr-pin-emoji";
						svg.after(em);
					}
				}
				if (em && em.textContent !== e.emoji) em.textContent = e.emoji;
			} else {
				if (em) em.remove();
				if (svg) {
					svg.style.removeProperty("display");
					if (e.color) {
						svg.dataset.crPin = "1";
						svg.style.setProperty("color", e.color, "important");
						svg.style.setProperty("fill", e.color, "important");
					} else if (svg.dataset.crPin) {
						delete svg.dataset.crPin;
						svg.style.removeProperty("color");
						svg.style.removeProperty("fill");
					}
				}
			}
		});
	};
	prefetch();
	setInterval(() => {
		prefetch();
		apply();
	}, 1500);
	let aq = false;
	new MutationObserver(() => {
		if (aq) return;
		aq = true;
		requestAnimationFrame(() => {
			aq = false;
			apply();
		});
	}).observe(document.body, { childList: true, subtree: true });
	apply();
})();
