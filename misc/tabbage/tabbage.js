document.querySelectorAll("[data-switcher]").forEach(root => {
    const headers = root.querySelector("[data-switch-headers]");
    const buttons = headers.querySelectorAll("[data-switch]");

    headers.addEventListener("click", e => {
        const btn = e.target.closest("[data-switch]");
        if (!btn) return;

        const key = btn.dataset.switch;

        buttons.forEach(b =>
            b.classList.toggle("is-active", b === btn)
        );

        root.querySelectorAll("[data-panel]").forEach(p => {
            const active = p.dataset.panel === key;
            p.hidden = !active;
        });
    });
});