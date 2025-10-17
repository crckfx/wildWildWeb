export class Accordion {
    constructor(container, options) {
        // Store the container element
        this.container = container;
        this.items = [];
        const panels = container.querySelectorAll('.accordion-panel');

        // NEW: wrap panels in "items" instead
        for (const panel of panels) {
            if (panel.classList.contains("min")) {
                // VERY CHEEKY: INFLATE SOME SHORTHAND SPAN STUFF
                const _header = panel.querySelector('span.header');
                const _content = panel.querySelector('span.content');
                const contents = _content.innerHTML;
                const title = _header.textContent;
                panel.innerHTML = "";

                const newPanelInterior = this.specialCreatePanelInterior({
                    title: title,
                    content: contents,
                });
                const header = newPanelInterior.trigger;
                const content = newPanelInterior.content;
                panel.appendChild(header);
                panel.appendChild(content);
                panel.classList.remove("min");
            
                this.items.push({ panel, header, content });

            } else {
                // REGULAR: USE A REAL PRE-MADE ONE
                const header = panel.querySelector('.accordion-trigger');
                const content = panel.querySelector('.accordion-content');
                this.items.push({ panel, header, content });
            }
        }



        // Default parameters for styling or behavior
        this.options = {
            exclusive: false,
            addPanels: [],
            scrollOnExpand: true,
            mainRounding: "8px", // Border radius for panels
            contentRounding: "0px", // Border radius for panels
            gap: "2px", // Gap between panels
            animationDuration: "0.5s", // Transition duration for opening/closing
            backgroundColor: "none",
            ...options, // Allow user-provided options to override defaults
        };

        this.options.addPanels.forEach((panel) => this.createPanel(panel));

        this.container.style.setProperty("gap", this.options.gap);
        this.container.style.setProperty("border-width", this.options.gap);
        this.container.style.setProperty("border-radius", this.options.mainRounding);
        this.container.style.setProperty("background-color", this.options.backgroundColor);
        // this.container.style.setProperty("transition", `grid-template-rows: ${this.options.animationDuration}`);
        this.items.forEach((item) => {
            item.panel.style.borderRadius = this.options.panelRounding;
            item.content.style.transition = `grid-template-rows ${this.options.animationDuration}`;
            item.header.addEventListener("click", () => this.toggle(item));
        });
    }

    specialCreatePanelInterior(data) {
        const newPanelTrigger = document.createElement('button');
        newPanelTrigger.classList.add('accordion-trigger');
        newPanelTrigger.ariaExpanded = "false";
        newPanelTrigger.innerHTML = `<h2>${data.title}</h2>`;

        const newPanelContent = document.createElement('div');
        newPanelContent.classList.add('accordion-content');
        newPanelContent.ariaHidden = "true";
        newPanelContent.innerHTML = `<div><hr>${data.content}</div>`;

        return {
            trigger: newPanelTrigger,
            content: newPanelContent
        };
    }

    createPanel(data) {
        console.log("adding panel:", data)
        const newPanel = document.createElement('div');
        newPanel.classList.add('accordion-panel');

        const newPanelTrigger = document.createElement('button');
        newPanelTrigger.classList.add('accordion-trigger');
        newPanelTrigger.ariaExpanded = "false";
        newPanelTrigger.innerHTML = `<h2>${data.title}</h2>`;

        const newPanelContent = document.createElement('div');
        newPanelContent.classList.add('accordion-content');
        newPanelContent.ariaHidden = "true";
        newPanelContent.innerHTML = `<div><hr>${data.content}</div>`;

        newPanel.appendChild(newPanelTrigger);
        newPanel.appendChild(newPanelContent);

        // NEW: ITEMS
        this.items.push({
            panel: newPanel,
            header: newPanelTrigger,
            content: newPanelContent
        });

        // possibly dodgy "insert at order" method
        console.log(`provided position is ${data.order}`);
        if (data.order !== undefined) {
            this.container.insertBefore(newPanel, this.container.children[data.order]);
        } else {
            this.container.appendChild(newPanel);
        }
    }

    updateItemState(item, newState) {
        item.header.setAttribute("aria-expanded", newState);
        item.content.setAttribute("aria-hidden", !newState);
    }

    toggle(item) {
        // Check the current state
        const isExpanded = item.header.getAttribute("aria-expanded") === "true";
        
        // experimental: scroll to fit panel
        // this is kind of crude (fires after transition), but "nearest" seems to filter nicely
        if (this.options.scrollOnExpand === true && !isExpanded) {
            item.content.addEventListener("transitionend", function handler(event) {
                if (event.propertyName === "grid-template-rows") {
                    // console.log('transition end');
                    item.panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    item.content.removeEventListener("transitionend", handler);
                }
            });
        }
        if (this.options.exclusive === true) {
            if (!isExpanded) {
                // if we're opening it; shut the other guys
                // console.log("shut the other guys");
                for (const other of this.items) {
                    if (other === item) continue;           // skip the one being opened
                    this.updateItemState(other, false)
                }
            }
        }

        // Toggle the state
        this.updateItemState(item, !isExpanded)



    }
}
