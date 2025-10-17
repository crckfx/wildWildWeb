document.addEventListener("DOMContentLoaded", () => {
    const sections = [...document.querySelectorAll("main section[id]")];
    const linkMap = new Map(
        sections.map(s => [s.id, document.querySelector(`.contents[data-target="${s.id}"]`)])
    );

    const setCurrent = (id) => {
        document.querySelectorAll(".toc .current").forEach(el => el.classList.remove("current"));
        const link = linkMap.get(id);
        if (link) link.classList.add("current");
    };

    // Measure sticky header so the “hot zone” sits below it
    const headerH = document.querySelector("header")?.getBoundingClientRect().height || 0;

    // 1px sentinel at the *top* of each section
    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const id = e.target.parentElement.id; // sentinel lives inside the section
                setCurrent(id);
            }
        });
    }, {
        // Top of a section is "active" when it enters this center band.
        // Top margin pushes band below the sticky header.
        rootMargin: `${-(headerH + 8)}px 0px -60% 0px`,
        threshold: 0
    });

    sections.forEach(s => {
        const sent = document.createElement("div");
        sent.className = "toc-sentinel";
        // keep it invisible & non-intrusive
        sent.style.cssText = "position:relative;height:1px;margin-top:-1px;";
        s.prepend(sent);
        io.observe(sent);
    });

    // Smooth-scroll + URL (no extra history entries)
    document.querySelectorAll(".contents").forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            const hash = new URL(link.href, location.href).hash;
            const target = document.querySelector(hash);
            if (!target) return;
            target.scrollIntoView({ behavior: "smooth" });
            history.replaceState(null, "", hash);
            setCurrent(target.id); // instant feedback
        });
    });

    // Initial highlight
    const initial = location.hash?.slice(1);
    setCurrent(linkMap.has(initial) ? initial : sections[0]?.id);

    // Edge case: when you hit the absolute bottom, force last section active
    window.addEventListener("scroll", () => {
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
            const last = sections[sections.length - 1];
            if (last) setCurrent(last.id);
        }
    }, { passive: true });
});
