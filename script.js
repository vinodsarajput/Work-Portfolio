// ============================================================
// VINOD SINGH — PORTFOLIO INTERACTIONS
// Clean carousel, reveal, counter and review logic.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ----------------------------------------------------------
     Preloader
     ---------------------------------------------------------- */
  const loader = document.querySelector(".preloader");
  if (loader) {
    document.body.classList.add("locked");
    window.setTimeout(() => {
      loader.classList.add("done");
      document.body.classList.remove("locked");
    }, 900);
  }

  /* ----------------------------------------------------------
     Reveal on scroll
     ---------------------------------------------------------- */
  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        obs.unobserve(entry.target);
      });
    }, {threshold:0.10, rootMargin:"0px 0px -4% 0px"});
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("visible"));
  }

  /* ----------------------------------------------------------
     Portfolio carousels
     - Independent per card
     - Manual video
     - Static work auto-rotates using data-interval
     - Long carousels (>10) use a compact counter instead of dots
     ---------------------------------------------------------- */
  document.querySelectorAll("[data-carousel]").forEach(carousel => {
    const track = carousel.querySelector(".carousel-track");
    const slides = Array.from(carousel.querySelectorAll(".carousel-slide"));
    const prev = carousel.querySelector(".carousel-arrow.prev");
    const next = carousel.querySelector(".carousel-arrow.next");
    const dotsWrap = carousel.querySelector(".carousel-dots");
    const card = carousel.closest(".showcase-card");
    const intervalMs = Math.max(2500, Number(carousel.dataset.interval) || 4200);
    const autoPlay = carousel.dataset.auto !== "false";

    if (!track || !slides.length) return;

    let index = 0;
    let timer = null;
    let paused = false;
    let visible = true;
    let startX = 0;
    let soundOn = false;

    let counter = carousel.querySelector(".carousel-counter");
    if (!counter) {
      counter = document.createElement("div");
      counter.className = "carousel-counter";
      counter.setAttribute("aria-live", "polite");
      carousel.appendChild(counter);
    }

    const longCarousel = slides.length > 10;
    if (longCarousel) dotsWrap?.setAttribute("hidden", "true");

    if (slides.length <= 1) {
      prev?.setAttribute("hidden", "true");
      next?.setAttribute("hidden", "true");
      dotsWrap?.setAttribute("hidden", "true");
      counter.style.display = "none";
    } else if (longCarousel) {
      counter.style.display = "block";
    }

    const updateCounter = () => {
      if (!counter || slides.length <= 10) return;
      counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    };

    const updateSoundUI = toggle => {
      if (!toggle) return;
      toggle.textContent = soundOn ? "🔊" : "🔇";
      toggle.setAttribute("aria-label", soundOn ? "Turn sound off" : "Turn sound on");
      toggle.setAttribute("aria-pressed", String(soundOn));
    };

    const playVideo = video => {
      if (!video) return;
      video.muted = !soundOn;
      const promise = video.play();
      if (promise?.catch) promise.catch(() => {});
    };

    const updateVideos = () => {
      slides.forEach((slide, i) => {
        const video = slide.querySelector("video");
        if (!video) return;
        if (i === index && visible) {
          playVideo(video);
        } else {
          video.pause();
        }
      });
    };

    const render = () => {
      track.style.transform = `translateX(-${index * 100}%)`;
      dotsWrap?.querySelectorAll(".carousel-dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === index);
      });
      updateCounter();
      updateVideos();

      const activeSlide = slides[index];
      const title = activeSlide?.dataset.title;
      const description = activeSlide?.dataset.description;
      const client = activeSlide?.dataset.client;
      const titleBox = card?.querySelector(".project-title");
      const descriptionBox = card?.querySelector(".project-description");
      if (titleBox && title) titleBox.textContent = title;
      if (descriptionBox) descriptionBox.textContent = client || description || "";
    };

    const step = direction => {
      index = (index + direction + slides.length) % slides.length;
      render();
    };

    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };

    const start = () => {
      stop();
      if (!autoPlay || slides.length <= 1) return;
      timer = window.setInterval(() => {
        if (!paused && visible) step(1);
      }, intervalMs);
    };

    const restart = () => {
      start();
    };

    slides.forEach((_, i) => {
      if (!dotsWrap || longCarousel) return;
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.addEventListener("click", () => {
        index = i;
        render();
        restart();
      });
      dotsWrap.appendChild(dot);
    });

    prev?.addEventListener("click", () => { step(-1); restart(); });
    next?.addEventListener("click", () => { step(1); restart(); });

    const soundToggle = carousel.querySelector(".video-sound-toggle");
    soundToggle?.addEventListener("click", async () => {
      soundOn = !soundOn;
      const activeVideo = slides[index]?.querySelector("video");
      if (activeVideo) {
        activeVideo.muted = !soundOn;
        try { await activeVideo.play(); } catch (e) {}
      }
      updateSoundUI(soundToggle);
    });
    updateSoundUI(soundToggle);

    carousel.addEventListener("mouseenter", () => paused = true);
    carousel.addEventListener("mouseleave", () => paused = false);
    carousel.addEventListener("focusin", () => paused = true);
    carousel.addEventListener("focusout", () => paused = false);

    carousel.addEventListener("touchstart", e => {
      startX = e.changedTouches[0].clientX;
      paused = true;
    }, {passive:true});

    carousel.addEventListener("touchend", e => {
      const delta = e.changedTouches[0].clientX - startX;
      if (Math.abs(delta) > 35) step(delta < 0 ? 1 : -1);
      paused = false;
      restart();
    }, {passive:true});

    /* Stop video playback/timers when the carousel is off-screen. */
    if ("IntersectionObserver" in window) {
      const viewObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          visible = entry.isIntersecting;
          if (visible) {
            updateVideos();
            start();
          } else {
            stop();
            updateVideos();
          }
        });
      }, {threshold:0.05});
      viewObserver.observe(carousel);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stop();
      } else {
        updateVideos();
        start();
      }
    });

    render();
    start();
  });

  /* ----------------------------------------------------------
     Results counters
     ---------------------------------------------------------- */
  const counters = document.querySelectorAll(".counter[data-target]");
  if (counters.length) {
    const animateCounter = counter => {
      const target = Number(counter.dataset.target) || 0;
      const duration = 1200;
      const startTime = performance.now();
      const tick = now => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        counter.firstChild.nodeValue = Math.floor(target * eased).toLocaleString("en-IN");
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if ("IntersectionObserver" in window) {
      const countObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        });
      }, {threshold:0.55});
      counters.forEach(counter => countObserver.observe(counter));
    } else {
      counters.forEach(animateCounter);
    }
  }

  /* ----------------------------------------------------------
     Reviews slider
     ---------------------------------------------------------- */
  document.querySelectorAll("[data-review-carousel]").forEach(carousel => {
    const track = carousel.querySelector(".reviews-track");
    const slides = Array.from(carousel.querySelectorAll(".review-slide"));
    const prev = carousel.querySelector(".review-arrow.prev");
    const next = carousel.querySelector(".review-arrow.next");
    const dotsWrap = carousel.querySelector(".review-dots");
    const intervalMs = Math.max(3000, Number(carousel.dataset.interval) || 4200);
    if (!track || !slides.length) return;

    let index = 0;
    let timer = null;
    let paused = false;
    let startX = 0;

    slides.forEach((_, i) => {
      if (!dotsWrap) return;
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "review-dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", `Go to review ${i + 1}`);
      dot.addEventListener("click", () => { index = i; render(); restart(); });
      dotsWrap.appendChild(dot);
    });

    const render = () => {
      track.style.transform = `translateX(-${index * 100}%)`;
      dotsWrap?.querySelectorAll(".review-dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === index);
      });
    };

    const step = direction => {
      index = (index + direction + slides.length) % slides.length;
      render();
    };
    const stop = () => { if (timer) clearInterval(timer); timer = null; };
    const start = () => {
      stop();
      timer = setInterval(() => { if (!paused) step(1); }, intervalMs);
    };
    const restart = () => start();

    prev?.addEventListener("click", () => { step(-1); restart(); });
    next?.addEventListener("click", () => { step(1); restart(); });
    carousel.addEventListener("mouseenter", () => paused = true);
    carousel.addEventListener("mouseleave", () => paused = false);
    carousel.addEventListener("touchstart", e => { startX = e.changedTouches[0].clientX; paused = true; }, {passive:true});
    carousel.addEventListener("touchend", e => {
      const delta = e.changedTouches[0].clientX - startX;
      if (Math.abs(delta) > 35) step(delta < 0 ? 1 : -1);
      paused = false;
      restart();
    }, {passive:true});

    render();
    start();
  });

  /* ----------------------------------------------------------
     Local element glow — desktop only
     ---------------------------------------------------------- */
  if (window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
    const targets = document.querySelectorAll(".btn, .service-card, .showcase-card, .stat, .text-link, .contact-social, .carousel-arrow, .carousel-dot, .review-arrow, .review-dot");
    targets.forEach(el => {
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--hover-x", `${e.clientX - r.left}px`);
        el.style.setProperty("--hover-y", `${e.clientY - r.top}px`);
      }, {passive:true});
    });
  }
});
