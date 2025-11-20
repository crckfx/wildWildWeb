// ------------------------------------------------------------
// populateMenu(rootNode, container)
// Build menu DOM that exactly matches the demo structure.
// ------------------------------------------------------------
export function populateMenu(rootNode, container) {
    if (!rootNode || !container) return;

    container.innerHTML = "";

    // Top-level nodes are the children of "/"
    for (const child of rootNode.children || []) {
        const li = buildNode(child, 0);
        if (li) container.appendChild(li);   // skip nulls
    }
}


// ------------------------------------------------------------
// buildNode(node, depth)
// Returns <li> element containing full row + children structure,
// OR null if node is "linkless + childless" (invalid).
// ------------------------------------------------------------
function buildNode(node, depth) {
    const rawChildren = Array.isArray(node.children) ? node.children : [];
    const hasChildrenRaw = rawChildren.length > 0;
    const isLink = node.hasIndex;

    // --------------------------------------------------------
    // RULE: skip "non-index + no-children" entries entirely
    // --------------------------------------------------------
    if (!isLink && !hasChildrenRaw) {
        return null;
    }

    // Filter children *after* applying the rule recursively
    const filteredChildren = [];
    for (const child of rawChildren) {
        const built = buildNode(child, depth + 1);
        if (built) filteredChildren.push(built);
    }

    const hasChildren = filteredChildren.length > 0;


    // --------------------------------------------------------
    // <li> base
    // --------------------------------------------------------
    const li = document.createElement("li");
    li.dataset.depth = depth;

    if (hasChildren) {
        li.classList.add("has-children");
        li.setAttribute("aria-expanded", "false");
    }


    // --------------------------------------------------------
    // Row wrapper: <div class="menu-item">
    // --------------------------------------------------------
    const row = document.createElement("div");
    row.className = "menu-item";


    // LINK vs LABEL
    if (node.hasIndex) {
        const a = document.createElement("a");
        a.className = "menu-link";
        a.href = node.path;

        const span = document.createElement("span");
        span.textContent = node.title;

        a.appendChild(span);
        row.appendChild(a);
    } else {
        const lbl = document.createElement("span");
        lbl.className = "menu-label";
        lbl.textContent = node.title;
        row.appendChild(lbl);
    }


    // --------------------------------------------------------
    // Toggle button (only when a visible submenu exists)
    // --------------------------------------------------------
    if (hasChildren) {
        const btn = document.createElement("button");
        btn.className = "toggle-btn";
        btn.type = "button";
        btn.textContent = "+";
        row.appendChild(btn);
    }

    li.appendChild(row);


    // --------------------------------------------------------
    // Children container
    // --------------------------------------------------------
    if (hasChildren) {
        const grid = document.createElement("div");
        grid.className = "submenu-grid";

        const ul = document.createElement("ul");
        ul.className = "submenu";

        // append filtered-and-built li nodes
        for (const builtChild of filteredChildren) {
            ul.appendChild(builtChild);
        }

        grid.appendChild(ul);
        li.appendChild(grid);
    }

    return li;
}
