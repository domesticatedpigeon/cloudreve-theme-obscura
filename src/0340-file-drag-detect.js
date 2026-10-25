(() => {
	let depth = 0;
	let lastOver = 0;
	const hasFiles = (e) => !!e.dataTransfer && [...(e.dataTransfer.types || [])].includes("Files");
	const set = (v) => document.documentElement.classList.toggle("cr-dragfiles", v);
	window.addEventListener("dragenter", (e) => {
		if (!hasFiles(e)) return;
		depth++;
		lastOver = Date.now();
		set(true);
	}, true);
	window.addEventListener("dragleave", (e) => {
		if (!hasFiles(e)) return;
		depth = Math.max(0, depth - 1);
		if (!depth) set(false);
	}, true);
	window.addEventListener("dragover", (e) => {
		if (!hasFiles(e)) return;
		e.preventDefault();
		lastOver = Date.now();
	});
	setInterval(() => {
		if (document.documentElement.classList.contains("cr-dragfiles") && Date.now() - lastOver > 600) {
			depth = 0;
			set(false);
		}
	}, 300);
	window.addEventListener("drop", (e) => {
		if (hasFiles(e)) e.preventDefault();
	});
	["drop", "dragend"].forEach((t) => window.addEventListener(t, () => {
		depth = 0;
		set(false);
	}, true));
})();
