export class Accordion {
    constructor(container, options) {
        // Store the container element
        this.container = container;

        const panels = container.querySelectorAll('.accordion-panel');
        this.panels = Array.from(panels);


        // Default parameters for styling or behavior
        this.options = {
            addPanels: [],
            scrollOnExpand: true,
            mainRounding: "8px", // Border radius for panels
            contentRounding: "0px", // Border radius for panels
            gap: "2px", // Gap between panels
            animationDuration: "0.5s", // Transition duration for opening/closing
            backgroundColor: "none",
            ...options, // Allow user-provided options to override defaults
        };

        console.log("------ panels ------");
        this.options.addPanels.forEach((panel) => {
            // console.log(panel); // correctly targets a param panel
            const newPanel = document.createElement('div');
            newPanel.classList.add('accordion-panel');

            const newPanelTrigger = document.createElement('button');
            newPanelTrigger.classList.add('accordion-trigger');
            newPanelTrigger.ariaExpanded = "false";
            newPanelTrigger.innerHTML = `<h2>${panel.title}</h2>`;

            const newPanelContent = document.createElement('div');
            newPanelContent.classList.add('accordion-content');
            newPanelContent.ariaHidden = "true";
            newPanelContent.innerHTML = `<div><hr>${panel.content}</div>`;

            newPanel.appendChild(newPanelTrigger);
            newPanel.appendChild(newPanelContent);

            this.panels.push(newPanel);

            console.log(`provided position is ${panel.order}`);
            if (panel.order !== undefined) {
                container.insertBefore(newPanel, container.children[panel.order]);
            } else {
                container.appendChild(newPanel);
            }

        });
        console.log("------ /panels ------");
        this.container.style.setProperty("gap", this.options.gap);
        this.container.style.setProperty("border-width", this.options.gap);
        this.container.style.setProperty("border-radius", this.options.mainRounding);
        this.container.style.setProperty("background-color", this.options.backgroundColor);
        // this.container.style.setProperty("transition", `grid-template-rows: ${this.options.animationDuration}`);
        this.panels.forEach((panel) => {
            // console.log(panel);
            panel.style.borderRadius = this.options.panelRounding;
            const header = panel.querySelector(".accordion-trigger");
            const content = panel.querySelector(".accordion-content");
            // console.log(`animation duration is ${this.options.animationDuration}`);
            content.style.transition = `grid-template-rows ${this.options.animationDuration}`;

        })

        // Initialize the accordion behavior
        this.init();
    }

    init() {
        // Attach a click listener to the accordion
        this.container.addEventListener("click", (e) => {
            const trigger = e.target.closest(".accordion-trigger");
            if (!trigger) return; // Ignore clicks outside the trigger

            const panel = trigger.closest(".accordion-panel");
            this.toggle(panel);
        });

    }

    toggle(panel) {
        const header = panel.querySelector(".accordion-trigger");
        const content = panel.querySelector(".accordion-content");

        // Check the current state
        const isExpanded = header.getAttribute("aria-expanded") === "true";

        // Toggle the state
        header.setAttribute("aria-expanded", !isExpanded);
        content.setAttribute("aria-hidden", isExpanded);

        // experimental: scroll to fit panel
        // this is kind of crude (fires after transition), but "nearest" seems to filter nicely
        if (this.options.scrollOnExpand === true) {
            content.addEventListener("transitionend", function handler(event) {
                if (event.propertyName === "grid-template-rows") {
                    // console.log('transition end');
                    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    content.removeEventListener("transitionend", handler);
                }
            });
        }
    }
}
