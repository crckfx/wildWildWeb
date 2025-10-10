// caseStudy
gsap.registerPlugin(ScrollTrigger);


const title = document.querySelector('.intro__title');
title.innerHTML = title.textContent.split('').map(char => `<span class="char">${char}</span>`).join('');

// Animation
function initIntro() {
  gsap.from('.intro__title .char', {
    y: 100,
    opacity: 0,
    stagger: 0.05,
    duration: 1.5,
    ease: 'power4.out'
  });

  gsap.from('.intro__txt', {
    x: -100,
    opacity: 0,
    duration: 1.5,
    ease: 'power4.out',
    delay: 0.5
  });

gsap.set('.intro__title', { x: 0 });

gsap.to('.intro__title', {
  scrollTrigger: {
    trigger: '.intro',
    scrub: 1,
    start: "top bottom",
    end: "bottom top"
  },
  x: 400,
  ease: 'power4.inOut'
});

}

window.addEventListener('load', initIntro);
