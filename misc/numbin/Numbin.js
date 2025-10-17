export class Numbin {
    constructor(input, { min = 0, max = 9999, step = 1, loop = false } = {}) {
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
		let newVal = v;

		if (this.loop) {
			const range = this.max - this.min + 1;
			if (range > 0) {
				newVal = ((newVal - this.min) % range + range) % range + this.min;
			}
		} else {
			newVal = Math.max(this.min, Math.min(this.max, v));
		}

		if (this.input.value !== String(newVal)) {
			this.input.value = newVal;
			this.input.dispatchEvent(new Event("input", { bubbles: true }));
		}
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
            e.stopPropagation(); // stop native input increment
            const dir = Math.sign(e.deltaY); // -1 for up, +1 for down
            if (dir !== 0) this.value = this.value - dir * this.step;
        });
    }
}
