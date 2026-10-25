(() => {
	const SETTINGS_PATH = "M12.012 2.25c.734.008 1.465.093 2.182.253a.75.75 0 0 1 .582.649l.17 1.527a1.384 1.384 0 0 0 1.927 1.116l1.4-.615a.75.75 0 0 1 .85.174a9.793 9.793 0 0 1 2.205 3.792a.75.75 0 0 1-.272.825l-1.241.916a1.38 1.38 0 0 0 0 2.226l1.243.915a.75.75 0 0 1 .272.826a9.798 9.798 0 0 1-2.204 3.792a.75.75 0 0 1-.849.175l-1.406-.617a1.38 1.38 0 0 0-1.926 1.114l-.17 1.526a.75.75 0 0 1-.571.647a9.518 9.518 0 0 1-4.406 0a.75.75 0 0 1-.572-.647l-.169-1.524a1.382 1.382 0 0 0-1.925-1.11l-1.406.616a.75.75 0 0 1-.85-.175a9.798 9.798 0 0 1-2.203-3.796a.75.75 0 0 1 .272-.826l1.243-.916a1.38 1.38 0 0 0 0-2.226l-1.243-.914a.75.75 0 0 1-.272-.826a9.793 9.793 0 0 1 2.205-3.792a.75.75 0 0 1 .85-.174l1.4.615a1.387 1.387 0 0 0 1.93-1.118l.17-1.526a.75.75 0 0 1 .583-.65a10.72 10.72 0 0 1 2.201-.252m0 1.5a9.136 9.136 0 0 0-1.354.117l-.11.977A2.886 2.886 0 0 1 6.526 7.17l-.899-.394A8.293 8.293 0 0 0 4.28 9.092l.797.587a2.881 2.881 0 0 1 .001 4.643l-.799.588c.32.842.776 1.626 1.348 2.322l.905-.397a2.882 2.882 0 0 1 4.017 2.318l.109.984c.89.15 1.799.15 2.688 0l.11-.984a2.881 2.881 0 0 1 4.018-2.322l.904.396a8.299 8.299 0 0 0 1.348-2.318l-.798-.588a2.88 2.88 0 0 1-.001-4.643l.797-.587a8.293 8.293 0 0 0-1.348-2.317l-.897.393a2.884 2.884 0 0 1-4.023-2.324l-.109-.976a8.99 8.99 0 0 0-1.334-.117M12 8.25a3.75 3.75 0 1 1 0 7.5a3.75 3.75 0 0 1 0-7.5m0 1.5a2.25 2.25 0 1 0 0 4.5a2.25 2.25 0 0 0 0-4.5";
	const findNavHeader = () => {
		const main = document.querySelector("main");
		if (!main) return null;
		for (const stack of main.querySelectorAll(".MuiStack-root")) {
			const next = stack.nextElementSibling;
			if (!next) continue;
			const frame = [...next.children].find((c) => {
				const p = cr.propsOf(c);
				return p && typeof p.onContextMenu === "function";
			});
			if (frame) {
				if (!frame.classList.contains("cr-explorer")) frame.classList.add("cr-explorer");
				return stack;
			}
		}
		return null;
	};
	let lastNav = null;
	const crumbOf = (frame) => {
		const start = cr.fiberOf(frame);
		const queue = start ? [start.child] : [];
		let n = 0;
		while (queue.length && n++ < 400) {
			const f = queue.shift();
			if (!f) continue;
			const hooks = [];
			let h = f.memoizedState;
			while (h && hooks.length < 40 && typeof h === "object" && "next" in h) {
				hooks.push(h);
				h = h.next;
			}
			for (let i = 0; i + 5 < hooks.length; i++) {
				const q = (x) => x.queue && typeof x.queue.dispatch === "function";
				if (q(hooks[i]) && typeof hooks[i].queue.lastRenderedState === "boolean" && q(hooks[i + 1]) && typeof hooks[i + 1].queue.lastRenderedState === "string" && q(hooks[i + 2]) && typeof hooks[i + 2].queue.lastRenderedState === "number" && q(hooks[i + 3]) && !hooks[i + 4].queue && !hooks[i + 5].queue) {
					const chain = hooks[i + 5].memoizedState && hooks[i + 5].memoizedState.current;
					if (chain instanceof HTMLElement) return { queue: hooks[i + 2].queue, chain };
				}
			}
			if (f.child) queue.push(f.child);
			if (f.sibling) queue.push(f.sibling);
		}
		return null;
	};
	let crumb = null;
	const widthCache = new Map();
	let moreW = 40;
	let chevW = 24;
	let forced = { key: "", k: 0 };
	let canvas = null;
	const textW = (text, font) => {
		canvas = canvas || document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		ctx.font = font;
		return ctx.measureText(text || "").width;
	};
	const buttonsOf = (chain) => {
		let f = cr.fiberOf(chain);
		for (let i = 0; f && i < 12; i++, f = f.return) {
			let h = f.memoizedState;
			let n = 0;
			while (h && typeof h === "object" && "next" in h && n++ < 60) {
				const v = h.memoizedState;
				if (Array.isArray(v) && Array.isArray(v[0]) && v[0].length && v[0][0] && v[0][0].is_root === true && "path" in v[0][0]) return v[0];
				h = h.next;
			}
		}
		return null;
	};
	const outerW = (el) => {
		const cs = getComputedStyle(el);
		return el.getBoundingClientRect().width + (parseFloat(cs.marginLeft) || 0) + (parseFloat(cs.marginRight) || 0);
	};
	const fitPath = (nav) => {
		const frame = nav && nav.querySelector(":scope > .cr-path");
		if (!frame) return;
		if (!crumb || !crumb.chain.isConnected || !frame.contains(crumb.chain)) crumb = crumbOf(frame);
		if (!crumb) return;
		const { queue, chain } = crumb;
		const buttons = buttonsOf(chain);
		if (!buttons || !buttons.length) return;
		const hiding = queue.lastRenderedState;
		const domButtons = [...chain.querySelectorAll(":scope > .MuiButtonBase-root")];
		let shown = domButtons;
		if (hiding > 0 && domButtons.length) {
			moreW = outerW(domButtons[0]);
			shown = domButtons.slice(1);
		}
		const visible = buttons.slice(hiding);
		if (shown.length === visible.length) {
			shown.forEach((el, i) => {
				const inner = el.querySelector(".MuiBox-root") || el;
				if (inner.scrollWidth > inner.clientWidth + 1) return;
				widthCache.set(visible[i].path + (visible[i].is_latest ? "#l" : ""), outerW(el));
			});
		}
		const chev = chain.querySelector(":scope > svg");
		if (chev) chevW = outerW(chev);
		const font = shown.length ? getComputedStyle(shown[shown.length - 1]).font : "500 13px sans-serif";
		const n = buttons.length;
		const w = buttons.map((b) => {
			const key = b.path + (b.is_latest ? "#l" : "");
			if (widthCache.has(key)) return widthCache.get(key);
			if (b.is_root) return 110;
			const t = textW(b.name, font) + 12;
			return b.is_latest ? Math.min(300, t + 24) : Math.min(100, t);
		});
		const avail = chain.clientWidth - 4;
		let k = n - 1;
		for (let i = 0; i < n; i++) {
			let total = 0;
			for (let j = i; j < n; j++) total += w[j];
			total += (n - i - 1) * chevW;
			if (i > 0) total += moreW + chevW;
			if (total <= avail) {
				k = i;
				break;
			}
		}
		const key = buttons.map((b) => b.path).join("|") + "@" + Math.round(avail);
		if (forced.key === key) k = Math.max(k, forced.k);
		if (k === hiding && chain.scrollWidth > chain.clientWidth + 1 && hiding < n - 1) {
			forced = { key, k: hiding + 1 };
			k = hiding + 1;
		}
		if (k !== hiding) {
			queue.dispatch(k);
			schedule();
		}
	};
	let store = null;
	const getStore = () => {
		if (store) return store;
		store = cr.store();
		if (!store) return null;
		const sync = () => {
			const g = store.getState().globalState;
			document.documentElement.classList.toggle("cr-drawer-closed", !!g && g.drawerOpen === false);
		};
		store.subscribe(sync);
		sync();
		return store;
	};
	const MENU_PATH = "M4 6h16a1 1 0 1 1 0 2H4a1 1 0 0 1 0-2Zm0 5h16a1 1 0 1 1 0 2H4a1 1 0 1 1 0-2Zm0 5h16a1 1 0 1 1 0 2H4a1 1 0 1 1 0-2Z";
	const ADD_PATH = "M11.883 3.007 12 3a1 1 0 0 1 .993.883L13 4v7h7a1 1 0 0 1 .993.883L21 12a1 1 0 0 1-.883.993L20 13h-7v7a1 1 0 0 1-.883.993L12 21a1 1 0 0 1-.993-.883L11 20v-7H4a1 1 0 0 1-.993-.883L3 12a1 1 0 0 1 .883-.993L4 11h7V4a1 1 0 0 1 .883-.993L12 3l-.117.007Z";
	const SEARCH_PATH = "M10 2.5a7.5 7.5 0 0 1 5.964 12.048l4.743 4.745a1 1 0 0 1-1.32 1.497l-.094-.083-4.745-4.743A7.5 7.5 0 1 1 10 2.5Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z";
	const svg = (d) => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"></path></svg>';
	const makeBtn = (cls, d, label, onClick) => {
		const b = document.createElement("button");
		b.type = "button";
		b.className = "cr-tbtn " + cls;
		b.title = label;
		b.setAttribute("aria-label", label);
		b.innerHTML = svg(d);
		b.addEventListener("click", onClick);
		return b;
	};
	let lead = null;
	let rootH = null;
	let rootKey = "";
	let fitT = "";
	const fitRoot = () => {
		if (!rootH || !rootH.isConnected || !rootH.clientWidth) return;
		const sig = rootH.textContent + "|" + rootH.clientWidth;
		if (sig === fitT) return;
		fitT = sig;
		rootH.style.fontSize = "";
		const sw = rootH.scrollWidth;
		const cw = rootH.clientWidth;
		if (sw > cw + 1) rootH.style.fontSize = Math.max(12, Math.floor((24 * cw) / sw)) + "px";
	};
	addEventListener("resize", () => {
		fitT = "";
		fitRoot();
	}, { passive: true });
	let fadeEl = null;
	const getLead = () => {
		if (lead) return lead;
		lead = document.createElement("div");
		lead.className = "cr-lead";
		lead.appendChild(makeBtn("cr-expand", MENU_PATH, "Expand sidebar", () => {
			const st = getStore();
			if (st) st.dispatch({ type: "globalState/setDrawerOpen", payload: true });
		}));
		lead.appendChild(makeBtn("cr-new", ADD_PATH, "New", (e) => {
			const st = getStore();
			if (!st) return;
			const r = e.currentTarget.getBoundingClientRect();
			st.dispatch({ type: "fileManagerSlice/setContextMenu", payload: { index: 0, value: { open: true, pos: { x: r.x, y: r.bottom }, type: "new", fmIndex: 0, targets: undefined } } });
		}));
		const nb = lead.querySelector(".cr-new");
		if (nb && !nb.querySelector(".cr-lp-t")) {
			nb.className = "cr-lp cr-new";
			const t = document.createElement("span");
			t.className = "cr-lp-t";
			crT.set(t, "fileManager.new", "New");
			crT.set(nb, "fileManager.new", "New", "title");
			crT.set(nb, "fileManager.new", "New", "aria");
			nb.appendChild(t);
		}
		return lead;
	};
	const fiberProp = (el, name, depth) => {
		const p = cr.up(el, (x) => typeof x[name] === "boolean", depth);
		return p ? p[name] : null;
	};
	const pinOf = new WeakMap();
	const pinUri = (li) => {
		if (pinOf.has(li)) return pinOf.get(li);
		const p = cr.up(li, (x) => x.pinned === true && typeof x.path === "string", 30);
		const v = p ? p.path : null;
		pinOf.set(li, v);
		return v;
	};
	const normUri = (u) => {
		try {
			u = decodeURIComponent(u);
		} catch (e) {}
		return u.replace(/\/+$/, "");
	};
	const markActive = () => {
		document.querySelectorAll(":is(.MuiDrawer-paper, .MuiPopover-paper > .MuiBox-root) > .MuiStack-root .MuiButtonBase-root").forEach((b) => {
			if (b.closest('[role="tree"]')) return;
			const on = fiberProp(b, "active", 6) === true;
			if (b.classList.contains("cr-active") !== on) b.classList.toggle("cr-active", on);
		});
		const cur = normUri(new URLSearchParams(location.search).get("path") || "");
		document.querySelectorAll(':is(.MuiDrawer-paper, .MuiPopover-paper) [role="tree"] [role="treeitem"]:not([role="group"] *)').forEach((li) => {
			const c = li.querySelector(":scope > .MuiTreeItem-content");
			if (!c) return;
			const u = pinUri(li);
			const on = !!u && !!cur && normUri(u) === cur;
			if (c.classList.contains("cr-active") !== on) c.classList.toggle("cr-active", on);
		});
	};
	const addSearch = () => {
		const trash = document.querySelector('.MuiDrawer-paper [role="tree"] li[id*="//trash"]');
		if (!trash) return;
		const box = trash.parentElement;
		if (box.querySelector(":scope > .cr-search-item")) return;
		const item = trash.cloneNode(true);
		item.removeAttribute("id");
		item.removeAttribute("aria-selected");
		item.removeAttribute("aria-expanded");
		item.setAttribute("role", "none");
		item.classList.add("cr-search-item");
		item.querySelectorAll(".MuiTouchRipple-root, ul").forEach((x) => x.remove());
		const content = item.firstElementChild;
		if (!content) return;
		content.classList.remove("Mui-selected", "Mui-focused", "Mui-expanded");
		const kids = [...content.children];
		const iconEl = kids[1];
		if (iconEl) {
			const holder = document.createElement("div");
			holder.className = "cr-search-icon";
			holder.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + SEARCH_PATH + '"></path></svg>';
			content.replaceChild(holder, iconEl);
		}
		kids.slice(3).forEach((x) => x.remove());
		const text = content.querySelector(".MuiTypography-root");
		if (text) crT.set(text, "navbar.searchFiles", "Search");
		item.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			const st = getStore();
			if (st) st.dispatch({ type: "globalState/setSearchPopup", payload: true });
		});
		["mousedown", "contextmenu", "dblclick", "keydown"].forEach((ev) => item.addEventListener(ev, (e) => e.stopPropagation()));
		box.appendChild(item);
		document.querySelectorAll(".MuiDrawer-paper > .MuiStack-root > .MuiBox-root > .MuiButtonBase-root.cr-search-item").forEach((x) => x.remove());
	};
	const fadeSince = new WeakMap();
	const unstickFades = () => {
		const now = Date.now();
		document.querySelectorAll(".fade-exit, .fade-enter, .fade-exit-active, .fade-enter-active").forEach((el) => {
			const state = (el.className.match(/\bfade-(enter|exit)\b/) || [""])[0];
			const rec = fadeSince.get(el);
			if (!rec || rec.state !== state) {
				fadeSince.set(el, { state, t: now });
				return;
			}
			const t = rec.t;
			if (now - t > (el.closest("header.MuiAppBar-root") ? 450 : 600)) {
				fadeSince.delete(el);
				el.dispatchEvent(new TransitionEvent("transitionend", { bubbles: true, propertyName: "opacity" }));
			}
		});
	};
	let dockGeo = null;
	const dock = () => {
		unstickFades();
		if (!getStore()) {
			const paper = document.querySelector(".MuiDrawer-root .MuiDrawer-paper");
			document.documentElement.classList.toggle("cr-drawer-closed", !!paper && getComputedStyle(paper).visibility === "hidden");
		}
		addSearch();
		markActive();
		const header = [...document.querySelectorAll("header.MuiAppBar-root")].find((h) => !h.closest(".MuiDialog-root, .MuiPopover-root")) || null;
		const found = findNavHeader();
		if (found && !found.classList.contains("cr-nav")) found.classList.add("cr-nav");
		if (found && !found.classList.contains("cr-tbp")) found.classList.add("cr-tbp");
		const nav = header && window.innerWidth >= 600 ? found : null;
		const html = document.documentElement;
		let p = "";
		try {
			p = new URLSearchParams(location.search).get("path") || "";
		} catch (e) {}
		html.classList.toggle("cr-trash", p.startsWith("cloudreve://trash"));
		html.classList.toggle("cr-swm", p.startsWith("cloudreve://shared_with_me"));
		let up = !p || p.startsWith("cloudreve://my");
		const fmSt = getStore();
		const fm0 = fmSt && fmSt.getState().fileManager;
		const par = fm0 && fm0[0] && fm0[0].list && fm0[0].list.parent;
		if (par) {
			let cap = false;
			try {
				cap = (atob(par.capability || "").charCodeAt(0) & 1) !== 0;
			} catch (e) {}
			up = par.type === 1 && !!par.owned && cap;
		}
		html.classList.toggle("cr-my", location.pathname.startsWith("/home") && up);
		html.classList.toggle("cr-home", location.pathname.startsWith("/home"));
		const onHome = location.pathname.startsWith("/home");
		rootKey = !onHome ? "" : !p || /^cloudreve:\/\/my\/?$/.test(p) ? "navbar.myFiles|My Files" : /^cloudreve:\/\/shared_with_me\/?$/.test(p) ? "navbar.sharedWithMe|Shared with me" : /^cloudreve:\/\/[^/]+@share\/?$/.test(p) ? "share" : "";
		html.classList.toggle("cr-myroot", !!rootKey);
		html.classList.toggle("cr-shares", location.pathname.startsWith("/shares"));
		html.classList.toggle("cr-profile", location.pathname.startsWith("/profile"));
		html.classList.toggle("cr-settings", location.pathname.startsWith("/settings"));
		if (lastNav && lastNav !== nav) lastNav.style.paddingRight = "";
		lastNav = nav;
		const toolbar = header && header.querySelector(".MuiToolbar-root");
		const firstStack = toolbar && toolbar.querySelector(":scope > .MuiStack-root");
		const selBox = firstStack && firstStack.querySelector(":scope > .MuiBox-root");
		document.querySelectorAll("[data-cr-selbar]").forEach((el) => {
			if (el !== selBox || !nav) el.removeAttribute("data-cr-selbar");
		});
		if (found) {
			const fp = [...found.children].find((c) => !c.classList.contains("cr-lead") && c.classList.contains("MuiBox-root") && !c.classList.contains("cr-tbp-m") && !c.querySelector(".MuiButtonGroup-root"));
			[...found.children].forEach((c) => {
				if (c !== fp && c.classList.contains("cr-path")) c.classList.remove("cr-path", "cr-tf");
			});
			if (fp && !fp.classList.contains("cr-path")) fp.classList.add("cr-path");
			if (fp) {
				if (!rootH) {
					rootH = document.createElement("h4");
					rootH.className = "cr-root-h";
				}
				if (rootKey === "share") {
					const crumb = fp.querySelector("button");
					let name = "";
					if (crumb) {
						const c = crumb.cloneNode(true);
						c.querySelectorAll(".MuiAvatar-root, svg").forEach((x) => x.remove());
						name = c.textContent.trim();
					}
					if (name && rootH.dataset.k !== "share:" + name) {
						rootH.dataset.k = "share:" + name;
						rootH.removeAttribute("data-cr-t");
						rootH.textContent = name;
					}
				} else if (rootKey && rootH.dataset.k !== rootKey) {
					rootH.dataset.k = rootKey;
					const [k, fb] = rootKey.split("|");
					crT.set(rootH, k, fb);
				}
				if (rootKey) fitRoot();
				if (rootH.parentElement !== fp) fp.prepend(rootH);
			}
		}
		const mainBox = document.querySelector("main");
		if (!nav) {
			html.classList.remove("cr-sel");
			if (lead && lead.parentElement) lead.remove();
			const page = header && mainBox && window.innerWidth >= 600 ? mainBox.querySelector("div:has(> .MuiContainer-root)") || (/^\/(shares|profile)/.test(location.pathname) ? mainBox : null) : null;
			if (!page) {
				html.classList.remove("cr-dock", "cr-dock-page");
				return;
			}
			const mr = mainBox.getBoundingClientRect();
			if (!dockGeo) {
				const lg = document.querySelector(".MuiDrawer-paper > div:first-child img");
				const lr = lg && lg.getBoundingClientRect();
				const off = lr && lr.height > 0 ? Math.max(4, Math.round(lr.top + lr.height / 2 - 20 - mr.top)) : 12;
				dockGeo = { top: off, h: 40, inset: mr.right - page.getBoundingClientRect().right };
			}
			html.style.setProperty("--cr-dock-top", mr.top + dockGeo.top + "px");
			html.style.setProperty("--cr-dock-h", dockGeo.h + "px");
			html.style.setProperty("--cr-dock-right", window.innerWidth - mr.right + dockGeo.inset + 20 + "px");
			html.style.setProperty("--cr-page-top", Math.round(2 * dockGeo.top + dockGeo.h) + "px");
			html.classList.add("cr-dock", "cr-dock-page");
			return;
		}
		html.classList.remove("cr-dock-page");
		html.classList.add("cr-dock");
		const selOn = !!(selBox && selBox.querySelector(".MuiButtonGroup-root"));
		if (selBox) {
			if (selOn) selBox.setAttribute("data-cr-selbar", "");
			else selBox.removeAttribute("data-cr-selbar");
		}
		html.classList.toggle("cr-sel", selOn);
		const l = getLead();
		if (nav.firstElementChild !== l) nav.insertBefore(l, nav.firstElementChild);
		if (!fadeEl) {
			fadeEl = document.createElement("div");
			fadeEl.className = "cr-fade";
			fadeEl.setAttribute("aria-hidden", "true");
			fadeEl.innerHTML = "<i></i><i></i><i></i><i></i><i></i><i></i>";
		}
		if (fadeEl.parentElement !== nav) nav.appendChild(fadeEl);
		const pf = [...nav.children].find((c) => c !== l && c.classList.contains("MuiBox-root"));
		nav.querySelectorAll(":scope > .cr-path").forEach((c) => {
			if (c !== pf) c.classList.remove("cr-path", "cr-tf");
		});
		if (pf && !pf.classList.contains("cr-path")) pf.classList.add("cr-path");
		if (pf && !pf.classList.contains("cr-tf")) pf.classList.add("cr-tf");
		const logo = document.querySelector(".MuiDrawer-paper > div:first-child img");
		const mainEl = document.querySelector("main");
		if (logo && mainEl && !html.classList.contains("cr-drawer-closed")) {
			const lr = logo.getBoundingClientRect();
			if (lr.height > 0) {
				const top = Math.max(0, Math.round(lr.top + lr.height / 2 - 24 - mainEl.getBoundingClientRect().top));
				const v = top + "px";
				if (html.style.getPropertyValue("--cr-nav-top") !== v) html.style.setProperty("--cr-nav-top", v);
			}
		}
		const dp = document.querySelector(".MuiDrawer-root .MuiDrawer-paper");
		if (dp && dp.offsetWidth) {
			const dw = dp.offsetWidth + "px";
			if (html.style.getPropertyValue("--cr-drawer-w") !== dw) html.style.setProperty("--cr-drawer-w", dw);
		}
		const r = nav.getBoundingClientRect();
		const navCs = getComputedStyle(nav);
		const padTop = parseFloat(navCs.paddingTop) || 0;
		const padBot = parseFloat(navCs.paddingBottom) || 0;
		html.style.setProperty("--cr-dock-top", r.top + padTop + "px");
		html.style.setProperty("--cr-dock-h", r.height - padTop - padBot + "px");
		html.style.setProperty("--cr-dock-right", window.innerWidth - r.right + 20 + "px");
		if (mainBox) {
			const mr = mainBox.getBoundingClientRect();
			dockGeo = { top: r.top + padTop - mr.top, h: r.height - padTop - padBot, inset: mr.right - r.right };
		}
		if (toolbar) toolbar.querySelectorAll(".MuiIconButton-root:has(> .MuiBadge-root):not(.cr-lp)").forEach((el) => el.classList.add("cr-lp"));
		let tl = Infinity;
		if (toolbar) {
			toolbar.querySelectorAll(".MuiIconButton-root, [data-cr-selbar] .MuiStack-root:has(> .MuiButtonGroup-root), .MuiButton-root").forEach((el) => {
				const er = el.getBoundingClientRect();
				const l = er.left + (er.width - el.offsetWidth) / 2;
				if (er.width > 1 && er.height > 1 && l < tl) tl = l;
			});
		}
		if (toolbar) toolbar.querySelectorAll(".MuiButton-root:not(.cr-lp)").forEach((el) => {
			if (el.querySelector('path[d^="M12 1.75a3.25"]')) el.classList.add("cr-lp");
		});
		const pad = tl !== Infinity ? Math.ceil(r.right - tl + 8) + "px" : "";
		if (nav.style.paddingRight !== pad) nav.style.paddingRight = pad;
		fitPath(nav);
	};
	const mergeStorage = () => {
		document.querySelectorAll(":is(.MuiDrawer-paper, .MuiPopover-paper > .MuiBox-root) > .MuiStack-root > div:has(> .MuiLinearProgress-root, > .MuiSkeleton-root)").forEach(mergeOne);
	};
	const mergeOne = (box) => {
		if (!box || box.dataset.crStorage) return;
		const header = box.firstElementChild;
		if (!header) return;
		let link = header.querySelector("a, .MuiLink-root, button, [role='button'], [role='link']");
		if (!link && header.children.length > 1) link = header.lastElementChild;
		if (!link) return;
		link.classList.add("cr-hide");
		box.dataset.crStorage = "1";
		box.classList.add("cr-storage-link");
		box.addEventListener("click", (e) => {
			if (link.contains(e.target)) return;
			const h = box.firstElementChild;
			const l = (h && h.querySelector(".cr-hide")) || link;
			l.click();
		});
	};
	const tickSliders = () => {
		document.querySelectorAll(".MuiPopover-paper .MuiSlider-root").forEach((sl) => {
			const input = sl.querySelector("input[type='range']");
			if (!input) return;
			const min = parseFloat(input.min);
			const max = parseFloat(input.max);
			const step = parseFloat(input.step);
			if (!(max > min) || !(step > 0)) return;
			const total = Math.round((max - min) / step);
			let n = total;
			if (n > 20) {
				const cands = [20, 15, 13, 10, 9, 8, 6, 5];
				n = cands.find((c) => total % c === 0) || 13;
			}
			const v = String(Math.max(1, n));
			if (sl.style.getPropertyValue("--cr-n") !== v) sl.style.setProperty("--cr-n", v);
			if (!sl.hasAttribute("data-cr-ticks")) sl.setAttribute("data-cr-ticks", "");
		});
	};
	const addSettings = () => {
		document.querySelectorAll(".MuiPopover-root :is(.MuiMenuList-root, ul.MuiList-root):not([data-cr-settings])").forEach((list) => {
			const pop = list.closest(".MuiPopover-root");
			const items = [...list.children].filter((li) => li.classList.contains("MuiMenuItem-root"));
			const isUserMenu = !!pop && [...pop.querySelectorAll(".MuiTypography-caption, .MuiTypography-root")].some((t) => /@/.test(t.textContent || "")) && items.length >= 2 && !list.querySelector(".MuiAvatar-root");
			let home = [...list.children].find((li) => li.querySelector('path[d^="M10.55 2.532a2.25 2.25 0 0 1 2.9 0l6.75"]'));
			const signOut = list.querySelector('path[d^="M8.502 11.5a1.002 1.002 0 1 1 0 2.004"]');
			if (!home && isUserMenu) home = items[items.length - 2];
			if (!home || (!signOut && !isUserMenu)) return;
			list.setAttribute("data-cr-settings", "1");
			const head = isUserMenu && pop.querySelector(".MuiPopover-paper > .MuiBox-root:first-child");
			if (head && !head.classList.contains("cr-acct")) {
				head.classList.add("cr-acct");
				head.tabIndex = 0;
				head.setAttribute("role", "menuitem");
				head.addEventListener("click", () => home.click());
				head.addEventListener("keydown", (e) => {
					if (e.key !== "Enter" && e.key !== " ") return;
					e.preventDefault();
					home.click();
				});
			}
			if (list.querySelector('path[d^="M12.012 2.25c.734.008"]')) return;
			const item = home.cloneNode(true);
			item.removeAttribute("id");
			const path = item.querySelector("path");
			if (path) path.setAttribute("d", SETTINGS_PATH);
			const text = item.querySelector(".MuiListItemText-root .MuiTypography-root") || item.querySelector(".MuiListItemText-root");
			if (text) crT.set(text, "navbar.setting", "Settings");
			item.addEventListener("click", (e) => {
				e.stopPropagation();
				const root = list.closest(".MuiPopover-root");
				const backdrop = root && (root.querySelector(".MuiBackdrop-root") || root);
				if (backdrop) backdrop.dispatchEvent(new MouseEvent("click", { bubbles: true }));
				const r = cr.router();
				if (r) r.navigate("/settings");
				else location.href = "/settings";
			});
			list.insertBefore(item, home);
		});
	};
	let queued = false;
	const run = () => {
		queued = false;
		try {
			dock();
		} catch (e) {}
		try {
			addSettings();
		} catch (e) {}
		try {
			mergeStorage();
		} catch (e) {}
		try {
			tickSliders();
		} catch (e) {}
	};
	let held = false;
	let waitT = 0;
	const busy = () => held || document.documentElement.classList.contains("cr-scrolling");
	const schedule = (now) => {
		if (queued) return;
		if (now !== true && busy()) {
			if (!waitT) waitT = setTimeout(() => {
				waitT = 0;
				schedule();
			}, 200);
			return;
		}
		queued = true;
		requestAnimationFrame(run);
	};
	window.addEventListener("pointerdown", () => {
		held = true;
	}, true);
	["pointerup", "pointercancel"].forEach((ev) => window.addEventListener(ev, () => {
		held = false;
	}, true));
	window.addEventListener("pointermove", (e) => {
		if (held && !e.buttons) held = false;
	}, { capture: true, passive: true });
	window.addEventListener("blur", () => {
		held = false;
	});
	let navLoc = location.pathname + location.search;
	let navLocAt = 0;
	new MutationObserver((muts) => {
		const loc = location.pathname + location.search;
		if (loc !== navLoc) {
			navLoc = loc;
			navLocAt = Date.now();
		}
		if (Date.now() - navLocAt < 800 || muts.some((m) => m.target.matches && m.target.matches("header.MuiAppBar-root > .MuiToolbar-root > .MuiStack-root:last-child, header.MuiAppBar-root > .MuiToolbar-root > .MuiStack-root:last-child > *"))) run();
		else schedule(muts.some((m) => m.target.closest && m.target.closest("header.MuiAppBar-root, .cr-nav")));
	}).observe(document.body, { childList: true, subtree: true });
	window.addEventListener("resize", () => schedule(true));
	setInterval(schedule, 1000);
	setInterval(() => {
		try {
			unstickFades();
		} catch (e) {}
	}, 250);
})();
