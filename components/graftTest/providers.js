export function generateMenuHTML(plan) {
    const length = plan.renderablePages;
    return `<pre>hi from ${length} pages!</pre>`;
}

export function helloWorld(plan) {
    return "Hello from provider!";
}