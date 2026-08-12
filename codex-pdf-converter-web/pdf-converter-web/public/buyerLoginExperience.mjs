const PULL_THRESHOLD = 50;
const LAMP_HUES = [28, 42, 57, 112, 168, 204, 246, 312];

let initialized = false;

export function initBuyerLoginExperience() {
  if (initialized) {
    return;
  }

  const gsap = window.gsap;
  const Draggable = window.Draggable;
  const stage = document.querySelector('[data-lamp-login-stage]');
  const buyerApp = document.querySelector('.buyer-app');
  const ropePath = document.querySelector('[data-lamp-rope-path]');
  const ropeHandle = document.querySelector('[data-lamp-rope-handle]');
  const eyeGroup = document.querySelector('[data-lamp-eye-group]');
  const lampGlow = document.querySelector('[data-lamp-glow]');
  const lampBeam = document.querySelector('[data-lamp-beam]');
  const loginForm = document.querySelector('[data-login-lamp-form]');

  if (!gsap || !Draggable || !stage || !buyerApp || !ropePath || !ropeHandle || !eyeGroup || !lampGlow || !lampBeam || !loginForm) {
    return;
  }

  initialized = true;
  gsap.registerPlugin(Draggable);

  const ropeState = {
    pull: 0,
    sway: 0
  };
  const handleState = {
    x: 0,
    y: 0
  };
  const baseHue = LAMP_HUES[Math.floor(Math.random() * LAMP_HUES.length)];
  let lampOn = false;

  setTheme(baseHue, lampOn);
  syncLampPose();
  renderRope();
  gsap.set(loginForm, {
    autoAlpha: 0,
    scale: 0.86,
    y: 18,
    transformOrigin: '50% 50%'
  });
  gsap.set([lampGlow, lampBeam], {
    autoAlpha: 0
  });

  Draggable.create(ropeHandle, {
    type: 'x,y',
    bounds: {
      minX: -10,
      maxX: 10,
      minY: 0,
      maxY: 88
    },
    onPress() {
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    },
    onDrag() {
      handleState.x = this.x;
      handleState.y = Math.max(0, this.y);
      ropeState.pull = handleState.y;
      ropeState.sway = handleState.x * 0.9;
      renderRope();
    },
    onRelease() {
      const shouldToggle = handleState.y >= PULL_THRESHOLD;
      animateHandleBack(gsap, handleState, ropeState, renderRope);
      if (shouldToggle) {
        playLampClick();
        lampOn = !lampOn;
        const nextHue = LAMP_HUES[Math.floor(Math.random() * LAMP_HUES.length)];
        setTheme(nextHue, lampOn);
        syncLampPose();
        animateLampFeedback(gsap, lampGlow, lampBeam, loginForm, lampOn);
      }
    }
  });

  function setTheme(hue, on) {
    buyerApp.style.setProperty('--shade-hue', String(hue));
    buyerApp.style.setProperty('--on', on ? '1' : '0');
    stage.dataset.lampOn = on ? 'true' : 'false';
  }

  function syncLampPose() {
    gsap.to(eyeGroup, {
      rotation: lampOn ? 0 : 180,
      transformOrigin: '50% 50%',
      duration: 0.45,
      ease: 'power2.out'
    });
  }
}

function renderRope() {
  const ropePath = document.querySelector('[data-lamp-rope-path]');
  const ropeHandle = document.querySelector('[data-lamp-rope-handle]');
  if (!ropePath || !ropeHandle) {
    return;
  }

  const handleState = ropeHandle._gsTransform || { x: 0, y: 0 };
  const startX = 236;
  const startY = 62;
  const endX = 236 + (handleState.x || 0);
  const endY = 148 + (handleState.y || 0);
  const controlX = startX + (handleState.x || 0) * 1.35;
  const controlY = startY + (endY - startY) * 0.55;

  ropePath.setAttribute('d', `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`);
}

function animateHandleBack(gsap, handleState, ropeState, onUpdate) {
  gsap.to(handleState, {
    x: 0,
    y: 0,
    duration: 0.82,
    ease: 'elastic.out(1, 0.34)',
    onUpdate() {
      gsap.set('[data-lamp-rope-handle]', {
        x: handleState.x,
        y: handleState.y
      });
      ropeState.pull = handleState.y;
      ropeState.sway = handleState.x * 0.9;
      onUpdate();
    }
  });
}

function animateLampFeedback(gsap, glow, beam, form, lampOn) {
  const hueEase = 'power2.out';
  gsap.to(glow, {
    autoAlpha: lampOn ? 0.92 : 0,
    duration: 0.45,
    ease: hueEase
  });
  gsap.to(beam, {
    autoAlpha: lampOn ? 0.75 : 0,
    duration: 0.45,
    ease: hueEase
  });
  gsap.to(form, {
    autoAlpha: lampOn ? 1 : 0,
    scale: lampOn ? 1 : 0.86,
    y: lampOn ? 0 : 18,
    duration: lampOn ? 0.78 : 0.32,
    ease: lampOn ? 'back.out(1.45)' : 'power2.inOut'
  });
}

function playLampClick() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return;
  }

  if (!window.__buyerLampAudioContext) {
    window.__buyerLampAudioContext = new AudioContextCtor();
  }

  const context = window.__buyerLampAudioContext;
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(880, now);
  oscillator.frequency.exponentialRampToValueAtTime(210, now + 0.085);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.11, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.1);
}
