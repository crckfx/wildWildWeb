export function generateMenuHTML(menu) {
    return `<pre>${JSON.stringify(menu, null, 2)}</pre>`;
}

export function helloWorld() {
    return "Hello from provider!";
}