export class Numbin {
    constructor(input, {min = 0, max = 9999, step = 1} = {}) {
        this.input = input;
        this.min = min;
        this.max = max;
        this.step = step;

        this.startY = 0;
        this.moved = false;

        this.attachEvents();
    }

    get value() {
        return parseInt(this.input.value, 10) || 0;
    }

    set value(v) {
        const clamped = Math.max(this.min, Math.min(this.max, v));
        this.input.value = clamped;
    }

    attachEvents() {
        this.input.addEventListener('pointerdown', e => {
            e.preventDefault();
            this.startY = e.clientY;
            this.moved = false;
            this.input.setPointerCapture(e.pointerId);
        });

        this.input.addEventListener('pointermove', e => {
            if (e.buttons === 1) {
                const deltaY = e.clientY - this.startY;
                if (Math.abs(deltaY) > 10) {
                    this.moved = true;
                    if (deltaY > 0) this.value = this.value - this.step;
                    else this.value = this.value + this.step;
                    this.startY = e.clientY;
                }
            }
        });

        this.input.addEventListener('pointerup', e => {
            this.input.releasePointerCapture(e.pointerId);
            if (!this.moved) {
                // treat as click → focus/select
                this.input.focus();
                this.input.select();
            }
        });

        this.input.addEventListener('wheel', e => {
            e.preventDefault();
            if (e.deltaY > 0) this.value = this.value - this.step;
            else this.value = this.value + this.step;
        });
    }
}
