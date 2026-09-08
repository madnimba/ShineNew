/* =========================================================
   SHINE DIGITAL — main.js
   Vanilla JS. No dependencies.
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none)').matches;
  var lerp = function (a, b, n) { return a + (b - a) * n; };
  var clamp = function (v, a, b) { return Math.min(Math.max(v, a), b); };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------
     1. PRELOADER
     --------------------------------------------------------- */
  (function loader() {
    var el = $('#loader'), bar = $('#loaderBar'), num = $('#loaderNum');
    if (!el) return;
    var p = 0, done = false;

    var tick = setInterval(function () {
      p += Math.random() * 14 + 4;
      if (p >= 96) p = 96;
      paint(p);
    }, 130);

    function paint(v) {
      if (bar) bar.style.width = v + '%';
      if (num) num.textContent = Math.round(v);
    }

    function finish() {
      if (done) return;
      done = true;
      clearInterval(tick);
      paint(100);
      setTimeout(function () {
        el.classList.add('is-done');
        document.body.classList.remove('is-locked');
        startHero();
      }, 420);
    }

    document.body.classList.add('is-locked');
    window.addEventListener('load', function () { setTimeout(finish, 380); });
    setTimeout(finish, 4200); // hard safety net
  })();

  function startHero() {
    $$('.hero__title .line').forEach(function (l, i) {
      setTimeout(function () { l.classList.add('is-in'); }, i * 130);
    });
    $$('.hero .reveal').forEach(function (r, i) {
      setTimeout(function () { r.classList.add('is-in'); }, 350 + i * 130);
    });
    runCounters($('.hero__stats'));
  }

  /* ---------------------------------------------------------
     2. SPLIT TEXT INTO CHARACTERS
     --------------------------------------------------------- */
  $$('[data-split]').forEach(function (node) {
    var text = node.textContent;
    node.textContent = '';
    var frag = document.createDocumentFragment();
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      var s = document.createElement('span');
      s.className = 'char';
      s.style.animationDelay = (i * 0.032) + 's';
      s.textContent = ch === ' ' ? String.fromCharCode(160) : ch;
      frag.appendChild(s);
    }
    node.appendChild(frag);
  });

  /* ---------------------------------------------------------
     3. CUSTOM CURSOR + SPOTLIGHT
     --------------------------------------------------------- */
  (function cursor() {
    var spot = $('#spotlight');
    var cur = $('#cursor');
    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var cx = mx, cy = my, rx = mx, ry = my;

    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (spot) {
        spot.style.setProperty('--mx', mx + 'px');
        spot.style.setProperty('--my', my + 'px');
      }
      if (cur && !isTouch) cur.classList.add('is-on');
    }, { passive: true });

    if (!cur || isTouch || reduced) return;
    var dot = $('.cursor__dot', cur), ring = $('.cursor__ring', cur), label = $('.cursor__label', cur);

    (function raf() {
      cx = lerp(cx, mx, 0.9); cy = lerp(cy, my, 0.9);
      rx = lerp(rx, mx, 0.16); ry = lerp(ry, my, 0.16);
      dot.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      label.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      requestAnimationFrame(raf);
    })();

    var hoverSel = 'a,button,[data-cursor],.svc__head,.card,.step,.quote';
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest(hoverSel);
      if (!t) return;
      cur.classList.add('is-hover');
      label.textContent = t.getAttribute('data-cursor') || '';
    });
    document.addEventListener('pointerout', function (e) {
      if (!e.target.closest || !e.target.closest(hoverSel)) return;
      cur.classList.remove('is-hover');
      label.textContent = '';
    });
    document.addEventListener('pointerdown', function () { cur.classList.add('is-hover'); });
  })();

  /* ---------------------------------------------------------
     4. NAV: sticky, auto-hide, mobile menu
     --------------------------------------------------------- */
  (function nav() {
    var nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
    var last = 0;

    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      nav.classList.toggle('is-stuck', y > 40);
      if (!menu.classList.contains('is-open')) {
        nav.classList.toggle('is-hidden', y > last && y > 340);
      }
      last = y;
    }, { passive: true });

    function toggle(open) {
      menu.classList.toggle('is-open', open);
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('is-locked', open);
    }
    burger.addEventListener('click', function () { toggle(!menu.classList.contains('is-open')); });
    $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { toggle(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) toggle(false);
    });
  })();

  /* ---------------------------------------------------------
     5. SCROLL REVEALS
     --------------------------------------------------------- */
  (function reveals() {
    var items = $$('.reveal, .reveal-up');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        if (en.target.classList.contains('contact__title') ||
            en.target.classList.contains('split')) {
          (en.target.closest('.contact__title') || en.target).classList.add('is-in');
        }
        io.unobserve(en.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (i) { if (!i.closest('.hero')) io.observe(i); });

    // headline reveals outside the hero
    $$('.contact__title .line').forEach(function (s, i) {
      var o = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        setTimeout(function () { s.classList.add('is-in'); }, i * 120);
        o.disconnect();
      }, { threshold: 0.3 });
      o.observe(s);
    });
  })();

  /* ---------------------------------------------------------
     6. COUNTERS
     --------------------------------------------------------- */
  function runCounters(scope) {
    $$('[data-count]', scope || document).forEach(function (el) {
      if (el.dataset.done) return;
      el.dataset.done = '1';
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var dur = 1800, t0 = performance.now();
      (function step(t) {
        var p = clamp((t - t0) / dur, 0, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  /* ---------------------------------------------------------
     7. MANIFESTO — word-by-word illumination on scroll
     --------------------------------------------------------- */
  var manifestoWords = [];
  var manifestoEl = null;
  (function manifesto() {
    var el = $('[data-scrub]');
    if (!el) return;
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      manifestoWords.push(s);
    });
    manifestoEl = el;
  })();

  function paintManifesto() {
    if (!manifestoEl || !manifestoWords.length) return;
    var r = manifestoEl.getBoundingClientRect();
    var vh = window.innerHeight;
    // progress: 0 when the block enters the lower third, 1 when it leaves the upper third
    var p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.35), 0, 1);
    var head = p * manifestoWords.length;
    for (var i = 0; i < manifestoWords.length; i++) {
      var w = manifestoWords[i];
      var on = i < head;
      w.classList.toggle('on', on);
      w.classList.toggle('hot', on && i > head - 3);
    }
  }

  /* ---------------------------------------------------------
     8. SERVICES ACCORDION
     --------------------------------------------------------- */
  (function services() {
    var rows = $$('.svc__row');
    rows.forEach(function (row, i) {
      var head = $('.svc__head', row);
      head.addEventListener('click', function () {
        var open = row.classList.contains('is-open');
        rows.forEach(function (r) {
          r.classList.remove('is-open');
          $('.svc__head', r).setAttribute('aria-expanded', 'false');
        });
        if (!open) {
          row.classList.add('is-open');
          head.setAttribute('aria-expanded', 'true');
        }
      });
      // stagger the rows in
      row.style.transitionDelay = (i * 0.05) + 's';
    });
    if (rows[0] && window.innerWidth > 900) {
      rows[0].classList.add('is-open');
      $('.svc__head', rows[0]).setAttribute('aria-expanded', 'true');
    }
  })();

  /* ---------------------------------------------------------
     9. APPROACH — horizontal scroll driven by page scroll
     --------------------------------------------------------- */
  function paintApproach() {
    var sec = $('#approach'), track = $('#approachTrack'), bar = $('#approachBar');
    if (!sec || !track) return;
    if (window.innerWidth <= 900) { // native swipe rail on mobile
      if (bar) {
        var max = track.scrollWidth - track.clientWidth;
        bar.style.width = (max > 0 ? (track.scrollLeft / max) * 100 : 0) + '%';
      }
      return;
    }
    var r = sec.getBoundingClientRect();
    var total = sec.offsetHeight - window.innerHeight;
    var p = clamp(-r.top / (total || 1), 0, 1);
    var dist = track.scrollWidth - window.innerWidth + 40;
    track.style.transform = 'translate3d(' + (-p * Math.max(dist, 0)) + 'px,0,0)';
    if (bar) bar.style.width = (p * 100) + '%';
  }
  // The section is exactly as tall as the horizontal distance it has to travel,
  // so the sideways pace always matches the scroll wheel.
  function sizeApproach() {
    var sec = $('#approach'), track = $('#approachTrack');
    if (!sec || !track) return;
    if (window.innerWidth <= 900) { sec.style.height = ''; track.style.transform = ''; return; }
    var dist = Math.max(track.scrollWidth - window.innerWidth + 40, 0);
    sec.style.height = (window.innerHeight + dist * 1.15) + 'px';
  }
  (function approachRail() {
    var track = $('#approachTrack');
    if (track) track.addEventListener('scroll', paintApproach, { passive: true });
    window.addEventListener('resize', function () { sizeApproach(); paintApproach(); });
    window.addEventListener('load', function () { sizeApproach(); paintApproach(); });
    sizeApproach();
  })();

  /* ---------------------------------------------------------
     10. PROGRESS BAR + scroll loop
     --------------------------------------------------------- */
  (function scrollLoop() {
    var bar = $('#progressBar');
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        if (bar) bar.style.width = clamp(window.scrollY / (h || 1), 0, 1) * 100 + '%';
        paintManifesto();
        paintApproach();
        parallax();
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  })();

  /* ---------------------------------------------------------
     11. PARALLAX / ZOOM ON SCROLL
     --------------------------------------------------------- */
  function parallax() {
    if (reduced) return;
    var vh = window.innerHeight;

    var founder = $('#founderImg');
    if (founder) {
      var fr = founder.getBoundingClientRect();
      if (fr.bottom > 0 && fr.top < vh) {
        var fp = (vh - fr.top) / (vh + fr.height); // 0..1
        founder.style.transform = 'scale(' + (1.02 + fp * 0.09) + ') translateY(' + ((fp - 0.5) * -22) + 'px)';
      }
    }

    var band = $('#tagband'), bandTitle = $('#tagbandTitle');
    if (band && bandTitle) {
      var br = band.getBoundingClientRect();
      if (br.bottom > 0 && br.top < vh) {
        // 0 -> 1 across the pinned run; zooms in, holds, then eases back out
        var bp = clamp(-br.top / Math.max(band.offsetHeight - vh, 1), 0, 1);
        var curve = Math.sin(bp * Math.PI); // 0 at both ends, 1 in the middle
        bandTitle.style.transform = 'scale(' + (0.72 + curve * 0.42) + ')';
        bandTitle.style.opacity = 0.25 + curve * 0.75;
      }
    }

    var word = $('.foot__word span');
    if (word) {
      var wr = word.getBoundingClientRect();
      if (wr.bottom > 0 && wr.top < vh) {
        var wp = clamp((vh - wr.top) / vh, 0, 1);
        word.style.transform = 'scale(' + (0.9 + wp * 0.12) + ')';
        word.style.opacity = 0.35 + wp * 0.65;
      }
    }

    var hero = $('.hero__inner');
    if (hero && window.scrollY < vh * 1.2) {
      var hp = window.scrollY / vh;
      hero.style.transform = 'translateY(' + (hp * 60) + 'px) scale(' + (1 - hp * 0.06) + ')';
      hero.style.opacity = clamp(1 - hp * 1.25, 0, 1);
    }
  }

  /* ---------------------------------------------------------
     12. MAGNETIC BUTTONS + CARD TILT
     --------------------------------------------------------- */
  if (!isTouch && !reduced) {
    $$('.magnetic').forEach(function (el) {
      var raf, tx = 0, ty = 0, cx = 0, cy = 0;
      function loop() {
        cx = lerp(cx, tx, 0.18); cy = lerp(cy, ty, 0.18);
        el.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
        if (Math.abs(cx - tx) > 0.1 || Math.abs(cy - ty) > 0.1) raf = requestAnimationFrame(loop);
      }
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width / 2)) * 0.32;
        ty = (e.clientY - (r.top + r.height / 2)) * 0.42;
        cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
      });
      el.addEventListener('pointerleave', function () {
        tx = 0; ty = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
      });
    });

    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateX(' + (-py * 6) + 'deg) rotateY(' + (px * 8) +
          'deg) translateY(-6px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------
     13. HERO CANVAS — particle constellation
     --------------------------------------------------------- */
  (function heroCanvas() {
    var cv = $('#heroCanvas');
    if (!cv || reduced) return;
    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, parts = [], mouse = { x: -999, y: -999 }, visible = true, raf;

    function size() {
      var r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }
    function build() {
      var density = w < 700 ? 16000 : 11000;
      var count = clamp(Math.round((w * h) / density), 22, 110);
      parts = [];
      for (var i = 0; i < count; i++) {
        parts.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
          r: Math.random() * 1.6 + 0.5,
          a: Math.random() * 0.5 + 0.25
        });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      var linkDist = w < 700 ? 92 : 128;

      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;

        // gentle push away from the pointer
        var dx = p.x - mouse.x, dy = p.y - mouse.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 20000) {
          var f = (20000 - d2) / 20000;
          p.x += dx * f * 0.03; p.y += dy * f * 0.03;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fillStyle = 'rgba(255,194,68,' + p.a + ')';
        ctx.fill();

        for (var j = i + 1; j < parts.length; j++) {
          var q = parts[j];
          var ax = p.x - q.x, ay = p.y - q.y;
          var dist = Math.sqrt(ax * ax + ay * ay);
          if (dist < linkDist) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = 'rgba(255,194,68,' + (0.16 * (1 - dist / linkDist)) + ')';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      if (visible) raf = requestAnimationFrame(draw);
    }

    window.addEventListener('pointermove', function (e) {
      var r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });

    var io = new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
      else cancelAnimationFrame(raf);
    }, { threshold: 0.02 });
    io.observe(cv);

    window.addEventListener('resize', size);
    size(); draw();
  })();

  /* ---------------------------------------------------------
     14. CONTACT FORM
     Swap the mailto handoff for your own endpoint when ready:
     fetch('/api/contact', { method:'POST', body:new FormData(form) })
     --------------------------------------------------------- */
  (function form() {
    var form = $('#contactForm'), msg = $('#formMsg');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ['f-name', 'f-email', 'f-message'].forEach(function (id) {
        var input = document.getElementById(id);
        var valid = input.value.trim() !== '' &&
          (id !== 'f-email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()));
        input.parentElement.classList.toggle('has-error', !valid);
        if (!valid) ok = false;
      });
      if (!ok) { msg.textContent = 'Please complete the highlighted fields.'; return; }

      var d = new FormData(form);
      var body = 'Name: ' + d.get('name') +
        '\nEmail: ' + d.get('email') +
        '\nCompany: ' + (d.get('company') || '—') +
        '\nService: ' + (d.get('service') || '—') +
        '\n\n' + d.get('message');

      msg.textContent = 'Opening your email app — we reply within one business day.';
      window.location.href = 'mailto:hello@shinedigital.com.bd?subject=' +
        encodeURIComponent('New enquiry — ' + d.get('name')) +
        '&body=' + encodeURIComponent(body);
    });

    $$('.field input, .field textarea').forEach(function (i) {
      i.addEventListener('input', function () { i.parentElement.classList.remove('has-error'); });
    });
  })();

  /* ---------------------------------------------------------
     15. COPY-TO-CLIPBOARD on the email
     --------------------------------------------------------- */
  $$('.copy').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (!navigator.clipboard) return; // fall through to mailto
      e.preventDefault();
      navigator.clipboard.writeText(el.getAttribute('data-copy')).then(function () {
        var old = el.textContent;
        el.textContent = 'Copied to clipboard';
        setTimeout(function () { el.textContent = old; }, 1400);
      });
    });
  });

  /* ---------------------------------------------------------
     16. MISC
     --------------------------------------------------------- */
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
})();
