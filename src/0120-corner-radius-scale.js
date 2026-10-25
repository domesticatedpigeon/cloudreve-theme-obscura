(() => {
	const FACTOR = 1;
	const PILL = 999;
	const px = (v) => v.replace(/(\d*\.?\d+)px/g, (m, n) => {
		const value = parseFloat(n);
		return (value >= 999 ? PILL : Math.round(value * FACTOR * 2) / 2) + "px";
	});
	const scaleText = (text) => text.replace(/(border(?:-(?:top|bottom)-(?:left|right))?-radius\s*:\s*)([^;}]+)/gi, (m, prop, value) => prop + px(value));
	const done = new WeakSet();
	const scaleRules = (rules) => {
		for (const rule of rules) {
			if (done.has(rule)) continue;
			done.add(rule);
			if (rule.selectorText && /\.cr-(v|legend|wrap-toast|tip|tbp)|cr-selbar/.test(rule.selectorText)) continue;
			if (rule.style) {
				for (let i = 0; i < rule.style.length; i++) {
					const name = rule.style[i];
					if (name.includes("radius")) {
						rule.style.setProperty(name, px(rule.style.getPropertyValue(name)), rule.style.getPropertyPriority(name));
					}
				}
			}
			if (rule.cssRules) scaleRules(rule.cssRules);
		}
	};
	const scaleSheet = (sheet) => {
		try {
			scaleRules(sheet.cssRules);
		} catch (e) {}
	};
	const insertRule = CSSStyleSheet.prototype.insertRule;
	CSSStyleSheet.prototype.insertRule = function (rule, index) {
		const i = insertRule.call(this, typeof rule === "string" ? scaleText(rule) : rule, index);
		try {
			done.add(this.cssRules[i]);
		} catch (e) {}
		return i;
	};
	const scaleAll = () => {
		for (const sheet of document.styleSheets) scaleSheet(sheet);
	};
	scaleAll();
	new MutationObserver(scaleAll).observe(document.head, { childList: true, subtree: true, characterData: true });
	document.addEventListener("DOMContentLoaded", scaleAll);
})();
