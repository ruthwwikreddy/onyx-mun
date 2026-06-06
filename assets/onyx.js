(() => {
  const ready = (fn) => {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  };

  ready(() => {
    document.body.classList.add("is-loaded");

    const header = document.querySelector(".onyx-header");
    const progress = document.getElementById("scroll-progress");
    const onScroll = () => {
      const y = window.scrollY;
      if (header) header.classList.toggle("is-scrolled", y > 12);
      if (progress) {
        const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        progress.style.width = h > 0 ? `${(y / h) * 100}%` : "0%";
      }
      const heroBg = document.getElementById("heroBg");
      if (heroBg && y < window.innerHeight * 1.2) {
        heroBg.style.transform = `scale(1.08) translateY(${y * 0.18}px)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

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
    if (revealEls.length) {
      revealEls.forEach((el, i) => {
        // If a section/page already sets a specific reveal delay inline, keep it.
        // Otherwise, assign the default stagger delay.
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
    }

    const scrollTop = document.querySelector(".scroll-top");
    if (scrollTop) {
      window.addEventListener("scroll", () => {
        scrollTop.classList.toggle("is-visible", window.scrollY > 500);
      }, { passive: true });
      scrollTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }

    const loader = document.getElementById("loader");
    if (loader) {
      window.addEventListener("load", () => {
        setTimeout(() => loader.classList.add("is-hidden"), loader.dataset.delay ? +loader.dataset.delay : 800);
      });
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

    const heroBg = document.getElementById("heroBg");
    if (heroBg) {
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
      heroBg.style.backgroundImage = `url("${encodeURI(chosen)}")`;
    }

    const navLinks = document.querySelectorAll('.onyx-nav a[href^="#"]');
    const sections = [...navLinks]
      .map((a) => document.querySelector(a.getAttribute("href")))
      .filter(Boolean);
    if (navLinks.length && sections.length) {
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
