(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const home = document.querySelector(".home-atmosphere");
  const stage = document.createElement("div");
  stage.className = home ? "ambient-stage" : "ambient-stage ambient-stage--page";
  stage.setAttribute("aria-hidden", "true");
  stage.inert = true;
  for (const kind of ["warm", "cool"]) {
    const light = document.createElement("span");
    light.className = `ambient-light ambient-light--${kind}`;
    stage.append(light);
  }
  const motes = document.createElement("div");
  motes.className = "ambient-motes";
  // A fixed, sparse distribution avoids a random burst when navigating back.
  for (let i = 0; i < 24; i++) {
    const mote = document.createElement("span");
    mote.className = "ambient-mote";
    const values = {
      x: `${((i * 61.8034 + 9) % 100).toFixed(2)}%`,
      y: `${((i * 38.1966 + 12) % 100).toFixed(2)}%`,
      size: `${i % 4 === 0 ? 2 : 1}px`,
      duration: `${24 + (i % 7) * 3}s`,
      delay: `${-i * 2.7}s`,
      opacity: (0.2 + (i % 5) * 0.065).toFixed(3),
      drift: `${(i % 2 ? -1 : 1) * (18 + (i % 6) * 7)}px`,
    };
    for (const [key, value] of Object.entries(values)) mote.style.setProperty(`--mote-${key}`, value);
    motes.append(mote);
  }
  stage.append(motes);
  if (home) home.append(stage);
  else document.body.prepend(stage);

  // Decoration rests while the tab is hidden or an actual work is playing.
  const videos = Array.from(document.querySelectorAll("video"));
  const syncActivity = () => {
    const resting = document.hidden || reducedMotion.matches || videos.some((video) => !video.paused && !video.ended);
    document.documentElement.toggleAttribute("data-ambient-paused", resting);
  };
  document.addEventListener("visibilitychange", syncActivity);
  window.addEventListener("pageshow", syncActivity);
  reducedMotion.addEventListener("change", syncActivity);
  videos.forEach((video) => ["play", "pause", "ended", "emptied"].forEach((event) => video.addEventListener(event, syncActivity)));
  syncActivity();

  let pending = false;
  let pointerX = 0;
  let pointerY = 0;
  const commitPointer = () => {
    stage.style.setProperty("--light-x", `${pointerX.toFixed(1)}px`);
    stage.style.setProperty("--light-y", `${pointerY.toFixed(1)}px`);
    pending = false;
  };
  window.addEventListener("pointermove", (event) => {
    if (reducedMotion.matches || !finePointer.matches || event.pointerType === "touch") return;
    pointerX = (event.clientX / window.innerWidth - .5) * 20;
    pointerY = (event.clientY / window.innerHeight - .5) * 10;
    if (!pending) {
      pending = true;
      window.requestAnimationFrame(commitPointer);
    }
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => {
    pointerX = pointerY = 0;
    if (!pending) {
      pending = true;
      window.requestAnimationFrame(commitPointer);
    }
  });
})();
