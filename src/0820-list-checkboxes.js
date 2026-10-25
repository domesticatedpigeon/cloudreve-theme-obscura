(() => {
	const ROW = '.cr-explorer [data-testid="virtuoso-item-list"] > [data-index] > .MuiBox-root';
	const SQ_ON = "M9 3h6a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V9a6 6 0 0 1 6-6Zm7.28 6.73a.75.75 0 0 0-1.06-1.06l-4.47 4.47-1.97-1.97a.75.75 0 0 0-1.06 1.06l2.5 2.5a.75.75 0 0 0 1.06 0l5-5Z";
	const SQ_OFF = "M9 3h6a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V9a6 6 0 0 1 6-6ZM9 4a5 5 0 0 0-5 5v6a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5V9a5 5 0 0 0-5-5H9Z";
	const SQ = "M9 3h6a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V9a6 6 0 0 1 6-6Z";
	const isCheck = (svg) => {
		const d = svg && svg.querySelector("path") && svg.querySelector("path").getAttribute("d");
		return !!d && (d.startsWith(SQ) || d.startsWith("M12 2c5.523"));
	};
	const folders = new Map();
	const typeIcon = (host, file) => {
		if (file.type === 0) return window.crFicon ? window.crFicon(file.name || "") : null;
		const src = [...host.querySelectorAll("svg")].find((x) => !isCheck(x));
		if (src) {
			const c = src.cloneNode(true);
			c.dataset.crPin = "1";
			folders.set(file.path, c);
		}
		return folders.has(file.path) ? folders.get(file.path).cloneNode(true) : null;
	};
	const lineOf = (row) => row.firstElementChild && row.firstElementChild.querySelector(":scope > p > .MuiBox-root");
	const hostOf = (line) => line && line.querySelector(":scope > div");
	const clickIcon = (row) => {
		const host = hostOf(lineOf(row));
		if (!host) return;
		const target = [host, ...host.querySelectorAll("*")].find((x) => cr.propsOf(x) && typeof cr.propsOf(x).onClick === "function");
		(target || host).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
	};
	const stop = (e) => e.stopPropagation();
	const decorate = (row, sel) => {
		const file = cr.fileOf(row, 30);
		if (!file) return;
		const line = lineOf(row);
		const host = hostOf(line);
		if (!host) return;
		const thumb = !!host.querySelector(":scope > .MuiBox-root");
		let cb = line.querySelector(":scope > .cr-lcb");
		if (!cb) {
			cb = document.createElement("span");
			cb.className = "cr-lcb";
			cb.setAttribute("role", "checkbox");
			cb.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="' + SQ_OFF + '"/></svg><svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="' + SQ_ON + '"/></svg>';
			["mousedown", "dblclick", "pointerdown", "touchstart"].forEach((t) => cb.addEventListener(t, stop, { passive: true }));
			cb.addEventListener("click", (e) => {
				e.stopPropagation();
				e.preventDefault();
				clickIcon(row);
			});
			line.insertBefore(cb, line.firstChild);
		}
		const on = !!sel[file.path];
		if (cb.classList.contains("cr-on") !== on) cb.classList.toggle("cr-on", on);
		if (cb.getAttribute("aria-checked") !== String(on)) cb.setAttribute("aria-checked", String(on));
		const key = file.path + "|" + thumb;
		let ti = row.querySelector(".cr-lti");
		if (!ti || ti.dataset.k !== key) {
			if (ti) ti.remove();
			const svg = typeIcon(host, file);
			if (svg) {
				ti = document.createElement("span");
				ti.className = thumb ? "cr-lti" : "cr-lti cr-lti-p";
				ti.dataset.k = key;
				ti.appendChild(svg);
				if (thumb) {
					const name = line.querySelector("[aria-label]");
					const nameBox = name && name.parentElement;
					if (nameBox && nameBox.parentElement) nameBox.parentElement.insertBefore(ti, nameBox);
				} else line.insertBefore(ti, host);
			}
		}
		if (!row.querySelector(":scope > .cr-lmore")) {
			const more = document.createElement("span");
			more.className = "cr-grid-more cr-lmore";
			more.setAttribute("role", "button");
			if (window.crT) crT.set(more, "fileManager.moreActions", "More actions", "aria");
			["mousedown", "dblclick", "pointerdown", "touchstart"].forEach((t) => more.addEventListener(t, stop, { passive: true }));
			more.addEventListener("click", (e) => {
				e.stopPropagation();
				e.preventDefault();
				const r = more.getBoundingClientRect();
				row.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: r.left, clientY: r.bottom, button: 2, buttons: 2 }));
			});
			row.appendChild(more);
		}
	};
	const run = () => {
		const rows = document.querySelectorAll(ROW);
		if (!rows.length) return;
		const s = cr.store();
		const fm = s && s.getState().fileManager;
		const sel = (fm && fm[0] && fm[0].selected) || {};
		rows.forEach((r) => decorate(r, sel));
	};
	let q = false;
	const schedule = () => {
		if (q) return;
		q = true;
		requestAnimationFrame(() => {
			q = false;
			run();
		});
	};
	new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
	const t = setInterval(() => {
		const s = cr.store();
		if (!s) return;
		clearInterval(t);
		let last = null;
		s.subscribe(() => {
			const fm = s.getState().fileManager;
			const sel = fm && fm[0] && fm[0].selected;
			if (sel === last) return;
			last = sel;
			schedule();
		});
	}, 500);
	run();
})();
