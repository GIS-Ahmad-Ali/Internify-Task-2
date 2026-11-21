document.addEventListener('DOMContentLoaded', () => {
  const billingToggle = document.getElementById('billingToggle');
  const monthlyLabel = document.getElementById('monthlyLabel');
  const yearlyLabel = document.getElementById('yearlyLabel');
  const amountEls = document.querySelectorAll('.amount');
  const billingNoteEls = document.querySelectorAll('.billing-note');

  const filterBtns = document.querySelectorAll('.filter-btn');
  const priceCards = document.querySelectorAll('.price-card');

  const planBtns = document.querySelectorAll('.plan-btn');
  const selectionToast = document.getElementById('selectionToast');
  const toastMessage = document.getElementById('toastMessage');
  const closeToast = document.getElementById('closeToast');

  let isYearly = false;
  let toastTimer = null;
  let hoveredTier = null;

  /* ============================================================
     1. MONTHLY / YEARLY PRICE TOGGLE
     ============================================================ */
  billingToggle.addEventListener('click', () => {
    isYearly = !isYearly;
    billingToggle.classList.toggle('yearly', isYearly);
    billingToggle.setAttribute('aria-checked', String(isYearly));
    document.body.classList.toggle('yearly-active', isYearly);

    monthlyLabel.classList.toggle('active', !isYearly);
    yearlyLabel.classList.toggle('active', isYearly);

    amountEls.forEach((el) => {
      el.classList.add('price-flash');
      setTimeout(() => {
        el.textContent = isYearly ? el.dataset.yearly : el.dataset.monthly;
        el.classList.remove('price-flash');
      }, 140);
    });

    billingNoteEls.forEach((note) => {
      note.textContent = isYearly ? 'Billed annually (20% off)' : 'Billed monthly';
    });
  });

  /* ============================================================
     2. CATEGORY FILTER BUTTONS (ALL / BASIC / PREMIUM)
     ============================================================ */
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const selectedCategory = btn.dataset.filter;

      priceCards.forEach((card) => {
        const cardCategory = card.dataset.category;
        if (selectedCategory === 'all' || cardCategory === selectedCategory) {
          card.classList.remove('is-hidden');
        } else {
          card.classList.add('is-hidden');
        }
      });
    });
  });

  /* ============================================================
     3. INTERACTIVE PLAN BUTTON CONFIRMATION TOAST + HOVER SYNC
     ============================================================ */
  priceCards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      hoveredTier = card.dataset.category;
    });
    card.addEventListener('mouseleave', () => {
      hoveredTier = null;
    });
  });

  planBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const planName = btn.dataset.plan;
      const cycleText = isYearly ? 'Yearly' : 'Monthly';
      toastMessage.textContent = `Selected "${planName}" (${cycleText} Billing).`;
      selectionToast.classList.add('show');

      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        selectionToast.classList.remove('show');
      }, 4000);
    });
  });

  if (closeToast) {
    closeToast.addEventListener('click', () => {
      selectionToast.classList.remove('show');
    });
  }

  /* ============================================================
     4. INTERACTIVE GIS ANNUAL ORBIT & SATELLITE SWATH BACKGROUND
        - Displays a diagonal orbital track & moving sensor satellite
        - Lights up 12 Annual Month Nodes when Yearly Plan is active
     ============================================================ */
  const canvas = document.getElementById('gisAnnualCanvas');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let satProgress = 0.18;
    let yearBlend = 0; // Smooth transition 0 (Monthly) -> 1 (Yearly)

    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Quadratic Bezier point & tangent helper for orbital path
    function getOrbitPoint(t) {
      const p0 = { x: -80, y: height * 0.78 };
      const p1 = { x: width * 0.48, y: height * 0.12 };
      const p2 = { x: width + 80, y: height * 0.42 };

      const u = 1 - t;
      const x = u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x;
      const y = u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y;

      const dx = 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
      const dy = 2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
      const angle = Math.atan2(dy, dx);

      return { x, y, angle, p0, p1, p2 };
    }

    function drawSatelliteIcon(x, y, angle, isAnnualBoost) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Sensor Swath Cone scanning downward toward map
      const swathLen = isAnnualBoost ? 145 : 105;
      const swathHalfW = isAnnualBoost ? 58 : 40;
      const grad = ctx.createLinearGradient(0, 0, 0, swathLen);
      if (isAnnualBoost) {
        grad.addColorStop(0, 'rgba(200, 90, 50, 0.28)');
        grad.addColorStop(1, 'rgba(200, 90, 50, 0.0)');
      } else {
        grad.addColorStop(0, 'rgba(22, 43, 77, 0.22)');
        grad.addColorStop(1, 'rgba(22, 43, 77, 0.0)');
      }

      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(-swathHalfW, swathLen);
      ctx.lineTo(swathHalfW, swathLen);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Solar Array Wings
      ctx.fillStyle = isAnnualBoost ? '#C85A32' : '#162B4D';
      ctx.fillRect(-22, -4, 15, 8);
      ctx.fillRect(7, -4, 15, 8);

      // Solar Panel Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(-22, -4, 15, 8);
      ctx.strokeRect(7, -4, 15, 8);

      // Satellite Core Bus
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = isAnnualBoost ? '#C85A32' : '#162B4D';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(-5, -6, 10, 12, 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    function renderOrbitLoop() {
      ctx.clearRect(0, 0, width, height);

      const targetBlend = isYearly || hoveredTier === 'premium' ? 1 : 0;
      yearBlend += (targetBlend - yearBlend) * 0.06;

      const sample = getOrbitPoint(satProgress);

      // 1. Subtle Latitude / Longitude Graticule Lines
      ctx.save();
      ctx.strokeStyle = 'rgba(22, 43, 77, 0.055)';
      ctx.lineWidth = 1;
      const step = 130;
      for (let gx = step; gx < width; gx += step) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = step; gy < height; gy += step) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Primary Orbital Ground-Track Curve
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(sample.p0.x, sample.p0.y);
      ctx.quadraticCurveTo(sample.p1.x, sample.p1.y, sample.p2.x, sample.p2.y);
      ctx.setLineDash([7, 7]);
      ctx.lineWidth = 1.6 + yearBlend * 0.5;
      ctx.strokeStyle =
        yearBlend > 0.5
          ? `rgba(200, 90, 50, ${0.24 + yearBlend * 0.14})`
          : 'rgba(22, 43, 77, 0.22)';
      ctx.stroke();
      ctx.restore();

      // 3. 12-Month Annual Cycle Nodes along the Orbit (Jan -> Dec)
      for (let m = 1; m <= 12; m++) {
        const tNode = m / 13;
        const pt = getOrbitPoint(tNode);
        const isPassed = satProgress >= tNode;
        const nodeRadius = isYearly ? (isPassed ? 4.5 : 3.4) : 2.4;

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, nodeRadius, 0, Math.PI * 2);

        if (isYearly) {
          ctx.fillStyle = isPassed ? '#C85A32' : 'rgba(200, 90, 50, 0.35)';
          ctx.fill();
          if (isPassed) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200, 90, 50, 0.14)';
            ctx.fill();
          }
        } else {
          ctx.fillStyle = 'rgba(22, 43, 77, 0.25)';
          ctx.fill();
        }
      }

      // 4. Advance & Render Earth-Observation Satellite
      const speed = isYearly ? 0.00145 : 0.00085;
      satProgress += speed;
      if (satProgress > 1.06) satProgress = -0.06;

      drawSatelliteIcon(sample.x, sample.y, sample.angle, yearBlend > 0.45);

      requestAnimationFrame(renderOrbitLoop);
    }

    renderOrbitLoop();
  }
});