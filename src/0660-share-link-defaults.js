(() => {
	const NONE = { list: false, read: false, update: false, create: false, delete: false, share: false };
	const fiberRoot = () => {
		const root = document.getElementById("root");
		const k = root && Object.keys(root).find((x) => x.startsWith("__reactContainer$"));
		return k ? (root[k].stateNode && root[k].stateNode.current) || root[k] : null;
	};
	const patch = () => {
		const stack = [fiberRoot()];
		while (stack.length) {
			const f = stack.pop();
			if (!f) continue;
			let h = f.memoizedState;
			let list = null;
			for (let n = 0; h && typeof h === "object" && "next" in h && n < 40; n++, h = h.next) {
				const v = h.memoizedState;
				if (!h.queue && Array.isArray(v) && Array.isArray(v[0]) && v[0].length === 2 && v[0][1] && v[0][1].option && v[0][1].option.id === "everyone") list = v[0];
				else if (list && h.queue && typeof v === "string") {
					if (list[1].permission.list || list[1].permission.read) list[1] = { ...list[1], permission: { ...NONE } };
					return;
				}
			}
			if (f.sibling) stack.push(f.sibling);
			if (f.child) stack.push(f.child);
		}
	};
	let tries = 0;
	const hook = () => {
		let f = fiberRoot();
		while (f && !(f.memoizedProps && f.memoizedProps.store && f.memoizedProps.store.subscribe)) f = f.child;
		const s = f && f.memoizedProps.store;
		if (!s) {
			if (tries++ < 50) setTimeout(hook, 200);
			return;
		}
		let open = false;
		s.subscribe(() => {
			const g = s.getState().globalState;
			const o = !!(g && g.shareLinkDialogOpen);
			if (o && !open && !g.shareLinkDialogShare) patch();
			open = o;
		});
	};
	hook();
})();
