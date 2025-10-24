function initFabs(root = document) {
    const margin = 8;

    function positionX(host, panel, lid) {
        const lidBox = lid === document
            ? { left: 0, right: document.documentElement.clientWidth }
            : lid.getBoundingClientRect();

        const hb = host.getBoundingClientRect();
        const pw = panel.offsetWidth;
        const idealLeft = hb.left + hb.width / 2 - pw / 2;
        const minLeft = lidBox.left + margin;
        const maxLeft = lidBox.right - pw - margin;
        const shift = Math.max(minLeft, Math.min(idealLeft, maxLeft)) - idealLeft;
        // panel.style.transform = `translateX(calc(-50% + ${Math.round(shift)}px))`;
        panel.style.setProperty('--tx', `calc(-50% + ${shift}px)`);

    }

    root.querySelectorAll('.toolt-container').forEach(host => {
        const panel = host.querySelector('.toolt-floater');
        if (!panel) return;

        const lidSel = host.dataset.tooltRoot;
        const lid = lidSel ? document.querySelector(lidSel) : document;

        const show = () => requestAnimationFrame(() => positionX(host, panel, lid));
        // host.addEventListener('mouseenter', show);
        host.addEventListener('focusin', show);
    });
}

window.addEventListener('load', () => initFabs());
