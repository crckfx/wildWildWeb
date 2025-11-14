export function createRord(grid) {

    let items = [...grid.children];

    let originalRects = [];
    let originalOrder = [];
    let gridRect;

    let dragging = null;
    let floating = null;
    let startIndex = -1;

    // helper functions
    function captureOriginalRects() {
        originalRects = items.map(el => {
            const r = el.getBoundingClientRect();
            return {
                left: r.left,
                top: r.top,
                cx: r.left + r.width / 2,
                cy: r.top + r.height / 2
            };
        });
    }

    function nearestIndex(x, y) {
        let best = 0;
        let bestDist = Infinity;
        for (let i = 0; i < originalRects.length; i++) {
            const r = originalRects[i];
            const dx = r.cx - x;
            const dy = r.cy - y;
            const d = dx * dx + dy * dy;
            if (d < bestDist) {
                bestDist = d;
                best = i;
            }
        }
        return best;
    }

    function applyTransforms() {
        for (let i = 0; i < items.length; i++) {
            const el = items[i];
            const tr = originalRects[i];
            const or = el.__origPos;
            el.style.transform = `translate(${tr.left - or.left}px, ${tr.top - or.top}px)`;
        }
    }

    function isInsideGrid(x, y) {
        return (
            x >= gridRect.left &&
            x <= gridRect.right &&
            y >= gridRect.top &&
            y <= gridRect.bottom
        );
    }

    function moveFloating(e) {
        floating.style.left = e.clientX + "px";
        floating.style.top = e.clientY + "px";
    }

    // event functions
    function startDrag(e) {
        const t = e.target.closest(".item");
        if (!t) return;

        e.preventDefault();

        dragging = t;
        startIndex = items.indexOf(dragging);

        originalOrder = [...items];
        gridRect = grid.getBoundingClientRect();

        captureOriginalRects();
        items.forEach(el => {
            const r = el.getBoundingClientRect();
            el.__origPos = { left: r.left, top: r.top };
        });

        floating = dragging.cloneNode(true);
        floating.classList.remove("item");
        floating.classList.add("floating");
        document.body.appendChild(floating);

        dragging.classList.add("drag-src");
        dragging.setPointerCapture(e.pointerId);

        moveFloating(e);
    }

    function moveDrag(e) {
        if (!dragging) return;

        moveFloating(e);

        if (!isInsideGrid(e.clientX, e.clientY)) {
            // strict snap back
            items = [...originalOrder];
            items.forEach(el => el.style.transform = "");
            startIndex = items.indexOf(dragging);
            return;
        }

        const idx = nearestIndex(e.clientX, e.clientY);
        if (idx === startIndex) return;

        const removed = items.splice(startIndex, 1)[0];
        items.splice(idx, 0, removed);
        startIndex = idx;

        applyTransforms();
    }

    function endDrag(e) {
        if (!dragging) return;
        const inside = isInsideGrid(e.clientX, e.clientY);

        dragging.releasePointerCapture(e.pointerId);

        if (floating) floating.remove();
        floating = null;

        dragging.classList.remove("drag-src");

        items.forEach(el => {
            el.style.transform = "";
            grid.appendChild(el);
        });

        dragging = null;
        startIndex = -1;

        // detect if this pointer truly changed the order and fire something if it did
        if (inside) {
            let changed = false;
            for (let i = 0; i < items.length; i++) {
                if (items[i] !== originalOrder[i]) {
                    changed = true;
                    break;
                }
            }

            if (changed) {
                console.log("confirmed reorder:", items.map(el => el.textContent));
            }
        }

    }

    grid.addEventListener("pointerdown", startDrag);
    grid.addEventListener("pointermove", moveDrag);
    grid.addEventListener("pointerup", endDrag);
    grid.addEventListener("pointercancel", endDrag);

}