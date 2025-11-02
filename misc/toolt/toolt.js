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
    panel.style.setProperty('--shift-x', `${shift}px`);

}

function positionY(host, panel, lid, margin = 8) {
    const lidBox = lid === document
        ? { top: 0, bottom: document.documentElement.clientHeight }
        : lid.getBoundingClientRect();

    const hb = host.getBoundingClientRect();
    const ph = panel.offsetHeight;
    const idealTop = hb.top + hb.height / 2 - ph / 2;
    const minTop = lidBox.top + margin;
    const maxTop = lidBox.bottom - ph - margin;
    const shift = Math.max(minTop, Math.min(idealTop, maxTop)) - idealTop;
    panel.style.setProperty('--ty', `calc(-50% + ${shift}px)`);
    panel.style.setProperty('--shift-y', `${shift}px`);
}

let activeToolt = null;

function initToolt(el) {
    const panel = el.querySelector('.toolt-floater');
    if (!panel) return;

    const lidSel = el.dataset.tooltRoot;
    const lid = lidSel ? document.querySelector(lidSel) : document;
    let hovered = false;
    let focused = false;

    const show = () => requestAnimationFrame(() => {
        const edge = el.dataset.edge || 'top';
        if (edge === 'left' || edge === 'right') {
            panel.style.setProperty('--tx', '0');
            positionY(el, panel, lid);
        } else {
            panel.style.setProperty('--ty', '0');
            positionX(el, panel, lid);
        }
    });

    const update = () => {
        const active = hovered || focused;
        if (active && activeToolt && activeToolt !== el) {
            activeToolt.classList.remove('active');
            activeToolt = null;
        }
        if (active) {
            el.classList.add('active');
            activeToolt = el;
            show();
        } else if (!active) {
            el.classList.remove('active');
            if (activeToolt === el) activeToolt = null;
        }
    };

    el.addEventListener('mouseenter', () => { hovered = true; update(); });
    el.addEventListener('mouseleave', () => { hovered = false; update(); });
    el.addEventListener('focusin', () => { focused = true; update(); });
    el.addEventListener('focusout', () => { focused = false; update(); });
}



function initToolts() {
    document.querySelectorAll('.toolt-container').forEach(initToolt);
}

window.addEventListener('load', () => initToolts());