(() => {
	let on = false;
	try {
		on = !!localStorage.getItem("cr-perf");
	} catch (e) {}
	if (!on) return;
	let t0 = performance.now();
	const rows = new Map();
	const SRC = /cr\/(\d{4}-[\w-]+)\.js/g;
	const origin = (skip) => {
		const lim = Error.stackTraceLimit;
		Error.stackTraceLimit = 8;
		const stack = new Error().stack || "";
		Error.stackTraceLimit = lim;
		for (const m of stack.matchAll(SRC)) if (m[1] !== "0005-perf" && m[1] !== skip) return m[1];
		return "(cloudreve)";
	};
	const timed = (kind, cb, skip) => {
		if (typeof cb !== "function") return cb;
		const src = origin(skip);
		if (src === "0015-core") return cb;
		const key = src + " · " + kind;
		return function (...args) {
			const s = performance.now();
			try {
				return cb.apply(this, args);
			} finally {
				const d = performance.now() - s;
				const r = rows.get(key) || { calls: 0, ms: 0, max: 0 };
				r.calls++;
				r.ms += d;
				if (d > r.max) r.max = d;
				rows.set(key, r);
			}
		};
	};
	const MO = window.MutationObserver;
	window.MutationObserver = class extends MO {
		constructor(cb) {
			super(timed("observer", cb));
		}
	};
	const RO = window.ResizeObserver;
	if (RO) {
		window.ResizeObserver = class extends RO {
			constructor(cb) {
				super(timed("resize", cb));
			}
		};
	}
	[["setInterval", "interval"], ["setTimeout", "timeout"], ["requestAnimationFrame", "frame"]].forEach(([name, kind]) => {
		const orig = window[name];
		window[name] = function (cb, ...args) {
			return orig.call(window, timed(kind, cb), ...args);
		};
	});
	window.crTimed = (kind, cb) => timed(kind, cb, "0015-core");
	window.crPerf = (reset) => {
		const secs = (performance.now() - t0) / 1000;
		const list = [...rows].map(([source, r]) => ({ source, calls: r.calls, "ms total": +r.ms.toFixed(1), "ms/s": +(r.ms / secs).toFixed(2), "max ms": +r.max.toFixed(1) })).sort((a, b) => b["ms total"] - a["ms total"]);
		console.table(list);
		const theme = list.filter((x) => !x.source.startsWith("(cloudreve)")).reduce((a, x) => a + x["ms total"], 0);
		console.log(`Theme: ${theme.toFixed(0)} ms in ${secs.toFixed(1)} s = ${(theme / secs).toFixed(1)} ms/s (${(theme / secs / 10).toFixed(2)}% of the main thread)`);
		if (reset) {
			rows.clear();
			t0 = performance.now();
		}
		return list;
	};
})();
