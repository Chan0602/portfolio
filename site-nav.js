document.addEventListener("DOMContentLoaded", () => {
  window.portfolioNavVersion = "20260701-contact-target-3";
  const nav = document.querySelector("[data-portfolio-nav]");
  const toggle = nav?.querySelector("[data-portfolio-nav-toggle]");
  const links = nav?.querySelectorAll(".portfolio-nav__panel a") || [];

  if (!nav || !toggle) return;

  const updateScrolledState = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  updateScrolledState();
  window.addEventListener("scroll", updateScrolledState, { passive: true });

  function closeNav() {
    nav.classList.remove("is-open");
    document.body.classList.remove("portfolio-nav-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
  }

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = nav.classList.toggle("is-open");
    document.body.classList.toggle("portfolio-nav-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  links.forEach((link) => link.addEventListener("click", (event) => {
    const isSamePageContact = link.hash === "#contact-me" && link.pathname === window.location.pathname;
    closeNav();

    if (!isSamePageContact) return;

    event.preventDefault();
    history.pushState(null, "", "#contact-me");
    const footer = document.getElementById("scroll-footer");
    if (!footer) return;

    const targetTop = footer.offsetTop + Math.max(1, footer.offsetHeight - window.innerHeight);
    window.scrollTo({ top: targetTop, behavior: "auto" });

    const contactPanel = document.getElementById("contact-panel");
    const footerScene = footer.querySelector(".footer-scene");
    if (contactPanel) {
      contactPanel.style.opacity = "1";
      contactPanel.classList.add("is-visible");
      contactPanel.setAttribute("aria-hidden", "false");
    }
    footerScene?.classList.add("contact-active");
  }));

  document.addEventListener("click", (event) => {
    if (!nav.classList.contains("is-open") || nav.contains(event.target)) return;
    closeNav();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav();
  });
});
