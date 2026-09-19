// TargetCursor — vanilla port of React Bits <TargetCursor>. Requires window.gsap (v3).

const CSS = `
.target-cursor-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 2147483647;
  mix-blend-mode: difference;
  transform: translate(-50%, -50%);
}
.target-cursor-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 4px;
  height: 4px;
  background: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  will-change: transform;
}
.target-cursor-corner {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12px;
  height: 12px;
  border: 3px solid #fff;
  will-change: transform;
}
.corner-tl { transform: translate(-150%, -150%); border-right: none; border-bottom: none; }
.corner-tr { transform: translate(50%, -150%); border-left: none; border-bottom: none; }
.corner-br { transform: translate(50%, 50%); border-left: none; border-top: none; }
.corner-bl { transform: translate(-150%, 50%); border-right: none; border-top: none; }
`;

function injectStyle() {
  if (document.querySelector('style[data-rb="TargetCursor"]')) return;
  const s = document.createElement('style');
  s.setAttribute('data-rb', 'TargetCursor');
  s.textContent = CSS;
  document.head.appendChild(s);
}

// A position: fixed element is positioned relative to the viewport UNLESS an
// ancestor establishes a containing block (transform, perspective, filter,
// will-change of those, or contain). Measure and compensate for it.
const getContainingBlock = element => {
  let node = element?.parentElement;
  while (node && node !== document.documentElement) {
    const style = getComputedStyle(node);
    if (
      style.transform !== 'none' ||
      style.perspective !== 'none' ||
      style.filter !== 'none' ||
      style.willChange.includes('transform') ||
      style.willChange.includes('perspective') ||
      style.willChange.includes('filter') ||
      /paint|layout|strict|content/.test(style.contain)
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
};

const getContainingBlockOffset = block => {
  if (!block) return { x: 0, y: 0 };
  const rect = block.getBoundingClientRect();
  return { x: rect.left + block.clientLeft, y: rect.top + block.clientTop };
};

function isMobile() {
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  const userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  return (hasTouchScreen && isSmallScreen) || mobileRegex.test(userAgent.toLowerCase());
}

export default function mount(el = document.body, opts = {}) {
  const noop = { destroy() {} };
  const gsap = window.gsap;
  if (!gsap || isMobile() || matchMedia('(prefers-reduced-motion: reduce)').matches) return noop;

  const {
    targetSelector = '.cursor-target',
    spinDuration = 2,
    hideDefaultCursor = true,
    hoverDuration = 0.2,
    parallaxOn = true,
    cursorColor = '#ffffff',
    cursorColorOnTarget
  } = opts;

  injectStyle();

  const cursor = document.createElement('div');
  cursor.className = 'target-cursor-wrapper';
  const dot = document.createElement('div');
  dot.className = 'target-cursor-dot';
  dot.style.backgroundColor = cursorColor;
  cursor.appendChild(dot);
  for (const pos of ['tl', 'tr', 'br', 'bl']) {
    const c = document.createElement('div');
    c.className = `target-cursor-corner corner-${pos}`;
    c.style.borderColor = cursorColor;
    cursor.appendChild(c);
  }
  (el || document.body).appendChild(cursor);

  const corners = Array.from(cursor.querySelectorAll('.target-cursor-corner'));
  const constants = { borderWidth: 3, cornerSize: 12 };

  const originalCursor = document.body.style.cursor;
  if (hideDefaultCursor) document.body.style.cursor = 'none';

  let containingBlock = getContainingBlock(cursor);
  const getOffset = () => getContainingBlockOffset(containingBlock);

  let spinTl = null;
  let activeTarget = null;
  let currentLeaveHandler = null;
  let resumeTimeout = null;
  let targetCornerPositions = null;
  const activeStrength = { current: 0 };

  const cleanupTarget = target => {
    if (currentLeaveHandler) target.removeEventListener('mouseleave', currentLeaveHandler);
    currentLeaveHandler = null;
  };

  const initialOffset = getOffset();
  gsap.set(cursor, {
    xPercent: -50,
    yPercent: -50,
    x: window.innerWidth / 2 - initialOffset.x,
    y: window.innerHeight / 2 - initialOffset.y
  });

  const createSpinTimeline = () => {
    if (spinTl) spinTl.kill();
    spinTl = gsap.timeline({ repeat: -1 }).to(cursor, { rotation: '+=360', duration: spinDuration, ease: 'none' });
  };
  createSpinTimeline();

  const tickerFn = () => {
    if (!targetCornerPositions) return;
    const strength = activeStrength.current;
    if (strength === 0) return;

    const cursorX = gsap.getProperty(cursor, 'x');
    const cursorY = gsap.getProperty(cursor, 'y');

    corners.forEach((corner, i) => {
      const currentX = gsap.getProperty(corner, 'x');
      const currentY = gsap.getProperty(corner, 'y');
      const targetX = targetCornerPositions[i].x - cursorX;
      const targetY = targetCornerPositions[i].y - cursorY;
      const finalX = currentX + (targetX - currentX) * strength;
      const finalY = currentY + (targetY - currentY) * strength;
      const duration = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05;
      gsap.to(corner, {
        x: finalX,
        y: finalY,
        duration,
        ease: duration === 0 ? 'none' : 'power1.out',
        overwrite: 'auto'
      });
    });
  };

  const moveCursor = (x, y) => {
    const { x: offsetX, y: offsetY } = getOffset();
    gsap.to(cursor, { x: x - offsetX, y: y - offsetY, duration: 0.1, ease: 'power3.out' });
  };
  const moveHandler = e => moveCursor(e.clientX, e.clientY);

  const scrollHandler = () => {
    if (!activeTarget) return;
    const { x: offsetX, y: offsetY } = getOffset();
    const mouseX = gsap.getProperty(cursor, 'x') + offsetX;
    const mouseY = gsap.getProperty(cursor, 'y') + offsetY;
    const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
    const isStillOverTarget =
      elementUnderMouse &&
      (elementUnderMouse === activeTarget || elementUnderMouse.closest(targetSelector) === activeTarget);
    if (!isStillOverTarget && currentLeaveHandler) currentLeaveHandler();
  };

  const mouseDownHandler = () => {
    gsap.to(dot, { scale: 0.7, duration: 0.3 });
    gsap.to(cursor, { scale: 0.9, duration: 0.2 });
  };
  const mouseUpHandler = () => {
    gsap.to(dot, { scale: 1, duration: 0.3 });
    gsap.to(cursor, { scale: 1, duration: 0.2 });
  };

  const enterHandler = e => {
    const allTargets = [];
    let current = e.target;
    while (current && current !== document.body) {
      if (current.matches(targetSelector)) allTargets.push(current);
      current = current.parentElement;
    }
    const target = allTargets[0] || null;
    if (!target) return;
    if (activeTarget === target) return;
    if (activeTarget) cleanupTarget(activeTarget);
    if (resumeTimeout) {
      clearTimeout(resumeTimeout);
      resumeTimeout = null;
    }

    activeTarget = target;
    corners.forEach(corner => gsap.killTweensOf(corner, 'x,y'));

    gsap.killTweensOf(cursor, 'rotation');
    spinTl?.pause();
    gsap.set(cursor, { rotation: 0 });

    if (cursorColorOnTarget) {
      gsap.to(corners, { borderColor: cursorColorOnTarget, duration: 0.15, ease: 'power2.out' });
      gsap.to(dot, { backgroundColor: cursorColorOnTarget, duration: 0.15, ease: 'power2.out' });
    }

    const rect = target.getBoundingClientRect();
    const { borderWidth, cornerSize } = constants;
    const { x: offsetX, y: offsetY } = getOffset();
    const cursorX = gsap.getProperty(cursor, 'x');
    const cursorY = gsap.getProperty(cursor, 'y');

    targetCornerPositions = [
      { x: rect.left - borderWidth - offsetX, y: rect.top - borderWidth - offsetY },
      { x: rect.right + borderWidth - cornerSize - offsetX, y: rect.top - borderWidth - offsetY },
      { x: rect.right + borderWidth - cornerSize - offsetX, y: rect.bottom + borderWidth - cornerSize - offsetY },
      { x: rect.left - borderWidth - offsetX, y: rect.bottom + borderWidth - cornerSize - offsetY }
    ];

    gsap.ticker.add(tickerFn);
    gsap.to(activeStrength, { current: 1, duration: hoverDuration, ease: 'power2.out' });

    corners.forEach((corner, i) => {
      gsap.to(corner, {
        x: targetCornerPositions[i].x - cursorX,
        y: targetCornerPositions[i].y - cursorY,
        duration: 0.2,
        ease: 'power2.out'
      });
    });

    const leaveHandler = () => {
      gsap.ticker.remove(tickerFn);
      targetCornerPositions = null;
      gsap.set(activeStrength, { current: 0, overwrite: true });
      activeTarget = null;

      if (cursorColorOnTarget) {
        gsap.to(corners, { borderColor: cursorColor, duration: 0.15, ease: 'power2.out' });
        gsap.to(dot, { backgroundColor: cursorColor, duration: 0.15, ease: 'power2.out' });
      }

      gsap.killTweensOf(corners, 'x,y');
      const { cornerSize } = constants;
      const positions = [
        { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
        { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
        { x: cornerSize * 0.5, y: cornerSize * 0.5 },
        { x: -cornerSize * 1.5, y: cornerSize * 0.5 }
      ];
      const tl = gsap.timeline();
      corners.forEach((corner, index) => {
        tl.to(corner, { x: positions[index].x, y: positions[index].y, duration: 0.3, ease: 'power3.out' }, 0);
      });

      resumeTimeout = setTimeout(() => {
        if (!activeTarget && spinTl) {
          const currentRotation = gsap.getProperty(cursor, 'rotation');
          const normalizedRotation = currentRotation % 360;
          spinTl.kill();
          spinTl = gsap
            .timeline({ repeat: -1 })
            .to(cursor, { rotation: '+=360', duration: spinDuration, ease: 'none' });
          gsap.to(cursor, {
            rotation: normalizedRotation + 360,
            duration: spinDuration * (1 - normalizedRotation / 360),
            ease: 'none',
            onComplete: () => spinTl?.restart()
          });
        }
        resumeTimeout = null;
      }, 50);

      cleanupTarget(target);
    };

    currentLeaveHandler = leaveHandler;
    target.addEventListener('mouseleave', leaveHandler);
  };

  const resizeHandler = () => {
    containingBlock = getContainingBlock(cursor);
  };

  // gsap.ticker already sleeps while the tab is hidden; nothing else to pause.
  window.addEventListener('mousemove', moveHandler);
  window.addEventListener('scroll', scrollHandler, { passive: true });
  window.addEventListener('mousedown', mouseDownHandler);
  window.addEventListener('mouseup', mouseUpHandler);
  window.addEventListener('mouseover', enterHandler, { passive: true });
  window.addEventListener('resize', resizeHandler);

  return {
    destroy() {
      gsap.ticker.remove(tickerFn);
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('mousedown', mouseDownHandler);
      window.removeEventListener('mouseup', mouseUpHandler);
      window.removeEventListener('mouseover', enterHandler);
      window.removeEventListener('resize', resizeHandler);
      if (resumeTimeout) clearTimeout(resumeTimeout);
      if (activeTarget) cleanupTarget(activeTarget);
      spinTl?.kill();
      gsap.killTweensOf([cursor, dot, ...corners, activeStrength]);
      document.body.style.cursor = originalCursor;
      cursor.remove();
    }
  };
}
