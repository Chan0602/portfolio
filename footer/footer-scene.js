const canvas = document.getElementById("scene-canvas");
const ctx = canvas.getContext("2d");
const footer = document.getElementById("scroll-footer");
const footerScene = footer.querySelector(".footer-scene");
const contactPanel = document.getElementById("contact-panel");
const contactForm = document.getElementById("contact-form");
const contactStatus = document.getElementById("contact-status");
const contactArtboard = document.querySelector(".contact-artboard");
const contactSend = document.querySelector(".contact-send");

const assetSources = {
  catLay: [
    "footer/cat-sleep-1.png",
    "footer/cat-sleep-2.png",
    "footer/cat-sleep-3.png",
    "footer/cat-sleep-4.png",
  ],
  catRun: [
    "footer/cat-run-1.png",
    "footer/cat-run-2.png",
    "footer/cat-run-3.png",
    "footer/cat-run-4.png",
  ],
  fallbackCatLay: [],
  fallbackCatRun: [],
  layers: {
    sky: "footer/sky.png",
    grass: "footer/grass.png",
    dandelion: "footer/dandelion.png",
  },
  dandelions: ["footer/dandelion-seed-1.png", "footer/dandelion-seed-2.png"],
  fly: ["footer/fly.png"],
};

const assets = {
  catLay: [],
  catRun: [],
  layers: {
    sky: null,
    grass: null,
    dandelion: null,
  },
  dandelions: [],
  fly: null,
};

const timing = {
  sceneInStart: 0,
  sceneInEnd: 0.10,
  grassStart: 0,
  grassEnd: 0.10,
  dandelionStart: 0.10,
  dandelionEnd: 0.24,
  catStart: 0.22,
  catEnterEnd: 0.6,
  catRunEnd: 0.82,
  catExitEnd: 0.9,
};

let vw = 0;
let vh = 0;
let dpr = 1;
let progress = 0;
let targetProgress = 0;
let scrollDirection = 1;
let isScrolling = false;
let scrollStopTimer = 0;
let lastTime = performance.now();
let runFrameClock = 0;
let layFrameClock = 0;
let layFrame = 0;
let sleepBlend = 0;

const flowers = Array.from({ length: 34 }, (_, i) => ({
  x: (i * 0.173 + Math.random() * 0.08) % 1,
  y: 0.66 + Math.random() * 0.28,
  size: 16 + Math.random() * 44,
  delay: Math.random() * 0.12,
  spin: Math.random() * Math.PI * 2,
  img: i % 2,
}));

const seeds = Array.from({ length: 46 }, () => ({
  x: Math.random(),
  y: Math.random(),
  size: 10 + Math.random() * 22,
  speed: 0.08 + Math.random() * 0.16,
  drift: Math.random() * Math.PI * 2,
  alpha: 0.22 + Math.random() * 0.42,
}));

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function invLerp(a, b, value) {
  return clamp((value - a) / (b - a));
}

function smoothstep(a, b, value) {
  const t = invLerp(a, b, value);
  return t * t * (3 - 2 * t);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - clamp(t), 3);
}

function drawCoverImage(img, x, y, w, h, offsetX = 0.5, offsetY = 0.5) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = x + (w - dw) * offsetX;
  const dy = y + (h - dh) * offsetY;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function resize() {
  vw = window.innerWidth;
  vh = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.width = `${vw}px`;
  canvas.style.height = `${vh}px`;
  canvas.width = Math.floor(vw * dpr);
  canvas.height = Math.floor(vh * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  updateScrollProgress();
}

function updateScrollProgress() {
  const rect = footer.getBoundingClientRect();
  const scrollable = Math.max(1, rect.height - window.innerHeight);
  targetProgress = clamp(-rect.top / scrollable);
}

function markScrolling() {
  isScrolling = true;
  sleepBlend = 0;
  clearTimeout(scrollStopTimer);
  scrollStopTimer = setTimeout(() => {
    isScrolling = false;
  }, 360);
  updateScrollProgress();
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(cropTransparent(img));
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function loadRawImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function loadAndCropImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(removeWhiteBg(img));
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function cropTransparent(img) {
  const offscreen = document.createElement("canvas");
  offscreen.width = img.naturalWidth;
  offscreen.height = img.naturalHeight;
  const offCtx = offscreen.getContext("2d");
  offCtx.drawImage(img, 0, 0);

  const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
  const data = imageData.data;
  let x0 = offscreen.width;
  let x1 = 0;
  let y0 = offscreen.height;
  let y1 = 0;

  for (let y = 0; y < offscreen.height; y += 1) {
    for (let x = 0; x < offscreen.width; x += 1) {
      const i = (y * offscreen.width + x) * 4;
      if (data[i + 3] > 12) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
    }
  }

  if (x0 >= x1 || y0 >= y1) return img;

  const pad = 36;
  const sx = Math.max(0, x0 - pad);
  const sy = Math.max(0, y0 - pad);
  const sw = Math.min(offscreen.width, x1 + pad) - sx;
  const sh = Math.min(offscreen.height, y1 + pad) - sy;
  const cropped = document.createElement("canvas");
  cropped.width = sw;
  cropped.height = sh;
  cropped.getContext("2d").drawImage(offscreen, sx, sy, sw, sh, 0, 0, sw, sh);
  return cropped;
}

function normalizeFrameGroup(frames) {
  const validFrames = frames.filter(Boolean);
  if (!validFrames.length) return [];

  const maxW = Math.max(...validFrames.map((frame) => frame.width));
  const maxH = Math.max(...validFrames.map((frame) => frame.height));

  return validFrames.map((frame) => {
    if (frame.width === maxW && frame.height === maxH) return frame;

    const normalized = document.createElement("canvas");
    normalized.width = maxW;
    normalized.height = maxH;
    const normalizedCtx = normalized.getContext("2d");
    const dx = Math.floor((maxW - frame.width) / 2);
    const dy = maxH - frame.height;
    normalizedCtx.drawImage(frame, dx, dy);
    return normalized;
  });
}

function removeWhiteBg(img) {
  const offscreen = document.createElement("canvas");
  offscreen.width = img.naturalWidth;
  offscreen.height = img.naturalHeight;
  const offCtx = offscreen.getContext("2d");
  offCtx.drawImage(img, 0, 0);

  const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
  const data = imageData.data;
  let x0 = offscreen.width;
  let x1 = 0;
  let y0 = offscreen.height;
  let y1 = 0;

  for (let y = 0; y < offscreen.height; y += 1) {
    for (let x = 0; x < offscreen.width; x += 1) {
      const i = (y * offscreen.width + x) * 4;
      const alpha = data[i + 3];
      const bright = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (alpha > 20 && bright < 240) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
    }
  }

  if (x0 >= x1 || y0 >= y1) return offscreen;

  for (let i = 0; i < data.length; i += 4) {
    const bright = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (bright > 245) {
      data[i + 3] = 0;
    } else if (bright > 210) {
      data[i + 3] = Math.round((1 - (bright - 210) / 35) * data[i + 3]);
    }
  }
  offCtx.putImageData(imageData, 0, 0);

  const pad = 44;
  const sx = Math.max(0, x0 - pad);
  const sy = Math.max(0, y0 - pad);
  const sw = Math.min(offscreen.width, x1 + pad) - sx;
  const sh = Math.min(offscreen.height, y1 + pad) - sy;
  const cropped = document.createElement("canvas");
  cropped.width = sw;
  cropped.height = sh;
  cropped.getContext("2d").drawImage(offscreen, sx, sy, sw, sh, 0, 0, sw, sh);
  return cropped;
}

async function loadAssets() {
  const [catLay, catRun, fallbackCatLay, fallbackCatRun, layerImages, dandelions, fly] = await Promise.all([
    Promise.all(assetSources.catLay.map(loadImage)),
    Promise.all(assetSources.catRun.map(loadImage)),
    Promise.all(assetSources.fallbackCatLay.map(loadAndCropImage)),
    Promise.all(assetSources.fallbackCatRun.map(loadAndCropImage)),
    Promise.all(Object.values(assetSources.layers).map(loadRawImage)),
    Promise.all(assetSources.dandelions.map(loadAndCropImage)),
    Promise.all(assetSources.fly.map(loadAndCropImage)),
  ]);

  const catLayFrames = catLay.filter(Boolean).length ? catLay : fallbackCatLay;
  const catRunFrames = catRun.filter(Boolean).length ? catRun : fallbackCatRun;

  assets.catLay = normalizeFrameGroup(catLayFrames);
  assets.catRun = normalizeFrameGroup(catRunFrames);
  assets.layers.sky = layerImages[0] || null;
  assets.layers.grass = layerImages[1] || null;
  assets.layers.dandelion = layerImages[2] || null;
  assets.dandelions = dandelions.filter(Boolean);
  assets.fly = fly.find(Boolean) || null;
}

function drawSky() {
  const reveal = smoothstep(timing.sceneInStart, timing.sceneInEnd, progress);
  if (reveal <= 0 || !assets.layers.sky) return;

  ctx.save();
  ctx.globalAlpha = reveal;
  drawCoverImage(assets.layers.sky, 0, 0, vw, vh);
  ctx.restore();
}

function drawCloud(x, y, scale) {
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  for (let i = 0; i < 8; i += 1) {
    const ox = Math.cos(i * 1.3) * scale * 0.34;
    const oy = Math.sin(i * 0.9) * scale * 0.12;
    ctx.beginPath();
    ctx.ellipse(x + ox, y + oy, scale * (0.22 + i * 0.012), scale * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWatercolorGrass() {
  const reveal = smoothstep(timing.grassStart, timing.grassEnd, progress);
  if (reveal <= 0 || !assets.layers.grass) return;

  ctx.save();
  ctx.globalAlpha = reveal;
  ctx.filter = `blur(${lerp(14, 0, reveal)}px)`;
  ctx.translate(0, lerp(vh * 0.18, 0, easeOutCubic(reveal)));
  drawCoverImage(assets.layers.grass, 0, 0, vw, vh);
  ctx.filter = "none";
  ctx.restore();
}

function drawGrassDetails(hillTop, reveal) {
  const bladeCount = Math.floor(lerp(10, vw < 760 ? 70 : 130, reveal));
  for (let i = 0; i < bladeCount; i += 1) {
    const x = (i * 67.13) % vw;
    const base = lerp(hillTop + vh * 0.08, vh + 6, ((i * 0.37) % 1));
    const h = lerp(16, 58, ((i * 0.19) % 1)) * (vw < 760 ? 0.8 : 1);
    const sway = Math.sin(performance.now() * 0.001 + i) * 5;
    ctx.strokeStyle = i % 3 === 0 ? "rgba(74, 132, 60, 0.34)" : "rgba(110, 158, 64, 0.38)";
    ctx.lineWidth = 1 + (i % 3) * 0.45;
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.quadraticCurveTo(x + sway, base - h * 0.55, x + sway * 1.5, base - h);
    ctx.stroke();
  }
}

function drawCat(dt) {
  const visible = progress > timing.catStart && progress < timing.catExitEnd;
  if (!visible) return;

  const enterT = smoothstep(timing.catStart, timing.catEnterEnd, progress);
  const runT = smoothstep(timing.catEnterEnd, timing.catRunEnd, progress);
  const exitT = smoothstep(timing.catRunEnd, timing.catExitEnd, progress);
  const catHeight = clamp(vw * (vw < 760 ? 0.24 : 0.105), 76, vw < 760 ? 126 : 160);
  const xEnter = lerp(-catHeight * 1.4, vw * (vw < 760 ? 0.2 : 0.18), enterT);
  const xRun = lerp(vw * (vw < 760 ? 0.2 : 0.18), vw * 0.7, runT);
  const xExit = lerp(vw * 0.7, vw + catHeight * 1.8, exitT);
  const catX = progress < timing.catEnterEnd ? xEnter : progress < timing.catRunEnd ? xRun : xExit;
  const groundY = catGroundY(catX, catHeight);

  const canSleep = !isScrolling && progress > timing.catStart + 0.06 && progress < timing.catRunEnd && assets.catLay.length;
  sleepBlend += ((canSleep ? 1 : 0) - sleepBlend) * 0.055;
  const sleeping = sleepBlend > 0.5;
  if (!assets.catRun.length && !assets.catLay.length) return;

  if (sleepBlend < 0.95 && assets.catRun.length) {
    runFrameClock += dt * (0.0048 + Math.abs(targetProgress - progress) * 0.12);
  }
  if (sleepBlend > 0.05 && assets.catLay.length) {
    layFrameClock += dt;
    if (layFrameClock > 820) {
      layFrameClock = 0;
      layFrame = (layFrame + 1) % assets.catLay.length;
    }
  }

  ctx.save();
  ctx.globalAlpha = smoothstep(timing.catStart, timing.catStart + 0.08, progress) * (1 - smoothstep(0.88, timing.catExitEnd, progress));

  if (assets.catRun.length && sleepBlend < 0.98) {
    const runFrame = assets.catRun[Math.floor(runFrameClock) % assets.catRun.length];
    drawCatFrame(runFrame, catX, groundY, catHeight, 1 - sleepBlend, Math.sin(runFrameClock * Math.PI) * 4 * (1 - sleepBlend));
  }

  if (assets.catLay.length && sleepBlend > 0.02) {
    const layFrameImage = assets.catLay[layFrame % assets.catLay.length];
    drawCatFrame(layFrameImage, catX, groundY, catHeight, sleepBlend, 0);
  }

  ctx.restore();
}

function catGroundY(x, catHeight) {
  const xRatio = clamp(x / Math.max(1, vw));
  const mobile = vw < 760;
  const startY = vh * (mobile ? 0.7 : 0.66);
  const endY = vh * (mobile ? 0.83 : 0.84);
  const slope = smoothstep(0, 1, xRatio);
  const grassCurve = Math.sin(xRatio * Math.PI * 1.15) * vh * (mobile ? 0.018 : 0.026);
  const scrollDrop = smoothstep(timing.catStart, timing.catRunEnd, progress) * vh * (mobile ? 0.018 : 0.025);
  const lowerOffset = vh * (mobile ? 0.085 : 0.11);
  return lerp(startY, endY, slope) + grassCurve + scrollDrop + lowerOffset - catHeight * 0.06;
}

function drawCatFrame(frame, x, groundY, targetHeight, alpha, bob) {
  const scale = targetHeight / frame.height;
  const dw = frame.width * scale;
  const dh = frame.height * scale;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (scrollDirection < 0) {
    ctx.translate(x, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(frame, -dw / 2, groundY - dh + bob, dw, dh);
  } else {
    ctx.drawImage(frame, x - dw / 2, groundY - dh + bob, dw, dh);
  }
  ctx.restore();
}

function drawCatFallback(x, y, size, sleeping) {
  ctx.save();
  ctx.strokeStyle = "rgba(35, 42, 32, 0.78)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y - size * 0.38, size * 0.55, size * 0.25, sleeping ? 0 : -0.08, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + size * 0.42, y - size * 0.46, size * 0.18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawFinale() {
  const finale = smoothstep(timing.dandelionStart, timing.dandelionEnd, progress);
  if (finale <= 0 || !assets.layers.dandelion) return;

  ctx.save();
  ctx.globalAlpha = finale;
  ctx.translate(0, lerp(vh * 0.04, 0, easeOutCubic(finale)));
  drawCoverImage(assets.layers.dandelion, 0, 0, vw, vh);
  ctx.restore();

  if (assets.fly) drawSeeds(smoothstep(0.82, 1, progress));
}

function drawSeeds(finale) {
  ctx.save();
  for (const seed of seeds) {
    const x = ((seed.x + finale * seed.speed) % 1) * vw + Math.sin(seed.drift + finale * 5) * 24;
    const y = (seed.y * 0.62 + 0.04 + Math.sin(finale * 4 + seed.drift) * 0.04) * vh;
    const scale = seed.size / assets.fly.height;
    ctx.globalAlpha = seed.alpha * finale;
    ctx.drawImage(assets.fly, x, y, assets.fly.width * scale, assets.fly.height * scale);
  }
  ctx.restore();
}

function updateContact() {
  const show = smoothstep(0.9, 0.985, progress);
  const active = show > 0.03;
  contactPanel.style.opacity = show.toFixed(3);
  contactPanel.classList.toggle("is-visible", active);
  contactPanel.setAttribute("aria-hidden", String(!active));
  footerScene.classList.toggle("contact-active", active);
}

function scrollToContactPanel(behavior = "smooth") {
  const scrollable = Math.max(1, footer.offsetHeight - window.innerHeight);
  const targetProgressRatio = 0.985;
  const targetTop = footer.offsetTop + scrollable * targetProgressRatio;
  targetProgress = targetProgressRatio;
  progress = Math.max(progress, targetProgressRatio);
  updateContact();
  window.scrollTo({ top: targetTop, behavior });
}

window.portfolioScrollToContact = scrollToContactPanel;

function render(now) {
  const dt = Math.min(50, now - lastTime);
  lastTime = now;
  updateScrollProgress();
  const progressDelta = targetProgress - progress;
  if (Math.abs(progressDelta) > 0.0008) {
    scrollDirection = progressDelta < 0 ? -1 : 1;
  }
  progress += (targetProgress - progress) * 0.16;

  ctx.clearRect(0, 0, vw, vh);
  drawSky();
  drawWatercolorGrass();
  drawCat(dt);
  drawFinale();
  updateContact();

  requestAnimationFrame(render);
}

resize();
loadAssets();
window.addEventListener("resize", resize, { passive: true });
window.addEventListener("scroll", markScrolling, { passive: true });
window.addEventListener("wheel", markScrolling, { passive: true });
window.addEventListener("touchmove", markScrolling, { passive: true });
document.addEventListener("click", (event) => {
  const contactLink = event.target.closest('a[href="#contact-me"]');
  if (!contactLink) return;
  event.preventDefault();
  history.pushState(null, "", "#contact-me");
  scrollToContactPanel("auto");
});
window.addEventListener("load", () => {
  if (window.location.hash === "#contact-me") {
    window.setTimeout(() => scrollToContactPanel("auto"), 120);
  }
});
window.addEventListener("hashchange", () => {
  if (window.location.hash === "#contact-me") scrollToContactPanel("auto");
});
contactForm.addEventListener("submit", (event) => {
  event.preventDefault();

  contactArtboard.classList.add("is-reacting");
  window.setTimeout(() => {
    contactArtboard.classList.remove("is-reacting");
  }, 900);

  if (!contactForm.reportValidity()) return;

  const name = document.getElementById("contact-name").value.trim();
  const email = document.getElementById("contact-email").value.trim();
  const message = document.getElementById("contact-message").value.trim();
  const subject = encodeURIComponent(`Portfolio message from ${name}`);
  const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);

  contactStatus.textContent = "Opening your email app…";
  window.location.href = `mailto:yilinchan339@gmail.com?subject=${subject}&body=${body}`;
});
contactSend.addEventListener("pointerdown", () => {
  contactArtboard.classList.add("is-reacting");
});
contactSend.addEventListener("click", () => {
  contactArtboard.classList.add("is-reacting");
  window.setTimeout(() => {
    contactArtboard.classList.remove("is-reacting");
  }, 900);
});
contactSend.addEventListener("pointerenter", () => {
  contactArtboard.classList.add("is-reacting");
});
contactSend.addEventListener("pointerleave", () => {
  contactArtboard.classList.remove("is-reacting");
});
contactSend.addEventListener("pointerup", () => {
  window.setTimeout(() => {
    contactArtboard.classList.remove("is-reacting");
  }, 500);
});
requestAnimationFrame(render);
