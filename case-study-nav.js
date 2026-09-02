(() => {
  const projectNav = document.querySelector(".project-nav");
  const spyLinks = Array.from(document.querySelectorAll(".spy-nav__link[data-target]"));
  const sections = spyLinks
    .map(link => document.getElementById(link.dataset.target))
    .filter(Boolean);

  if (!projectNav || !spyLinks.length || !sections.length) return;

  const setActiveSection = sectionId => {
    spyLinks.forEach(link => {
      link.classList.toggle("is-active", link.dataset.target === sectionId);
    });
  };

  spyLinks.forEach(link => {
    link.addEventListener("click", () => {
      const target = document.getElementById(link.dataset.target);
      if (!target) return;
      setActiveSection(target.id);
      const navHeight = projectNav.getBoundingClientRect().height;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight - 21;
      window.scrollTo({ top: targetTop, behavior: "smooth" });
    });
  });

  let frame = null;
  const update = () => {
    frame = null;
    const activationLine = projectNav.getBoundingClientRect().height + 32;
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
})();
