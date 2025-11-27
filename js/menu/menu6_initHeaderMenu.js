// /js/initHeaderMenu.js
import { bindSomeMenu } from "/js/menu/menu5.js";


export function initHeaderMenu() {
    const navRoot = document.querySelector(".wwwNav");
    if (!navRoot) return;

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

// initHeaderMenu();