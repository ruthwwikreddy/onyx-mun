(() => {
  const ready = (fn) => {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  };

  ready(() => {
    document.body.classList.add("is-loaded");

    const header = document.querySelector(".onyx-header");
    const progress = document.getElementById("scroll-progress");
    const heroBg = document.getElementById("heroBg");
    const scrollTop = document.querySelector(".scroll-top");
    let scrollTicking = false;

    const updateOnScroll = () => {
      const y = window.scrollY;
      if (header) header.classList.toggle("is-scrolled", y > 12);
      if (progress) {
        const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        progress.style.width = h > 0 ? `${(y / h) * 100}%` : "0%";
      }
      if (heroBg && y < window.innerHeight * 1.2) {
        heroBg.style.transform = `scale(1.08) translateY(${y * 0.18}px)`;
      }
      if (scrollTop) scrollTop.classList.toggle("is-visible", y > 500);
    };

    const onScroll = () => {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        updateOnScroll();
        scrollTicking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateOnScroll();

    const menuBtn = document.querySelector(".onyx-menu-btn");
    const navWrap = document.querySelector(".onyx-nav-wrap");
    if (menuBtn && navWrap) {
      menuBtn.addEventListener("click", () => {
        const open = navWrap.classList.toggle("is-open");
        menuBtn.classList.toggle("is-open", open);
        menuBtn.setAttribute("aria-expanded", open);
      });
      navWrap.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => {
          navWrap.classList.remove("is-open");
          menuBtn.classList.remove("is-open");
          menuBtn.setAttribute("aria-expanded", "false");
        });
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          navWrap.classList.remove("is-open");
          menuBtn.classList.remove("is-open");
        }
      });
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        const href = anchor.getAttribute("href");
        if (!href || href === "#") return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth" });
        }
      });
    });

    document.querySelectorAll(".onyx-faq__trigger, .ox-faq__trigger").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = btn.closest(".onyx-faq__item, .ox-faq__item");
        const body = item.querySelector(".onyx-faq__body, .ox-faq__body");
        const wasOpen = item.classList.contains("is-open");
        const root = item.parentElement;
        root.querySelectorAll(".onyx-faq__item, .ox-faq__item").forEach((i) => {
          i.classList.remove("is-open");
          const b = i.querySelector(".onyx-faq__body, .ox-faq__body");
          if (b) b.style.maxHeight = null;
        });
        if (!wasOpen) {
          item.classList.add("is-open");
          if (body) body.style.maxHeight = `${body.scrollHeight}px`;
        }
      });
    });

    const revealEls = document.querySelectorAll("[data-reveal]");
    if (revealEls.length && "IntersectionObserver" in window) {
      revealEls.forEach((el, i) => {
        const existing = el.style.getPropertyValue("--reveal-delay");
        if (!existing) {
          el.style.setProperty("--reveal-delay", `${Math.min(i % 8, 7) * 60}ms`);
        }
      });
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
      );
      revealEls.forEach((el) => io.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    }

    if (scrollTop) {
      scrollTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }

    const loader = document.getElementById("loader");
    if (loader) {
      const hideLoader = () => {
        loader.classList.add("is-hidden");
        loader.setAttribute("aria-hidden", "true");
        loader.hidden = true;
      };
      const delay = loader.dataset.delay ? Math.max(0, +loader.dataset.delay) : 400;
      const scheduleHide = () => setTimeout(hideLoader, delay);
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", scheduleHide, { once: true });
      } else {
        scheduleHide();
      }
      // Never block the page if a slow asset delays window.load
      setTimeout(hideLoader, Math.max(delay + 600, 1200));
    }

    document.querySelectorAll('a[target="_blank"]').forEach((a) => {
      if (!a.getAttribute("rel")) a.setAttribute("rel", "noopener noreferrer");
    });

    document.querySelectorAll(".js-email").forEach((el) => {
      const user = el.dataset.user;
      const domain = el.dataset.domain;
      if (user && domain) {
        const addr = `${user}@${domain}`;
        el.href = `mailto:${addr}`;
        if (el.textContent.trim() === "Contact via email") el.textContent = addr;
      }
    });

    const setHeroImage = () => {
      if (!heroBg) return;
      const imgs = [
        "assets/hero/image.webp",
        "assets/hero/image copy.webp",
        "assets/hero/image copy 2.webp",
        "assets/hero/image copy 3.webp",
      ];
      let chosen = sessionStorage.getItem("heroImage");
      if (!chosen || !imgs.includes(chosen)) {
        chosen = imgs[Math.floor(Math.random() * imgs.length)];
        sessionStorage.setItem("heroImage", chosen);
      }
      if (heroBg.style.backgroundImage.indexOf(chosen) === -1) {
        heroBg.style.backgroundImage = `url("${encodeURI(chosen)}")`;
      }
    };

    if (heroBg) {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(setHeroImage, { timeout: 1500 });
      } else {
        setTimeout(setHeroImage, 200);
      }
    }

    const navLinks = document.querySelectorAll('.onyx-nav a[href^="#"]');
    const sections = [...navLinks]
      .map((a) => document.querySelector(a.getAttribute("href")))
      .filter(Boolean);
    if (navLinks.length && sections.length && "IntersectionObserver" in window) {
      const sectionIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const id = entry.target.id;
            navLinks.forEach((link) => {
              link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
            });
          });
        },
        { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
      );
      sections.forEach((s) => sectionIo.observe(s));
    }

    document.querySelectorAll(".chip-nav .nav-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".chip-nav .nav-chip").forEach((c) => c.classList.remove("is-active"));
        chip.classList.add("is-active");
      });
    });
  });
})();
