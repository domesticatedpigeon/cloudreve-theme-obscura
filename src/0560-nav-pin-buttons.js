(() => {
	const MORE = 'path[d^="M8 12a2 2 0 1 1-4 0 2 2 0"]';
	const PIN = "m16.242 2.932 4.826 4.826a2.75 2.75 0 0 1-.715 4.404l-4.87 2.435a.75.75 0 0 0-.374.426l-1.44 4.166a1.25 1.25 0 0 1-2.065.476L8.5 16.561 4.06 21H3v-1.06l4.44-4.44-3.105-3.104a1.25 1.25 0 0 1 .476-2.066l4.166-1.44a.75.75 0 0 0 .426-.373l2.435-4.87a2.75 2.75 0 0 1 4.405-.715Zm3.766 5.886-4.826-4.826a1.25 1.25 0 0 0-2.002.325l-2.435 4.871a2.25 2.25 0 0 1-1.278 1.12l-3.789 1.31 6.705 6.704 1.308-3.789a2.25 2.25 0 0 1 1.12-1.277l4.872-2.436a1.25 1.25 0 0 0 .325-2.002Z";
	const LINK = "M3.5 6.25V8h4.629a.75.75 0 0 0 .53-.22l1.53-1.53l-1.53-1.53a.75.75 0 0 0-.53-.22H5.25A1.75 1.75 0 0 0 3.5 6.25m-1.5 0A3.25 3.25 0 0 1 5.25 3h2.879a2.25 2.25 0 0 1 1.59.659L11.562 5.5h7.189A3.25 3.25 0 0 1 22 8.75v5.627a4.728 4.728 0 0 0-1.5-.71V8.75A1.75 1.75 0 0 0 18.75 7h-7.19L9.72 8.841a2.25 2.25 0 0 1-1.591.659H3.5v8.25c0 .966.784 1.75 1.75 1.75h5.916c.149.545.392 1.052.71 1.5H5.25A3.25 3.25 0 0 1 2 17.75zm21 12a3.75 3.75 0 0 0-3.75-3.75l-.102.007A.75.75 0 0 0 19.25 16l.154.005a2.25 2.25 0 0 1-.154 4.495l-.003.005l-.102.007a.75.75 0 0 0 .108 1.493V22l.2-.005A3.75 3.75 0 0 0 23 18.25m-6.5-3a.75.75 0 0 0-.75-.75l-.2.005a3.75 3.75 0 0 0 .2 7.495l.102-.007a.75.75 0 0 0-.102-1.493l-.154-.005A2.25 2.25 0 0 1 15.75 16l.102-.007a.75.75 0 0 0 .648-.743m3.5 3a.75.75 0 0 0-.75-.75h-3.5l-.102.007A.75.75 0 0 0 15.75 19h3.5l.102-.007A.75.75 0 0 0 20 18.25";
	const pick = (more, re, ico, key, fb) => {
		const html = document.documentElement;
		html.classList.add("cr-ghostmenu");
		more.click();
		const t0 = Date.now();
		const find = () => {
			const it = [...document.querySelectorAll(".MuiPopover-root [role='menu'] .MuiMenuItem-root")].find((x) => re.test(x.textContent || "") || crT.is(x.textContent, key, fb) || x.querySelector('path[d^="' + ico.slice(0, 24) + '"]'));
			if (it) {
				it.click();
				setTimeout(() => html.classList.remove("cr-ghostmenu"), 300);
				return;
			}
			if (Date.now() - t0 < 800) setTimeout(find, 30);
			else {
				document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
				html.classList.remove("cr-ghostmenu");
			}
		};
		setTimeout(find, 30);
	};
	const loggedIn = () => {
		try {
			const s = JSON.parse(localStorage.getItem("cloudreve_session") || "{}");
			return !!(s.current && s.sessions && s.sessions[s.current]);
		} catch (e) {
			return false;
		}
	};
	const onShare = () => /@share(\/|$)/.test(new URLSearchParams(location.search).get("path") || "");
	const make = (more, cls, key, label, d, re) => {
		const b = document.createElement("button");
		b.type = "button";
		b.className = more.className.replace("cr-more-hide", "") + " " + cls;
		crT.set(b, key, label, "title");
		crT.set(b, key, label, "aria");
		b.innerHTML = '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall" viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"></path></svg>';
		b.addEventListener("click", (e) => {
			e.stopPropagation();
			pick(more, re, d, key, label);
		});
		return b;
	};
	const inject = () => {
		const share = onShare() && loggedIn();
		document.querySelectorAll(".cr-nav .MuiButtonGroup-root > .MuiButtonBase-root:not(.cr-pinbtn):has(" + MORE + ")").forEach((more) => {
			more.classList.add("cr-more-hide");
			const box = more.parentElement;
			let pb = box.querySelector(":scope > .cr-pinbtn:not(.cr-linkbtn)");
			if (!pb) {
				pb = make(more, "cr-pinbtn", "fileManager.pin", "Pin to sidebar", PIN, /pin/i);
				more.before(pb);
			}
			const lb = box.querySelector(":scope > .cr-linkbtn");
			if (share && !lb) pb.after(make(more, "cr-pinbtn cr-linkbtn", "fileManager.saveShortcut", "Save as shortcut", LINK, /shortcut/i));
			else if (!share && lb) lb.remove();
		});
	};
	setInterval(inject, 700);
	let iq = false;
	new MutationObserver(() => {
		if (iq) return;
		iq = true;
		requestAnimationFrame(() => {
			iq = false;
			inject();
		});
	}).observe(document.body, { childList: true, subtree: true });
})();
