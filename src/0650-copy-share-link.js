(() => {
	const COPY = "M5.503 4.627 5.5 6.75v10.504a3.25 3.25 0 0 0 3.25 3.25h8.616a2.251 2.251 0 0 1-2.122 1.5H8.75A4.75 4.75 0 0 1 4 17.254V6.75c0-.98.627-1.815 1.503-2.123ZM17.75 2A2.25 2.25 0 0 1 20 4.25v13a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-13A2.25 2.25 0 0 1 8.75 2h9Zm0 1.5h-9a.75.75 0 0 0-.75.75v13c0 .414.336.75.75.75h9a.75.75 0 0 0 .75-.75v-13a.75.75 0 0 0-.75-.75Z";
	const i18n = (ns, path, fb) => {
		try {
			const o = JSON.parse(localStorage.getItem("i18next_res_" + (localStorage.getItem("i18nextLng") || "en-US") + "-" + ns) || "{}");
			const v = path.split(".").reduce((a, k) => a && a[k], o);
			return typeof v === "string" ? v : fb;
		} catch (e) {
			return fb;
		}
	};
	let snk = null;
	const notify = () => {
		const cur = cr.rootFiber();
		if (!cur) return;
		if (!snk || !snk._reactInternals) {
			snk = null;
			const stack = [cur];
			while (stack.length) {
				const f = stack.pop();
				if (f.stateNode && f.stateNode.enqueueSnackbar && f.stateNode.closeSnackbar) {
					snk = f.stateNode;
					break;
				}
				if (f.sibling) stack.push(f.sibling);
				if (f.child) stack.push(f.child);
			}
		}
		const T = cur.memoizedState && cur.memoizedState.element && cur.memoizedState.element.$$typeof;
		if (!snk || !T) return;
		const inst = snk;
		inst.enqueueSnackbar(i18n("application", "setting.copied", "Copied to clipboard."), {
			action: (key) => ({ $$typeof: T, type: "button", key: null, ref: null, _owner: null, props: { type: "button", className: "MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-sizeSmall MuiButton-colorInherit cr-snackbtn", onClick: () => inst.closeSnackbar(key), children: i18n("common", "dismiss", "Dismiss") } }),
		});
	};
	const isShare = (v) => v && typeof v === "object" && typeof v.id === "string" && "visited" in v;
	const urlOf = (v) => v.url || location.origin + "/s/" + v.id + (v.password ? "/" + v.password : "");
	const shareOf = (tr) => {
		const fib = cr.fiberOf(tr);
		if (!fib) return "";
		const stack = fib.child ? [fib.child] : [];
		while (stack.length) {
			const f = stack.pop();
			const p = f.memoizedProps;
			if (p && typeof p === "object") for (const k in p) if (isShare(p[k])) return urlOf(p[k]);
			if (f.sibling) stack.push(f.sibling);
			if (f.child) stack.push(f.child);
		}
		const rows = [...tr.parentElement.children].filter((r) => !r.querySelector(".MuiSkeleton-root"));
		const i = rows.indexOf(tr);
		for (let f = fib.return; f && i >= 0; f = f.return) {
			for (let h = f.memoizedState; h && typeof h === "object" && "next" in h; h = h.next) {
				const v = h.memoizedState;
				const list = Array.isArray(v) ? v : v && v.extended_info && v.extended_info.shares;
				if (Array.isArray(list) && isShare(list[i])) return urlOf(list[i]);
			}
		}
		return "";
	};
	const copy = (text) => {
		if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
		const ta = document.createElement("textarea");
		ta.value = text;
		ta.style.cssText = "position:fixed;opacity:0";
		document.body.appendChild(ta);
		ta.select();
		document.execCommand("copy");
		ta.remove();
		return Promise.resolve();
	};
	const inject = () => {
		document.querySelectorAll(".MuiDialog-root tbody > tr > :first-child .MuiIconButton-root:not(.cr-copylink)").forEach((more) => {
			if (more.nextElementSibling && more.nextElementSibling.classList.contains("cr-copylink")) return;
			const tr = more.closest("tr");
			if (tr.querySelector(".cr-copylink") || !shareOf(tr)) return;
			const b = document.createElement("button");
			b.type = "button";
			b.className = more.className.replace(/\bMui-disabled\b/, "") + " cr-copylink";
			crT.set(b, "share.copyLinkToClipboard", "Copy link", "title");
			crT.set(b, "share.copyLinkToClipboard", "Copy link", "aria");
			const sv = more.querySelector("svg");
			b.innerHTML = '<svg class="' + (sv ? sv.getAttribute("class") : "MuiSvgIcon-root MuiSvgIcon-fontSizeSmall") + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + COPY + '"></path></svg>';
			b.addEventListener("click", (e) => {
				e.stopPropagation();
				const url = shareOf(tr);
				if (url) copy(url).then(notify);
			});
			more.after(b);
		});
	};
	let q = false;
	new MutationObserver(() => {
		if (q) return;
		q = true;
		requestAnimationFrame(() => {
			q = false;
			inject();
		});
	}).observe(document.body, { childList: true, subtree: true });
	inject();
})();
