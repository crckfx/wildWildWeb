import { Ploder } from './Ploder.js';

// Grab canvas and context
const canvas = document.getElementById('svgPreview');
const ctx = canvas.getContext('2d');

// Initialize Ploder
new Ploder(document.getElementById('svgploder'), {
    accept: '.svg',
    pattern: /^image\/svg\+xml$/,
    onUpload: (files) => {
        for (const file of files) {
            if (!file.type.match(/^image\/svg\+xml$/)) continue;

            const reader = new FileReader();
            reader.onload = (e) => {
                const svgText = e.target.result;
                renderSVGToCanvas(svgText);
            };
            reader.readAsText(file);
        }
    }
});

// Render SVG text to canvas
function renderSVGToCanvas(svgText) {
    const blob = new Blob([svgText], {
        type: 'image/svg+xml'
    });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
        // Clear previous content
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the SVG to fill the canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Clean up the blob URL
        URL.revokeObjectURL(url);
    };
    img.src = url;
}