import { Ploder } from './Ploder.js';

const canvas = document.getElementById('svgPreview');
const ctx = canvas.getContext('2d');

// --- functions ---
function renderSVGToCanvas(svgText) {
    const blob = new Blob([svgText], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
    };
    img.src = url;
}

//
function getSVGFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

//
async function getSVGFromURL(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    return res.text();
}

// --- run ---
new Ploder(document.getElementById('svgploder'), {
    accept: '.svg',
    pattern: /^image\/svg\+xml$/,
    onUpload: async (files) => {
        for (const file of files) {
            if (!file.type.match(/^image\/svg\+xml$/)) continue;
            renderSVGToCanvas(await getSVGFromFile(file));
        }
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    const defaultSVG = await getSVGFromURL('/resources/images/svg/snkbx_Boosh.svg');
    renderSVGToCanvas(defaultSVG);
});
