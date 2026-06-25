(() => {
  const footers = document.querySelectorAll(".case-study-grass-footer");
  if (!footers.length) return;

  const layerSources = [
    "footer/sky.png",
    "footer/grass.png",
    "footer/dandelion.png",
  ];
  const sleepSources = [1, 2, 3, 4].map((frame) => `footer/case-cat-sleep-${frame}.png`);
  const runSources = [1, 2, 3, 4].map((frame) => `footer/case-cat-run-${frame}.png`);

  const loadImage = (src) => new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

  Promise.all([
    ...layerSources.map(loadImage),
    ...sleepSources.map(loadImage),
    ...runSources.map(loadImage),
  ]).then((loaded) => {
    const layers = loaded.slice(0, 3);
    const sleepFrames = loaded.slice(3, 7).filter(Boolean);
    const runFrames = loaded.slice(7, 11).filter(Boolean);
    footers.forEach((footer) => {
      const canvas = footer.querySelector(".case-study-grass-footer__canvas");
      const context = canvas.getContext("2d");
      let width = 0;
      let height = 0;
      let dpr = 1;
      let catX = 0;
      let targetX = 0;
      let moving = false;
      let facingLeft = false;
      let lastTime = performance.now();

      function resize() {
        const bounds = footer.getBoundingClientRect();
        width = bounds.width;
        height = bounds.height;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (!catX) {
          catX = width * 0.86;
          targetX = catX;
        } else {
          catX = Math.min(catX, width - 50);
          targetX = Math.min(targetX, width - 50);
        }
      }

      function drawLayer(image) {
        if (!image) return;
        const cropTop = image.naturalHeight * 0.24;
        const sourceHeight = image.naturalHeight - cropTop;
        const scale = Math.max(width / image.naturalWidth, height / sourceHeight);
        const drawWidth = image.naturalWidth * scale;
        const drawHeight = sourceHeight * scale;
        context.drawImage(
          image,
          0,
          cropTop,
          image.naturalWidth,
          sourceHeight,
          (width - drawWidth) / 2,
          height - drawHeight,
          drawWidth,
          drawHeight
        );
      }

      function catSize() {
        const mobile = width < 760;
        const homepageSize = Math.max(
          76,
          Math.min(width * (mobile ? 0.24 : 0.105), mobile ? 126 : 160)
        );
        return homepageSize * 0.72;
      }

      function catGroundY(x) {
        const xRatio = Math.max(0, Math.min(1, x / Math.max(1, width)));
        const portrait = height / Math.max(1, width) > 0.62;
        const startY = height * (portrait ? 0.69 : 0.67);
        const endY = height - 2;
        const controlY = startY + height * (portrait ? 0.015 : 0.025);
        const inverse = 1 - xRatio;
        return inverse * inverse * startY
          + 2 * inverse * xRatio * controlY
          + xRatio * xRatio * endY;
      }

      function drawCat(time) {
        const frames = moving ? runFrames : sleepFrames;
        if (!frames.length) return;
        const frameDuration = moving ? 115 : 260;
        const frame = frames[Math.floor(time / frameDuration) % frames.length];
        const catHeight = catSize();
        const frameScale = catHeight / frame.naturalHeight;
        const catWidth = frame.naturalWidth * frameScale;
        const groundY = catGroundY(catX);

        context.save();
        context.translate(catX, groundY);
        if (facingLeft) context.scale(-1, 1);
        context.drawImage(frame, -catWidth / 2, -catHeight, catWidth, catHeight);
        context.restore();
      }

      function animate(time) {
        const delta = Math.min(40, time - lastTime);
        lastTime = time;

        if (moving) {
          const dx = targetX - catX;
          const distance = Math.abs(dx);
          const step = Math.min(distance, delta * 0.32);
          if (distance < 3) {
            catX = targetX;
            moving = false;
          } else {
            catX += Math.sign(dx) * step;
          }
        }

        context.clearRect(0, 0, width, height);
        drawLayer(layers[0]);
        drawLayer(layers[1]);
        drawCat(time);
        drawLayer(layers[2]);
        requestAnimationFrame(animate);
      }

      footer.addEventListener("pointerdown", (event) => {
        const bounds = footer.getBoundingClientRect();
        targetX = Math.max(54, Math.min(width - 54, event.clientX - bounds.left));
        facingLeft = targetX < catX;
        moving = true;
      });

      window.addEventListener("resize", resize);
      resize();
      requestAnimationFrame(animate);
    });
  });
})();
