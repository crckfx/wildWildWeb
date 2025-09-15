import { MerryGoRound } from "./MerryGoRound.js";

// get the empty item from the DOM
const carousel = document.querySelector('.carousel');

// (assume it is already populated)

// bring the populated element to life
const merryGoRound = new MerryGoRound(carousel);
// measure again if we resize (not baked into the class yet, don't worry about it)
window.addEventListener('resize', () => {
    merryGoRound.setCarouselMinHeight();
});