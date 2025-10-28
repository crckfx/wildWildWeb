// --- helper functions ---
export function getSVGFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

export async function getSVGFromURL(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    return res.text();
}

export function inspectSVG(svgText) {
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const svg = doc.documentElement;
    if (!svg || svg.nodeName.toLowerCase() !== 'svg') return null;
    return {
        width: svg.getAttribute('width'),
        height: svg.getAttribute('height'),
        viewBox: svg.getAttribute('viewBox'),
        preserveAspectRatio: svg.getAttribute('preserveAspectRatio')
    };
}

export function filenameFromURL(url) {
    const parts = url.split('/');
    return parts[parts.length - 1] || 'untitled.svg';
}


export function loadSVGImage(svgText) {
    return new Promise((resolve, reject) => {
        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };

        img.onerror = reject;
        img.src = url;
    });
}