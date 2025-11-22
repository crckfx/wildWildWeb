// /js/initHeaderMenu.js
import { bindSomeMenu } from "/js/menu/menu5.js";
import { populateMenu } from "/js/pageGoblin/populateMenu.js";
import { loadUrlTree } from "/js/pageGoblin/tree.js";

export async function initHeaderMenu() {
    const navRoot = document.querySelector(".wwwNav");
    if (!navRoot) return;

    // ---- populate menu ----
    const siteUrlTree = await loadUrlTree("/map.json");
    if (!siteUrlTree) return;
    const target = navRoot.querySelector(".menu-root");
    populateMenu(siteUrlTree, target);

    // ---- menu toggle ----
    const menuToggle = navRoot.querySelector(".menu-toggle");
    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            navRoot.getAttribute("aria-expanded") === "true"
                ? navRoot.setAttribute("aria-expanded", "false")
                : navRoot.setAttribute("aria-expanded", "true");
        });
    }

    // ---- interaction logic ----
    bindSomeMenu(navRoot, { exclusive: true });
}
