document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll("main section");
  const tocItems = document.querySelectorAll(".contents");

  // create an observer
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // get the ID of the visible section
          const id = entry.target.getAttribute("id");

          // remove .current from all TOC items
          tocItems.forEach(item => item.classList.remove("current"));

          // add .current to the matching TOC item
          const activeItem = document.querySelector(`.contents[data-target="${id}"]`);
          if (activeItem) {
            activeItem.classList.add("current");
          }
        }
      });
    },
    {
      root: null, // viewport
      threshold: 0.5 // section is "active" when 50% visible
    }
  );

  // observe each section
  sections.forEach(section => {
    observer.observe(section);
  });
});

// Smooth-scroll TOC without polluting history
document.querySelectorAll('.contents').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();

    // get the hash from href (works even if href is absolute)
    const hash = new URL(link.href, location.href).hash;
    const target = document.querySelector(hash);
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth' });

    // update URL *without* adding a history entry
    history.replaceState(null, '', hash);
  });
});

// If user lands on the page with a hash, scroll to it
window.addEventListener('load', () => {
  if (location.hash) {
    const el = document.querySelector(location.hash);
    el?.scrollIntoView({ behavior: 'smooth' });
  }
});








// Accordian
document.querySelectorAll('.accordionContainer').forEach(createAccordion);

function createAccordion(accordion) {
  accordion.addEventListener('click', (e) => {
    const header = e.target.closest('.accordionButton');
    if (!header || !accordion.contains(header)) return;

    const panel = header.closest('.accordionPanel');
    toggleAccordion(panel, accordion);
  });
}

function toggleAccordion(currentPanel, root) {
  const btn = currentPanel.querySelector('.accordionButton');
  const content = currentPanel.querySelector('.accordionContent');
  const isOpen = btn.getAttribute('aria-expanded') === 'true';

  root.querySelectorAll('.accordionPanel').forEach(p => {
    const b = p.querySelector('.accordionButton');
    const c = p.querySelector('.accordionContent');
    b.setAttribute('aria-expanded', 'false');
    c.setAttribute('aria-hidden', 'true');
  });

  if (!isOpen) {
    btn.setAttribute('aria-expanded', 'true');
    content.setAttribute('aria-hidden', 'false');

    content.addEventListener('transitionend', function handler(ev) {
      if (ev.propertyName === 'grid-template-rows') {
        currentPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        content.removeEventListener('transitionend', handler);
      }
    });
  }
}



// Video

// Manage autoplay/pause/controls for ALL smart videos
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const videos = document.querySelectorAll('video.smartVideo');

// One observer for all videos
const io = new IntersectionObserver((entries) => {
  for (const { target: v, isIntersecting } of entries) {
    if (prefersReducedMotion.matches) continue; // don't autoplay if user prefers less motion
    if (isIntersecting) {
      v.play?.().catch(() => v.setAttribute('controls', ''));
    } else {
      v.pause?.();
    }
  }
}, { threshold: 0.5, rootMargin: '0px 0px -20% 0px' });

videos.forEach((v) => {
  // Ensure attributes that make mobile autoplay work
  v.setAttribute('playsinline', '');
  v.muted = true; // programmatic mute (needed for some browsers)
  v.setAttribute('preload', v.getAttribute('preload') || 'metadata');

  if (prefersReducedMotion.matches) {
    v.removeAttribute('autoplay');
    v.pause?.();
    v.setAttribute('controls', '');   // let the user choose to play
    return;                           // don't observe this video
  }

  // Try to autoplay; if blocked, show controls
  v.play?.().catch(() => v.setAttribute('controls', ''));

  // Start observing viewport visibility
  io.observe(v);
});

// If the user changes their system motion preference while the page is open
prefersReducedMotion.addEventListener?.('change', (e) => {
  videos.forEach((v) => {
    if (e.matches) {
      v.removeAttribute('autoplay');
      v.pause?.();
      v.setAttribute('controls', '');
      io.unobserve(v);
    } else {
      v.removeAttribute('controls');
      io.observe(v);
      v.play?.().catch(() => v.setAttribute('controls', ''));
    }
  });
});


