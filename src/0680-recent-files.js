(() => {
	const MAX = 30;
	const SHOW = 12;
	const MY = /^cloudreve:\/\/my\//;
	const SHARE = /^cloudreve:\/\/([^/:@]+)(?::[^/@]*)?@share(\/|$)/;
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
	const keyOf = (path) => {
		const s = SHARE.exec(path);
		if (!s && !MY.test(path)) return "";
		const cur = session();
		if (cur && cur.user && cur.user.id) return "cr-recent:" + cur.user.id;
		return s ? "cr-recent:s:" + s[1] : "";
	};
	const mem = new Map();
	const read = (key) => {
		if (mem.has(key)) return mem.get(key);
		let v = [];
		try {
			v = JSON.parse(localStorage.getItem(key) || "[]");
		} catch (e) {}
		if (!Array.isArray(v)) v = [];
		mem.set(key, v);
		return v;
	};
	const write = (key, list) => {
		mem.set(key, list.slice(0, MAX));
		try {
			localStorage.setItem(key, JSON.stringify(mem.get(key)));
		} catch (e) {}
	};
	const record = (file) => {
		const key = keyOf(file.path);
		if (!key) return;
		const list = read(key).filter((x) => x.path !== file.path);
		const link = (file.metadata && file.metadata["sys:shared_redirect"]) || "";
		const entry = { path: file.path, name: file.name, at: Date.now() };
		if (link) entry.link = link;
		list.unshift(entry);
		write(key, list);
		sync();
	};
	const forget = (path) => {
		const key = keyOf(path);
		if (key) write(key, read(key).filter((x) => x.path !== path));
		sync();
	};
	const fm = () => {
		const s = cr.store();
		const f = s && s.getState().fileManager;
		return (f && f[0]) || null;
	};
	const curPath = () => {
		const f = fm();
		if (f && f.path) return f.path;
		try {
			return new URLSearchParams(location.search).get("path") || "";
		} catch (e) {
			return "";
		}
	};
	const navPath = () => {
		let q = "";
		try {
			q = new URLSearchParams(location.search).get("path") || "";
		} catch (e) {}
		if (q || location.pathname.startsWith("/home")) return q;
		const f = fm();
		return (f && f.path) || "";
	};
	const rootKey = () => {
		const p = navPath();
		if (location.pathname.startsWith("/home") && (!p || /^cloudreve:\/\/my\/?$/.test(p))) return keyOf("cloudreve://my/");
		if (/^cloudreve:\/\/[^/]+@share\/?$/.test(p)) return keyOf(p);
		return "";
	};
	const parentOf = (path) => path.slice(0, path.lastIndexOf("/"));
	const norm = (p) => (p || "").replace(/^(cloudreve:\/\/[^/:@]+):[^/@]*@/, "$1@").replace(/\/$/, "");
	const same = (a, b) => norm(a) === norm(b);
	const tileOf = (path) => {
		for (const el of document.querySelectorAll("main [data-rect-id], main .MuiImageListItem-root")) {
			const f = cr.fileOf(el, 30);
			if (f && same(f.path, path)) return el;
		}
		return null;
	};
	let opening = 0;
	const open = (path) => {
		const id = ++opening;
		const parent = parentOf(path);
		if (!same(curPath(), parent)) {
			const r = cr.router();
			if (!r) return;
			r.navigate("/home?" + new URLSearchParams({ path: parent }).toString());
		}
		const t0 = Date.now();
		const tick = () => {
			if (id !== opening) return;
			const el = tileOf(path);
			if (el) {
				el.scrollIntoView({ block: "nearest" });
				el.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true, detail: 2 }));
				return;
			}
			const f = fm();
			const list = f && f.list && f.list.parent && same(f.list.parent.path, parent) ? f.list : null;
			if (list && Array.isArray(list.files) && !(list.pagination && list.pagination.next_token) && !list.files.some((x) => same(x.path, path))) return forget(path);
			if (Date.now() - t0 < 6000) setTimeout(tick, 100);
		};
		setTimeout(tick, 0);
	};
	const known = (path) => {
		const f = fm();
		const tree = f && f.tree;
		if (!tree) return "";
		for (const k in tree) {
			const th = tree[k] && tree[k].thumb;
			if (th && th.src && same(k, path) && (!th.expires || Date.parse(th.expires) > Date.now())) return th.src;
		}
		return "";
	};
	const cacheThumb = (path, d) => {
		const s = cr.store();
		if (s) s.dispatch({ type: "fileManagerSlice/setThumbCache", payload: { index: 0, value: [path, d] } });
	};
	const loading = new Map();
	const fetchThumb = (x) => {
		let p = loading.get(x.path);
		if (!p) {
			p = crApi("file/thumb", { uri: x.link || x.path })
				.then((j) => {
					if (!j || j.code !== 0 || !j.data || !j.data.url) throw new Error((j && j.code) + " " + (j && j.msg));
					cacheThumb(x.path, j.data);
					return j.data.url;
				})
				.finally(() => loading.delete(x.path));
			loading.set(x.path, p);
		}
		return p;
	};
	let dbP = null;
	const db = () => dbP || (dbP = new Promise((res, rej) => {
		const r = indexedDB.open("cr-thumbs", 1);
		r.onupgradeneeded = () => r.result.createObjectStore("t");
		r.onsuccess = () => res(r.result);
		r.onerror = () => rej(r.error);
	}).catch((err) => {
		console.warn("Recent files: thumbnail cache unavailable", err && err.message);
		return null;
	}));
	const idb = (mode, fn) => db().then((d) => d && new Promise((res, rej) => {
		const tx = d.transaction("t", mode);
		const q = fn(tx.objectStore("t"));
		tx.oncomplete = () => res(q && q.result);
		tx.onerror = tx.onabort = () => rej(tx.error);
	})).catch(() => undefined);
	const blobs = new Map();
	const kept = new Set();
	const ckOf = (key, path) => key + "|" + norm(path);
	const blobUrl = (ck, blob) => {
		const old = blobs.get(ck);
		blobs.set(ck, URL.createObjectURL(blob));
		if (old) URL.revokeObjectURL(old);
		return blobs.get(ck);
	};
	const stored = (ck) => blobs.has(ck) ? Promise.resolve(blobs.get(ck)) : idb("readonly", (s) => s.get(ck)).then((v) => v && v.blob instanceof Blob ? blobs.get(ck) || blobUrl(ck, v.blob) : "");
	const unstore = (ck) => {
		const u = blobs.get(ck);
		if (u) URL.revokeObjectURL(u);
		blobs.delete(ck);
		kept.delete(ck);
		return idb("readwrite", (s) => s.delete(ck));
	};
	const keep = (ck, url) => {
		if (kept.has(ck)) return;
		kept.add(ck);
		fetch(url)
			.then((r) => (r.ok ? r.blob() : null))
			.then((b) => b && b.type.startsWith("image/") && idb("readwrite", (s) => s.put({ blob: b, at: Date.now() }, ck)).then(() => blobUrl(ck, b)))
			.catch(() => kept.delete(ck));
	};
	const prune = (key, items) => {
		const want = new Set(items.map((x) => ckOf(key, x.path)));
		idb("readonly", (s) => s.getAllKeys()).then((ks) => (ks || []).forEach((k) => typeof k === "string" && k.startsWith(key + "|") && !want.has(k) && unstore(k)));
	};
	const owned = (img) => !!row && row.contains(img);
	const thumb = (x, img, tries, fresh) => {
		const n = tries || 0;
		const ck = ckOf(img.crKey, x.path);
		const retry = () => {
			if (n < 5) setTimeout(() => owned(img) && !img.getAttribute("src") && thumb(x, img, n + 1, true), [1500, 5000, 15000, 45000, 120000][n]);
		};
		const show = (url) => {
			if (!owned(img) || img.getAttribute("src")) return;
			const cached = url.startsWith("blob:");
			img.onload = () => {
				img.classList.add("cr-on");
				if (!cached) keep(ck, url);
			};
			img.onerror = () => {
				img.onerror = null;
				img.removeAttribute("src");
				img.classList.remove("cr-on");
				if (cached) return unstore(ck).then(() => thumb(x, img, n, true));
				cacheThumb(x.path, { url: "", expires: new Date(0).toISOString() });
				retry();
			};
			img.src = url;
		};
		const url = known(x.path);
		if (url) return show(url);
		const remote = () => fetchThumb(x).then(show, (err) => {
			console.warn("Recent files: no thumbnail for", x.path, err.message);
			retry();
		});
		if (fresh) return remote();
		stored(ck).then((b) => (b ? show(b) : remote()));
	};
	const info = (path) => crApi("file/info", { uri: path })
		.then((j) => (j && j.code === 0 && j.data && j.data.path ? j.data : j && j.code === 404 ? null : undefined))
		.catch(() => undefined);
	const menuOpen = () => [...document.querySelectorAll(".MuiMenu-root")].some((m) => getComputedStyle(m).visibility !== "hidden" && m.getAttribute("aria-hidden") !== "true");
	let menuT = 0;
	const menu = (card, path, x, y) => {
		const s = cr.store();
		if (!s) return;
		document.querySelectorAll(".cr-recent-i.cr-menu-open").forEach((c) => c.classList.remove("cr-menu-open"));
		card.classList.add("cr-menu-open");
		info(path).then((file) => {
			if (file === null) {
				card.classList.remove("cr-menu-open");
				return forget(path);
			}
			if (!file || !card.isConnected) return card.classList.remove("cr-menu-open");
			s.dispatch({ type: "fileManagerSlice/setSelected", payload: { index: 0, value: [file] } });
			s.dispatch({ type: "fileManagerSlice/setContextMenu", payload: { index: 0, value: { open: true, pos: { x, y }, type: "file", fmIndex: 0, targets: { [file.path]: file } } } });
			clearInterval(menuT);
			let seen = false;
			const t0 = Date.now();
			menuT = setInterval(() => {
				if (menuOpen()) seen = true;
				if (seen && !menuOpen()) card.classList.remove("cr-menu-open");
				if ((!seen && Date.now() - t0 < 1500) || menuOpen() || document.querySelector(".MuiDialog-root")) return;
				clearInterval(menuT);
				card.classList.remove("cr-menu-open");
				const f = fm();
				const sel = Object.keys((f && f.selected) || {});
				const listed = f && f.list && Array.isArray(f.list.files) && f.list.files.some((z) => z.path === file.path);
				if (sel.length === 1 && sel[0] === file.path && !listed) s.dispatch({ type: "fileManagerSlice/setSelected", payload: { index: 0, value: [] } });
			}, 150);
		});
	};
	const FICONS = {"audio":["M11.513 2.048a.75.75 0 0 0-1.013.702v12.127a4 4 0 1 0 1.476 3.56.749.749 0 0 0 .024-.187V8.832l6.987 2.62A.75.75 0 0 0 20 10.75V7.483a3.25 3.25 0 0 0-2.109-3.044l-6.378-2.391Z"],"video":["M16 16.25a3.25 3.25 0 0 1-3.25 3.25h-7.5A3.25 3.25 0 0 1 2 16.25v-8.5A3.25 3.25 0 0 1 5.25 4.5h7.5A3.25 3.25 0 0 1 16 7.75v8.5Zm5.762-10.357a1 1 0 0 1 .238.648v10.918a1 1 0 0 1-1.648.762L17 15.37V8.628l3.352-2.849a1 1 0 0 1 1.41.114Z"],"image":["m11.475 13.718.083-.071a.75.75 0 0 1 .874-.007l.093.078 6.928 6.8A3.235 3.235 0 0 1 17.75 21H6.25a3.235 3.235 0 0 1-1.703-.481l6.928-6.801.083-.071-.083.07ZM17.75 3A3.25 3.25 0 0 1 21 6.25v11.5c0 .627-.178 1.213-.485 1.71l-6.939-6.813-.128-.116a2.25 2.25 0 0 0-2.889-.006l-.135.123-6.939 6.811A3.235 3.235 0 0 1 3 17.75V6.25A3.25 3.25 0 0 1 6.25 3h11.5Zm-1.998 3a2.252 2.252 0 1 0 0 4.504 2.252 2.252 0 0 0 0-4.504Zm0 1.5a.752.752 0 1 1 0 1.504.752.752 0 0 1 0-1.504Z"],"pdf":["M7.503 13.002a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0v-.5H8.5a1.5 1.5 0 0 0 0-3h-.997Zm.997 2h-.497v-1H8.5a.5.5 0 1 1 0 1ZM14.998 13.501a.5.5 0 0 1 .5-.499h1.505a.5.5 0 1 1 0 1h-1.006l-.001 1.002h1.007a.5.5 0 0 1 0 1h-1.007l.002.497a.5.5 0 0 1-1 .002l-.003-.998v-.002l.003-2.002ZM11.5 13.002h.498a2 2 0 0 1 0 4H11.5a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm.5 3a1 1 0 0 0 0-2v2Z","M12 8V2H6a2 2 0 0 0-2 2v6.668c-.591.281-1 .884-1 1.582v5.5c0 .698.409 1.3 1 1.582V20a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-.668c.591-.281 1-.884 1-1.582v-5.5c0-.698-.409-1.3-1-1.582V10h-6a2 2 0 0 1-2-2Zm-7.25 4h14.5a.25.25 0 0 1 .25.25v5.5a.25.25 0 0 1-.25.25H4.75a.25.25 0 0 1-.25-.25v-5.5a.25.25 0 0 1 .25-.25Z","M13.5 8V2.5l6 6H14a.5.5 0 0 1-.5-.5Z"],"word":["M15.5 17H14l-2-7.5l-2 7.5H8.5L6.1 7h1.7l1.54 7.5L11.3 7h1.4l1.97 7.5L16.2 7h1.7M19 3H5c-1.11 0-2 .89-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2"],"ppt":["M9.8 13.4h2.5c1.5 0 2.16-.28 2.8-.82c.64-.55.9-1.33.9-2.35c0-.97-.25-1.73-.9-2.35c-.65-.59-1.27-.88-2.8-.88H8v10h1.8zM19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-9.2 9V8.4h2.3c.66 0 1.17.25 1.5.6c.33.35.5.72.5 1.24c0 .56-.18.95-.5 1.26c-.32.31-.7.5-1.38.5z"],"excel":["M16.2 17h-2L12 13.2L9.8 17h-2l3.2-5l-3.2-5h2l2.2 3.8L14.2 7h2L13 12m6-9H5c-1.11 0-2 .89-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2"],"text":["M16.25 2a.75.75 0 0 1 .743.648L17 2.75v.749h.749a2.25 2.25 0 0 1 2.25 2.25V16h-3.754l-.154.005a2.25 2.25 0 0 0-2.09 2.084l-.006.161v3.755H5.754a2.25 2.25 0 0 1-2.25-2.25L3.502 5.75a2.25 2.25 0 0 1 2.25-2.25l.747-.001.001-.749a.75.75 0 0 1 1.493-.102L8 2.75v.749H11V2.75a.75.75 0 0 1 1.494-.102l.007.102v.749h2.997l.001-.749a.75.75 0 0 1 .75-.75Zm3.31 15.5-4.066 4.065.001-3.315.007-.102a.75.75 0 0 1 .641-.641l.102-.007h3.314ZM11.247 16H7.25l-.102.007a.75.75 0 0 0 0 1.486l.102.007h3.998l.102-.007a.75.75 0 0 0 0-1.486L11.248 16Zm5-4H7.25l-.102.007a.75.75 0 0 0 0 1.486l.102.007h8.998l.102-.007a.75.75 0 0 0 0-1.486L16.248 12Zm0-4H7.25l-.102.007a.75.75 0 0 0 0 1.486l.102.007h8.998l.102-.007a.75.75 0 0 0 0-1.486L16.248 8Z"],"torrent":["M3 7v6a9 9 0 0 0 9 9a9 9 0 0 0 9-9V7h-4v6a5 5 0 0 1-5 5a5 5 0 0 1-5-5V7m10-2h4V2h-4M3 5h4V2H3m10-.5L9 9h2v5.5L15 7h-2z"],"zip":["M13.997 6.5h-.176L9.647 9.979l-.156.119a2.25 2.25 0 0 1-1.088.393l-.196.009L2 10.499v7.251l.005.154A2.25 2.25 0 0 0 4.25 20h11.247v-3.502h-.25a.75.75 0 0 1 0-1.5h.25v-1.5h-.25a.75.75 0 0 1 0-1.5h.25v-1.003h-.75a.75.75 0 0 1-.75-.75V6.5ZM15.497 6.5h1.5v2.75h-1.5V6.5ZM18.497 6.5h1.253a2.25 2.25 0 0 1 2.229 1.938l.016.158.005.154v9a2.25 2.25 0 0 1-2.096 2.245L19.75 20h-2.753v-2h.25a.75.75 0 0 0 0-1.5h-.25V15h.25a.75.75 0 0 0 0-1.5h-.25v-2.505h.75a.75.75 0 0 0 .75-.75V6.5Z","M9.49 4.402A2.25 2.25 0 0 0 8.208 4H4.25l-.154.005A2.25 2.25 0 0 0 2 6.25v2.749L8.207 9l.104-.007a.75.75 0 0 0 .291-.106l.085-.06 3.063-2.554-2.103-1.752-.156-.119Z"],"android":["m17.6 9.48 1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52M7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25m10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25"],"exe":["M3 6.25A3.25 3.25 0 0 1 6.25 3h11.5A3.25 3.25 0 0 1 21 6.25v2.76a3.3 3.3 0 0 0-.25-.01H19.5v-.5h-15v9.25c0 .966.784 1.75 1.75 1.75H9v1.25c0 .084.003.168.01.25H6.25A3.25 3.25 0 0 1 3 17.75zm9.25 9.25h3.25v-3.25A2.25 2.25 0 0 1 17.75 10h3A2.25 2.25 0 0 1 23 12.25v7.5A3.25 3.25 0 0 1 19.75 23h-7.5A2.25 2.25 0 0 1 10 20.75v-3a2.25 2.25 0 0 1 2.25-2.25M17 12.25v3.25h4.5v-3.25a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75m-1.5 9.25V17h-3.25a.75.75 0 0 0-.75.75v3c0 .414.336.75.75.75zM17 17v4.5h2.75a1.75 1.75 0 0 0 1.75-1.75V17z"],"go":["m2.64 10.33l-.02-.06l.22-.27l.12-.08H6.8l.03.08l-.18.26l-.11.06zm-1.61.98L1 11.26l.22-.29l.12-.06h4.9l.05.09l-.08.24l-.1.07zm2.6.99l-.04-.06l.16-.28l.1-.06H6l.07.07l-.02.25l-.08.08zm11.15-2.16l-1.78.47c-.19.04-.2.05-.34-.11c-.16-.18-.27-.29-.5-.4c-.66-.34-1.33-.24-1.94.15c-.72.48-1.11 1.17-1.1 2.05c.01.86.6 1.57 1.45 1.7c.73.09 1.34-.17 1.83-.72l.29-.39h-2.07c-.22 0-.27-.14-.2-.32l.55-1.18c.03-.06.11-.17.27-.17h3.44c.15-.5.41-.96.75-1.41c.78-1.03 1.73-1.57 3-1.81c1.07-.18 2.13-.07 3.07.57c.84.58 1.37 1.36 1.5 2.39c.19 1.45-.24 2.63-1.24 3.65c-.71.72-1.58 1.17-2.57 1.39l-.86.08c-.98-.02-1.87-.3-2.62-.95c-.52-.45-.88-.99-1.06-1.63c-.15.24-.27.47-.44.7c-.77 1.02-1.78 1.65-3.06 1.8c-1.05.16-2.03-.05-2.89-.69c-.79-.6-1.26-1.4-1.36-2.39c-.14-1.17.2-2.22.91-3.14c.76-1 1.77-1.63 3.01-1.86c1-.18 1.97-.06 2.84.52c.57.38.97.9 1.24 1.52c.04.09 0 .15-.12.18m6.11 1.6l-.03-.36c-.19-1.06-1.17-1.66-2.19-1.43c-1.01.22-1.67.85-1.88 1.86c-.19.84.21 1.69.98 2.03c.59.26 1.19.22 1.76-.06c.84-.43 1.31-1.12 1.36-2.04"],"c":["m15.45 15.97l.42 2.44c-.26.14-.68.27-1.24.39c-.57.13-1.24.2-2.01.2c-2.21-.04-3.87-.7-4.98-1.96c-1.14-1.27-1.68-2.88-1.68-4.83C6 9.9 6.68 8.13 8 6.89C9.28 5.64 10.92 5 12.9 5c.75 0 1.4.07 1.94.19s.94.25 1.2.4l-.6 2.49l-1.04-.34c-.4-.1-.87-.15-1.4-.15c-1.15-.01-2.11.36-2.86 1.1c-.76.73-1.14 1.85-1.18 3.34c.01 1.36.37 2.42 1.08 3.2c.71.77 1.7 1.17 2.99 1.18l1.33-.12c.43-.08.79-.19 1.09-.32"],"cpp":["m10.5 15.97l.41 2.44c-.26.14-.68.27-1.24.39c-.57.13-1.24.2-2.01.2c-2.21-.04-3.87-.7-4.98-1.96C1.56 15.77 1 14.16 1 12.21c.05-2.31.72-4.08 2-5.32C4.32 5.64 5.96 5 7.94 5c.75 0 1.4.07 1.94.19s.94.25 1.2.4l-.58 2.49l-1.06-.34c-.4-.1-.86-.15-1.39-.15c-1.16-.01-2.12.36-2.87 1.1c-.76.73-1.15 1.85-1.18 3.34c0 1.36.37 2.42 1.08 3.2c.71.77 1.71 1.17 2.99 1.18l1.33-.12c.43-.08.79-.19 1.1-.32M11 11h2V9h2v2h2v2h-2v2h-2v-2h-2zm7 0h2V9h2v2h2v2h-2v2h-2v-2h-2z"],"js":["M3 3h18v18H3zm4.73 15.04c.4.85 1.19 1.55 2.54 1.55c1.5 0 2.53-.8 2.53-2.55v-5.78h-1.7V17c0 .86-.35 1.08-.9 1.08c-.58 0-.82-.4-1.09-.87zm5.98-.18c.5.98 1.51 1.73 3.09 1.73c1.6 0 2.8-.83 2.8-2.36c0-1.41-.81-2.04-2.25-2.66l-.42-.18c-.73-.31-1.04-.52-1.04-1.02c0-.41.31-.73.81-.73c.48 0 .8.21 1.09.73l1.31-.87c-.55-.96-1.33-1.33-2.4-1.33c-1.51 0-2.48.96-2.48 2.23c0 1.38.81 2.03 2.03 2.55l.42.18c.78.34 1.24.55 1.24 1.13c0 .48-.45.83-1.15.83c-.83 0-1.31-.43-1.67-1.03z"],"python":["M19.14 7.5A2.86 2.86 0 0 1 22 10.36v3.78A2.86 2.86 0 0 1 19.14 17H12c0 .39.32.96.71.96H17v1.68a2.86 2.86 0 0 1-2.86 2.86H9.86A2.86 2.86 0 0 1 7 19.64v-3.75a2.85 2.85 0 0 1 2.86-2.85h5.25a2.85 2.85 0 0 0 2.85-2.86V7.5zm-4.28 11.79c-.4 0-.72.3-.72.89c0 .59.32.71.72.71a.71.71 0 0 0 .71-.71c0-.59-.32-.89-.71-.89m-10-1.79A2.86 2.86 0 0 1 2 14.64v-3.78A2.86 2.86 0 0 1 4.86 8H12c0-.39-.32-.96-.71-.96H7V5.36A2.86 2.86 0 0 1 9.86 2.5h4.28A2.86 2.86 0 0 1 17 5.36v3.75a2.85 2.85 0 0 1-2.86 2.85H8.89a2.85 2.85 0 0 0-2.85 2.86v2.68zM9.14 5.71c.4 0 .72-.3.72-.89c0-.59-.32-.71-.72-.71c-.39 0-.71.12-.71.71s.32.89.71.89"],"book":["M6.5 2A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h13.25a.75.75 0 0 0 0-1.5H6.5a1 1 0 0 1-1-1h14.25a.75.75 0 0 0 .75-.75V4.5A2.5 2.5 0 0 0 18 2H6.5ZM8 5h8a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"],"rust":["m21.9 11.7l-.9-.5V11l.7-.7c.1-.1.1-.3 0-.4l-.1-.1l-.9-.3c0-.1 0-.2-.1-.2l.6-.8c.1-.1.1-.3-.1-.4c0 0-.1 0-.1-.1l-1-.2c0-.1-.1-.1-.1-.2l.4-.9v-.3c-.1-.1-.2-.1-.3-.1h-1s0-.1-.1-.1l.2-1c0-.2-.1-.3-.2-.3h-.1l-1 .2c0-.1-.1-.1-.2-.2v-1c0-.2-.1-.3-.3-.3h-.1l-.9.4h-.1L16 3c0-.2-.2-.3-.3-.2h-.1l-.8.6c-.1 0-.2 0-.2-.1l-.3-.9c-.1-.1-.2-.2-.4-.2c0 0-.1 0-.1.1L13 3h-.2l-.5-.8c-.1-.2-.3-.2-.5-.2l-.1.1l-.5.9H11l-.7-.7c-.1-.1-.3-.1-.4 0l-.1.1l-.3.9c-.1 0-.2 0-.2.1l-.8-.6c-.2-.1-.4-.1-.5.1V3l-.2 1s-.1 0-.2.1l-.9-.4c-.1-.1-.3 0-.4.1v1.1c0 .1-.1.1-.1.2l-1-.2c-.2-.1-.3 0-.3.2v.1l.2 1c-.1 0-.1.1-.2.1h-1c-.2 0-.3.1-.3.3v.1l.4.9v.2L3 8c-.2 0-.3.2-.3.3v.1l.6.8c0 .1 0 .2-.1.2l-.8.4c-.1.1-.2.2-.2.4c0 0 0 .1.1.1l.7.7v.2l-.8.5c-.2.1-.2.3-.2.4l.1.1l.9.6v.2l-.7.7c-.1.1-.1.3 0 .4l.1.1l.9.3c0 .1 0 .2.1.2l-.6.8c-.1.1-.1.3.1.4c0 0 .1 0 .1.1l1 .2c0 .1.1.1.1.2l-.4.9c-.1.1 0 .3.1.4h1.1c.1 0 .1.1.2.1l-.2 1c0 .2.1.3.2.3h.1l1-.2c0 .1.1.1.2.2v1c0 .2.1.3.3.3h.1l.9-.4h.1l.2 1c0 .2.2.3.3.2h.1l.8-.6c.1 0 .2 0 .2.1l.3.9c.1.1.2.2.4.2c0 0 .1 0 .1-.1l.8-.7h.2l.5.8c.1.1.3.2.4.1l.1-.1l.5-.8h.2l.7.7c.1.1.3.1.4 0l.1-.1l.3-.9c.1 0 .2 0 .2-.1l.8.6c.1.1.3.1.4-.1c0 0 0-.1.1-.1l.2-1c.1 0 .1-.1.2-.1l.9.4c.1.1.3 0 .4-.1v-1.1l.2-.2l1 .2c.2 0 .3-.1.3-.2v-.1l-.2-1l.2-.2h1c.2 0 .3-.1.3-.3v-.1l-.4-.9c0-.1.1-.1.1-.2l1-.2c.2 0 .3-.2.2-.3v-.1l-.6-.8l.1-.2l.9-.3c.1-.1.2-.2.2-.4c0 0 0-.1-.1-.1L21 13v-.2l.8-.5c.2-.1.2-.3.1-.6c0 .1 0 .1 0 0m-5.7 7c-.3-.1-.5-.4-.5-.7c.1-.3.4-.5.7-.5c.3.1.5.4.5.7c0 .4-.3.6-.7.5m-.2-1.9c-.3-.1-.6.1-.6.4l-.4 1.4c-.9.4-1.9.6-3 .6s-2.1-.2-3.1-.7l-.3-1.4c-.1-.3-.3-.5-.6-.4l-1.2.3c-.2-.2-.4-.5-.6-.7h6c.1 0 .1 0 .1-.1v-2.1c0-.1 0-.1-.1-.1h-1.7v-1.3h1.9c.2 0 .9 0 1.2 1c.1.3.2 1.3.4 1.6c.1.3.6 1 1.1 1h3.1c-.2.3-.4.5-.7.8zm-8.3 1.9c-.3.1-.6-.1-.7-.5c-.1-.3.1-.6.5-.7s.6.1.7.5c0 .3-.2.6-.5.7M5.4 9.5c.1.3 0 .7-.3.8c-.3.1-.7 0-.8-.3c-.1-.3 0-.7.3-.8c.4-.1.7 0 .8.3m-.7 1.6l1.3-.5c.3-.1.4-.4.3-.7L6 9.3h1V14H5c-.3-1-.4-1.9-.3-2.9m5.6-.4V9.3h2.5c.1 0 .9.1.9.7c0 .5-.6.7-1.1.7zm9 1.2v.5h-.8c-.1 0-.1 0-.1.1v.3c0 .8-.5 1-.9 1s-.8-.2-.9-.4c-.2-1.3-.6-1.5-1.2-2c.7-.5 1.5-1.2 1.5-2.1c0-1-.7-1.6-1.1-1.9c-.7-.4-1.4-.5-1.6-.5H6.6c1.1-1.2 2.5-2 4.1-2.3l.9 1c.2.2.5.2.8 0l1-1c2.1.4 3.9 1.7 5 3.6l-.7 1.6c-.1.3 0 .6.3.7l1.3.6zm-7.7-8c.2-.2.6-.2.8 0c.2.2.2.6 0 .8c-.3.3-.6.3-.9 0c-.2-.2-.1-.5.1-.8m6.9 5.6c.1-.3.5-.4.8-.3c.3.1.4.5.3.8c-.1.3-.5.4-.8.3c-.3-.1-.4-.5-.3-.8"],"raw":["M6.5 9H3v6h1.5v-2h1.1l.9 2H8l-.9-2.1c.5-.3.9-.8.9-1.4v-1C8 9.7 7.3 9 6.5 9m0 2.5h-2v-1h2zM10.25 9l-1.5 6h1.5l.38-1.5h1.75l.37 1.5h1.5l-1.5-6zm.75 3l.25-1h.5l.25 1zm8.98-3l-.74 3l-.74-3h-1.52l-.74 3l-.74-3H14l1.5 6h1.48l.76-3.04l.76 3.04h1.48l1.5-6z"],"flowchart":["M6.5 8.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-.75.75h-.5v2.69l1.56 1.56h2.69v-.5a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1-.75-.75v-.5h-2.69l-1.78 1.78a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 0 1 0-1.06l1.78-1.78V11.5h-.5a.75.75 0 0 1-.75-.75zm12.914.164l-5.829-5.828a.491.491 0 0 0-.049-.04a.63.63 0 0 1-.036-.03a2.072 2.072 0 0 0-.219-.18a.652.652 0 0 0-.08-.044l-.048-.024l-.05-.029c-.054-.031-.109-.063-.166-.087a1.977 1.977 0 0 0-.624-.138a.56.56 0 0 1-.059-.007a.605.605 0 0 0-.082-.007H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9.828a2 2 0 0 0-.586-1.414M18.5 20a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5h6V8a2 2 0 0 0 2 2h4.5zm-5-15.379L17.378 8.5H14a.5.5 0 0 1-.5-.5z"],"whiteboard":["m15.989 4l-1.503 1.5H5.25l-.144.006A1.75 1.75 0 0 0 3.5 7.25v2.24l2.61-1.64a2.25 2.25 0 0 1 3.008.569l.095.139a2.25 2.25 0 0 1 .163 2.082l-.079.166l-1.208 2.286a.75.75 0 0 0 .933 1.05l.098-.046l1.76-.993a.75.75 0 0 1 .826 1.247l-.085.057l-1.765.996a2.25 2.25 0 0 1-3.163-2.867l.07-.145l1.208-2.286a.75.75 0 0 0-.964-1.037l-.098.052L3.5 11.262v5.493c0 .966.784 1.75 1.75 1.75h13.5a1.75 1.75 0 0 0 1.75-1.75V9.443L22 7.946v8.809a3.25 3.25 0 0 1-3.25 3.25H5.25A3.25 3.25 0 0 1 2 16.755V7.25a3.25 3.25 0 0 1 3.066-3.245L5.25 4zm5.186-.455l.13.12l.121.13a2.269 2.269 0 0 1-.121 3.08l-4.281 4.273a2.25 2.25 0 0 1-.943.562l-2.327.7a1 1 0 0 1-1.24-1.265l.739-2.295c.11-.34.299-.65.552-.903l4.29-4.283a2.27 2.27 0 0 1 3.08-.12m-2.02 1.18l-4.29 4.284a.751.751 0 0 0-.184.3l-.447 1.39l1.416-.425a.752.752 0 0 0 .314-.188l4.28-4.273l.075-.086a.769.769 0 0 0-1.163-1.002"],"markdown":["0 0 15 15","M0 3.5A1.5 1.5 0 0 1 1.5 2h12A1.5 1.5 0 0 1 15 3.5v8a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 0 11.5zM10 5v3.293L8.854 7.146l-.708.708l2 2a.5.5 0 0 0 .708 0l2-2l-.707-.708L11 8.293V5zm-7.146.146A.5.5 0 0 0 2 5.5V10h1V6.707l1.5 1.5l1.5-1.5V10h1V5.5a.5.5 0 0 0-.854-.354L4.5 6.793z"],"default":["M12 2v6a2 2 0 0 0 2 2h6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h6Z","M13.5 2.5V8a.5.5 0 0 0 .5.5h5.5l-6-6Z"]};
	const iconMap = () => {
		const s = cr.store();
		const c = s && s.getState().siteConfig;
		return (c && c.explorer && c.explorer.typed && c.explorer.typed.icons) || null;
	};
	const VIDEO = ["m3u8", "mp4", "flv", "avi", "wmv", "mkv", "rm", "rmvb", "mov", "ogv", "webm"];
	const extOf = (name) => name.split(".").pop().toLowerCase();
	const isVideo = (name) => {
		const ext = extOf(name);
		const map = iconMap();
		return !!ext && (map && map[ext] ? map[ext].icon === "video" : VIDEO.includes(ext));
	};
	window.crIsVideo = isVideo;
	window.crFicon = (name) => ficon(name);
	const ICONIFY = ["https://api.iconify.design", "https://api.simplesvg.com", "https://api.unisvg.com"];
	const iconifySvg = (data, name) => {
		const a = data.aliases && data.aliases[name];
		const ic = data.icons && (data.icons[name] || (a && data.icons[a.parent]));
		if (!ic) return "";
		return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + (ic.width || data.width || 16) + " " + (ic.height || data.height || 16) + '">' + ic.body + "</svg>";
	};
	const iconifyCached = (prefix, name) => {
		try {
			for (let i = 0; i < localStorage.length; i++) {
				const k = localStorage.key(i);
				if (!/^iconify\d+$/.test(k)) continue;
				const v = JSON.parse(localStorage.getItem(k) || "null");
				const svg = v && v.data && v.data.prefix === prefix ? iconifySvg(v.data, name) : "";
				if (svg) return svg;
			}
		} catch (e) {}
		return "";
	};
	const iconifyReqs = new Map();
	const iconify = (id) => {
		const parts = id.split(":");
		const name = parts.pop();
		const prefix = parts.pop();
		if (!prefix || !name) return Promise.reject(new Error("invalid iconify name " + id));
		let p = iconifyReqs.get(id);
		if (p) return p;
		const cached = iconifyCached(prefix, name);
		const tryHost = (i) => {
			if (i >= ICONIFY.length) return Promise.reject(new Error("iconify icon not found: " + id));
			return fetch(ICONIFY[i] + "/" + encodeURIComponent(prefix) + ".json?icons=" + encodeURIComponent(name))
				.then((r) => r.json())
				.then((j) => iconifySvg(j || {}, name) || tryHost(i + 1), () => tryHost(i + 1));
		};
		p = cached ? Promise.resolve(cached) : tryHost(0);
		p.catch(() => iconifyReqs.delete(id));
		iconifyReqs.set(id, p);
		return p;
	};
	const ficon = (name) => {
		const map = iconMap();
		const ext = extOf(name);
		const o = (map && ext && map[ext]) || {};
		let el;
		if (!o.icon && o.img) {
			el = document.createElement("img");
			el.src = o.img;
			el.alt = "";
			el.draggable = false;
		} else if (!o.icon && o.iconify) {
			el = document.createElement("span");
			iconify(o.iconify).then((svg) => {
				el.style.setProperty("--cr-fim", "url(" + JSON.stringify("data:image/svg+xml," + encodeURIComponent(svg)) + ")");
				el.classList.add("cr-on");
			}, (err) => console.warn("File icon failed for", name, err.message));
		} else {
			const paths = FICONS[(o.icon && FICONS[o.icon] && o.icon) || "default"];
			const vb = paths[0].indexOf(" ") > 0 && /^[\d. ]+$/.test(paths[0]) ? paths[0] : "0 0 24 24";
			el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			el.setAttribute("viewBox", vb);
			el.setAttribute("aria-hidden", "true");
			paths.filter((d) => d !== vb).forEach((d) => {
				const pa = document.createElementNS("http://www.w3.org/2000/svg", "path");
				pa.setAttribute("d", d);
				el.appendChild(pa);
			});
		}
		el.classList.add("cr-ficon");
		if (o.color) el.style.setProperty("--cr-fic", o.color);
		if (o.color_dark) el.style.setProperty("--cr-fic-d", o.color_dark);
		return el;
	};
	let row = null;
	let sig = "";
	let iconsRef = null;
	let iconsGen = 0;
	const build = (items, key) => {
		prune(key, items);
		const list = row.querySelector(".cr-recent-row");
		list.textContent = "";
		items.forEach((x) => {
			const b = document.createElement("div");
			b.className = "cr-recent-i";
			b.setAttribute("role", "button");
			b.tabIndex = 0;
			b.title = x.name;
			const t = document.createElement("span");
			t.className = "cr-recent-t";
			if (isVideo(x.name)) t.classList.add("cr-vid");
			const ic = document.createElement("span");
			ic.className = "cr-recent-ic";
			ic.appendChild(ficon(x.name));
			const img = document.createElement("img");
			img.alt = "";
			img.draggable = false;
			t.append(ic, img);
			const n = document.createElement("span");
			n.className = "cr-recent-hd";
			const nm = document.createElement("span");
			nm.className = "cr-recent-nm";
			nm.textContent = x.name;
			const more = document.createElement("span");
			more.className = "cr-grid-more";
			more.setAttribute("role", "button");
			crT.set(more, "fileManager.moreActions", "More actions", "aria");
			more.addEventListener("click", (e) => {
				e.stopPropagation();
				const r = more.getBoundingClientRect();
				menu(b, x.path, r.left, r.bottom);
			});
			n.append(ficon(x.name), nm, more);
			b.append(n, t);
			b.addEventListener("click", () => open(x.path));
			b.addEventListener("keydown", (e) => {
				if (e.key !== "Enter" && e.key !== " ") return;
				e.preventDefault();
				open(x.path);
			});
			b.addEventListener("contextmenu", (e) => {
				e.preventDefault();
				menu(b, x.path, e.clientX, e.clientY);
			});
			list.appendChild(b);
			img.crItem = x;
			img.crKey = key;
			thumb(x, img);
		});
		edges(list);
	};
	const revive = () => {
		if (!row || document.hidden) return;
		row.querySelectorAll(".cr-recent-i img:not([src])").forEach((img) => img.crItem && thumb(img.crItem, img));
	};
	document.addEventListener("visibilitychange", revive);
	addEventListener("pageshow", revive);
	const ARROWS = { prev: "M15.53 4.47a.75.75 0 0 1 0 1.06L9.06 12l6.47 6.47a.75.75 0 1 1-1.06 1.06l-7-7a.75.75 0 0 1 0-1.06l7-7a.75.75 0 0 1 1.06 0Z", next: "M8.47 4.47a.75.75 0 0 1 1.06 0l7 7a.75.75 0 0 1 0 1.06l-7 7a.75.75 0 0 1-1.06-1.06L14.94 12 8.47 5.53a.75.75 0 0 1 0-1.06Z" };
	const PAD = 20;
	const page = (list, dir) => {
		const cards = [...list.querySelectorAll(":scope > .cr-recent-i")];
		if (!cards.length) return;
		const max = list.scrollWidth - list.clientWidth;
		const x = list.scrollLeft;
		const w = list.clientWidth;
		const start = (c) => Math.min(max, Math.max(0, c.offsetLeft - PAD));
		let target;
		if (dir > 0) {
			const c = cards.find((c) => c.offsetLeft + c.offsetWidth > x + w - PAD + 1 && start(c) > x + 1);
			target = c ? start(c) : max;
		} else {
			const k = cards.findIndex((c) => c.offsetLeft - PAD >= x - 1);
			if (k <= 0) target = 0;
			else {
				const edge = cards[k - 1].offsetLeft + cards[k - 1].offsetWidth + PAD - w;
				const c = cards.find((c, i) => i < k && start(c) >= edge - 1);
				target = c ? start(c) : 0;
			}
		}
		list.scrollTo({ left: target, behavior: "smooth" });
	};
	const edges = (list) => {
		const max = list.scrollWidth - list.clientWidth;
		const l = list.scrollLeft > 1;
		const r = list.scrollLeft < max - 1;
		list.classList.toggle("cr-fl", l);
		list.classList.toggle("cr-fr", r);
		const wrap = list.parentElement;
		if (!wrap) return;
		wrap.querySelectorAll(":scope > .cr-prev").forEach((x) => x.classList.toggle("cr-on", l));
		wrap.querySelectorAll(":scope > .cr-next").forEach((x) => x.classList.toggle("cr-on", r));
	};
	const make = () => {
		row = document.createElement("div");
		row.className = "cr-recent";
		const h = document.createElement("p");
		crT.set(h, "navbar.recentlyViewed", "Recent");
		const wrap = document.createElement("div");
		wrap.className = "cr-recent-wrap";
		const list = document.createElement("div");
		list.className = "cr-recent-row";
		const arrows = ["prev", "next"].map((d) => {
			const a = document.createElement("button");
			a.type = "button";
			a.className = "cr-lp cr-recent-arrow cr-" + d;
			a.setAttribute("aria-label", d === "prev" ? "Scroll left" : "Scroll right");
			a.tabIndex = -1;
			a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + ARROWS[d] + '"/></svg>';
			a.addEventListener("click", () => page(list, d === "prev" ? -1 : 1));
			return a;
		});
		list.addEventListener("scroll", () => edges(list), { passive: true });
		new ResizeObserver(() => edges(list)).observe(list);
		const shades = ["prev", "next"].map((d) => {
			const sh = document.createElement("span");
			sh.className = "cr-recent-shade cr-" + d;
			return sh;
		});
		wrap.append(list, ...shades, ...arrows);
		row.append(h, wrap);
		row.addEventListener("click", (e) => {
			const f = fm();
			const s = cr.store();
			if (!s || !f || !Object.keys(f.selected || {}).length || e.target.closest(".cr-recent-arrow")) return;
			s.dispatch({ type: "fileManagerSlice/setSelected", payload: { index: 0, value: [] } });
		});
		["pointerdown", "mousedown", "click", "dblclick", "contextmenu", "dragstart"].forEach((t) => row.addEventListener(t, (e) => e.stopPropagation()));
	};
	let colorsAt = 0;
	const tileColors = (force) => {
		if (!row) return;
		const now = Date.now();
		if (!force && now - colorsAt < 500) return;
		colorsAt = now;
		const count = (list) => {
			const n = new Map();
			list.forEach((c) => c && c !== "rgba(0, 0, 0, 0)" && n.set(c, (n.get(c) || 0) + 1));
			let best = "";
			n.forEach((v, k) => (!best || v > n.get(best)) && (best = k));
			return best;
		};
		const any = document.querySelector(".cr-explorer .MuiGrid-container [data-rect-id]");
		const tf = cr.upFiber(any, (p) => p.theme && p.theme.palette, 400);
		const want = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
		const pals = [tf, tf && tf.alternate].map((x) => x && x.memoizedProps && x.memoizedProps.theme && x.memoizedProps.theme.palette).filter(Boolean);
		const pal = pals.find((x) => x.mode === want) || pals[0];
		if (pal && pal.grey && pal.background) {
			const bg0 = pal.mode === "light" ? pal.grey[100] : pal.grey[900];
			const ic0 = pal.background.default;
			if (bg0 && row.style.getPropertyValue("--cr-ft-bg") !== bg0) row.style.setProperty("--cr-ft-bg", bg0);
			if (ic0 && row.style.getPropertyValue("--cr-ft-ic") !== ic0) row.style.setProperty("--cr-ft-ic", ic0);
			return;
		}
		const f = fm();
		const sel = (f && f.selected) || {};
		const tiles = [...document.querySelectorAll(".cr-explorer .MuiGrid-container [data-rect-id]")].slice(0, 24).filter((t) => {
			if (t.closest(EXIT) || t.matches(":hover")) return false;
			const file = cr.fileOf(t, 30);
			return !file || !sel[file.path];
		});
		const bg = count(tiles.map((t) => getComputedStyle(t).backgroundColor));
		const ic = count(tiles.map((t) => {
			const svg = t.firstElementChild && t.firstElementChild.children[1] && t.firstElementChild.children[1].querySelector("svg");
			let e = svg && svg.parentElement;
			while (e && e !== t && getComputedStyle(e).backgroundColor === "rgba(0, 0, 0, 0)") e = e.parentElement;
			return e && e !== t ? getComputedStyle(e).backgroundColor : "";
		}));
		if (bg && row.style.getPropertyValue("--cr-ft-bg") !== bg) row.style.setProperty("--cr-ft-bg", bg);
		if (ic && row.style.getPropertyValue("--cr-ft-ic") !== ic) row.style.setProperty("--cr-ft-ic", ic);
	};
	matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
		if (row) {
			row.style.removeProperty("--cr-ft-bg");
			row.style.removeProperty("--cr-ft-ic");
		}
		setTimeout(() => tileColors(true), 400);
	});
	const EXIT = ".fade-exit, .fade-exit-active";
	let graceAt = 0;
	let exiting = false;
	const sync = () => {
		const key = rootKey();
		const items = key ? read(key).slice(0, SHOW) : [];
		const grid = items.length ? [...document.querySelectorAll(".cr-explorer .MuiGrid-container")].find((g) => !g.closest(".MuiDialog-root") && !g.closest(EXIT) && g.querySelector(":scope > .MuiGrid-item > [data-rect-id]")) : null;
		const section = grid && grid.parentElement;
		const host = section && section.parentElement;
		if (!host) {
			if (!row || !row.isConnected) return;
			if (row.closest(EXIT)) {
				exiting = true;
				requestAnimationFrame(sync);
				return;
			}
			if (exiting) {
				exiting = false;
				graceAt = 0;
				row.remove();
				return;
			}
			const now = Date.now();
			if (!graceAt) {
				graceAt = now;
				setTimeout(sync, 260);
				return;
			}
			if (now - graceAt < 250) return;
			graceAt = 0;
			row.remove();
			return;
		}
		graceAt = 0;
		exiting = false;
		if (!row) make();
		const h = row.firstElementChild;
		const label = section.querySelector(":scope > .MuiTypography-root");
		const cls = (label ? label.className : "MuiTypography-root MuiTypography-body2") + " cr-recent-h";
		if (h.className !== cls) h.className = cls;
		const map = iconMap();
		if (map !== iconsRef) {
			iconsRef = map;
			iconsGen++;
		}
		const s = key + "|" + iconsGen + "|" + items.map((x) => x.path).join("|");
		if (s !== sig) {
			sig = s;
			build(items, key);
		}
		const moved = row.parentElement !== host || row.nextElementSibling !== section;
		if (moved) host.insertBefore(row, section);
		tileColors(moved);
	};
	const VIEWER = /^(?!viewerSelector$).*(viewer|player|editor)/i;
	const VIEWERS = new Map();
	let lastG = null;
	const watch = () => {
		const s = cr.store();
		if (!s) return false;
		s.subscribe(() => {
			const g = s.getState().globalState;
			if (!g || g === lastG) return;
			lastG = g;
			for (const k in g) {
				if (!VIEWER.test(k)) continue;
				const v = g[k];
				const f = v && typeof v === "object" && v.open && v.file && v.file.path && v.file.type !== 1 ? v.file : null;
				if (f && VIEWERS.get(k) !== f.path) record(f);
				VIEWERS.set(k, f ? f.path : "");
			}
		});
		return true;
	};
	if (!watch()) {
		const t = setInterval(() => {
			if (watch()) clearInterval(t);
		}, 500);
	}
	let shown = "";
	const viewing = () => {
		const portal = document.querySelector(".PhotoView-Portal");
		if (!portal) return (shown = "");
		const f = cr.slider(portal);
		if (!f) return;
		const p = f.memoizedProps;
		const it = p.images[p.index];
		const file = it && it.file;
		if (file && file.path && file.type !== 1 && file.path !== shown) {
			shown = file.path;
			record(file);
		}
	};
	setInterval(viewing, 300);
	new MutationObserver(sync).observe(document.body, { childList: true, subtree: true });
	new MutationObserver((recs) => {
		if (recs.some((r) => r.target instanceof Element && /\bfade-/.test(r.target.className))) sync();
	}).observe(document.body, { attributes: true, attributeFilter: ["class"], subtree: true });
	window.addEventListener("storage", (e) => {
		if (!e.key || !e.key.startsWith("cr-recent:")) return;
		mem.delete(e.key);
		sync();
	});
	sync();
})();
