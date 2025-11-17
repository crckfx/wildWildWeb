/**
 * take a URL tree and return a menu HTML: <ul class="menu">
 *
 * @param {Object} root - root of the url tree from loadUrlTree()
 * @returns {string} - HTML string for the <ul class="menu">
 */
export function createNavFromSitemap(root) {
    if (!root) return `<ul class="menu"></ul>`;

    const html = [];
    html.push(`<ul class="menu">`);

    // Only direct children of root are top-level items
    for (const child of root.children || []) {
        html.push(renderNode(child, true)); // isTopLevel = true
    }

    html.push(`</ul>`);
    return html.join("");
}

/**
 * Render a node and its subtree.
 * isTopLevel = true  → manual header pattern (with .menu-item, submenu-toggle, submenu-grid)
 * isTopLevel = false → submenu pattern (plain <li><a>…</a>[nested submenu]</li>, no .menu-item)
 */
function renderNode(node, isTopLevel) {
    const id    = node.pageId || "";
    const href  = node.path;
    const title = escapeHtml(node.title);
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;

    if (isTopLevel) {
        // this is a "menu item" (top level)
        let html = `<li data-pageid="${id}"${hasChildren ? ` class="has-children" aria-expanded="false"` : ""}>`;

        html += `<div class="menu-item">`;

        // real link vs dead label
        if (node.hasIndex) {
            html += `<a href="${href}"><span>${title}</span></a>`;
        } else {
            html += `<a><span>${title}</span></a>`;
        }

        if (hasChildren) {
            html += `<button class="submenu-toggle">+</button>`;
        }

        html += `</div>`; // .menu-item

        if (hasChildren) {
            html += `<div class="submenu-grid"><ul class="submenu">`;
            for (const child of node.children) {
                // children of top level are submenu items (not top level)
                html += renderNode(child, false);
            }
            html += `</ul></div>`;
        }

        html += `</li>`;
        return html;
    } else {
        // this is a "submenu item" (child)
        const liClasses = hasChildren ? ` class="has-children"` : "";
        let html = `<li data-pageid="${id}"${liClasses}>`;

        // real link vs dead label
        if (node.hasIndex) {
            html += `<a href="${href}"><span>${title}</span></a>`;
        } else {
            html += `<a><span>${title}</span></a>`;
        }


        // this item should not have children. however, this outputs the HTML for children if they exist.
        if (hasChildren) {
            html += `<div class="submenu-grid"><ul class="submenu">`;
            for (const child of node.children) {
                html += renderNode(child, false); // still submenu style
            }
            html += `</ul></div>`;
        }

        html += `</li>`;
        return html;
    }
}

// some helper, maybe necessary
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
