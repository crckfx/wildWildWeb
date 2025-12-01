// TAKE IN A PLAN AND MAKE A FLAT URL LIST
export function buildFlatMap(plan) {
    const urls = Object.create(null);
    if (!Array.isArray(plan.pages)) {
        console.log("ERROR: something is wrong with your plan.pages");
        return {};
    }
    for (const page of plan.pages) {
        urls[page.url] = {
            hasIndex: Array.isArray(page.contentPath) && page.contentPath.length > 0,
            title: page.title || "Untitled Page",
            navPath: page.navPath || [],
            pageId: page.pageId || null
        };
    }
    return urls;
}

// TAKE IN A SET OF URLS AND BUILD A NODELIST STRUCTURE FROM IT 
export function buildTree(urls) {
    function parentOf(url) {
        if (url === "/") return null;
        const trimmed = url.replace(/\/$/, "");
        const idx = trimmed.lastIndexOf("/");
        if (idx <= 0) return "/";
        return trimmed.slice(0, idx) + "/";
    }

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

    // // Sort
    // for (const p of paths) {
    //     nodes[p].children.sort((a, b) => a.path.localeCompare(b.path));
    // }

    return root;
}


// TAKE IN A NODELIST AND VALIDATE
export function filterMenuTree(node) {

    const rawChildren = Array.isArray(node.children) ? node.children : [];

    const filteredChildren = [];
    for (const child of rawChildren) {
        const out = filterMenuTree(child);
        if (out) filteredChildren.push(out);
    }

    const isLink = node.hasIndex;
    const hasChildren = filteredChildren.length > 0;

    if (!isLink && !hasChildren) {
        return null;
    }

    return {
        ...node,
        children: filteredChildren
    };
}
