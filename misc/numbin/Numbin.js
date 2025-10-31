export class Numbin {
    constructor(el, { min = 0, max = 9999, step = 1, loop = false } = {}) {
        this.el = el;

        let input = el.querySelector("input[type=number]");
        if (!input) {
            input = document.createElement("input");
            input.type = "number";
            el.appendChild(input);
        }
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
        this.lastValid = parseInt(input.value, 10) || min;

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
                const current = this.value;
                if (current !== null)
                    this.value = current + (dy < 0 ? this.step : -this.step);
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
                const current = this.value;
                if (current !== null)
                    this.value = current - dir * this.step;
            }
        }, { passive: false });

        this.input.addEventListener("keydown", e => {
            switch (e.key) {
                case "ArrowUp":
                    e.preventDefault();
                    if (this.value !== null)
                        this.value = this.value + this.step;
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    if (this.value !== null)
                        this.value = this.value - this.step;
                    break;
                case "Enter":
                    e.preventDefault();
                    this.input.blur();
                    break;
            }
        });

        this.input.addEventListener('blur', () => {
            const n = parseInt(this.input.value, 10);
            if (!Number.isFinite(n) || n < this.min || n > this.max) {
                const fallback = this.lastValid ?? this.min;
                this.value = fallback; // go through setter: clamp/loop + 'input' event
            } else {
                this.value = n;        // setter updates lastValid + emits 'input'
            }
        });
    }
}
