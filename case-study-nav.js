(() => {
  const projectNav = document.querySelector(".project-nav");
  const getSpyLinks = () => Array.from(document.querySelectorAll(".spy-nav__link[data-target]"));
  const getSections = () => getSpyLinks()
    .map(link => document.getElementById(link.dataset.target))
    .filter(Boolean);

  if (!projectNav || !getSpyLinks().length || !getSections().length) return;

  const setActiveSection = sectionId => {
    getSpyLinks().forEach(link => {
      link.classList.toggle("is-active", link.dataset.target === sectionId);
    });
  };

  document.addEventListener("click", event => {
    const link = event.target.closest(".spy-nav__link[data-target]");
    if (!link) return;
    const target = document.getElementById(link.dataset.target);
    if (!target) return;
    setActiveSection(target.id);
    const navHeight = projectNav.getBoundingClientRect().height;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight - 21;
    window.scrollTo({ top: targetTop, behavior: "smooth" });
  });

  let frame = null;
  const update = () => {
    frame = null;
    const activationLine = projectNav.getBoundingClientRect().height + 32;
    const sections = getSections();
    const active = sections.reduce((current, section) => {
      return section.getBoundingClientRect().top <= activationLine ? section : current;
    }, sections[0]);
    if (active) setActiveSection(active.id);
  };

  update();
  window.addEventListener("scroll", () => {
    if (frame !== null) return;
    frame = window.requestAnimationFrame(update);
  }, { passive: true });

  const revealItems = document.querySelectorAll(".lyntra-reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.16 });

    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("is-visible"));
  }

  const impactSection = document.querySelector("[data-lyntra-impact]");
  if (impactSection && "IntersectionObserver" in window) {
    const impactItems = Array.from(impactSection.querySelectorAll("[data-lyntra-impact-item]"));
    const impactObserver = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      impactItems.forEach((item, index) => {
        item.animate([
          { opacity: 0, transform: "translateY(30px)" },
          { opacity: 1, transform: "translateY(0)" }
        ], {
          duration: 900,
          delay: index * 120,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both"
        });
      });
      impactObserver.unobserve(impactSection);
    }, { threshold: 0.2, rootMargin: "0px 0px -20% 0px" });
    impactObserver.observe(impactSection);
  }

  const lightboxTargets = Array.from(document.querySelectorAll(
    "[data-section-group] img, [data-section-group] video"
  )).filter(target => !target.closest(".portfolio-nav") && !target.closest(".case-study-grass-footer"));

  if (lightboxTargets.length) {
    const lightbox = document.createElement("div");
    lightbox.className = "lyntra-media-lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Expanded media preview");
    lightbox.innerHTML = `
      <button class="lyntra-media-lightbox__close" type="button" aria-label="Close preview">×</button>
      <div class="lyntra-media-lightbox__content"></div>
    `;
    document.body.appendChild(lightbox);

    const lightboxContent = lightbox.querySelector(".lyntra-media-lightbox__content");
    const closeLightboxButton = lightbox.querySelector(".lyntra-media-lightbox__close");
    let activeTrigger = null;

    const closeLightbox = () => {
      lightbox.classList.remove("is-open");
      document.body.classList.remove("lyntra-lightbox-open");
      lightboxContent.innerHTML = "";
      if (activeTrigger) activeTrigger.focus({ preventScroll: true });
      activeTrigger = null;
    };

    const openLightbox = source => {
      const isVideo = source.tagName.toLowerCase() === "video";
      const expanded = document.createElement(isVideo ? "video" : "img");
      activeTrigger = source;
      if (isVideo) {
        expanded.src = source.currentSrc || source.src;
        expanded.controls = true;
        expanded.autoplay = true;
        expanded.loop = true;
        expanded.muted = true;
        expanded.playsInline = true;
      } else {
        expanded.src = source.currentSrc || source.src;
        expanded.alt = source.alt || "Expanded Lyntra project image";
      }
      lightboxContent.innerHTML = "";
      lightboxContent.appendChild(expanded);
      document.body.classList.add("lyntra-lightbox-open");
      lightbox.classList.add("is-open");
      closeLightboxButton.focus({ preventScroll: true });
    };

    lightboxTargets.forEach(target => {
      target.classList.add("lyntra-lightbox-trigger");
      target.setAttribute("tabindex", "0");
      target.setAttribute("role", "button");
      target.setAttribute("aria-label", target.getAttribute("aria-label") || target.alt || "Open larger preview");
      target.addEventListener("click", () => openLightbox(target));
      target.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openLightbox(target);
      });
    });

    closeLightboxButton.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", event => {
      if (event.target === lightbox) closeLightbox();
    });
    window.addEventListener("keydown", event => {
      if (event.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox();
    });
  }
})();
