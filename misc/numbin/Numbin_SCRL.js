export class Numbin {
    constructor(el, { min = 0, max = 9999, step = 1, loop = false } = {}) {
        // el is the <div class="numbin"> gesture surface
        this.el = el;

        // create the input once; append inside the div
        const input = document.createElement("input");
        input.type = "number";
        input.min = min;
        input.max = max;
        input.step = step;
        input.value = el.dataset.value || 0;
        el.appendChild(input);

        this.input = input;
        this.min = min;
        this.max = max;
        this.step = step;
        this.loop = loop;
        this.startY = 0;
        this.moved = false;

        this.attachEvents();
    }

    get value() {
        return parseInt(this.input.value, 10) || 0;
    }

    set value(v) {
        let n = v;
        if (this.loop) {
            const range = this.max - this.min + 1;
            if (range > 0)
                n = ((n - this.min) % range + range) % range + this.min;
        } else {
            n = Math.max(this.min, Math.min(this.max, v));
        }
        if (String(n) !== this.input.value) {
            this.input.value = n;
            this.input.dispatchEvent(new Event("input", { bubbles: true }));
        }
    }

    attachEvents() {
        const el = this.el;

        // block browser scroll gestures while dragging
        el.addEventListener("pointerdown", e => {
            e.preventDefault();
            this.startY = e.clientY;
            this.moved = false;
            el.setPointerCapture(e.pointerId);
        });

        el.addEventListener("pointermove", e => {
            if (!(e.buttons & 1)) return;
            e.preventDefault();
            const dy = e.clientY - this.startY;
            if (Math.abs(dy) > 10) {
                this.moved = true;
                this.value = this.value + (dy < 0 ? this.step : -this.step);
                this.startY = e.clientY;
            }
        });

        el.addEventListener("pointerup", e => {
            el.releasePointerCapture(e.pointerId);
            if (!this.moved) {
                this.input.focus({ preventScroll: true });
                this.input.select?.();
            }
        });

        el.addEventListener(
            "wheel",
            e => {
                e.preventDefault();
                const dir = Math.sign(e.deltaY);
                if (dir) this.value = this.value - dir * this.step;
            },
            { passive: false }
        );
    }
}
