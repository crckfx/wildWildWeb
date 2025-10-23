export class Ploder {
    constructor(zone, {
        accept = '*/*',
        pattern = /.*/,
        multiple = true,
        onUpload = null,
        click = true,
    } = {}) {
        this.pattern = pattern;

        // Default behavior: log accept/reject
        this.onUpload = onUpload || ((valid, all) => {
            all.forEach(f => {
                if (valid.includes(f)) {
                    console.log(`ACCEPTED: ${f.name} (${f.type})`);
                } else {
                    console.warn(`REJECTED: ${f.name} (${f.type})`);
                }
            });
        });

        // hidden <input type=file>
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = multiple;
        fileInput.accept = accept;
        fileInput.style.display = 'none';
        zone.appendChild(fileInput);

        const handle = fileList => {
            const all = [...fileList];
            const valid = all.filter(f => this.pattern.test(f.type));
            this.onUpload(valid, all);
        };

        // Event bindings
        if (click) zone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => handle(fileInput.files));
        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.classList.add('dragover');
        });
        zone.addEventListener('dragleave', e => {
            e.preventDefault();
            zone.classList.remove('dragover');
        });
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('dragover');
            handle(e.dataTransfer.files);
        });
    }
}
