// Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Wait For Assets To Load
window.addEventListener("load", () => {

  // DOM References
  const container = document.querySelector(".csColumns");
  const leftBlock = document.querySelector(".tableOfContents");
  const contentsList = Array.from(document.querySelectorAll(".contentsList a"));
  const sections = contentsList
    .map(a => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);


  // Header Offset
  const getHeaderOffset = () => {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--header-space").trim();
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 72;
  };
  const extraGap = 12;

  // Smooth Scrolling
  document.querySelectorAll(".tableOfContents .contentsList a, .tocMini a").forEach(a => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (!target) return;

      gsap.to(window, {
        duration: 0.7,
        ease: "power2.out",
        scrollTo: { y: target, offsetY: getHeaderOffset() + extraGap },
        onComplete: () => history.pushState(null, "", href)
      });
    });
  });

  // Highlight Active Section
  const setActive = (id) => {
    contentsList.forEach(a =>
      a.classList.toggle("active", a.getAttribute("href") === `#${id}`)
    );
  };

  sections.forEach(sec => {
    ScrollTrigger.create({
      trigger: sec,
      start: "top center",
      end: "bottom center",
      onEnter: () => setActive(sec.id),
      onEnterBack: () => setActive(sec.id)
    });
  });

  // Pin Table Of Contents
  let pinST = null;
  const mm = gsap.matchMedia();

  mm.add("(min-width: 1025px)", () => {
    if (!container || !leftBlock) return;

    const lockWidth = () => {
      leftBlock.style.width = getComputedStyle(leftBlock).width;
    };
    lockWidth();

    const onResize = () => {
      leftBlock.style.width = "";
      lockWidth();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);

    pinST = ScrollTrigger.create({
      trigger: container,
      start: "top 120px",
      end: () => `+=${Math.max(0, container.offsetHeight - leftBlock.offsetHeight)}`,
      pin: leftBlock,
      pinSpacing: true,
      invalidateOnRefresh: true
      // markers: true
    });

    return () => {
      if (pinST) { pinST.kill(); pinST = null; }
      leftBlock.style.width = "";
      window.removeEventListener("resize", onResize);
    };
  });

  // Unpin Everything For Phone
  mm.add("(max-width: 1024px)", () => {
    if (pinST) { pinST.kill(); pinST = null; }
    if (leftBlock) leftBlock.style.width = "";
    ScrollTrigger.refresh();
  });
  ScrollTrigger.refresh();
});


// Accordian Start
(() => {
  document.querySelectorAll('.accordion').forEach((acc) => {
    const items = acc.querySelectorAll('.acc-item');

    const closeItem = (item) => {
      const btn = item.querySelector('.acc-button');
      const panel = item.querySelector('.acc-panel');
      btn.setAttribute('aria-expanded', 'false');
      panel.style.maxHeight = null;
    };
    const openItem = (item) => {
      const btn = item.querySelector('.acc-button');
      const panel = item.querySelector('.acc-panel');
      btn.setAttribute('aria-expanded', 'true');
      panel.style.maxHeight = panel.scrollHeight + 'px';
    };

    items.forEach((item) => {
      const btn = item.querySelector('.acc-button');
      const panel = item.querySelector('.acc-panel');

      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        items.forEach(closeItem);
        if (!expanded) openItem(item);
      });

      window.addEventListener('resize', () => {
        if (btn.getAttribute('aria-expanded') === 'true') {
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      });
    });
  });
})();
// Accordian End

// ScrollTrigger RightColumn Start
// (function () {
//   if (!(window.gsap && window.ScrollTrigger)) return;
//   gsap.registerPlugin(ScrollTrigger);

//   const onReady = () => {
//     const mm = gsap.matchMedia();

//     mm.add("(prefers-reduced-motion: reduce)", () => {
//       gsap.set(".rightColumn .rightSection, .splitBar__panel, .personaContainer, #sec-matrix .matrix__row", {
//         autoAlpha: 1,
//         clearProps: "all"
//       });
//       return () => {};
//     });

//     mm.add("(prefers-reduced-motion: no-preference)", () => {
//       gsap.utils.toArray(".rightColumn .rightSection").forEach((sec, i) => {
//         const fromAxis = i % 2 ? { x: 18 } : { y: 24 }; // tweak amount here

//         gsap.from(sec, {
//           ...fromAxis,
//           autoAlpha: 0,
//           duration: 0.8,
//           ease: "power3.out",
//           clearProps: "transform,opacity",
//           scrollTrigger: {
//             trigger: sec,
//             start: "top 75%",
//             end: "top 30%",
//             toggleActions: "play none none reverse"
//           }
//         });

//         const kids = sec.querySelectorAll(":scope > *");
//         if (kids.length) {
//           gsap.from(kids, {
//             autoAlpha: 0,
//             y: 12,
//             duration: 0.6,
//             ease: "power2.out",
//             stagger: 0.06,
//             scrollTrigger: {
//               trigger: sec,
//               start: "top 70%",
//               toggleActions: "play none none reverse"
//             }
//           });
//         }
//       });

//       gsap.utils.toArray(".splitBar__panel").forEach((panel, idx) => {
//         gsap.from(panel, {
//           x: idx % 2 ? 12 : -12,
//           autoAlpha: 0,
//           duration: 0.6,
//           ease: "power3.out",
//           scrollTrigger: {
//             trigger: panel.closest(".rightSection") || panel,
//             start: "top 75%",
//             toggleActions: "play none none reverse"
//           }
//         });
//       });

//       if (document.querySelector(".persona")) {
//         gsap.from(".personaContainer", {
//           autoAlpha: 0,
//           y: 18,
//           duration: 0.6,
//           ease: "power3.out",
//           stagger: 0.1,
//           scrollTrigger: {
//             trigger: ".persona",
//             start: "top 80%",
//             toggleActions: "play none none reverse"
//           }
//         });
//       }

//       if (document.querySelector("#sec-matrix")) {
//         gsap.from("#sec-matrix .matrix__row", {
//           autoAlpha: 0,
//           y: 10,
//           duration: 0.4,
//           ease: "power2.out",
//           stagger: 0.05,
//           scrollTrigger: {
//             trigger: "#sec-matrix",
//             start: "top 80%",
//             toggleActions: "play none none reverse"
//           }
//         });
//       }

//       return () => ScrollTrigger.getAll().forEach(t => t.kill());
//     });
//   };

//   if (document.readyState === "loading") {
//     document.addEventListener("DOMContentLoaded", onReady, { once: true });
//   } else {
//     onReady();
//   }
// })();
// Scrolltrigger RightColumn End

// Gallery Start
  const dots = document.querySelectorAll('.dot');
  const track = document.querySelector('.galleryTrack');

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const index = parseInt(dot.getAttribute('data-index'));
      const shift = -index * 100;

      track.style.transform = `translateX(${shift}%)`;

      dots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
    });
  });
// Gallery End