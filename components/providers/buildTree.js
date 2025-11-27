function parentOf(url) {
    if (url === "/") return null;
    const trimmed = url.replace(/\/$/, "");
    const idx = trimmed.lastIndexOf("/");
    if (idx <= 0) return "/";
    return trimmed.slice(0, idx) + "/";
}

export function buildTree(urls) {
    const paths = Object.keys(urls).sort((a, b) => a.length - b.length);
    const nodes = {};

    // Create nodes
    for (const p of paths) {
        const entry = urls[p];
        nodes[p] = {
            path: p,
            title: entry.title,
            hasIndex: entry.hasIndex,
            navPath: entry.navPath,
            pageId: entry.pageId,
            children: []
        };
    }

    // Always define root
    const root = nodes["/"];

    // Link children → parents, but never replace root
    for (const p of paths) {
        if (p === "/") continue;

        const parent = parentOf(p);

        if (parent && nodes[parent]) {
            nodes[parent].children.push(nodes[p]);
        }
        // else: ignore malformed path silently
        // (alternatively: log, or collect in a separate bucket)
    }

    // Sort
    for (const p of paths) {
        nodes[p].children.sort((a, b) => a.path.localeCompare(b.path));
    }

    return root;
}
