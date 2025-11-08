export class Numbin {
    constructor(el, { min = 0, max = 9999, step = 1, loop = false } = {}) {
        this.el = el;

        let input = el.querySelector("input");
        if (!input) {
            input = document.createElement("input");
            // input.type = "number";
            // el.appendChild(input);
        }
        input.min = min;
        input.max = max;
        input.step = step;
        input.value = el.dataset.value || null;
        input.setAttribute('inputmode', 'numeric');
        input.type = "text";
        el.appendChild(input);
        this.input = input;

        this.min = min;
        this.max = max;
        this.step = step;
        this.loop = loop;
        this.startY = 0;
        this.moved = false;
        const v = parseInt(input.value, 10);
        this.lastValid = Number.isFinite(v) ? v : min;

        this.attachEvents();
    }

    get value() {
        const n = parseInt(this.input.value, 10);
        return Number.isFinite(n) ? n : null;
    }

    set value(v) {
        if (!Number.isFinite(v)) return;

        let n = v;
        if (this.loop === true) {
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

        this.lastValid = n;
    }

    attachEvents() {
        const el = this.el;

        el.addEventListener("pointerdown", e => {
            e.preventDefault();
            // this.input.focus();
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
                this.value = this.value === null
                    ? 0
                    : this.value + (dy < 0 ? this.step : -this.step);
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

        el.addEventListener("wheel", e => {
            e.preventDefault();
            const dir = Math.sign(e.deltaY);
            if (dir) {
                this.value = this.value === null ? 0 : this.value - dir * this.step;
            }
        }, { passive: false });

        this.input.addEventListener("keydown", e => {
            switch (e.key) {
                case "ArrowUp":
                    e.preventDefault();
                    this.value = this.value === null ? 0 : this.value + this.step;

                    break;
                case "ArrowDown":
                    e.preventDefault();
                    this.value = this.value === null ? 0 : this.value - this.step;

                    break;
                case "Enter":
                    e.preventDefault();
                    this.input.blur();
                    break;
            }
        });

        this.input.addEventListener('blur', () => {
            const raw = this.input.value;
            if (raw === '') return; // leave blank untouched

            const n = this.value;
            if (!Number.isFinite(n) || n < this.min || n > this.max) {
                const fb = this.lastValid;
                if (fb !== null && fb !== undefined) this.value = fb;
            } else if (n !== this.lastValid) {
                this.value = n;
            }
        });

        // patch for "don't scroll-on-drag" for the numbin's <input>        
        this.input.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    }
}
