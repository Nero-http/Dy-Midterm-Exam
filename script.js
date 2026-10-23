(() => {
  "use strict";

  gsap.registerPlugin(ScrollTrigger);

  const root = document.documentElement;
  const themeToggle = document.querySelector("#themeToggle");
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  const replayButton = document.querySelector("#replayIntro");
  const terminalOutput = document.querySelector("#terminalOutput");
  const contactForm = document.querySelector("#contactForm");
  const messageField = document.querySelector("#contactMessage");
  const formStatus = document.querySelector("#formStatus");
  const interestChips = document.querySelectorAll("#interestChips .chip");

  const terminalText = [
    "Gaming PCs ........ OK",
    "Components ........ OK",
    "Custom builds ..... OK",
    "Repair & upgrades . OK",
    "",
    "> Ready when you are."
  ].join("\n");

  /* ---------- Dark mode (choice remembered in localStorage) ---------- */

  function syncThemeControls() {
    const isDark = root.classList.contains("dark");
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    themeColorMeta.content = isDark ? "#120907" : "#FFF4EA";
  }

  try {
    const savedTheme = localStorage.getItem("cyberhell-theme");
    if (savedTheme === "light") root.classList.remove("dark");
    if (savedTheme === "dark") root.classList.add("dark");
  } catch (error) {
    // Storage can be blocked; the toggle still works for this visit.
  }

  syncThemeControls();

  themeToggle.addEventListener("click", () => {
    root.classList.toggle("dark");
    try {
      localStorage.setItem("cyberhell-theme", root.classList.contains("dark") ? "dark" : "light");
    } catch (error) {
      // Ignore blocked storage.
    }
    syncThemeControls();
  });

  /* ---------- Motion (all wrapped in gsap.matchMedia) ---------- */

  const motion = gsap.matchMedia();

  // Page-load intro timeline (about 2.8 s) with a Replay button.
  motion.add("(prefers-reduced-motion: no-preference)", () => {
    const typing = { characters: 0 };

    // power3.out: quick start with a soft landing feels confident, not bouncy.
    const intro = gsap.timeline({ defaults: { duration: 0.55, ease: "power3.out" } });

    intro
      .from("#siteHeader", { y: -30, opacity: 0 })
      .from(".hero-line", { x: -50, opacity: 0, stagger: 0.12 }, "-=0.3")
      .from(".hero-copy", { y: 20, opacity: 0, stagger: 0.08 }, "-=0.4")
      // back.out: a small overshoot makes the terminal "pop" in like a window opening.
      .from("#heroTerminal", { x: 40, opacity: 0, scale: 0.96, ease: "back.out(1.4)" }, "<")
      // none: constant speed, because real typing has no acceleration.
      .to(typing, {
        characters: terminalText.length,
        duration: 1.4,
        ease: "none",
        onStart: () => { terminalOutput.textContent = ""; },
        onUpdate: () => {
          terminalOutput.textContent = terminalText.slice(0, Math.round(typing.characters));
        }
      }, "-=0.25");

    const replayIntro = () => intro.restart();
    replayButton.addEventListener("click", replayIntro);

    // sine.inOut: smooth acceleration both ways for a gentle, endless float.
    gsap.to("#sticker", { y: -10, duration: 1.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.fromTo("#sticker", { rotation: -3 }, {
      rotation: 3, duration: 2.4, repeat: -1, yoyo: true, ease: "sine.inOut"
    });

    // none: a marquee must move at a constant speed to loop seamlessly.
    gsap.to("#tickerTrack", { xPercent: -50, duration: 24, repeat: -1, ease: "none" });

    return () => replayButton.removeEventListener("click", replayIntro);
  });

  // With reduced motion on, the intro never runs, so hide the replay button.
  motion.add("(prefers-reduced-motion: reduce)", () => {
    replayButton.hidden = true;
    terminalOutput.textContent = terminalText;
    return () => { replayButton.hidden = false; };
  });

  // Scroll effects: section reveals and a scrubbed progress bar.
  motion.add("(prefers-reduced-motion: no-preference)", () => {
    gsap.utils.toArray(".reveal").forEach((section) => {
      // power2.out: gentler than the intro, so scrolling feels calm.
      gsap.from(section, {
        y: 35,
        opacity: 0,
        duration: 0.75,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      });
    });

    gsap.set("#scrollProgress", { autoAlpha: 1, scaleX: 0, transformOrigin: "left center" });

    // none: scrubbed tweens must map scroll position 1:1 to progress.
    gsap.to("#scrollProgress", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: true
      }
    });
  });

  // Hover effects only for visitors with a mouse who allow motion.
  motion.add("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)", () => {
    const controller = new AbortController();
    const options = { signal: controller.signal };

    document.querySelectorAll("button, .brutal-btn, .brutal-btn-ghost").forEach((button) => {
      button.addEventListener("pointerenter", () => {
        gsap.to(button, { y: -3, scale: 1.025, duration: 0.2, ease: "power2.out", overwrite: "auto" });
      }, options);
      button.addEventListener("pointerleave", () => {
        gsap.to(button, { y: 0, scale: 1, duration: 0.25, ease: "power2.out", overwrite: "auto" });
      }, options);
    });

    document.querySelectorAll(".hero-line").forEach((line) => {
      line.addEventListener("pointerenter", () => {
        // steps(2): hard, jittery steps read as a digital glitch.
        gsap.to(line, { x: 2, duration: 0.06, repeat: 3, yoyo: true, ease: "steps(2)", overwrite: "auto" });
      }, options);
      line.addEventListener("pointerleave", () => {
        gsap.to(line, { x: 0, duration: 0.15, overwrite: "auto" });
      }, options);
    });

    return () => controller.abort();
  });

  /* ---------- Contact form ---------- */

  const selectedInterests = new Set();
  let messageEditedByVisitor = false;

  function fillMessageFromChips() {
    if (messageEditedByVisitor) return;
    messageField.value = selectedInterests.size
      ? "Hi! I'm interested in " + [...selectedInterests].join(", ") + "."
      : "";
  }

  messageField.addEventListener("input", () => { messageEditedByVisitor = true; });

  interestChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const isOn = chip.getAttribute("aria-pressed") === "true";
      chip.setAttribute("aria-pressed", String(!isOn));
      if (isOn) selectedInterests.delete(chip.dataset.interest);
      else selectedInterests.add(chip.dataset.interest);
      fillMessageFromChips();
    });
  });

  // Gear card buttons preselect the matching interest chip.
  document.querySelectorAll("[data-interest-link]").forEach((link) => {
    link.addEventListener("click", () => {
      const interest = link.dataset.interestLink;
      selectedInterests.add(interest);
      interestChips.forEach((chip) => {
        if (chip.dataset.interest === interest) chip.setAttribute("aria-pressed", "true");
      });
      fillMessageFromChips();
    });
  });

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }
    formStatus.textContent = "> Form is valid. Sending is not connected yet.";
  });

  document.querySelector("#currentYear").textContent = new Date().getFullYear();
})();