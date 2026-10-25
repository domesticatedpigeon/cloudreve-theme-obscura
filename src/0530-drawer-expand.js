(() => {
	let btn = null;
	const sync = () => {
		const html = document.documentElement;
		const inNav = document.querySelector(".cr-nav .cr-expand");
		const show = html.classList.contains("cr-drawer-closed") && !(inNav && inNav.offsetParent) && window.innerWidth >= 600 && !document.querySelector(".PhotoView-Portal");
		if (show && !btn) {
			btn = document.createElement("button");
			btn.type = "button";
			btn.className = "cr-expand-float";
			btn.title = "Expand sidebar";
			btn.setAttribute("aria-label", "Expand sidebar");
			btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16a1 1 0 1 1 0 2H4a1 1 0 0 1 0-2Zm0 5h16a1 1 0 1 1 0 2H4a1 1 0 1 1 0-2Zm0 5h16a1 1 0 1 1 0 2H4a1 1 0 1 1 0-2Z"></path></svg>';
			btn.addEventListener("click", () => {
				const st = cr.store();
				if (st) st.dispatch({ type: "globalState/setDrawerOpen", payload: true });
			});
			document.body.appendChild(btn);
		}
		if (btn) btn.classList.toggle("cr-on", show);
	};
	setInterval(sync, 400);
})();
