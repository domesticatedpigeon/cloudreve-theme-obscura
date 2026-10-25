(() => {
	const check = () => {
		if (document.documentElement.classList.contains("cr-dragfiles")) return;
		const ex = document.querySelector(".cr-explorer");
		let room = false;
		if (ex && ex.clientHeight) {
			const r = ex.getBoundingClientRect();
			const tiles = ex.querySelectorAll("[data-rect-id], [data-item-index]");
			if (!tiles.length) room = true;
			else {
				const bottom = tiles[tiles.length - 1].getBoundingClientRect().bottom;
				room = ex.scrollHeight <= ex.clientHeight + 1 && r.bottom - bottom > 72;
			}
		}
		document.documentElement.classList.toggle("cr-room", room);
	};
	setInterval(check, 400);
	window.addEventListener("resize", check);
})();
