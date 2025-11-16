export function bindHeaderMenu(navRoot) {
    if (!navRoot) return;

    const menuToggle = navRoot.querySelector('.menu-toggle');
    const menu = navRoot.querySelector('.menu');          // <ul class="menu">
    const submenuButtons = navRoot.querySelectorAll('.submenu-toggle');

    let openLi = null;
    let isMobile = window.innerWidth < 1000;

    // ------------------------------------------
    // OPEN/CLOSE MAIN MENU
    // ------------------------------------------
    function openMainMenu() {
        navRoot.setAttribute('aria-expanded', 'true');
    }

    function closeMainMenu() {
        navRoot.setAttribute('aria-expanded', 'false');
        closeOpenSubmenu();
    }

    function toggleNavMenu() {
        navRoot.getAttribute('aria-expanded') === 'true'
            ? closeMainMenu()
            : openMainMenu();
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', toggleNavMenu);
    }

    // ------------------------------------------
    // UNLINKED REDIRECTS (mobile only)
    // ------------------------------------------
    function setupUnlinkedRedirects() {
        menu.querySelectorAll('.menu-item > a').forEach(anchor => {
            const href = anchor.getAttribute('href');
            anchor.onclick = null;

            if (isMobile && (!href || href.trim() === '')) {
                anchor.onclick = e => {
                    e.preventDefault();
                    const li = anchor.closest('li');
                    const toggle = li?.querySelector('.submenu-toggle');
                    if (toggle) toggle.click();
                };
            }
        });
    }

    // ------------------------------------------
    // SUBMENU HANDLING
    // ------------------------------------------
    function setSubmenuTabbable(li, tabbable) {
        li.querySelectorAll('.submenu-grid a').forEach(link => {
            if (tabbable || !isMobile) {
                link.removeAttribute('tabindex');
            } else {
                link.setAttribute('tabindex', '-1');
            }
        });
    }

    function closeOpenSubmenu() {
        if (openLi) {
            openLi.setAttribute('aria-expanded', 'false');
            const btn = openLi.querySelector('.submenu-toggle');
            if (btn) btn.textContent = '+';
            setSubmenuTabbable(openLi, false);
            openLi = null;
        }
    }

    // Initialize tabbing states
    submenuButtons.forEach(btn => {
        const li = btn.closest('li');
        setSubmenuTabbable(li, false);
    });

    // Submenu toggle handling
    submenuButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!isMobile) return;

            const li = button.closest('li');
            const isOpen = li.getAttribute('aria-expanded') === 'true';

            if (isOpen) {
                li.setAttribute('aria-expanded', 'false');
                button.textContent = '+';
                setSubmenuTabbable(li, false);
                openLi = null;
                return;
            }

            closeOpenSubmenu();

            li.setAttribute('aria-expanded', 'true');
            button.textContent = '−';
            setSubmenuTabbable(li, true);
            openLi = li;
        });
    });

    // ------------------------------------------
    // MEDIA QUERY ADAPTATION
    // ------------------------------------------
    const mediaQuery = window.matchMedia('(min-width: 1000px)');

    mediaQuery.addEventListener('change', e => {
        isMobile = !e.matches;

        if (isMobile) {
            setupUnlinkedRedirects();
            navRoot.querySelectorAll('li[aria-expanded="false"]')
                .forEach(li => setSubmenuTabbable(li, false));
        } else {
            closeMainMenu();
            navRoot.querySelectorAll('.submenu-grid a')
                .forEach(link => link.removeAttribute('tabindex'));
        }
    });

    // Initial setup
    setupUnlinkedRedirects();
    if (isMobile) {
        navRoot.querySelectorAll('li[aria-expanded="false"]')
            .forEach(li => setSubmenuTabbable(li, false));
    }

    // ------------------------------------------
    // CURRENT PAGE RESOLUTION
    // ------------------------------------------
    resolveNavPath(navRoot);
}


// ------------------------------------------------------------
// NAVPATH RESOLUTION (SCOPED TO THIS NAV ONLY)
// ------------------------------------------------------------
function resolveNavPath(navRoot) {
    const body = document.body;
    const navPath = body.dataset.navPath;
    if (!navPath) return;

    const levels = navPath.split('/').filter(Boolean);

    let deepest = null;

    for (let i = levels.length - 1; i >= 0; i--) {
        const level = levels[i];
        const selector = `[data-pageid="${level}"]`;
        const match = navRoot.querySelector(selector);
        if (match) {
            deepest = match;
            break;
        }
    }

    if (deepest) {
        deepest.classList.add('current');
    }
}
