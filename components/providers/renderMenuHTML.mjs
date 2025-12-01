// renderMenuHTML.js
export function renderMenuHTML(rootNode) {
    // Expect rootNode to be the filtered tree
    const output = [];

    for (const child of rootNode.children || []) {
        output.push(renderNode(child, 0));
    }

    return output.join("");
}

function renderNode(node, depth) {
    const children = node.children || [];
    const hasChildren = children.length > 0;
    const isLink = node.hasIndex;

    let html = "";

    // <li>
    html += `<li data-depth="${depth}"${hasChildren ? ` class="has-children"` : ""}${hasChildren ? ` aria-expanded="false"` : ""}>`;

    // <div class="menu-item">
    html += `<div class="menu-item">`;

    if (isLink) {
        html += `<a class="menu-link" href="${node.path}"><span>${escapeHtml(node.title)}</span></a>`;
    } else {
        html += `<span class="menu-label">${escapeHtml(node.title)}</span>`;
    }

    if (hasChildren) {
        html += `<button class="toggle-btn" type="button">+</button>`;
    }

    html += `</div>`; // end .menu-item

    if (hasChildren) {
        html += `<div class="submenu-grid"><ul class="submenu">`;

        for (const child of children) {
            html += renderNode(child, depth + 1);
        }

        html += `</ul></div>`;
    }

    html += `</li>`;

    return html;
}

// Utility: minimal escape for HTML text
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
