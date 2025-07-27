import { loadTheme } from "./theme.js";

console.log("hello from global JS");

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
});