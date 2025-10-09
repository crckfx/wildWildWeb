document.addEventListener("DOMContentLoaded", () => {
  const sections = [...document.querySelectorAll("main section[id]")];
  const linkMap = new Map(
    sections.map(s => [s.id, document.querySelector(`.contents[data-target="${s.id}"]`)])
  );

  const setCurrent = (id) => {
    document.querySelectorAll(".toc .current").forEach(el => el.classList.remove("current"));
    const link = linkMap.get(id);
    if (link) link.classList.add("current");
  };

  // Measure sticky header so the “hot zone” sits below it
  const headerH = document.querySelector("header")?.getBoundingClientRect().height || 0;

  // 1px sentinel at the *top* of each section
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.parentElement.id; // sentinel lives inside the section
        setCurrent(id);
      }
    });
  }, {
    // Top of a section is "active" when it enters this center band.
    // Top margin pushes band below the sticky header.
    rootMargin: `${-(headerH + 8)}px 0px -60% 0px`,
    threshold: 0
  });

  sections.forEach(s => {
    const sent = document.createElement("div");
    sent.className = "toc-sentinel";
    // keep it invisible & non-intrusive
    sent.style.cssText = "position:relative;height:1px;margin-top:-1px;";
    s.prepend(sent);
    io.observe(sent);
  });

  // Smooth-scroll + URL (no extra history entries)
  document.querySelectorAll(".contents").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const hash = new URL(link.href, location.href).hash;
      const target = document.querySelector(hash);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth" });
      history.replaceState(null, "", hash);
      setCurrent(target.id); // instant feedback
    });
  });

  // Initial highlight
  const initial = location.hash?.slice(1);
  setCurrent(linkMap.has(initial) ? initial : sections[0]?.id);

  // Edge case: when you hit the absolute bottom, force last section active
  window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      const last = sections[sections.length - 1];
      if (last) setCurrent(last.id);
    }
  }, { passive: true });
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

