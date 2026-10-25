(() => {
	const MARGIN = 600000;
	let fresh = null;
	let pending = null;
	const login = () => {
		try {
			const o = JSON.parse(localStorage.getItem("cloudreve_session") || "null");
			const s = o && o.current && o.sessions && o.sessions[o.current];
			return s && !s.signedOut && s.token && s.token.access_token ? { uid: o.current, token: s.token } : null;
		} catch (e) {
			return null;
		}
	};
	const left = (iso) => Date.parse(iso) - Date.now();
	const token = () => {
		const s = login();
		if (!s) return Promise.resolve("");
		const best = fresh && fresh.uid === s.uid && left(fresh.token.access_expires) > left(s.token.access_expires) ? fresh.token : s.token;
		if (left(best.access_expires) > MARGIN) return Promise.resolve(best.access_token);
		if (left(s.token.refresh_expires) <= MARGIN) return Promise.resolve("");
		if (!pending) {
			pending = fetch("/api/v4/session/token/refresh", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: s.token.refresh_token }) })
				.then((r) => r.json())
				.then((j) => {
					if (!j || j.code !== 0 || !j.data || !j.data.access_token) throw new Error("token refresh failed: " + (j && j.code) + " " + (j && j.msg));
					fresh = { uid: s.uid, token: j.data };
					return j.data.access_token;
				})
				.finally(() => (pending = null));
		}
		return pending;
	};
	window.crApi = (path, params) => token().then((t) => fetch("/api/v4/" + path + "?" + new URLSearchParams(params).toString(), { headers: t ? { Authorization: "Bearer " + t } : {} })).then((r) => r.json());
})();
