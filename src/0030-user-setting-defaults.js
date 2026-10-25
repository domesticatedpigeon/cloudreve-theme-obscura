(() => {
	const DEFAULTS = { tree_view_auto_expand: false };
	const fill = (o) => {
		if (!o || typeof o !== "object" || !o.sessions || !o.anonymousSettings) return false;
		let changed = false;
		[o.anonymousSettings, ...Object.values(o.sessions).map((s) => s && s.settings)].forEach((st) => {
			if (!st || typeof st !== "object") return;
			for (const k in DEFAULTS) {
				if (k in st) continue;
				st[k] = DEFAULTS[k];
				changed = true;
			}
		});
		return changed;
	};
	const stringify = JSON.stringify;
	JSON.stringify = function (v, ...rest) {
		fill(v);
		return stringify.call(this, v, ...rest);
	};
	try {
		const o = JSON.parse(localStorage.getItem("cloudreve_session") || "null");
		if (fill(o)) localStorage.setItem("cloudreve_session", stringify(o));
	} catch (e) {}
})();
