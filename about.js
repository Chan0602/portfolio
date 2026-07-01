class NotebookSection {
  constructor(root) {
    this.root = root;
    this.cards = Array.from(root.querySelectorAll("[data-notebook]"));
    this.modal = root.querySelector("[data-notebook-modal]");
    this.stage = root.querySelector("[data-notebook-stage]");
    this.closeButton = root.querySelector("[data-notebook-close]");
    this.activeSpread = null;
    this.activeCard = null;

    this.cards.forEach((card) => {
      card.querySelector("[data-notebook-toggle]").addEventListener("click", () => this.open(card));
    });

    this.closeButton?.addEventListener("click", () => this.close());
    this.modal?.addEventListener("click", (event) => {
      if (event.target === this.modal) this.close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.modal?.classList.contains("is-open")) this.close();
    });
  }

  open(card) {
    if (!this.modal || !this.stage) return;
    if (this.activeSpread) this.close(false);

    const spread = card.querySelector(".scrapbook-spread");
    if (!spread) return;

    this.activeCard = card;
    this.activeSpread = spread;
    card.querySelector("[data-notebook-toggle]").setAttribute("aria-expanded", "true");
    this.stage.appendChild(spread);
    this.modal.classList.add("is-open");
    this.modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("notebook-modal-open");
    this.closeButton?.focus({ preventScroll: true });
  }

  close(updateBody = true) {
    if (!this.activeSpread || !this.activeCard) return;

    this.activeCard.appendChild(this.activeSpread);
    this.activeCard.querySelector("[data-notebook-toggle]").setAttribute("aria-expanded", "false");
    this.activeSpread = null;
    this.activeCard = null;
    this.modal.classList.remove("is-open");
    this.modal.setAttribute("aria-hidden", "true");
    if (updateBody) document.body.classList.remove("notebook-modal-open");
  }
}

class DraggableItem {
  static zIndex = 10;

  constructor(item) {
    this.item = item;
    this.dragging = false;
    this.offsetX = 0;
    this.offsetY = 0;
    item.addEventListener("pointerdown", this.onPointerDown.bind(this));
    item.addEventListener("pointermove", this.onPointerMove.bind(this));
    item.addEventListener("pointerup", this.onPointerUp.bind(this));
    item.addEventListener("pointercancel", this.onPointerUp.bind(this));
  }

  onPointerDown(event) {
    this.dragging = true;
    this.item.classList.add("is-dragging");
    this.item.style.zIndex = ++DraggableItem.zIndex;
    const rect = this.item.getBoundingClientRect();
    this.offsetX = event.clientX - rect.left;
    this.offsetY = event.clientY - rect.top;
    this.item.setPointerCapture(event.pointerId);
  }

  onPointerMove(event) {
    if (!this.dragging) return;
    const parent = this.item.offsetParent.getBoundingClientRect();
    const x = event.clientX - parent.left - this.offsetX;
    const y = event.clientY - parent.top - this.offsetY;
    this.item.style.left = `${x}px`;
    this.item.style.top = `${y}px`;
  }

  onPointerUp() {
    this.dragging = false;
    this.item.classList.remove("is-dragging");
  }
}

class AboutMouseCat {
  constructor(stage) {
    this.stage = stage;
    this.cat = stage.querySelector("[data-about-mouse-cat]");
    this.frames = Array.from(this.cat?.querySelectorAll(".about-mouse-cat__frame") || []);
    this.frameSources = {
      neutral: "images/about/about-cat-neutral.png",
      right: "images/about/about-cat-right.png",
      left: "images/about/about-cat-right.png",
      up: "images/about/about-cat-up.png",
      down: "images/about/about-cat-down.png"
    };
    this.currentDirection = "neutral";
    this.activeIndex = 0;
    this.move = this.move.bind(this);
    this.reset = this.reset.bind(this);
    this.stage.addEventListener("pointermove", this.move);
    this.stage.addEventListener("pointerleave", this.reset);
  }

  showDirection(direction) {
    if (!this.cat || !this.frames.length || direction === this.currentDirection) return;
    const nextIndex = this.activeIndex ? 0 : 1;
    const nextFrame = this.frames[nextIndex];
    const activeFrame = this.frames[this.activeIndex];
    nextFrame.src = this.frameSources[direction] || this.frameSources.neutral;
    nextFrame.style.transform = direction === "left" ? "scaleX(-1)" : "";
    activeFrame.classList.remove("is-visible");
    nextFrame.classList.add("is-visible");
    this.activeIndex = nextIndex;
    this.currentDirection = direction;
  }

  move(event) {
    if (!this.cat) return;
    const rect = this.stage.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const normalizedX = x / rect.width;
    const normalizedY = y / rect.height;

    const dx = normalizedX - 0.5;
    const dy = normalizedY - 0.5;
    let direction = "neutral";
    if (Math.abs(dx) > 0.14 || Math.abs(dy) > 0.14) {
      direction = Math.abs(dy) > Math.abs(dx)
        ? (dy < 0 ? "up" : "down")
        : (dx < 0 ? "left" : "right");
    }
    this.showDirection(direction);
  }

  reset() {
    if (!this.cat) return;
    this.showDirection("neutral");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const aboutNav = document.querySelector(".about-nav");
  const aboutNavToggle = document.querySelector(".about-nav__toggle");
  const aboutNavLinks = document.querySelectorAll(".about-nav__links a");

  function closeAboutNav() {
    aboutNav?.classList.remove("is-open");
    aboutNavToggle?.setAttribute("aria-expanded", "false");
    aboutNavToggle?.setAttribute("aria-label", "Open navigation");
  }

  aboutNavToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = aboutNav.classList.toggle("is-open");
    aboutNavToggle.setAttribute("aria-expanded", String(isOpen));
    aboutNavToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  aboutNavLinks.forEach((link) => link.addEventListener("click", closeAboutNav));
  document.addEventListener("click", (event) => {
    if (!aboutNav?.classList.contains("is-open") || aboutNav.contains(event.target)) return;
    closeAboutNav();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAboutNav();
  });

  document.querySelectorAll("[data-notebook-section]").forEach((root) => new NotebookSection(root));
  document.querySelectorAll("[data-draggable]").forEach((item) => new DraggableItem(item));
  document.querySelectorAll("[data-about-cat-stage]").forEach((stage) => new AboutMouseCat(stage));
});
