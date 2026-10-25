(() => {
	const orig = HTMLElement.prototype.focus;
	HTMLElement.prototype.focus = function (opts) {
		if (this.closest && this.closest('.MuiDrawer-paper [role="tree"], .MuiPopover-paper [role="tree"]')) {
			return orig.call(this, Object.assign({}, opts || {}, { preventScroll: true }));
		}
		return orig.call(this, opts);
	};
})();
