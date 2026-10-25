(() => {
	const label = (li) => {
		const key = Object.keys(li).find((k) => k.startsWith("__reactFiber$"));
		let f = key && li[key];
		while (f && !(f.memoizedProps && f.memoizedProps.file)) f = f.return;
		const file = f && f.memoizedProps.file;
		let el = li.querySelector(":scope > .cr-gallery-name");
		if (!file || !file.name) {
			if (el) el.remove();
			return;
		}
		if (!el) {
			el = document.createElement("div");
			el.className = "cr-gallery-name";
			li.appendChild(el);
		}
		if (el.textContent !== file.name) el.textContent = file.name;
		const isFolder = file.type === 1 && !file.placeholder;
		if (li.classList.contains("cr-folder") !== isFolder) li.classList.toggle("cr-folder", isFolder);
		if (li.classList.contains("cr-file") === isFolder) li.classList.toggle("cr-file", !isFolder);
		if (!li.querySelector(":scope > .cr-more")) {
			const more = document.createElement("button");
			more.type = "button";
			more.className = "cr-more";
			crT.set(more, "fileManager.moreActions", "More actions", "aria");
			const stop = (ev) => ev.stopPropagation();
			more.addEventListener("mousedown", stop);
			more.addEventListener("touchstart", stop, { passive: true });
			more.addEventListener("click", (ev) => {
				ev.stopPropagation();
				ev.preventDefault();
				markMenu(li);
				const r = more.getBoundingClientRect();
				li.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: r.left, clientY: r.bottom, button: 2, buttons: 2 }));
			});
			li.appendChild(more);
		}
	};
	const CHECKED = "M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2Zm3.22 6.97";
	const UNCHECKED = "M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2Zm0 1.5a8.5";
	const SQ_CHECKED = "M9 3h6a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V9a6 6 0 0 1 6-6Zm7.28 6.73a.75.75 0 0 0-1.06-1.06l-4.47 4.47-1.97-1.97a.75.75 0 0 0-1.06 1.06l2.5 2.5a.75.75 0 0 0 1.06 0l5-5Z";
	const SQ_UNCHECKED = "M9 3h6a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V9a6 6 0 0 1 6-6ZM9 4a5 5 0 0 0-5 5v6a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5V9a5 5 0 0 0-5-5H9Z";
	const squareChecks = () => {
		document.querySelectorAll('path[d^="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2Z"]').forEach((p) => {
			const d = p.getAttribute("d");
			if (d.startsWith(CHECKED)) p.setAttribute("d", SQ_CHECKED);
			else if (d.startsWith(UNCHECKED)) p.setAttribute("d", SQ_UNCHECKED);
			else return;
			p.setAttribute("fill-rule", "evenodd");
		});
		document.querySelectorAll('path[d="M3 18h18v-2H3zm0-5h18v-2H3zm0-7v2h18V6z"]').forEach((p) => p.setAttribute("d", "M4 6h16a1 1 0 1 1 0 2H4a1 1 0 0 1 0-2Zm0 5h16a1 1 0 1 1 0 2H4a1 1 0 1 1 0-2Zm0 5h16a1 1 0 1 1 0 2H4a1 1 0 1 1 0-2Z"));
		document.querySelectorAll('svg[data-testid="CheckBoxIcon"] > path, svg[data-testid="CheckBoxOutlineBlankIcon"] > path').forEach((p) => {
			const want = p.parentNode.getAttribute("data-testid") === "CheckBoxIcon" ? SQ_CHECKED : SQ_UNCHECKED;
			if (p.getAttribute("d") === want) return;
			p.setAttribute("d", want);
			p.setAttribute("fill-rule", "evenodd");
		});
	};
	const gridMore = (tile) => {
		const header = tile.firstElementChild && tile.firstElementChild.firstElementChild;
		if (!header || header.querySelector(":scope > .cr-grid-more")) return;
		const more = document.createElement("span");
		more.className = "cr-grid-more";
		more.setAttribute("role", "button");
		crT.set(more, "fileManager.moreActions", "More actions", "aria");
		const stop = (ev) => ev.stopPropagation();
		more.addEventListener("mousedown", stop);
		more.addEventListener("dblclick", stop);
		more.addEventListener("touchstart", stop, { passive: true });
		more.addEventListener("click", (ev) => {
			ev.stopPropagation();
			ev.preventDefault();
			markMenu(tile);
			const r = more.getBoundingClientRect();
			tile.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: r.left, clientY: r.bottom, button: 2, buttons: 2 }));
		});
		header.appendChild(more);
	};
	const hideFinance = () => {
		if (!location.pathname.startsWith("/settings")) return;
		document.querySelectorAll('[role="tab"], [role="menuitem"]').forEach((el) => {
			if (el.textContent.trim() === "Finance" && el.style.display !== "none") el.style.display = "none";
		});
	};
	let menuTimer = null;
	let pointer = { x: -1, y: -1 };
	document.addEventListener("mousemove", (e) => {
		pointer = { x: e.clientX, y: e.clientY };
	}, true);
	const releaseMenu = (li) => {
		li.classList.remove("cr-menu-open");
		const under = pointer.x >= 0 ? document.elementFromPoint(pointer.x, pointer.y) : null;
		if (under && li.contains(under)) {
			li.classList.add("cr-hover-keep");
			li.addEventListener("mouseleave", () => li.classList.remove("cr-hover-keep"), { once: true });
		}
	};
	const markMenu = (li) => {
		document.querySelectorAll(".cr-menu-open").forEach((x) => x !== li && x.classList.remove("cr-menu-open"));
		li.classList.add("cr-menu-open");
		clearInterval(menuTimer);
		let seen = false;
		menuTimer = setInterval(() => {
			const open = [...document.querySelectorAll(".MuiMenu-root")].some((m) => getComputedStyle(m).visibility !== "hidden" && m.getAttribute("aria-hidden") !== "true");
			if (open) seen = true;
			if (seen && !open) {
				releaseMenu(li);
				clearInterval(menuTimer);
			}
		}, 150);
		setTimeout(() => {
			if (!seen) {
				li.classList.remove("cr-menu-open");
				clearInterval(menuTimer);
			}
		}, 1500);
	};
	document.addEventListener("contextmenu", (e) => {
		const li = e.target instanceof Element ? e.target.closest(".MuiImageListItem-root, .MuiGrid-container [data-rect-id]") : null;
		if (li) markMenu(li);
	}, true);
	let queued = false;
	const run = () => {
		queued = false;
		document.querySelectorAll(".MuiImageListItem-root").forEach(label);
		document.querySelectorAll(".MuiGrid-container [data-rect-id]:not(.MuiDialog-root *)").forEach(gridMore);
		document.querySelectorAll(".MuiDialog-root .cr-grid-more").forEach((x) => x.remove());
		squareChecks();
		hideFinance();
	};
	new MutationObserver(() => {
		if (!queued) {
			queued = true;
			requestAnimationFrame(run);
		}
	}).observe(document.body, { childList: true, subtree: true });
})();
