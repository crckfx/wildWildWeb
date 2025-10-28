function positionX(host, panel, lid, margin = 8) {
	const lidBox = lid === document
		? { left: 0, right: document.documentElement.clientWidth }
		: lid.getBoundingClientRect();

	const hb = host.getBoundingClientRect();
	const pw = panel.offsetWidth;
	const idealLeft = hb.left + hb.width / 2 - pw / 2;
	const minLeft = lidBox.left + margin;
	const maxLeft = lidBox.right - pw - margin;
	const shift = Math.max(minLeft, Math.min(idealLeft, maxLeft)) - idealLeft;
	panel.style.setProperty('--tx', `calc(-50% + ${shift}px)`);
}

function initToolt(el) {
	const panel = el.querySelector('.toolt-floater');
	if (!panel) return;

	const lidSel = el.dataset.tooltRoot;
	const lid = lidSel ? document.querySelector(lidSel) : document;

	const show = () => requestAnimationFrame(() => positionX(el, panel, lid));
	el.addEventListener('focusin', show);
	// el.addEventListener('mouseenter', show);
}

function initToolts(root = document) {
	root.querySelectorAll('.toolt-container').forEach(initToolt);
}

window.addEventListener('load', () => initToolts());