// ---------- URL Tree Loader ----------

/**
 * Load the map.json file and return a nested URL tree.
 * Returns:
 * { path, title, hasIndex, navPath, pageId, children: [...] }
 */
export async function loadUrlTree(mapFile = "/map.json") {
    let data;
    try {
        const res = await fetch(mapFile, { cache: "no-store" });
        if (!res.ok) return null;
        data = await res.json();
    } catch {
        return null;
    }

    if (!data || typeof data !== "object" || typeof data.urls !== "object") {
        return null;
    }

    return buildUrlTree(data.urls);
}


// ------------------------------------------------------------
// Build nested tree from flat:
// "/a/b/": { title, hasIndex, navPath, pageId }
// ------------------------------------------------------------
function buildUrlTree(urls) {
    const paths = Object.keys(urls).sort((a, b) => a.length - b.length);

    const nodes = {};
    let rootNode = null;

    // First pass: create all node objects
    for (const p of paths) {
        const entry = urls[p];

        nodes[p] = {
            path: p,                   // "/feature/gallery/"
            title: entry.title,
            hasIndex: entry.hasIndex,
            navPath: entry.navPath,
            pageId: entry.pageId,
            children: []
        };
    }

    // Second pass: link parent-child
    for (const p of paths) {
        const parent = parentOf(p);
        if (parent && nodes[parent]) {
            nodes[parent].children.push(nodes[p]);
        } else {
            rootNode = nodes[p];       // should be "/"
        }
    }

    // Sort children alphabetically by path
    for (const p of paths) {
        nodes[p].children.sort((a, b) => a.path.localeCompare(b.path));
    }

    return rootNode;
}


// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function parentOf(url) {
    if (url === "/") return null;

    const trimmed = url.replace(/\/$/, "");
    const idx = trimmed.lastIndexOf("/");
    if (idx <= 0) return "/";

    return trimmed.slice(0, idx) + "/";
}
