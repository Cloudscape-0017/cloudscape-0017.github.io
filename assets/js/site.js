(() => {
  const contactDialog = document.querySelector("#contact-dialog");
  const contactTrigger = document.querySelector("[data-contact-open]");
  const contactClose = document.querySelector("[data-contact-close]");
  const contactCopies = Array.from(document.querySelectorAll("[data-contact-copy]"));

  if (contactDialog && contactTrigger && contactClose) {
    contactTrigger.addEventListener("click", () => {
      contactDialog.showModal();
      contactClose.focus({ preventScroll: true });
    });

    const closeContact = () => {
      if (contactDialog.open) contactDialog.close();
    };

    contactClose.addEventListener("click", closeContact);
    contactDialog.addEventListener("click", (event) => {
      if (event.target === contactDialog) closeContact();
    });
    contactDialog.addEventListener("close", () => contactTrigger.focus({ preventScroll: true }));
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
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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
        window.gsap.fromTo(
          heroCopy,
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.72, ease: "power3.out" }
        );

        window.gsap.fromTo(
          heroImage,
          { scale: 1.085 },
          {
            scale: 1.015,
            ease: "none",
            scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true },
          }
        );

        window.gsap.to(heroCopy, {
          y: -12,
          autoAlpha: 0.5,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true },
        });
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
