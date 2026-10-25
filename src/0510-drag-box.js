(() => {
	const SEL = '.cr-explorer > div[style*="position: fixed"][style*="box-shadow"], .cr-drag-box';
	let x = 0;
	let y = 0;
	let q = false;
	const upd = () => {
		q = false;
		document.querySelectorAll(SEL).forEach((b) => {
			const r = b.getBoundingClientRect();
			if (!r.width && !r.height) return;
			const L = x < r.left + r.width / 2;
			const T = y < r.top + r.height / 2;
			const v = (T && L ? "0" : "20px") + " " + (T && !L ? "0" : "20px") + " " + (!T && !L ? "0" : "20px") + " " + (!T && L ? "0" : "20px");
			if (b.style.getPropertyValue("border-radius") !== v) b.style.setProperty("border-radius", v, "important");
		});
	};
	document.addEventListener("pointermove", (e) => {
		x = e.clientX;
		y = e.clientY;
		if (!q) {
			q = true;
			requestAnimationFrame(upd);
		}
	}, { passive: true });
})();
