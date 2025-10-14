const menuToggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('main-menu');
const nav = document.getElementById('site-nav');

function openMainMenu() {
    nav.setAttribute('aria-expanded', true);
}

function closeMainMenu() {
    nav.setAttribute('aria-expanded', false);
    // Close previously open submenu
    closeOpenSubmenu();
    // blockedLi = null;

}

function toggleNavMenu() {
    nav.getAttribute('aria-expanded') === 'true' ? closeMainMenu() : openMainMenu();
}

// if the menu toggle exists, attach its function
if (menuToggle) {
    menuToggle.addEventListener('click', () => toggleNavMenu());
}

// Handle non-href <a> redirects → toggle (on mobile only)
function setupUnlinkedRedirects() {
    menu.querySelectorAll('.menu-item > a').forEach(anchor => {
        const href = anchor.getAttribute('href');
        anchor.onclick = null; // remove stale handler
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

const submenuButtons = document.querySelectorAll('.submenu-toggle');
let openLi = null;
// let blockedLi = null;
let isMobile = window.innerWidth < 1000;


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
        const prevButton = openLi.querySelector('.submenu-toggle');
        if (prevButton) prevButton.textContent = '+';
        setSubmenuTabbable(openLi, false);
        openLi = null;
    }
}

submenuButtons.forEach(button => {
    const li = button.closest('li');
    setSubmenuTabbable(li, false);
});

submenuButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (!isMobile) return;

        const li = button.closest('li');
        const isOpen = li.getAttribute('aria-expanded') === 'true';

        // If this is the open submenu, close it and block hover
        if (isOpen) {
            li.setAttribute('aria-expanded', 'false');
            button.textContent = '+';
            setSubmenuTabbable(li, false);
            openLi = null;
            return; // exit because this is a 'close' click
        }

        // close previously open submenu
        closeOpenSubmenu();

        // Open current
        li.setAttribute('aria-expanded', 'true');
        button.textContent = '−';
        setSubmenuTabbable(li, true);
        openLi = li;

    });
});


const mediaQuery = window.matchMedia('(min-width: 1000px)');

// to operate the menu if it is present
if (menu) {
    mediaQuery.addEventListener('change', e => {
        isMobile = !e.matches;

        if (isMobile) {
            setupUnlinkedRedirects(); // reapply redirection
            // ensure closed menus have tabbing disabled
            document.querySelectorAll('li[aria-expanded="false"]')
                .forEach(li => setSubmenuTabbable(li, false));            
        } else {
            closeMainMenu(); // desktop: kill mobile open state
            // ensure all submenu links are tabbable
            document.querySelectorAll('.submenu-grid a').forEach(link => {
                link.removeAttribute('tabindex');
            });
        }
    });

    // On initial load
    setupUnlinkedRedirects();
    if (isMobile) {
        document.querySelectorAll('li[aria-expanded="false"]')
            .forEach(li => setSubmenuTabbable(li, false));
    }
}
