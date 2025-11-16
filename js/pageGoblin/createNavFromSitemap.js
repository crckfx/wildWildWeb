/**
 * Convert a URL tree into the HTML for the <ul class="menu"> navigation.
 *
 * @param {Object} root - root of the url tree from loadUrlTree()
 * @returns {string} - HTML string for the <ul class="menu">
 */
export function createNavFromSitemap(root) {
    if (!root) return "<ul class=\"menu\"></ul>";

    const html = [];
    html.push(`<ul class="menu" id="main-menu">`);

    for (const child of root.children) {
        html.push(renderNode(child));
    }

    html.push(`</ul>`);
    return html.join("");
}


/**
 * Render a node (page) and its subtree.
 *
 * @param {Object} node
 * @returns {string}
 */
function renderNode(node) {
    const id = node.pageId || "";            // canonical identity (not derived from URL)
    const href = node.path;                  // "/feature/gallery/"
    const title = escapeHtml(node.title);    // safe text

    const hasChildren = node.children && node.children.length > 0;

    // <li> opening
    let html = `<li data-pageid="${id}"${hasChildren ? ` class="has-children" aria-expanded="false"` : ""}>`;

    // Menu item wrapper
    html += `<div class="menu-item">`;
    html += `<a href="${href}"><span>${title}</span></a>`;

    if (hasChildren) {
        html += `<button class="submenu-toggle">+</button>`;
    }

    html += `</div>`;

    // Children block
    if (hasChildren) {
        html += `<div class="submenu-grid">`;
        html += `<ul class="submenu">`;
        for (const child of node.children) {
            html += renderChild(child);
        }
        html += `</ul></div>`;
    }

    // Close <li>
    html += `</li>`;

    return html;
}


/**
 * Render a child node inside <ul class="submenu">
 */
function renderChild(node) {
    const id = node.pageId || "";
    const href = node.path;
    const title = escapeHtml(node.title);

    const hasChildren = node.children && node.children.length > 0;

    // IMPORTANT:
    // Submenus recurse as full blocks, not inline.
    // <li> for submenu children is simple unless deeper nesting exists.
    let html = `<li data-pageid="${id}">`;
    html += `<a href="${href}"><span>${title}</span></a>`;
    html += `</li>`;

    // If deeper levels exist:
    if (hasChildren) {
        html += `<li class="has-children">`;
        html += renderNode(node);  // recursion handles its own li wrapper
        html += `</li>`;
    }

    return html;
}


// Minimal safe HTML-escaping
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
