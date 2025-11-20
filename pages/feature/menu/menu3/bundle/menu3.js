export function bindSomeMenu() {
    // realistically we should probably feed it a menu root element instead but this will do for now
    document.querySelectorAll("li.has-children").forEach((li, index) => {
        const btn = li.querySelector(".toggle-btn");
        const row = li.querySelector(".menu-item");
        const grid = li.querySelector(".submenu-grid");

        // Give submenu a unique ID (required for aria-controls)
        const submenuId = `submenu-${index}`;
        grid.id = submenuId;
        btn.setAttribute("aria-controls", submenuId);

        // Button click → toggle only
        btn.addEventListener("click", e => {
            e.stopPropagation(); // prevent double-trigger
            toggle(li, btn);
        });

        // Row click → toggle, unless the link was clicked
        row.addEventListener("click", e => {
            if (e.target.closest("a")) {
                return; // allow link navigation
            }
            toggle(li, btn);
        });
    });

    function toggle(li, btn) {
        const open = li.getAttribute("aria-expanded") === "true";
        li.setAttribute("aria-expanded", open ? "false" : "true");
        btn.setAttribute("aria-expanded", open ? "false" : "true");
        btn.textContent = open ? "+" : "-";
    }

}