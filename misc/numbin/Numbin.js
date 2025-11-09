export class Numbin {
    constructor(el,
        {
            min = 0, max = 9999, step = 1,
            loop = false,
            dragIncrement = 10,
            draggable = true, typeable = true, scrollable = true,
        } = {}
    ) {
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
        this.dragIncrement = dragIncrement;
        const v = parseInt(input.value, 10);
        this.lastValid = Number.isFinite(v) ? v : min;
        this.activeId = null;
        this.draggable = draggable;
        this.typeable = typeable;
        this.scrollable = scrollable;

        this.attachEvents();

        if (!this.typeable) {
            this.input.readOnly = true;
            this.input.setAttribute('inputmode', 'none');
            // this.input.tabIndex = -1;
            this.input.style.caretColor = 'transparent';
            this.input.style.userSelect = 'none';
            this.input.style.pointerEvents = 'none';   // clicks go to container or page
        }


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

    handleEnterKey(e) {
        this.input.blur();
    }

    handleBeforeInput(e) {
        if (e.isComposing) return;

        const t = e.inputType;
        if (t.startsWith("delete")) return;
        if (!(t.startsWith("insert") || t === "insertReplacementText" || t === "insertFromPaste")) return;

        const data = e.data ?? "";
        // block anything that's not digits
        if (/\D/.test(data)) {
            e.preventDefault();
            return;
        }
    }

    increment(dir) {
        const v = this.value ?? 0;
        let n = v + dir * this.step;

        // clamp/loop logic centralized here
        if (this.loop) {
            const range = this.max - this.min + 1;
            if (range > 0)
                n = ((n - this.min) % range + range) % range + this.min;
        } else {
            n = Math.max(this.min, Math.min(this.max, n));
        }

        this.value = n;
    }

    handlePointerDown = (e) => {
        if (e.button !== 0 || this.activeId !== null) return;
        this.activeId = e.pointerId;
        this.startY = e.clientY;
        this.moved = false;
        this.el.setPointerCapture(e.pointerId);

    }
    handlePointerMove = (e) => {
        if (e.pointerId !== this.activeId) return;
        const dy = e.clientY - this.startY;
        if (Math.abs(dy) > this.dragIncrement) {
            this.moved = true;
            // this.value = this.value === null ? 0 : this.value + (dy < 0 ? this.step : -this.step);
            this.increment(dy < 0 ? +1 : -1);
            this.startY = e.clientY;
        }
    }
    handlePointerUp = (e) => {
        if (e.pointerId !== this.activeId) return;
        this.el.releasePointerCapture(e.pointerId);
        if (!this.moved) {
            // this.input.focus({ preventScroll: true });
            this.input.select?.();
        }
        this.activeId = null;
    }

    handlePointerCancel = (e) => {
        if (e.pointerId === this.activeId) {
            this.el.releasePointerCapture(e.pointerId);
            this.activeId = null;
        }
    }

    handleWheel = (e) => {
        // todo: factor out of attachEvents into here; attach if scrollable
    }

    // --- drag and drop handlers ---
    handleDragover = (e) => {
        e.preventDefault();              // enables dropping
        e.dataTransfer.dropEffect = 'copy';        
        this.el.classList.add('dragover');
    }
    handleDragEnd = (e) => {
        e.preventDefault();              // enables dropping
        e.dataTransfer.dropEffect = 'copy';
        this.el.classList.remove('dragover');
    }
    
    handleDrop = (e) => {
        // for dropping numbers onto one? like, it does this naturally if typeable, but what if it's not?
        // we might be able to preserve all the non-focus-typing-ey stuff from non-typeable IF we handle drop properly
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        const val = parseInt(e.dataTransfer.getData('text/plain'), 10);
        this.el.classList.remove('dragover');
        if (!Number.isFinite(val)) return;
        this.value = val; // runs clamp/loop logic and dispatches input
    }

    attachEvents() {
        const el = this.el;

        if (this.draggable) {
            el.addEventListener("pointerdown", this.handlePointerDown);
            el.addEventListener("pointermove", this.handlePointerMove);
            el.addEventListener("pointerup", this.handlePointerUp);
            el.addEventListener("pointercancel", this.handlePointerCancel);

            // patch for "don't scroll-on-drag" for the numbin's <input>        
            this.input.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
        }

        if (this.scrollable) {
            el.addEventListener("wheel", e => {
                e.preventDefault();
                const dir = Math.sign(e.deltaY);
                // if (dir) this.value = this.value === null ? 0 : this.value - dir * this.step;
                if (dir) this.increment(-dir);
            }, { passive: false });
        }

        this.input.addEventListener("keydown", e => {
            switch (e.key) {
                case "ArrowUp":
                    e.preventDefault();
                    // this.value = this.value === null ? 0 : this.value + this.step;
                    this.increment(+1);
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    // this.value = this.value === null ? 0 : this.value - this.step;
                    this.increment(-1);

                    break;
                case "Enter":
                    e.preventDefault();
                    this.handleEnterKey(e);
                    break;
            }
        });

        this.input.addEventListener("beforeinput", e => this.handleBeforeInput(e));

        // this should probably be handled upstream wherever possible
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
    }
}
