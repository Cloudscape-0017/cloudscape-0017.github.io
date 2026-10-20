(() => {
  const cards = Array.from(document.querySelectorAll(".work-card"));
  const dialog = document.querySelector("#lightbox");
  const lightboxImage = document.querySelector("#lightbox-image");
  const lightboxTitle = document.querySelector("#lightbox-title");
  const lightboxTag = document.querySelector("#lightbox-tag");
  const lightboxCount = document.querySelector("#lightbox-count");
  const panel = document.querySelector(".lightbox-panel");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!cards.length || !dialog || !lightboxImage) return;

  const works = cards.map((card) => {
    const image = card.querySelector("img");
    return {
      src: image.getAttribute("src"),
      alt: image.alt,
      title: card.querySelector(".work-caption strong").textContent.trim(),
      tag: card.querySelector(".work-caption small").textContent.trim(),
    };
  });

  let currentIndex = 0;
  let returnFocusTo = null;

  const formattedIndex = (index) => String(index + 1).padStart(2, "0");

  function setWork(index) {
    currentIndex = (index + works.length) % works.length;
    const work = works[currentIndex];
    lightboxImage.src = work.src;
    lightboxImage.alt = work.alt;
    lightboxTitle.textContent = work.title;
    lightboxTag.textContent = work.tag;
    lightboxCount.textContent = `${formattedIndex(currentIndex)} / ${String(works.length).padStart(2, "0")}`;

    const next = new Image();
    next.src = works[(currentIndex + 1) % works.length].src;
  }

  function openWork(index, opener) {
    returnFocusTo = opener;
    setWork(index);
    dialog.showModal();
    document.querySelector(".lightbox-close").focus({ preventScroll: true });

    if (window.gsap && !reducedMotion.matches) {
      window.gsap.fromTo(
        panel,
        { autoAlpha: 0, y: 12, scale: 0.99 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.24, ease: "power2.out", overwrite: true }
      );
    }
  }

  function closeWork() {
    if (!dialog.open) return;
    dialog.close();
    if (returnFocusTo instanceof HTMLElement) returnFocusTo.focus({ preventScroll: true });
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => openWork(Number(card.dataset.workIndex), card));
  });

  document.querySelector("[data-close]").addEventListener("click", closeWork);
  document.querySelector("[data-previous]").addEventListener("click", () => setWork(currentIndex - 1));
  document.querySelector("[data-next]").addEventListener("click", () => setWork(currentIndex + 1));

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeWork();
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeWork();
  });

  window.addEventListener("keydown", (event) => {
    if (!dialog.open) return;
    if (event.key === "ArrowRight") setWork(currentIndex + 1);
    if (event.key === "ArrowLeft") setWork(currentIndex - 1);
  });

  if (window.gsap && window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    const motion = window.gsap.matchMedia();

    motion.add("(prefers-reduced-motion: no-preference)", () => {
      document.documentElement.classList.add("has-motion");
      const hero = document.querySelector(".hero-story");
      const heroLayout = document.querySelector(".hero-layout");
      const heroImage = document.querySelector(".hero-image");
      const heroCopy = document.querySelector(".hero-copy");
      const heroVisual = document.querySelector(".hero-visual");
      const scrollCue = document.querySelector(".scroll-cue");
      const mobile = window.matchMedia("(max-width: 720px)").matches;

      window.gsap.fromTo(
        [heroCopy, heroVisual],
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.78, stagger: 0.12, ease: "power3.out", clearProps: "opacity,visibility,transform" }
      );

      window.gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          pin: heroLayout,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
        .to(heroImage, { scale: mobile ? 0.84 : 0.82, ease: "none" }, 0)
        .to(heroCopy, { autoAlpha: 0, y: -22, ease: "none" }, 0.12)
        .to(scrollCue, { autoAlpha: 0, ease: "none" }, 0.08);

      document.querySelectorAll("[data-reveal]").forEach((element, index) => {
        window.gsap.fromTo(
          element,
          { autoAlpha: 0, y: 18 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.65,
            delay: (index % 2) * 0.06,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 86%",
              once: true,
            },
          }
        );
      });

      return () => document.documentElement.classList.remove("has-motion");
    });
  }
})();
