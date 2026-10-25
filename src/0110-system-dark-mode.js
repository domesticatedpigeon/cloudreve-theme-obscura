(() => {
	try {
		const raw = localStorage.getItem("cloudreve_session");
		if (raw) {
			const state = JSON.parse(raw);
			let changed = false;
			state.anonymousSettings = state.anonymousSettings || {};
			Object.values(state.sessions || {}).forEach((x) => (x.settings = x.settings || {}));
			[state.anonymousSettings].concat(Object.values(state.sessions || {}).map((x) => x.settings)).forEach((settings) => {
				if ("preferred_dark_mode" in settings) {
					delete settings.preferred_dark_mode;
					changed = true;
				}
			});
			if (changed) localStorage.setItem("cloudreve_session", JSON.stringify(state));
		}
	} catch (e) {}
	let tries = 0;
	const reset = () => {
		const store = cr.store();
		if (!store) {
			if (tries++ < 50) setTimeout(reset, 200);
			return;
		}
		if (store.getState().globalState.darkMode !== undefined) store.dispatch({ type: "globalState/setDarkMode", payload: undefined });
	};
	reset();
})();
