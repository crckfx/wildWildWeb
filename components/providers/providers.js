// providers.js
import { buildFlatMap } from "./buildFlatMap.js";
import { buildTree }    from "./buildTree.js";
import { filterMenuTree } from "./filterMenuTree.js";
import { renderMenuHTML } from "./renderMenuHTML.js";

export function generateMenuHTML(plan) {

    console.log(plan.dist);
    // 1. Build flat URL universe
    const flat = buildFlatMap(plan);

    // TEMP logging
    console.log("[header6] URL count:", Object.keys(flat).length);
    
    // 2. Build hierarchical tree
    const tree = buildTree(flat);
    
    // TEMP logging
    // console.log("[header6] root:", tree?.path);
    console.log("[header6] first-level:", tree.children.map(c => c.path));
    // 3. filter according to populateMenu rules
    const filtered = filterMenuTree(tree);

    // 4. build HTML identical to runtime populateMenu
    const html = renderMenuHTML(filtered);

    return html;

    // Placeholder until next modules are added:
    // return `<pre>Build pipeline OK — ${plan.renderablePages} pages</pre>`;
}

export function helloWorld(plan) {
    return "Hello from provider!";
}
