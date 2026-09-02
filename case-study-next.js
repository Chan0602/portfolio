(() => {
  const projects = [
    {
      id: "lyntra",
      title: "Lyntra · Designing a product from 0 to 1",
      description: "Designing an AI-powered academic planning experience from zero to one.",
      href: "lyntra/",
      video: "case-study-videos/lyntra.mp4?v=20260901-scene"
    },
    {
      id: "mapwa",
      title: "Mapwa · A clearer practicum matching system",
      description: "Streamlined practicum matching, reducing admin work by 94% and task time by 78%.",
      href: "mapwa.html",
      video: "case-study-videos/mapwa.mp4"
    },
    {
      id: "productive-energy-solutions",
      title: "Productive Energy Solutions · Website redesign",
      description: "Reframed the site's information architecture, reducing task time by 30% and driving 10+ inquiries.",
      href: "productive-energy-solutions.html",
      video: "case-study-videos/web.mp4?v=20260826-webredesign"
    },
    {
      id: "oshkosh",
      title: "Oshkosh · One dashboard for two different engineers",
      description: "Owned a real-time truck performance dashboard, improving user satisfaction by 25%.",
      href: "oshkosh.html",
      video: "case-study-videos/oshkosh.mp4"
    }
  ];

  const currentProject = document.body.dataset.caseProject;
  const anchor = document.querySelector(".case-back-link, .footer-link");
  if (!currentProject || !anchor) return;

  const recommendations = projects.filter(project => project.id !== currentProject).slice(0, 3);
  let section = document.querySelector(".case-next#see-next");
  if (!section) {
    section = document.createElement("section");
    section.className = "case-next";
    section.id = "see-next";
    section.dataset.sectionGroup = "see-next";
    section.setAttribute("aria-labelledby", "case-next-title");
    section.innerHTML = `
      <h2 class="case-next__label" id="case-next-title">SEE NEXT</h2>
      <div class="case-next__grid" data-case-study-nav-boundary>
        ${recommendations.map(project => `
          <article class="case-next__card">
            <a class="case-next__link" href="${project.href}">
              <div class="case-next__media">
                <video src="${project.video}" autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>
              </div>
              <div class="case-next__copy">
                <h3 class="case-next__title">${project.title}</h3>
                <p class="case-next__description">${project.description}</p>
              </div>
            </a>
          </article>
        `).join("")}
      </div>
    `;
    anchor.before(section);
  }

  const navList = document.querySelector(".spy-nav__list");
  if (navList && !navList.querySelector('[data-target="see-next"]')) {
    const navItem = document.createElement("li");
    navItem.className = "spy-nav__item";
    navItem.style.setProperty("--i", navList.children.length);
    navItem.innerHTML = '<button class="spy-nav__link" data-target="see-next"><span class="spy-nav__dot"></span><span>See Next</span></button>';
    navList.appendChild(navItem);
  }

  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  section.classList.add("case-next--motion-ready");
  const titleObserver = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    section.classList.add("is-visible");
    titleObserver.disconnect();
  }, {
    rootMargin: "0px 0px -20%",
    threshold: 0
  });
  titleObserver.observe(section.querySelector(".case-next__label"));

  const grid = section.querySelector(".case-next__grid");
  const cards = Array.from(section.querySelectorAll(".case-next__card"));
  let frame = 0;
  let stackOffsets = null;

  const resetCards = () => {
    cards.forEach(card => {
      card.style.transform = "translateX(0)";
      card.style.zIndex = "auto";
    });
  };

  const updateCardSpread = () => {
    frame = 0;
    if (window.innerWidth < 768 || cards.length !== 3) {
      resetCards();
      return;
    }

    if (!stackOffsets) {
      grid.classList.add("is-measuring");
      resetCards();
      const firstRect = cards[0].getBoundingClientRect();
      const middleRect = cards[1].getBoundingClientRect();
      const thirdRect = cards[2].getBoundingClientRect();
      const firstCenter = firstRect.left + firstRect.width / 2;
      const middleCenter = middleRect.left + middleRect.width / 2;
      const thirdCenter = thirdRect.left + thirdRect.width / 2;
      stackOffsets = {
        first: middleCenter - firstCenter - 40,
        third: middleCenter - thirdCenter + 40
      };
    }

    const gridRect = grid.getBoundingClientRect();
    const start = window.innerHeight * 0.7;
    const end = window.innerHeight * 0.2;
    const progress = Math.min(1, Math.max(0, (start - gridRect.top) / (start - end)));
    const remaining = 1 - progress;

    cards[0].style.transform = `translateX(${stackOffsets.first * remaining}px)`;
    cards[1].style.transform = "translateX(0)";
    cards[2].style.transform = `translateX(${stackOffsets.third * remaining}px)`;
    cards[1].style.zIndex = progress < 0.95 ? "10" : "auto";
    cards[0].style.zIndex = progress < 0.95 ? "1" : "auto";
    cards[2].style.zIndex = progress < 0.95 ? "1" : "auto";
    grid.getBoundingClientRect();
    grid.classList.remove("is-measuring");
  };

  const requestCardUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(updateCardSpread);
  };

  window.addEventListener("scroll", requestCardUpdate, { passive: true });
  window.addEventListener("resize", () => {
    stackOffsets = null;
    requestCardUpdate();
  });
  window.setTimeout(requestCardUpdate, 100);
})();
