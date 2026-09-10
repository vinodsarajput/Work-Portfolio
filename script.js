// ============================================================
// EDIT GUIDE — JAVASCRIPT
// इस file में animations, single-page interactions और portfolio
// carousel का behavior है। सामान्य text/content बदलने के लिए
// HTML files edit करें।
// ============================================================

// VINOD SINGH — navigation + portfolio carousel interactions

document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Preloader: keep it short and premium.
  const loader = document.querySelector(".preloader");
  if (loader) {
    document.body.classList.add("locked");
    setTimeout(() => {
      loader.classList.add("done");
      document.body.classList.remove("locked");
    }, 1050);
  }

  // Mobile menu.
  const toggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  if (toggle && mobileMenu) {
    toggle.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      mobileMenu.setAttribute("aria-hidden", String(!isOpen));
    });
    mobileMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        mobileMenu.setAttribute("aria-hidden", "true");
      });
    });
  }

  // Reveal on scroll.
  const revealItems = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        obs.unobserve(entry.target);
      }
    });
  }, {threshold:0.12});
  revealItems.forEach(item => observer.observe(item));

  // =====================================================
  // PORTFOLIO CAROUSELS
  // हर carousel independently चलता है।
  // data-interval="2000" = 2 सेकंड में अगली slide।
  // =====================================================
  document.querySelectorAll("[data-carousel]").forEach(carousel => {
    const track = carousel.querySelector(".carousel-track");
    const slides = Array.from(carousel.querySelectorAll(".carousel-slide"));
    const prev = carousel.querySelector(".carousel-arrow.prev");
    const next = carousel.querySelector(".carousel-arrow.next");
    const dotsWrap = carousel.querySelector(".carousel-dots");
    const intervalMs = Number(carousel.dataset.interval) || 2000;
    const autoPlay = carousel.dataset.auto !== "false";
    if (!track || slides.length === 0) return;

    // Video sound control: default muted, user can explicitly toggle sound.
    const soundToggle = carousel.querySelector(".video-sound-toggle");
    const isVideoCarousel = carousel.querySelector("video") !== null;
    let soundOn = false;

    const updateSoundUI = () => {
      if (!soundToggle) return;
      soundToggle.textContent = soundOn ? "🔊" : "🔇";
      soundToggle.setAttribute("aria-label", soundOn ? "Turn sound off" : "Turn sound on");
      soundToggle.setAttribute("aria-pressed", String(soundOn));
    };

    soundToggle?.addEventListener("click", async () => {
      soundOn = !soundOn;
      const activeVideo = slides[index]?.querySelector("video");
      if (activeVideo) {
        activeVideo.muted = !soundOn;
        if (soundOn) {
          try { await activeVideo.play(); } catch (e) {}
        }
      }
      updateSoundUI();
    });

    // एक ही slide हो तो अनावश्यक arrows/dots छिपाएँ।
    if (slides.length <= 1) {
      prev?.setAttribute("hidden", "true");
      next?.setAttribute("hidden", "true");
    }

    let index = 0;
    let timer = null;
    let paused = false;

    // Dots.
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "carousel-dot" + (i === 0 ? " active" : "");
      dot.type = "button";
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.addEventListener("click", () => {
        index = i;
        render();
        restart();
      });
      dotsWrap?.appendChild(dot);
    });

    const render = () => {
      track.style.transform = `translateX(-${index * 100}%)`;
      dotsWrap?.querySelectorAll(".carousel-dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === index);
      });

      // Active slide का title/description और video playback sync रखें।
      slides.forEach((slide, i) => {
        const media = slide.querySelector("video");
        if (!media) return;
        if (i === index) {
          media.muted = !soundOn;
          media.play().catch(() => {});
        } else {
          media.pause();
          try { media.currentTime = 0; } catch (e) {}
        }
      });
      const activeSlide = slides[index];
      const title = activeSlide?.dataset.title;
      const description = activeSlide?.dataset.description;
      const client = activeSlide?.dataset.client;
      const titleBox = carousel.closest(".showcase-card")?.querySelector(".project-info .project-title");
      const descriptionBox = carousel.closest(".showcase-card")?.querySelector(".project-info .project-description");

      if (titleBox && title) titleBox.textContent = title;
      if (descriptionBox) descriptionBox.textContent = client || description || "";
    };

    const step = direction => {
      index = (index + direction + slides.length) % slides.length;
      render();
    };

    prev?.addEventListener("click", () => { step(-1); restart(); });
    next?.addEventListener("click", () => { step(1); restart(); });

    const start = () => {
      clearInterval(timer);
      if (!autoPlay) return;
      timer = setInterval(() => {
        if (!paused) step(1);
      }, intervalMs);
    };
    const restart = () => {
      clearInterval(timer);
      if (autoPlay) start();
    };

    carousel.addEventListener("mouseenter", () => paused = true);
    carousel.addEventListener("mouseleave", () => paused = false);
    carousel.addEventListener("focusin", () => paused = true);
    carousel.addEventListener("focusout", () => paused = false);
    carousel.addEventListener("touchstart", () => paused = true, {passive:true});
    carousel.addEventListener("touchend", () => {
      paused = false;
      restart();
    }, {passive:true});

    // Optional manual swipe on touch screens.
    let startX = 0;
    carousel.addEventListener("touchstart", e => { startX = e.changedTouches[0].clientX; }, {passive:true});
    carousel.addEventListener("touchend", e => {
      const delta = e.changedTouches[0].clientX - startX;
      if (Math.abs(delta) > 35) {
        step(delta < 0 ? 1 : -1);
        restart();
      }
    }, {passive:true});

    updateSoundUI();
    render();
    start();
  });


  // =====================================================
  // RESULTS COUNT ANIMATION
  // HTML में data-target बदलने से final number बदल जाएगा।
  // =====================================================
  // जब Results section viewport में आता है, number 0 से target तक smoothly count होता है।
  const counters = document.querySelectorAll(".counter[data-target]");
  if (counters.length) {
    const countObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const counter = entry.target;
        const target = Number(counter.dataset.target) || 0;
        const duration = 1500;
        const start = performance.now();

        const tick = now => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          counter.firstChild.nodeValue = Math.floor(target * eased).toLocaleString("en-IN");
          if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
        obs.unobserve(counter);
      });
    }, {threshold: .6});

    counters.forEach(counter => countObserver.observe(counter));
  }

  // Subtle pointer glow for desktop.
  const hero = document.querySelector(".hero");
  const orb = document.querySelector(".orb-one");
  if (hero && orb && window.matchMedia("(pointer:fine)").matches) {
    hero.addEventListener("pointermove", e => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      orb.style.transform = `translate(${x * 24}px, ${y * 16}px)`;
    }, {passive:true});
  }
});

// Element-local glow: light follows the element under the pointer, not the cursor globally.
(() => {
  if (!window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  const targets = document.querySelectorAll(".btn, .service-card, .showcase-card, .stat, .text-link, .footer-nav a, .social-link, .carousel-arrow, .carousel-dot, .video-sound-toggle");
  targets.forEach(el => {
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--hover-x", `${e.clientX - r.left}px`);
      el.style.setProperty("--hover-y", `${e.clientY - r.top}px`);
    }, {passive:true});
  });
})();
