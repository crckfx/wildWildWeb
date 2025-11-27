// providers.js
import { buildFlatMap, buildTree, filterMenuTree } from "./menu6tree.js";
import { renderMenuHTML } from "./renderMenuHTML.js";

export function generateMenuHTML(plan) {

    // console.log(plan.dist);
    
    const flat = buildFlatMap(plan);        // 1. Build flat URL universe

    // // TEMP logging
    // console.log("[header6] URL count:", Object.keys(flat).length);
    
    const tree = buildTree(flat);           // 2. Build hierarchical tree
    
    // TEMP logging
    // console.log("[header6] root:", tree?.path);
    console.log("[header6] first-level:", tree.children.map(c => c.path));
    
    const filtered = filterMenuTree(tree);  // 3. filter according to populateMenu rules

    const html = renderMenuHTML(filtered);  // 4. write HTML to memory

    return html;
}

export function helloWorld(plan) {
    return "Hello from provider!";
}
