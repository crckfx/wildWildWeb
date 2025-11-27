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
