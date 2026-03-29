// ============================================================
// Animations Module - GSAP animations for MK Katalog SPA
// Handles page transitions, card entrances, scroll effects
// ============================================================

const Animations = {
  init() {
    this.setupScrollAnimations();
  },

  // Splash screen exit animation
  splashExit(callback) {
    const splash = document.getElementById('splash-screen');
    if (!splash) {
      if (callback) callback();
      return;
    }

    if (typeof gsap !== 'undefined') {
      const tl = gsap.timeline({
        onComplete: () => {
          splash.style.display = 'none';
          if (callback) callback();
        }
      });
      tl.to('.splash-logo-img', { scale: 0.95, opacity: 0, duration: 0.4, ease: 'power2.in' })
        .to('.splash-tagline', { opacity: 0, duration: 0.2 }, '-=0.3')
        .to('.splash-line', { scaleX: 0, duration: 0.3 }, '-=0.2')
        .to(splash, { opacity: 0, duration: 0.4 });
    } else {
      splash.style.display = 'none';
      if (callback) callback();
    }
  },

  // Page transition animation
  pageTransition(outScreen, inScreen, callback) {
    if (typeof gsap === 'undefined') {
      if (outScreen) outScreen.classList.remove('active');
      inScreen.classList.add('active');
      if (callback) callback();
      return;
    }

    const tl = gsap.timeline({
      onComplete: callback
    });

    if (outScreen) {
      tl.to(outScreen, {
        opacity: 0,
        duration: 0.2,
        ease: 'power1.in',
        onComplete: () => outScreen.classList.remove('active')
      });
    }

    inScreen.classList.add('active');
    inScreen.style.opacity = 0;
    tl.to(inScreen, { opacity: 1, duration: 0.3, ease: 'power1.out' });
  },

  // Staggered card entrance
  staggerCards(container, cardSelector) {
    if (typeof gsap === 'undefined') return;

    const cards = container.querySelectorAll(cardSelector);
    if (!cards.length) return;

    gsap.fromTo(cards,
      { opacity: 0, y: 30, scale: 0.95 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.out'
      }
    );
  },

  // Filter change animation - animate grid reflow
  filterAnimation(container, cardSelector) {
    if (typeof gsap === 'undefined') return;

    const cards = container.querySelectorAll(cardSelector);
    if (!cards.length) return;

    gsap.fromTo(cards,
      { opacity: 0, scale: 0.9 },
      {
        opacity: 1, scale: 1,
        duration: 0.3,
        stagger: 0.03,
        ease: 'back.out(1.2)'
      }
    );
  },

  // Hero section entrance
  heroEntrance() {
    if (typeof gsap === 'undefined') return;

    const tl = gsap.timeline();
    tl.fromTo('.hero-logo-img',
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
      .fromTo('.hero-divider',
        { scaleX: 0 },
        { scaleX: 1, duration: 0.4 }, '-=0.2')
      .fromTo('.hero-btn',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' }, '-=0.2');
  },

  // Button press animation (scale feedback)
  buttonPress(element) {
    if (typeof gsap === 'undefined') return;
    gsap.fromTo(element,
      { scale: 1 },
      { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1, ease: 'power1.inOut' }
    );
  },

  // Section entrance (for contact, portfolio headers)
  sectionEntrance(sectionId) {
    if (typeof gsap === 'undefined') return;

    const section = document.getElementById(sectionId);
    if (!section) return;

    const header = section.querySelector('.screen-header');
    const content = section.querySelectorAll('.animate-in');

    const tl = gsap.timeline();
    if (header) {
      tl.fromTo(header,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
    }
    if (content.length) {
      tl.fromTo(content,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }, '-=0.2');
    }
  },

  // Scroll-triggered animation observer
  setupScrollAnimations() {
    if (typeof gsap === 'undefined') return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
          entry.target.classList.add('animated');
          gsap.fromTo(entry.target,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
          );
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
  }
};
