(() => {
	const keyOf = (el, prefix) => el && Object.keys(el).find((x) => x.startsWith(prefix));
	const fiberOf = (el) => {
		const k = keyOf(el, "__reactFiber$");
		return k ? el[k] : null;
	};
	const propsOf = (el) => {
		const k = keyOf(el, "__reactProps$");
		return k ? el[k] : null;
	};
	const rootFiber = () => {
		const root = document.getElementById("root");
		const k = keyOf(root, "__reactContainer$");
		return k ? (root[k].stateNode && root[k].stateNode.current) || root[k] : null;
	};
	const upFiber = (el, test, max = Infinity) => {
		let f = fiberOf(el);
		for (let i = 0; f && i < max; i++, f = f.return) {
			const p = f.memoizedProps;
			if (p && typeof p === "object" && test(p)) return f;
		}
		return null;
	};
	const up = (el, test, max) => {
		const f = upFiber(el, test, max);
		return f ? f.memoizedProps : null;
	};
	const fileOf = (el, max) => {
		const p = up(el, (x) => x.file, max);
		return p ? p.file : null;
	};
	const slider = (el) => upFiber(el, (p) => Array.isArray(p.images) && typeof p.index === "number", 40);
	let store = null;
	const getStore = () => {
		if (store) return store;
		for (let f = rootFiber(); f; f = f.child) {
			const p = f.memoizedProps;
			if (p && p.store && typeof p.store.getState === "function" && typeof p.store.dispatch === "function") return (store = p.store);
		}
		return null;
	};
	let router = null;
	const getRouter = () => {
		if (router) return router;
		const start = rootFiber();
		const queue = start ? [start] : [];
		for (let n = 0; queue.length && n < 5000; n++) {
			const f = queue.shift();
			const p = f.memoizedProps;
			if (p && p.router && typeof p.router.navigate === "function") return (router = p.router);
			if (f.child) queue.push(f.child);
			if (f.sibling) queue.push(f.sibling);
		}
		return null;
	};
	window.cr = { fiberOf, propsOf, rootFiber, up, upFiber, fileOf, slider, store: getStore, router: getRouter };
})();
