(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const collectionCount = document.querySelector(".collection-count");
  if (collectionCount) collectionCount.textContent = String(document.querySelectorAll(".project-entry").length).padStart(2, "0");
  const railLinks = Array.from(document.querySelectorAll("[data-rail-section]"));
  const readingValue = document.querySelector(".reading-value");
  const indexSection = document.querySelector("#project-index");
  const header = document.querySelector(".site-header");
  if (header) {
    const hero = document.querySelector(".home-page .hero-story");
    const heroImage = document.querySelector(".home-atmosphere .hero-image");
    const worksImage = document.querySelector(".works-atmosphere-image");
    const atmosphereDim = document.querySelector(".atmosphere-dim");
    let framePending = false;
    const updateHeader = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 28);
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      const pageProgress = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
      header.style.setProperty("--reading-progress", pageProgress);
      document.documentElement.style.setProperty("--page-progress", pageProgress);
      if (readingValue) readingValue.textContent = `${String(Math.round(pageProgress * 100)).padStart(2, "0")}%`;
      if (railLinks.length && indexSection) {
        const activeSection = indexSection.getBoundingClientRect().top <= window.innerHeight * 0.55 ? "works" : "cover";
        railLinks.forEach((link) => {
          const active = link.dataset.railSection === activeSection;
          link.classList.toggle("is-current", active);
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      }
      // Keep the artwork readable with reduced motion or unavailable animation libraries.
      if (hero && heroImage && worksImage && atmosphereDim && (reducedMotion.matches || !window.gsap || !window.ScrollTrigger)) {
        const progress = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight * 0.94)));
        heroImage.style.opacity = 1 - 0.88 * progress;
        worksImage.style.opacity = 0.94 * Math.min(1, Math.max(0, (progress - 0.15) / 0.85));
        atmosphereDim.style.opacity = 0.06 + 0.62 * progress;
      }
      framePending = false;
    };
    const requestHeaderUpdate = () => {
      if (framePending) return;
      framePending = true;
      window.requestAnimationFrame(updateHeader);
    };
    updateHeader();
    window.addEventListener("scroll", requestHeaderUpdate, { passive: true });
    window.addEventListener("resize", requestHeaderUpdate, { passive: true });
    window.addEventListener("pageshow", requestHeaderUpdate);
    window.addEventListener("load", requestHeaderUpdate, { once: true });
    reducedMotion.addEventListener("change", requestHeaderUpdate);
  }

  const contactDialog = document.querySelector("#contact-dialog");
  const contactTriggers = Array.from(document.querySelectorAll("[data-contact-open]"));
  const contactClose = document.querySelector("[data-contact-close]");
  const contactCopies = Array.from(document.querySelectorAll("[data-contact-copy]"));

  if (contactDialog && contactTriggers.length && contactClose) {
    let contactReturnTarget = null;
    contactTriggers.forEach((trigger) => trigger.addEventListener("click", () => {
      contactReturnTarget = trigger;
      contactDialog.showModal();
      contactClose.focus({ preventScroll: true });
    }));

    const closeContact = () => {
      if (contactDialog.open) contactDialog.close();
    };

    contactClose.addEventListener("click", closeContact);
    contactDialog.addEventListener("click", (event) => {
      if (event.target === contactDialog) closeContact();
    });
    contactDialog.addEventListener("close", () => contactReturnTarget?.focus({ preventScroll: true }));
  }

  if (contactCopies.length) {
    async function copyText(text) {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          return;
        } catch {}
      }

      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      if (!copied) throw new Error("Clipboard copy failed");
    }

    contactCopies.forEach((button) => {
      let feedbackTimer = 0;
      const label = button.dataset.copyLabel || "信息";
      const target = button.dataset.copyTarget;
      const copyStatus = button.closest(".contact-copy-wrap")?.querySelector("[data-contact-copy-status]");
      const defaultTooltip = button.dataset.tooltip;
      const defaultAriaLabel = button.getAttribute("aria-label");

      button.addEventListener("click", async () => {
        const text = target ? contactDialog?.querySelector(target)?.textContent.trim() : "";
        if (!text) return;

        window.clearTimeout(feedbackTimer);
        try {
          await copyText(text);
          button.dataset.copyState = "copied";
          button.dataset.tooltip = "已复制";
          button.setAttribute("aria-label", `已复制${label}`);
          if (copyStatus) copyStatus.textContent = `已复制${label}`;
        } catch {
          button.dataset.copyState = "error";
          button.dataset.tooltip = "复制失败";
          button.setAttribute("aria-label", `复制失败，请手动选择${label}`);
          if (copyStatus) copyStatus.textContent = `复制失败，请手动选择${label}`;
        }

        feedbackTimer = window.setTimeout(() => {
          button.dataset.copyState = "idle";
          button.dataset.tooltip = defaultTooltip;
          button.setAttribute("aria-label", defaultAriaLabel);
          if (copyStatus) copyStatus.textContent = "";
        }, 1800);
      });
    });
  }

  const cards = Array.from(document.querySelectorAll(".work-card"));
  const dialog = document.querySelector("#lightbox");
  const lightboxImage = document.querySelector("#lightbox-image");
  const lightboxMedia = document.querySelector(".lightbox-media");
  const lightboxTitle = document.querySelector("#lightbox-title");
  const lightboxTag = document.querySelector("#lightbox-tag");
  const lightboxDescription = document.querySelector("#lightbox-description");
  const lightboxCount = document.querySelector("#lightbox-count");
  const panel = document.querySelector(".lightbox-panel");

  if (cards.length && dialog && lightboxImage && lightboxMedia) {

  const works = cards.map((card) => {
    const image = card.querySelector("img");
    const meta = card.querySelector(".work-meta");
    return {
      src: image.getAttribute("src"),
      alt: image.alt,
      width: Number(image.getAttribute("width")) || image.naturalWidth,
      height: Number(image.getAttribute("height")) || image.naturalHeight,
      title: meta.querySelector("strong").textContent.trim(),
      tag: meta.querySelector("small").textContent.trim(),
      description: card.querySelector(".work-description").textContent.trim(),
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
    lightboxImage.width = work.width;
    lightboxImage.height = work.height;
    lightboxMedia.style.setProperty("--lightbox-ratio", `${work.width} / ${work.height}`);
    lightboxTitle.textContent = work.title;
    lightboxTag.textContent = work.tag;
    lightboxDescription.textContent = work.description;
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
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.22, ease: "power2.out", overwrite: true }
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

  }

  if (window.gsap && window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    const motion = window.gsap.matchMedia();

    motion.add("(prefers-reduced-motion: no-preference)", () => {
      const hero = document.querySelector(".hero-story");
      const heroImage = document.querySelector(".hero-image");
      const heroCopy = document.querySelector(".hero-copy");

      if (hero && heroImage && heroCopy) {
        window.gsap.fromTo(heroCopy, { autoAlpha: 0, y: 18 }, {
          autoAlpha: 1, y: 0, duration: 0.58, ease: "power3.out"
        });

        const atmosphere = document.querySelector(".home-atmosphere");
        if (atmosphere) {
          const scene = window.gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: () => `+=${hero.offsetHeight * 0.94}`,
              scrub: 0.35,
              invalidateOnRefresh: true,
            },
          });
          scene.fromTo(heroImage, { scale: 1.035, autoAlpha: 1 }, { scale: 1.19, autoAlpha: 0.12, duration: 1 }, 0);
          scene.fromTo(".works-atmosphere-image", { scale: 1.09, autoAlpha: 0 }, { scale: 1, autoAlpha: 0.94, duration: 0.85 }, 0.15);
          scene.fromTo(".atmosphere-dim", { opacity: 0.06 }, { opacity: 0.68, duration: 1 }, 0);
        }
      }

      document.querySelectorAll("[data-reveal]").forEach((element, index) => {
        window.gsap.fromTo(
          element,
          { autoAlpha: 0, y: 18 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.65,
            delay: (index % 2) * 0.05,
            ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 88%", once: true },
          }
        );
      });

      window.addEventListener("load", window.ScrollTrigger.refresh, { once: true });
    });
  }
})();
