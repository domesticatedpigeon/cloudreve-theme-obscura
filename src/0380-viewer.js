(() => {
	const KEY = "cr-viewer-view";
	const st = { bg: "auto", proof: "none", sil: false, v: 2 };
	let curPng = false;
	try {
		const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
		if (saved.bg && saved.v === 2) st.bg = saved.bg;
		if (saved.proof === "gray") st.proof = "gray";
		if (saved.sil === true || saved.proof === "sil") st.sil = true;
	} catch (e) {}
	const effSil = () => st.sil && curPng;
	const darkQ = matchMedia("(prefers-color-scheme: dark)");
	const effBg = () => (st.bg === "auto" ? (darkQ.matches ? "black" : "white") : st.bg);
	const PAL = {
		dark: { "--cr-pill-solid": "rgba(24, 24, 24, 0.86)", "--cr-pill-bg": "rgba(22, 22, 22, 0.62)", "--cr-pill-bg-h": "rgba(40, 40, 40, 0.78)", "--cr-pill-br": "rgba(255, 255, 255, 0.1)", "--cr-pill-fg": "#ffffff", "--cr-pill-dim": "rgba(255, 255, 255, 0.6)", "--cr-pill-on": "rgba(255, 255, 255, 0.16)", "--cr-pill-ring": "rgba(255, 255, 255, 0.35)", "--cr-pill-inv": "#000000" },
		light: { "--cr-pill-solid": "rgba(255, 255, 255, 0.9)", "--cr-pill-bg": "rgba(240, 240, 240, 0.72)", "--cr-pill-bg-h": "rgba(228, 228, 228, 0.86)", "--cr-pill-br": "rgba(0, 0, 0, 0.08)", "--cr-pill-fg": "#000000", "--cr-pill-dim": "rgba(0, 0, 0, 0.55)", "--cr-pill-on": "rgba(0, 0, 0, 0.08)", "--cr-pill-ring": "rgba(0, 0, 0, 0.25)", "--cr-pill-inv": "#ffffff" }
	};
	const PILLS = ".PhotoView-Slider__BannerWrap, .PhotoView-Slider__Counter, .PhotoView-Slider__BannerRight, .PhotoView-Slider__BannerRight > *, .PhotoView-Slider__BannerRight > * > svg, .cr-legend, .cr-vdock-g, .cr-vdock-g > *, .cr-wrap-toast";
	const paint = (force) => {
		const mode = document.documentElement.classList.contains("cr-vlight") ? "light" : "dark";
		const v = PAL[mode];
		let hit = false;
		document.querySelectorAll(PILLS).forEach((el) => {
			if (!force && el.dataset.crPal === mode) return;
			el.dataset.crPal = mode;
			for (const k in v) el.style.setProperty(k, v[k]);
			if (el.tagName.toLowerCase() === "svg") el.style.setProperty("color", v["--cr-pill-fg"]);
			hit = true;
		});
		return hit;
	};
	let chromeOn = false;
	let openT = 0;
	let metaPrev = null;
	let metaTo = null;
	let tw = 0;
	const mobQ = matchMedia("(max-width: 599.95px)");
	const ease = (t) => {
		let lo = 0;
		let hi = 1;
		for (let i = 0; i < 20; i++) {
			const m = (lo + hi) / 2;
			const u = 1 - m;
			if (0.75 * u * u * m + 0.75 * u * m * m + m * m * m < t) lo = m;
			else hi = m;
		}
		const m = (lo + hi) / 2;
		const u = 1 - m;
		return 0.3 * u * u * m + 3 * u * m * m + m * m * m;
	};
	const hex = (s) => {
		const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((s || "").trim());
		if (!m) return null;
		const x = m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1];
		return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16));
	};
	const setMeta = (meta, to, smooth) => {
		if (metaTo === to) return;
		metaTo = to;
		cancelAnimationFrame(tw);
		const a = hex(meta.getAttribute("content"));
		const b = hex(to);
		if (!smooth || !a || !b) {
			meta.setAttribute("content", to);
			return;
		}
		const t0 = performance.now();
		const step = (now) => {
			const p = Math.min(1, (now - t0) / 350);
			const e = ease(p);
			meta.setAttribute("content", p === 1 ? to : "#" + a.map((v, i) => Math.round(v + (b[i] - v) * e).toString(16).padStart(2, "0")).join(""));
			if (p < 1) tw = requestAnimationFrame(step);
		};
		tw = requestAnimationFrame(step);
	};
	const syncChrome = () => {
		const open = !!document.querySelector(".PhotoView-Portal");
		const h = document.documentElement;
		let meta = document.querySelector('meta[name="theme-color"]');
		const settled = open && !document.querySelector(".PhotoView-Portal.PhotoView-Slider__willClose");
		if (!settled) {
			clearTimeout(openT);
			openT = 0;
			h.classList.remove("cr-vopen");
		} else if (!openT && !h.classList.contains("cr-vopen")) {
			openT = setTimeout(() => {
				if (document.querySelector(".PhotoView-Portal:not(.PhotoView-Slider__willClose)")) h.classList.add("cr-vopen");
				openT = 0;
			}, 450);
		}
		const mob = mobQ.matches && !h.classList.contains("cr-dock");
		if (!open || (mob && !settled)) {
			if (!chromeOn) return;
			chromeOn = false;
			h.classList.remove("cr-vtint");
			h.style.removeProperty("background-color");
			document.body.style.removeProperty("background-color");
			if (meta && metaPrev !== null) setMeta(meta, metaPrev, mob);
			metaPrev = null;
			return;
		}
		const c = effSil() || effBg() === "white" ? "#ffffff" : effBg() === "stripe" ? "#c8c8c8" : "#000000";
		if (!meta) {
			meta = document.createElement("meta");
			meta.setAttribute("name", "theme-color");
			document.head.appendChild(meta);
		}
		if (!chromeOn) {
			chromeOn = true;
			metaPrev = metaTo !== null ? metaTo : meta.getAttribute("content") || "";
		}
		setMeta(meta, c, mob);
		h.style.setProperty("--cr-vbgc", c);
		h.classList.add("cr-vtint");
		if (mob) {
			h.style.removeProperty("background-color");
			document.body.style.removeProperty("background-color");
		} else if (h.style.backgroundColor !== c) {
			h.style.setProperty("background-color", c, "important");
			document.body.style.setProperty("background-color", c, "important");
		}
	};
	const apply = () => {
		const h = document.documentElement;
		h.classList.toggle("cr-vbg-white", effBg() === "white");
		h.classList.toggle("cr-vbg-stripe", effBg() === "stripe");
		h.classList.toggle("cr-vgray", st.proof === "gray");
		h.classList.toggle("cr-vsil", effSil());
		const light = effBg() === "white" || effSil();
		h.classList.toggle("cr-vlight", light);
		paint(true);
		syncChrome();
		try {
			localStorage.setItem(KEY, JSON.stringify(st));
		} catch (e) {}
	};
	apply();
	darkQ.addEventListener("change", () => {
		if (st.bg === "auto") apply();
	});
	const CHECK = '<svg class="cr-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
	const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8.25"/><path d="M12 3.75v16.5A8.25 8.25 0 0 0 12 3.75z" fill="currentColor"/></svg>';
	let menu = null;
	const close = () => {
		if (!menu) return;
		const m = menu;
		menu = null;
		m.classList.add("cr-ctx-out");
		setTimeout(() => m.remove(), 130);
	};
	const item = (label, on, run, swatch) => {
		const el = document.createElement("div");
		el.className = "cr-ctx-item" + (on ? " cr-on" : "");
		el.setAttribute("role", "menuitemradio");
		el.setAttribute("aria-checked", on ? "true" : "false");
		el.innerHTML = CHECK + "<span></span>" + (swatch ? '<span class="cr-swatch"><i style="background:' + swatch + '"></i></span>' : "");
		el.children[1].textContent = label;
		el.addEventListener("click", (e) => {
			e.stopPropagation();
			run();
			apply();
			rebuild();
			fillDock();
		});
		return el;
	};
	let anchor = null;
	const rebuild = () => {
		if (!menu) return;
		menu.textContent = "";
		const lab = (t) => {
			const d = document.createElement("div");
			d.className = "cr-ctx-label";
			d.textContent = t;
			menu.appendChild(d);
		};
		const sep = () => {
			const d = document.createElement("div");
			d.className = "cr-ctx-sep";
			menu.appendChild(d);
		};
		lab("Background");
		menu.appendChild(item(crT("setting.syncWithSystem", "System"), st.bg === "auto", () => setBg("auto"), "linear-gradient(135deg, #000 50%, #fff 50%) border-box"));
		menu.appendChild(item("Black", st.bg === "black", () => setBg("black"), "#000"));
		menu.appendChild(item("White", st.bg === "white", () => setBg("white"), "#fff"));
		menu.appendChild(item("Checkerboard", st.bg === "stripe", () => setBg("stripe"), "repeating-conic-gradient(#d4d4d4 0 25%,#bcbcbc 0 50%) 0 0/7px 7px"));
		sep();
		lab("Proofing");
		menu.appendChild(item(crT("fileManager.color", "Color"), st.proof === "none", () => setProof("none")));
		menu.appendChild(item("Grayscale", st.proof === "gray", () => setProof("gray")));
		if (curPng) menu.appendChild(item("Silhouette", effSil(), () => (st.sil = !st.sil)));
	};
	const open = (btn) => {
		if (menu) return close();
		anchor = btn;
		menu = document.createElement("div");
		menu.className = "cr-ctx cr-vmenu";
		menu.setAttribute("role", "menu");
		rebuild();
		document.body.appendChild(menu);
		const r = btn.getBoundingClientRect();
		const mr = menu.getBoundingClientRect();
		menu.style.left = Math.max(8, Math.min(window.innerWidth - mr.width - 8, r.right - mr.width)) + "px";
		menu.style.top = r.bottom + 6 + "px";
		menu.style.setProperty("--cr-ctx-ox", "100%");
		menu.style.setProperty("--cr-ctx-oy", "0");
	};
	let swallow = 0;
	const eat = (e) => {
		if (!swallow || Date.now() - swallow > 800) {
			swallow = 0;
			return;
		}
		if (e.target instanceof Element && e.target.closest(".cr-vmenu")) return;
		e.stopImmediatePropagation();
		if (e.cancelable) e.preventDefault();
		if (e.type === "click") swallow = 0;
	};
	window.addEventListener("pointerdown", (e) => {
		if (menu && !menu.contains(e.target) && !(anchor && anchor.contains(e.target))) {
			close();
			swallow = Date.now();
			eat(e);
		}
	}, true);
	["touchstart", "touchend"].forEach((t) => window.addEventListener(t, eat, { capture: true, passive: false }));
	["mousedown", "pointerup", "mouseup", "click", "dblclick"].forEach((t) => window.addEventListener(t, eat, true));
	window.addEventListener("mousedown", (e) => {
		if (menu && !menu.contains(e.target) && !(anchor && anchor.contains(e.target))) close();
	}, true);
	window.addEventListener("keydown", (e) => {
		if (menu && e.key === "Escape") {
			e.stopImmediatePropagation();
			e.preventDefault();
			close();
		}
	}, true);
	let dock = null;
	let swallowUntil = 0;
	window.addEventListener("pointerdown", (e) => {
		if (!bgPop || !dock) return;
		const t = e.target instanceof Element ? e.target : null;
		if (t && t.closest(".cr-vbgpop, .cr-vbgb")) return;
		setPop(false);
		swallowUntil = Date.now() + 700;
		e.stopPropagation();
		e.preventDefault();
	}, true);
	["pointerup", "mousedown", "mouseup", "touchstart", "touchend", "click", "dblclick"].forEach((t) => window.addEventListener(t, (e) => {
		if (Date.now() < swallowUntil) {
			e.stopImmediatePropagation();
			e.stopPropagation();
			if (e.cancelable) e.preventDefault();
			if (t === "click") swallowUntil = 0;
		}
	}, { capture: true, passive: false }));
	const dockBtn = (cls, on, label, run, html) => {
		const b = document.createElement("button");
		b.type = "button";
		b.className = cls + (on ? " cr-on" : "");
		b.setAttribute("aria-pressed", on ? "true" : "false");
		b.setAttribute("aria-label", label);
		b.title = label;
		if (html) b.innerHTML = html;
		else b.textContent = label;
		b.addEventListener("click", (e) => {
			e.stopPropagation();
			run();
			apply();
			fillDock();
			rebuild();
		});
		return b;
	};
	const setBg = (v) => {
		st.bg = v;
		st.sil = false;
	};
	const setProof = (v) => {
		st.proof = v;
		st.sil = false;
	};
	let bgPop = false;
	const syncSeg = (anim) => {
		if (!dock) return;
		const seg = dock.querySelector(".cr-vseg2");
		if (!seg) return;
		const thumb = seg.querySelector(".cr-vseg-thumb");
		let on = null;
		seg.querySelectorAll(".cr-vdock-t").forEach((b) => {
			const a = b.dataset.v === st.proof && !effSil();
			b.classList.toggle("cr-on", a);
			b.setAttribute("aria-pressed", a ? "true" : "false");
			if (a) on = b;
		});
		if (!thumb) return;
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
	const snapRow = () => {
		if (!dock || !dockRow || !dock.classList.contains("cr-m")) return;
		const seg = dockRow.querySelector(".cr-vseg2");
		if (!seg) return;
		seg.style.width = "";
		const kids = [...dockRow.children];
		const gap = parseFloat(getComputedStyle(dockRow).columnGap) || 0;
		const others = kids.reduce((a, k) => a + (k === seg ? 0 : k.getBoundingClientRect().width), 0) + gap * (kids.length - 1);
		let w = Math.ceil(seg.getBoundingClientRect().width);
		if ((Math.round(dockRow.getBoundingClientRect().width) - Math.round(others) - w) % 2) w += 1;
		seg.style.width = w + "px";
	};
	const setPop = (v) => {
		bgPop = v;
		if (!dock) return;
		const pop = dock.querySelector(".cr-vbgpop");
		const b = dock.querySelector(".cr-vbgb");
		if (b) b.classList.toggle("cr-on", v);
		if (!pop) return;
		if (v) {
			void pop.offsetWidth;
			requestAnimationFrame(() => pop.classList.add("cr-on"));
		} else pop.classList.remove("cr-on");
	};
	const alphaCache = new Map();
	const fileAlpha = new Map();
	const hasAlpha = (img) => {
		if (!img || !img.complete || !img.naturalWidth) return undefined;
		const key = img.currentSrc || img.src;
		if (alphaCache.has(key)) return alphaCache.get(key);
		let res = true;
		try {
			const w = Math.min(256, img.naturalWidth);
			const h = Math.max(1, Math.round(img.naturalHeight * (w / img.naturalWidth)));
			const c = document.createElement("canvas");
			c.width = w;
			c.height = h;
			const ctx = c.getContext("2d", { willReadFrequently: true });
			ctx.drawImage(img, 0, 0, w, h);
			const d = ctx.getImageData(0, 0, w, h).data;
			res = false;
			for (let i = 3; i < d.length; i += 4) if (d[i] < 250) {
				res = true;
				break;
			}
		} catch (e) {
			res = true;
		}
		alphaCache.set(key, res);
		return res;
	};
	const SIL = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.6c.5 0 .9.3 1.2.7l8.1 14.2c.5.9-.1 2-1.2 2H3.9c-1.1 0-1.7-1.1-1.2-2l8.1-14.2c.3-.4.7-.7 1.2-.7z"/></svg>';
	const BGI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8.25"/><path d="M12 3.75v16.5A8.25 8.25 0 0 0 12 3.75z" fill="currentColor"/></svg>';
	let dockRow = null;
	let info = null;
	let infoKey = "";
	const sliderProps = (portal) => {
		const f = cr.slider(portal);
		return f ? f.memoizedProps : null;
	};
	const fmtSize = (n) => {
		if (!(n >= 0)) return "";
		const u = ["B", "KB", "MB", "GB", "TB"];
		let i = 0;
		while (n >= 1024 && i < u.length - 1) {
			n /= 1024;
			i++;
		}
		return (i ? n.toFixed(1) : String(n)) + " " + u[i];
	};
	const activePhoto = (portal) => {
		const cx = window.innerWidth / 2;
		let first = null;
		for (const img of portal.querySelectorAll(".PhotoView__Photo")) {
			const r = img.getBoundingClientRect();
			if (!r.width) continue;
			if (!first) first = img;
			if (r.left <= cx && r.right >= cx) return img;
		}
		return first;
	};
	const profCache = new Map();
	const iccDesc = (b) => {
		const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
		if (b.length < 132) return "";
		const n = dv.getUint32(128);
		for (let i = 0; i < n && 132 + i * 12 + 12 <= b.length; i++) {
			const o = 132 + i * 12;
			if (String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]) !== "desc") continue;
			const off = dv.getUint32(o + 4);
			const type = String.fromCharCode(b[off], b[off + 1], b[off + 2], b[off + 3]);
			if (type === "desc") {
				const len = dv.getUint32(off + 8);
				return String.fromCharCode(...b.subarray(off + 12, off + 12 + len)).replace(/\0+$/, "");
			}
			if (type === "mluc") {
				const rl = dv.getUint32(off + 20);
				const ro = dv.getUint32(off + 24);
				let t = "";
				for (let j = 0; j + 1 < rl; j += 2) t += String.fromCharCode(dv.getUint16(off + ro + j));
				return t.replace(/\0+$/, "");
			}
		}
		return "";
	};
	const inflate = async (data) => {
		if (typeof DecompressionStream === "undefined") return null;
		const ds = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate"));
		return new Uint8Array(await new Response(ds).arrayBuffer());
	};
	const readHead = async (url) => {
		const r = await fetch(url, { headers: { Range: "bytes=0-524287" } });
		const rd = r.body.getReader();
		const parts = [];
		let got = 0;
		while (got < 524288) {
			const { done, value } = await rd.read();
			if (done) break;
			parts.push(value);
			got += value.length;
		}
		rd.cancel().catch(() => {});
		const b = new Uint8Array(got);
		let o = 0;
		parts.forEach((x) => {
			b.set(x, o);
			o += x.length;
		});
		return b;
	};
	const iccName = async (url) => {
		const b = await readHead(url);
		const dv = new DataView(b.buffer);
		const tag = (o) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
		if (b[0] === 0x89 && b[1] === 0x50) {
			for (let o = 8; o + 12 <= b.length; ) {
				const len = dv.getUint32(o);
				const t = tag(o + 4);
				if (t === "sRGB" || t === "IDAT") return "";
				if (t === "iCCP") {
					const d = b.subarray(o + 8, o + 8 + len);
					const z = d.indexOf(0);
					const label = String.fromCharCode(...d.subarray(0, z));
					try {
						const prof = await inflate(d.subarray(z + 2));
						return (prof && iccDesc(prof)) || label;
					} catch (e) {
						return label;
					}
				}
				o += 12 + len;
			}
			return "";
		}
		if (b[0] === 0xff && b[1] === 0xd8) {
			const segs = [];
			for (let o = 2; o + 4 <= b.length; ) {
				if (b[o] !== 0xff) break;
				const m = b[o + 1];
				if (m === 0xda || m === 0xd9) break;
				const len = dv.getUint16(o + 2);
				if (m === 0xe2 && String.fromCharCode(...b.subarray(o + 4, o + 15)) === "ICC_PROFILE") segs.push([b[o + 16], b.subarray(o + 18, o + 2 + len)]);
				o += 2 + len;
			}
			if (!segs.length) return "";
			segs.sort((x, y) => x[0] - y[0]);
			const total = segs.reduce((a, x) => a + x[1].length, 0);
			const prof = new Uint8Array(total);
			let p = 0;
			segs.forEach((x) => {
				prof.set(x[1], p);
				p += x[1].length;
			});
			return iccDesc(prof);
		}
		if (tag(0) === "RIFF" && tag(8) === "WEBP") {
			for (let o = 12; o + 8 <= b.length; ) {
				const len = dv.getUint32(o + 4, true);
				if (tag(o) === "ICCP") return iccDesc(b.subarray(o + 8, o + 8 + len));
				o += 8 + len + (len & 1);
			}
		}
		return "";
	};
	const profileOf = (img) => {
		const src = img && (img.currentSrc || img.src);
		if (!src) return "";
		if (!profCache.has(src)) {
			profCache.set(src, "");
			iccName(src)
				.then((n) => {
					const t = (n || "").trim();
					if (t && !/srgb/i.test(t)) {
						profCache.set(src, t);
						infoKey = "";
					}
				})
				.catch(() => {});
		}
		return profCache.get(src);
	};
	const syncInfo = (portal) => {
		if (!info) return;
		const p = sliderProps(portal);
		const it = p && p.images[p.index];
		const file = it && it.file;
		const img = activePhoto(portal);
		const name = (file && file.name) || "";
		const res = img && img.naturalWidth ? img.naturalWidth + " × " + img.naturalHeight + " px" : "";
		const mob = mobile.matches;
		const size = file && typeof file.size === "number" ? fmtSize(file.size) : "";
		const c = portal.querySelector(".PhotoView-Slider__Counter");
		const count = c ? c.textContent.trim().replace(/\s+/g, " ") : "";
		const prof = profileOf(img);
		const key = name + "|" + res + "|" + size + "|" + count + "|" + mob + "|" + prof;
		if (key === infoKey) return;
		infoKey = key;
		const set = (el, parts) => {
			el.textContent = "";
			parts.filter((x) => x[1]).forEach(([cls, t]) => {
				const e = document.createElement("span");
				e.className = cls;
				e.textContent = t;
				el.appendChild(e);
			});
			el.style.display = el.childNodes.length ? "" : "none";
		};
		set(info.children[0].querySelector(".cr-vname-t"), [["cr-vinfo-c", count], ["cr-vinfo-n", name]]);
		if (name) {
			const ne = document.createElement("span");
			ne.className = "cr-vname-e";
			crT.set(ne, "fileManager.rename", "Rename", "aria");
			ne.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 19.5l1-4.2L15.8 5a2.1 2.1 0 0 1 3 0l.2.2a2.1 2.1 0 0 1 0 3L8.7 18.5z"/><path d="M13.8 7l3.2 3.2"/></svg>';
			info.children[0].querySelector(".cr-vname-t").appendChild(ne);
		}
		const meta = info.children[1];
		if (mob) {
			set(meta.children[0], [["cr-vinfo-m", res], ["cr-vinfo-m cr-vinfo-sep", size]]);
			set(meta.children[1], [["cr-vinfo-m", prof]]);
			set(meta.children[2], []);
		} else {
			set(meta.children[0], [["cr-vinfo-m", res]]);
			set(meta.children[1], [["cr-vinfo-m", size]]);
			set(meta.children[2], [["cr-vinfo-m", prof]]);
		}
		meta.style.display = res || size ? "" : "none";
		info.children[0].title = name;
	};
	const dockKey = () => [mobile.matches, bgPop, effSil(), st.bg, st.proof].join("|");
	const fillSil = (silWrap) => {
		silWrap.textContent = "";
		if (curPng) {
			const sp = document.createElement("div");
			sp.className = "cr-vdock-g cr-vround cr-vsilp" + (effSil() ? " cr-on" : "");
			sp.appendChild(dockBtn("cr-vt-b cr-vsilb", effSil(), effSil() ? "Silhouette on" : "Silhouette", () => (st.sil = !st.sil), SIL));
			silWrap.appendChild(sp);
		}
		silWrap.dataset.png = curPng ? "1" : "";
	};
	const fillDock = () => {
		if (!dock) return;
		if (!dockRow) {
			dockRow = document.createElement("div");
			dockRow.className = "cr-vdock-row";
			dock.appendChild(dockRow);
		}
		const keepSil = dockRow.querySelector(":scope > .cr-vsilwrap");
		if (keepSil && dockRow.dataset.k === dockKey()) {
			if (keepSil.dataset.png !== (curPng ? "1" : "")) fillSil(keepSil);
			paint(true);
			return;
		}
		dockRow.textContent = "";
		const row = (cls, items) => {
			const g = document.createElement("div");
			g.className = "cr-vdock-g " + cls;
			items.forEach((x) => g.appendChild(x));
			dockRow.appendChild(g);
		};
		const BGS = [["auto", "System", "linear-gradient(135deg,#000 50%,#fff 50%) border-box", "#808080"], ["black", "Black", "#000", "#fff"], ["white", "White", "#fff", "#000"], ["stripe", "Checkerboard", "repeating-conic-gradient(#d4d4d4 0 25%,#bcbcbc 0 50%) 0 0/8px 8px", "#000"]];
		const sw = (v, label, bg, dot, extra) => dockBtn("cr-vdock-sw" + (extra || ""), st.bg === v && !effSil(), label, () => {
			setBg(v);
			bgPop = false;
		}, '<i style="background:' + bg + ";--cr-dot:" + dot + '"></i>');
		if (mobile.matches) {
			const wrap = document.createElement("div");
			wrap.className = "cr-vbgwrap";
			const pick = document.createElement("div");
			pick.className = "cr-vdock-g cr-vround cr-vbgpick";
			const pb = document.createElement("button");
			pb.type = "button";
			pb.className = "cr-vt-b cr-vbgb" + (bgPop ? " cr-on" : "");
			pb.setAttribute("aria-label", "Background");
			pb.innerHTML = BGI;
			pb.addEventListener("click", (e) => {
				e.stopPropagation();
				setPop(!bgPop);
			});
			pick.appendChild(pb);
			wrap.appendChild(pick);
			const pop = document.createElement("div");
			pop.className = "cr-vdock-g cr-vbgpop" + (bgPop ? " cr-on" : "");
			BGS.forEach((x) => pop.appendChild(sw(x[0], x[1], x[2], x[3], " cr-circ")));
			wrap.appendChild(pop);
			dockRow.appendChild(wrap);
		} else {
			row("cr-vdock-sws", BGS.map((x) => sw(x[0], x[1], x[2], x[3])));
		}
		const seg = document.createElement("div");
		seg.className = "cr-vdock-g cr-vdock-seg cr-vseg2";
		const thumb = document.createElement("i");
		thumb.className = "cr-vseg-thumb";
		seg.appendChild(thumb);
		const mk = (v, label) => {
			const b = document.createElement("button");
			b.type = "button";
			b.className = "cr-vdock-t";
			b.dataset.v = v;
			b.textContent = label;
			b.addEventListener("click", (e) => {
				e.stopPropagation();
				if (seg.dataset.crNoclick) return;
				const wasSil = effSil();
				setProof(v);
				apply();
				rebuild();
				if (wasSil) fillDock();
				else syncSeg(true);
			});
			return b;
		};
		seg.append(mk("none", "Color"), mk("gray", "Grayscale"));
		let dg = null;
		seg.addEventListener("pointerdown", (e) => {
			if (e.button !== 0 || effSil()) return;
			const on = seg.querySelector(".cr-vdock-t.cr-on");
			if (!on) return;
			const r = on.getBoundingClientRect();
			if (e.clientX < r.left - 4 || e.clientX > r.right + 4) return;
			dg = { x0: e.clientX, left: on.offsetLeft, w: on.offsetWidth, moved: false, id: e.pointerId };
			try {
				seg.setPointerCapture(e.pointerId);
			} catch (err) {}
		});
		seg.addEventListener("pointermove", (e) => {
			if (!dg || e.pointerId !== dg.id) return;
			const dx = e.clientX - dg.x0;
			if (!dg.moved && Math.abs(dx) < 4) return;
			dg.moved = true;
			const btns = [...seg.querySelectorAll(".cr-vdock-t")];
			const min = btns[0].offsetLeft;
			const last = btns[btns.length - 1];
			const max = last.offsetLeft + last.offsetWidth - dg.w;
			const x = Math.max(min - 6, Math.min(max + 6, dg.left + dx));
			thumb.style.transition = "none";
			thumb.style.width = dg.w + "px";
			thumb.style.transform = "translateX(" + x + "px) scale(1.08, 0.88)";
			thumb.classList.add("cr-drag");
			dg.x = x;
		});
		const endDg = (e) => {
			if (!dg || e.pointerId !== dg.id) return;
			const d = dg;
			dg = null;
			thumb.classList.remove("cr-drag");
			thumb.style.transition = "";
			if (!d.moved) return;
			seg.dataset.crNoclick = "1";
			setTimeout(() => delete seg.dataset.crNoclick, 0);
			const c = d.x + d.w / 2;
			let best = null;
			let bd = Infinity;
			seg.querySelectorAll(".cr-vdock-t").forEach((b) => {
				const bc = b.offsetLeft + b.offsetWidth / 2;
				if (Math.abs(bc - c) < bd) {
					bd = Math.abs(bc - c);
					best = b;
				}
			});
			if (best && best.dataset.v !== st.proof) {
				setProof(best.dataset.v);
				apply();
				rebuild();
			}
			syncSeg(true);
		};
		seg.addEventListener("pointerup", endDg);
		seg.addEventListener("pointercancel", endDg);
		dockRow.appendChild(seg);
		syncSeg(false);
		requestAnimationFrame(() => {
			snapRow();
			syncSeg(false);
		});
		const silWrap = document.createElement("div");
		silWrap.className = "cr-vsilwrap";
		fillSil(silWrap);
		dockRow.appendChild(silWrap);
		dockRow.dataset.k = dockKey();
		paint(true);
	};
	const fine = matchMedia("(hover: hover) and (pointer: fine)");
	let hintFor = null;
	let hintGone = 0;
	const touchOnly = matchMedia("(hover: none) and (pointer: coarse)");
	const playHint = (portal) => {
		if (touchOnly.matches) return;
		const pr = sliderProps(portal);
		if (!pr || pr.images.filter((x) => x && x.file).length < 2) return;
		const h = document.createElement("div");
		h.className = "cr-vhint" + (mobile.matches ? " cr-m" : "");
		const chev = (d) => '<span class="cr-vhint-' + d + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + (d === "l" ? "M14.5 5.5L8 12l6.5 6.5" : "M9.5 5.5L16 12l-6.5 6.5") + '"/></svg></span>';
		h.innerHTML = chev("l") + chev("r");
		document.body.appendChild(h);
		paint(true);
		setTimeout(() => h.remove(), 1900);
	};
	let edges = null;
	const syncEdges = (portal) => {
		const want = !!portal && !portal.classList.contains("PhotoView-Slider__willClose") && fine.matches;
		if (want && !edges) {
			edges = document.createElement("div");
			edges.className = "cr-vedges";
			edges.innerHTML = '<i class="cr-vedge cr-vedge-l"></i><i class="cr-vedge cr-vedge-r"></i>';
			document.body.appendChild(edges);
		} else if (!want && edges) {
			edges.remove();
			edges = null;
		}
		if (edges) edges.classList.toggle("cr-side", !!portal && portal.matches('[style*="300px"]'));
	};
	const syncDock = () => {
		const portal = document.querySelector(".PhotoView-Portal");
		syncEdges(portal);
		if (!portal) {
			if (!hintGone) hintGone = performance.now();
			else if (hintFor && performance.now() - hintGone > 600) hintFor = null;
		} else hintGone = 0;
		if (portal && !hintFor && !portal.classList.contains("PhotoView-Slider__willClose") && sliderProps(portal)) {
			hintFor = portal;
			setTimeout(() => {
				if (portal.isConnected) playHint(portal);
			}, 350);
		}
		if (!portal) hintFor = null;
		const showTop = !!portal && !!portal.querySelector(".PhotoView-Slider__BannerWrap") && !portal.classList.contains("PhotoView-Slider__willClose");
		const show = showTop;
		syncTop(portal, showTop);
		if (!showTop && strip) strip.classList.remove("cr-on");
		if (!show) {
			if (dock) dock.classList.remove("cr-on");
			if (bgPop) {
				bgPop = false;
				if (dock) fillDock();
			}
			return;
		}
		const sp = sliderProps(portal);
		const cf = sp && sp.images[sp.index] && sp.images[sp.index].file;
		const pngName = !!(cf && /\.png$/i.test(cf.name || ""));
		const fkey = cf ? cf.path || cf.id || cf.name : "";
		let alpha = pngName ? fileAlpha.get(fkey) : false;
		if (alpha === undefined) {
			alpha = cf && cf.id ? hasAlpha(portal.querySelector('img.PhotoView__Photo[id="' + CSS.escape(cf.id) + '"]')) : undefined;
			if (alpha !== undefined) fileAlpha.set(fkey, alpha);
		}
		let changed = false;
		if (alpha !== undefined) {
			const png = pngName && alpha === true;
			if (png !== curPng) {
				curPng = png;
				changed = true;
			}
			if (!png && st.sil) {
				st.sil = false;
				changed = true;
			}
		}
		const mobNow = mobile.matches;
		if (dock && dock.classList.contains("cr-m") !== mobNow) {
			dock.classList.toggle("cr-m", mobNow);
			changed = true;
		}
		if (changed) {
			apply();
			if (dock) fillDock();
		}
		if (!dock) {
			dock = document.createElement("div");
			dock.className = "cr-vdock" + (mobNow ? " cr-m" : "");
			["pointerdown", "mousedown", "mouseup", "click", "dblclick", "contextmenu"].forEach((t) => dock.addEventListener(t, (e) => e.stopPropagation()));
			["touchstart", "touchmove", "touchend"].forEach((t) => dock.addEventListener(t, (e) => e.stopPropagation(), { passive: true }));
			document.body.appendChild(dock);
			fillDock();
		}
		dock.classList.toggle("cr-side", portal.matches('[style*="300px"]'));
		dock.classList.add("cr-on");
	};
	let top = null;
	let topBtns = null;
	let topClose = null;
	const mobile = matchMedia("(hover: none) and (pointer: coarse) and (orientation: portrait), (max-width: 599px)");
	let topKey = "";
	const sig = (b) => {
		if (b.classList.contains("cr-vbtn")) return "cr-vbtn";
		const p = b.querySelector("path");
		return p ? (p.getAttribute("d") || "").slice(0, 16) : "";
	};
	const openRename = () => {
		const bar = document.querySelector(".PhotoView-Portal .PhotoView-Slider__BannerRight");
		const more = bar ? [...bar.children].find((x) => x.classList.contains("MuiIconButton-root") && x.querySelector('path[d^="M8 12a2 2 0 1"]')) : null;
		if (!more) return;
		const html = document.documentElement;
		html.classList.add("cr-ghostmenu");
		const r = more.getBoundingClientRect();
		more.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window, clientX: r.left, clientY: r.bottom }));
		const t0 = performance.now();
		const look = () => {
			const it = [...document.querySelectorAll('.MuiPopover-root [role="menu"] [role="menuitem"]')].find((m) => /^\s*rename\s*$/i.test(m.textContent || ""));
			if (it) {
				it.click();
				setTimeout(() => html.classList.remove("cr-ghostmenu"), 250);
				return;
			}
			if (performance.now() - t0 > 1200) {
				const m = document.querySelector('.MuiPopover-root [role="menu"]');
				if (m) m.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true, cancelable: true }));
				setTimeout(() => html.classList.remove("cr-ghostmenu"), 250);
				return;
			}
			requestAnimationFrame(look);
		};
		look();
	};
	const liveSource = (key) => {
		const bar = document.querySelector(".PhotoView-Portal .PhotoView-Slider__BannerRight");
		return bar ? [...bar.children].find((b) => b.classList.contains("MuiIconButton-root") && sig(b) === key) : null;
	};
	const buildTop = (sources, mob) => {
		topBtns.textContent = "";
		topClose.textContent = "";
		const namePillEl = info && info.children[0];
		if (namePillEl) namePillEl.querySelectorAll(".cr-vt-more").forEach((x) => x.remove());
		sources.forEach((src) => {
			if (mob && (src.classList.contains("cr-vbtn") || sig(src).startsWith(DLP.slice(0, 16)))) return;
			if (src.classList.contains("cr-vbtn")) {
				const vb = document.createElement("button");
				vb.type = "button";
				vb.className = "cr-vt-b";
				vb.setAttribute("aria-label", "View options");
				vb.innerHTML = ICON;
				vb.addEventListener("click", (e) => {
					e.stopPropagation();
					open(vb);
				});
				topBtns.appendChild(vb);
				return;
			}
			const key = sig(src);
			const isDl = key.startsWith(DLP.slice(0, 16));
			const isClose = key.startsWith(CLP);
			const b = document.createElement("button");
			b.type = "button";
			b.className = "cr-vt-b" + (isDl ? " cr-lp" : isClose ? "" : " cr-vt-more");
			const svg = src.querySelector("svg");
			if (isClose) {
				b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
			} else if (svg) {
				const c = svg.cloneNode(true);
				c.removeAttribute("style");
				c.removeAttribute("data-cr-pal");
				c.removeAttribute("class");
				b.appendChild(c);
			}
			const label = isDl ? crT("fileManager.download", "Download") : isClose ? crT("common:close", "Close") : src.getAttribute("aria-label") || "";
			b.setAttribute("aria-label", label);
			if (isDl) {
				const t = document.createElement("span");
				t.className = "cr-lp-t";
				crT.set(t, "fileManager.download", "Download");
				b.appendChild(t);
			} else if (label) {
				b.addEventListener("mouseenter", () => showTip(b, label));
				b.addEventListener("mouseleave", hideTip);
			}
			b.addEventListener("click", (e) => {
				e.stopPropagation();
				hideTip();
				const openMenu = document.querySelector('.MuiPopover-root:not([aria-hidden="true"]) [role="menu"]');
				if (openMenu && !isDl && !isClose) {
					openMenu.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true, cancelable: true }));
					return;
				}
				const live = liveSource(key);
				if (!live) return;
				const r = b.getBoundingClientRect();
				live.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window, clientX: mob ? r.right : r.left, clientY: r.bottom + 6 }));
			});
			(isClose ? topClose : !isDl && !mob && namePillEl ? namePillEl : topBtns).appendChild(b);
		});
	};
	const syncTop = (portal, show) => {
		if (!show) {
			if (top) top.classList.remove("cr-on");
			return;
		}
		if (!top) {
			top = document.createElement("div");
			top.className = "cr-vtop";
			info = document.createElement("div");
			info.className = "cr-vinfo";
			const namePill = document.createElement("div");
			namePill.className = "cr-vdock-g cr-vinfo-p";
			const nameText = document.createElement("div");
			nameText.className = "cr-vname-t";
			namePill.appendChild(nameText);
			nameText.addEventListener("click", (e) => {
				if (matchMedia("(hover: none)").matches || !e.target.closest(".cr-vinfo-n, .cr-vname-e")) return;
				e.stopPropagation();
				openRename();
			});
			const metaRow = document.createElement("div");
			metaRow.className = "cr-vmeta";
			for (let k = 0; k < 3; k++) {
				const pill = document.createElement("div");
				pill.className = "cr-vdock-g cr-vinfo-p cr-vinfo-s";
				metaRow.appendChild(pill);
			}
			info.append(namePill, metaRow);
			topBtns = document.createElement("div");
			topBtns.className = "cr-vdock-g cr-vbtns";
			topClose = document.createElement("div");
			topClose.className = "cr-vdock-g cr-vbtns cr-vclose";
			top.append(topClose, info, topBtns);
			["pointerdown", "mousedown", "mouseup", "click", "dblclick", "contextmenu", "wheel"].forEach((t) => top.addEventListener(t, (e) => e.stopPropagation()));
			["touchstart", "touchmove", "touchend"].forEach((t) => top.addEventListener(t, (e) => e.stopPropagation(), { passive: true }));
			document.body.appendChild(top);
			paint(true);
		}
		syncInfo(portal);
		const bar = portal.querySelector(".PhotoView-Slider__BannerRight");
		const sources = bar ? [...bar.children].filter((b) => b.classList.contains("MuiIconButton-root") && getComputedStyle(b).display !== "none") : [];
		const mob = mobile.matches;
		const key = sources.map(sig).join(",") + (mob ? "|m" : "");
		if (key !== topKey) {
			topKey = key;
			buildTop(sources, mob);
		}
		top.classList.toggle("cr-m", mob);
		top.classList.toggle("cr-side", portal.matches('[style*="300px"]'));
		top.classList.add("cr-on");
		syncStrip(portal, mob);
	};
	let strip = null;
	let stripLock = 0;
	let stripKey = "";
	let stripIdx = -1;
	const thumbs = new Map();
	const sliderGo = (portal) => {
		let f = cr.fiberOf(portal);
		while (f) {
			const pr = f.memoizedProps;
			if (pr && Array.isArray(pr.images) && typeof pr.index === "number") {
				let h = f.memoizedState;
				while (h && typeof h === "object" && "next" in h) {
					const v = h.memoizedState;
					if (v && v.current && v.current.curr && typeof v.current.curr.changeIndex === "function") return v.current.curr.changeIndex;
					h = h.next;
				}
			}
			f = f.return;
		}
		return null;
	};
	const gridThumbs = () => {
		document.querySelectorAll("main [data-rect-id] img, main .MuiImageListItem-root img").forEach((img) => {
			if (!img.src || img.src.startsWith("data:")) return;
			const p = cr.up(img, (x) => x.file && x.file.path, 30);
			if (p && !thumbs.has(p.file.path)) thumbs.set(p.file.path, img.src);
		});
	};
	const cacheThumbs = () => {
		const stv = cr.store();
		const fm = stv && stv.getState().fileManager;
		const tree = fm && fm[0] && fm[0].tree;
		if (!tree) return;
		for (const k in tree) {
			const th = tree[k] && tree[k].thumb;
			if (th && th.src && thumbs.get(k) !== th.src) thumbs.set(k, th.src);
		}
	};
	const askedAt = new Map();
	const askThumb = (path) => {
		const last = askedAt.get(path) || 0;
		if (Date.now() - last < 5000) return;
		askedAt.set(path, Date.now());
		for (const el of document.querySelectorAll("main [data-rect-id], main .MuiImageListItem-root")) {
			let f = cr.fiberOf(el);
			let file = null;
			for (let i2 = 0; f && i2 < 25; i2++, f = f.return) {
				const pp = f.memoizedProps;
				if (!file && pp && pp.file && pp.file.path) {
					if (pp.file.path !== path) break;
					file = pp.file;
				}
				if (file && typeof f.type === "function") {
					let h = f.memoizedState;
					for (let n = 0; h && typeof h === "object" && "next" in h && n < 300; n++, h = h.next) {
						const v = h.memoizedState;
						if (Array.isArray(v) && v.length === 2 && typeof v[0] === "function" && v[0].length === 0 && Array.isArray(v[1]) && v[1].length === 4 && v[1][1] === file && typeof v[1][3] === "function") {
							try {
								v[0]();
							} catch (e) {}
							return;
						}
					}
				}
			}
		}
	};
	const fillThumb = (el, path) => {
		const src = thumbs.get(path);
		if (src && el.dataset.src !== src) {
			el.dataset.src = src;
			el.style.backgroundImage = "url(" + JSON.stringify(src) + ")";
		}
	};
	const syncStrip = (portal, mob) => {
		if (!mob) {
			if (strip) strip.classList.remove("cr-on");
			return;
		}
		const p = sliderProps(portal);
		if (!p) return;
		const items = p.images.map((it, i) => ({ it, i })).filter((x) => x.it && x.it.file);
		if (items.length < 2) {
			if (strip) strip.classList.remove("cr-on");
			return;
		}
		if (!strip) {
			strip = document.createElement("div");
			strip.className = "cr-vstrip";
			let scT = 0;
			strip.addEventListener("scroll", () => {
				if (Date.now() < stripLock) return;
				clearTimeout(scT);
				const pick = () => {
					const all = [...strip.querySelectorAll(".cr-vthumb")];
					const k = Math.max(0, Math.min(all.length - 1, Math.round(strip.scrollLeft / 28)));
					const t = all[k];
					if (!t) return;
					const i = Number(t.dataset.i);
					const pr = sliderProps(document.querySelector(".PhotoView-Portal"));
					if (pr && pr.index !== i) {
						const go = sliderGo(document.querySelector(".PhotoView-Portal"));
						if (go) {
							stripIdx = i;
							all.forEach((b) => b.classList.toggle("cr-on", b === t));
							go(i);
						}
					}
				};
				pick();
				scT = setTimeout(() => {
					const all = [...strip.querySelectorAll(".cr-vthumb")];
					const k = all.findIndex((b) => b.classList.contains("cr-on"));
					if (k >= 0 && Math.abs(strip.scrollLeft - k * 28) > 1) {
						stripLock = Date.now() + 450;
						strip.scrollTo({ left: k * 28, behavior: "smooth" });
					}
				}, 140);
			}, { passive: true });
			["pointerdown", "mousedown", "mouseup", "click", "dblclick", "contextmenu"].forEach((t) => strip.addEventListener(t, (e) => e.stopPropagation()));
			["touchstart", "touchmove", "touchend"].forEach((t) => strip.addEventListener(t, (e) => e.stopPropagation(), { passive: true }));
			document.body.appendChild(strip);
			paint(true);
		}
		gridThumbs();
		cacheThumbs();
		const key = items.map((x) => x.it.key).join(",");
		if (key !== stripKey) {
			stripKey = key;
			stripIdx = -1;
			strip.textContent = "";
			items.forEach(({ it, i }) => {
				const b = document.createElement("button");
				b.type = "button";
				b.className = "cr-vthumb";
				b.dataset.i = String(i);
				b.dataset.path = it.file.path;
				b.setAttribute("aria-label", it.file.name || "");
				b.addEventListener("click", (e) => {
					e.stopPropagation();
					const go = sliderGo(document.querySelector(".PhotoView-Portal"));
					if (go) go(i);
				});
				strip.appendChild(b);
			});
		}
		strip.querySelectorAll(".cr-vthumb").forEach((b) => {
			const path = b.dataset.path;
			if (!thumbs.has(path)) askThumb(path);
			fillThumb(b, path);
		});
		if (p.index !== stripIdx) {
			const first = stripIdx === -1;
			stripIdx = p.index;
			const all = [...strip.querySelectorAll(".cr-vthumb")];
			all.forEach((b) => b.classList.toggle("cr-on", Number(b.dataset.i) === p.index));
			const k = all.findIndex((b) => Number(b.dataset.i) === p.index);
			if (k >= 0 && Math.abs(strip.scrollLeft - k * 28) > 1) {
				stripLock = Date.now() + 450;
				strip.scrollTo({ left: k * 28, behavior: first ? "auto" : "smooth" });
			}
		}
		strip.classList.add("cr-on");
	};
	setInterval(syncDock, 150);
	const vp = document.querySelector('meta[name="viewport"]');
	if (vp && !/viewport-fit/.test(vp.content)) vp.setAttribute("content", vp.content + ",viewport-fit=cover");
	const DLP = "M18.25 20.5a.75.75";
	const CLP = "m4.21 4.387";
	let tip = null;
	let tipT = 0;
	const hideTip = () => {
		clearTimeout(tipT);
		if (tip) tip.classList.remove("cr-on");
	};
	const showTip = (b, text) => {
		clearTimeout(tipT);
		tipT = setTimeout(() => {
			if (!b.isConnected || !b.matches(":hover")) return;
			if (!tip) {
				tip = document.createElement("div");
				tip.className = "cr-tip";
				document.body.appendChild(tip);
			}
			tip.textContent = text;
			const r = b.getBoundingClientRect();
			tip.style.left = r.left + r.width / 2 + "px";
			tip.style.top = r.bottom + 10 + "px";
			const w = tip.offsetWidth;
			const x = Math.min(window.innerWidth - w / 2 - 6, r.left + r.width / 2);
			tip.style.left = x + "px";
			tip.classList.add("cr-on");
		}, 350);
	};
	const inject = () => {
		paint(false);
		syncChrome();
		if (!document.querySelector(".PhotoView-Portal")) {
			hideTip();
			document.documentElement.classList.remove("cr-notip");
		}
		document.querySelectorAll(".PhotoView-Slider__BannerRight > .MuiIconButton-root").forEach((b) => {
			if (b.querySelector('path[d^="' + CLP + '"]') && !b.dataset.crTip) {
				b.dataset.crTip = "1";
				b.addEventListener("mouseenter", () => showTip(b, "Close"));
				b.addEventListener("mouseleave", hideTip);
				b.addEventListener("click", hideTip);
			}
			if (!b.querySelector('path[d^="' + DLP + '"]')) return;
			if (!b.dataset.crNotip) {
				b.dataset.crNotip = "1";
				b.addEventListener("mouseenter", () => document.documentElement.classList.add("cr-notip"));
				b.addEventListener("mouseleave", () => setTimeout(() => {
					if (!b.matches(":hover")) document.documentElement.classList.remove("cr-notip");
				}, 600));
			}
			b.classList.add("cr-dl");
			if (!b.querySelector(":scope > .cr-dl-t")) {
				const t = document.createElement("span");
				t.className = "cr-dl-t";
				t.textContent = "Download";
				b.appendChild(t);
			}
		});
		const bar = document.querySelector(".PhotoView-Portal .PhotoView-Slider__BannerRight");
		if (!bar) {
			close();
			return;
		}
		if (bar.querySelector(":scope > .cr-vbtn")) return;
		const b = document.createElement("button");
		b.type = "button";
		b.className = "MuiButtonBase-root MuiIconButton-root cr-vbtn";
		b.title = "View options";
		b.setAttribute("aria-label", "View options");
		b.innerHTML = ICON;
		b.addEventListener("click", (e) => {
			e.stopPropagation();
			open(b);
		});
		bar.insertBefore(b, bar.firstChild);
	};
	const peekFine = matchMedia("(hover: hover) and (pointer: fine)");
	let peek = null;
	let peekPt = null;
	let peekRaf = 0;
	const peekDir = () => {
		const h = document.documentElement;
		return h.classList.contains("cr-cur-prev") ? -1 : h.classList.contains("cr-cur-next") ? 1 : 0;
	};
	const syncPeek = () => {
		peekRaf = 0;
		const d = peekFine.matches ? peekDir() : 0;
		const portal = d ? document.querySelector(".PhotoView-Portal:not(.PhotoView-Slider__willClose)") : null;
		const p = portal ? sliderProps(portal) : null;
		const list = p ? p.images.map((x, i) => [x, i]).filter(([x]) => x && x.file) : [];
		const at = list.findIndex(([, i]) => i === p.index);
		const it = at >= 0 && list.length > 1 ? list[(at + d + list.length) % list.length][0] : null;
		const path = it && it.file.path;
		if (!path || !peekPt) {
			if (peek) peek.classList.remove("cr-on");
			return;
		}
		if (!peek) {
			peek = document.createElement("div");
			peek.className = "cr-vpeek";
			peek.setAttribute("aria-hidden", "true");
			const t = document.createElement("div");
			t.className = "cr-vthumb cr-on";
			peek.appendChild(t);
			document.body.appendChild(peek);
		}
		const t = peek.firstChild;
		if (!thumbs.has(path)) {
			cacheThumbs();
			if (!thumbs.has(path)) askThumb(path);
		}
		if (t.dataset.path !== path) {
			t.dataset.path = path;
			t.dataset.src = "";
			t.style.backgroundImage = "";
		}
		fillThumb(t, path);
		const w = peek.offsetWidth;
		const hh = peek.offsetHeight;
		const x = d < 0 ? Math.min(peekPt[0] + 22, window.innerWidth - w - 8) : Math.max(peekPt[0] - 22 - w, 8);
		const y = Math.min(Math.max(peekPt[1] - hh / 2, 8), window.innerHeight - hh - 8);
		peek.style.translate = x + "px " + y + "px";
		peek.style.transformOrigin = d < 0 ? "left center" : "right center";
		peek.classList.add("cr-on");
	};
	const queuePeek = () => {
		if (!peekRaf) peekRaf = requestAnimationFrame(syncPeek);
	};
	window.addEventListener(
		"pointermove",
		(e) => {
			if (e.pointerType && e.pointerType !== "mouse") return;
			peekPt = [e.clientX, e.clientY];
			if (peekDir() || (peek && peek.classList.contains("cr-on"))) queuePeek();
		},
		{ passive: true }
	);
	new MutationObserver(queuePeek).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
	setInterval(inject, 300);
})();
