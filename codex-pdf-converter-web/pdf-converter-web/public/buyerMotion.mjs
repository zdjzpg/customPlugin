export function applyBuyerMotion(mode = 'tool_list') {
  if (prefersReducedMotion()) {
    return;
  }

  const gsap = window.gsap;
  if (!gsap) {
    return;
  }

  if (mode === 'login') {
    animateLogin(gsap);
    return;
  }

  animateBuyerShell(gsap, mode);
}

function animateLogin(gsap) {
  const root = document.querySelector('[data-login-motion-shell]');
  if (!root) {
    return;
  }

  const brand = root.querySelector('[data-animate-login-brand]');
  const panel = root.querySelector('[data-animate-login-panel]');
  const copy = root.querySelector('[data-animate-login-copy]');
  const form = root.querySelector('[data-animate-login-form]');
  const fields = form ? Array.from(form.querySelectorAll('.field, .button')) : [];
  const glows = Array.from(document.querySelectorAll('.buyer-login-glow'));

  gsap.killTweensOf([brand, panel, copy, form, ...fields, ...glows]);
  gsap.set([brand, panel], { autoAlpha: 0, y: 24 });
  gsap.set(copy ? copy.children : [], { autoAlpha: 0, y: 16 });
  gsap.set(fields, { autoAlpha: 0, y: 12 });
  gsap.set(glows, { autoAlpha: 0.42, scale: 0.94 });

  const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } });
  timeline
    .to(brand, { autoAlpha: 1, y: 0, duration: 0.54 })
    .to(panel, { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.36')
    .to(copy ? copy.children : [], { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.08 }, '-=0.3')
    .to(fields, { autoAlpha: 1, y: 0, duration: 0.34, stagger: 0.06 }, '-=0.22');

  glows.forEach((glow, index) => {
    gsap.to(glow, {
      y: index % 2 === 0 ? -18 : 18,
      x: index === 1 ? 14 : -10,
      scale: index === 2 ? 1.08 : 1.03,
      duration: 4.8 + (index * 0.7),
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  });
}

function animateBuyerShell(gsap, mode) {
  const root = document.querySelector('[data-buyer-motion-root]');
  if (!root) {
    return;
  }

  const topbar = root.querySelector('[data-animate-topbar]');
  const searchPanel = root.querySelector('[data-animate-search-panel]');
  const title = root.querySelector('[data-animate-current-title]');
  const sideNavItems = Array.from(root.querySelectorAll('[data-animate-side-nav] .buyer-side-nav-item'));
  const listHost = root.querySelector('[data-animate-tool-list]');
  const cards = listHost
    ? Array.from(
        listHost.querySelectorAll(
          '.tool-item, .mobile-tool-card, .buyer-home-category-card, .category-card'
        )
      )
    : [];

  gsap.killTweensOf([topbar, searchPanel, title, ...sideNavItems, ...cards]);

  if (mode === 'tool_list') {
    gsap.set([topbar, searchPanel, title], { autoAlpha: 0, y: 18 });
    gsap.set(sideNavItems, { autoAlpha: 0, x: -14 });
  }
  gsap.set(cards, { autoAlpha: 0, y: 18, scale: 0.985 });

  const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } });
  if (mode === 'tool_list') {
    timeline
      .to(topbar, { autoAlpha: 1, y: 0, duration: 0.34 })
      .to(sideNavItems, { autoAlpha: 1, x: 0, duration: 0.28, stagger: 0.03 }, '-=0.18')
      .to(searchPanel, { autoAlpha: 1, y: 0, duration: 0.34 }, '-=0.18')
      .to(title, { autoAlpha: 1, y: 0, duration: 0.3 }, '-=0.22');
  }
  timeline.to(cards, {
    autoAlpha: 1,
    y: 0,
    scale: 1,
    duration: 0.34,
    stagger: {
      each: 0.035,
      from: 'start'
    }
  }, mode === 'tool_list' ? '-=0.14' : 0);
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
