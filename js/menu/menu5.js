export function bindSomeMenu(navRoot, { exclusive = false } = {}) {
    const map = new Map(); // li → info block

    // First pass: collect all has-children nodes
    const all = [...navRoot.querySelectorAll("li.has-children")];

    all.forEach((li, index) => {
        const btn = li.querySelector(".toggle-btn");
        const row = li.querySelector(".menu-item");
        const grid = li.querySelector(".submenu-grid");

        if (!btn || !row || !grid) return;

        // Assign ID
        const submenuId = `submenu-${index}`;
        grid.id = submenuId;
        btn.setAttribute("aria-controls", submenuId);
        btn.setAttribute("aria-expanded", li.getAttribute("aria-expanded") || "false");

        // Build info block
        const info = {
            li,
            btn,
            row,
            depth: Number(li.dataset.depth) || 0,
            parentUl: li.parentElement,
            siblings: [],
            descendants: [],
        };

        map.set(li, info);
    });

    // Second pass: compute siblings + descendants
    for (const info of map.values()) {
        // Siblings at same level
        info.siblings = [...info.parentUl.children]
            .filter(el => el !== info.li && map.has(el));

        // Descendant has-children nodes
        info.descendants = [...info.li.querySelectorAll("li.has-children")]
            .filter(el => el !== info.li && map.has(el))
            .map(el => map.get(el));
    }

    // Attach handlers
    for (const info of map.values()) {
        info.btn.addEventListener("click", e => {
            e.stopPropagation();
            e.preventDefault();
            toggle(info);
        });

        info.row.addEventListener("click", e => {
            if (e.target.closest("a")) return;
            e.stopPropagation();
            e.preventDefault();
            toggle(info);
        });
    }

    // -----------------------------------

    function toggle(info) {
        const isOpen = info.li.getAttribute("aria-expanded") === "true";

        if (isOpen) {
            close(info);
        } else {
            if (exclusive) {
                // Close sibling branches immediately
                for (const sib of info.siblings) {
                    close(map.get(sib));
                }
            }
            open(info);
        }
    }

    function close(info) {
        info.li.setAttribute("aria-expanded", "false");
        info.btn.setAttribute("aria-expanded", "false");
        info.btn.textContent = "+";

        // Close all descendants
        for (const desc of info.descendants) {
            desc.li.setAttribute("aria-expanded", "false");
            desc.btn.setAttribute("aria-expanded", "false");
            desc.btn.textContent = "+";
        }
    }

    function open(info) {
        info.li.setAttribute("aria-expanded", "true");
        info.btn.setAttribute("aria-expanded", "true");
        info.btn.textContent = "-";
    }


    function setLayout(small) {
        if (small) {
            // console.log("we are MOBILE");
            navRoot.classList.remove('desktop');
            navRoot.classList.add('mobile');
        } else {
            // console.log("we are - W I D E - ");
            navRoot.classList.remove('mobile');
            navRoot.classList.add('desktop');
        } 
    }

    let isMobile = window.innerWidth < 840;
    setLayout(isMobile);
    const mediaQuery = window.matchMedia('(min-width: 840px)');
    mediaQuery.addEventListener('change', e => {
        isMobile = !e.matches;
        setLayout(isMobile);

    });

}
