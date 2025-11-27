// filterMenuTree.js
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
