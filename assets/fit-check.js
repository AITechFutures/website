/* Monitoring fit check: step-by-step questions, scoring, result and lead capture.
   Submissions go to Netlify Forms (form name "fit-check") on the live site only.
   Scores live on each option as data-need / data-fit / data-momentum (0–3). */
(function () {
  var form = document.getElementById('fc');
  if (!form) return;
  var result = document.getElementById('fc-result');
  var steps = [].slice.call(form.querySelectorAll('.fc-step'));
  var bar = form.querySelector('.fc-progress span');
  var count = form.querySelector('.fc-count');
  var err = form.querySelector('.fc-error');
  var btnBack = form.querySelector('.fc-back');
  var btnNext = form.querySelector('.fc-next');
  var btnSkip = form.querySelector('.fc-skip');
  var questions = steps.filter(function (s) { return !s.hasAttribute('data-optional'); }).length;
  var i = 0;

  // Only send submissions from the live site (or a Netlify deploy preview), not from the GitHub Pages or local preview.
  var host = location.hostname;
  var LIVE = /(^|\.)aitechfutures\.com$/.test(host) || /\.netlify\.app$/.test(host);

  form.classList.add('is-js');

  function val(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
  function vals(name) { return [].map.call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (e) { return e.value; }); }

  function show(n, focus) {
    i = n;
    steps.forEach(function (s, k) { s.classList.toggle('is-current', k === i); });
    var onContact = steps[i].hasAttribute('data-optional');
    form.classList.toggle('on-contact', onContact);
    form.classList.toggle('on-first', i === 0);
    count.textContent = onContact ? 'Last step · optional' : 'Question ' + (i + 1) + ' of ' + questions;
    bar.style.width = Math.round((i / questions) * 100) + '%';
    err.textContent = '';
    if (focus) {
      var lg = steps[i].querySelector('legend');
      lg.setAttribute('tabindex', '-1');
      var top = form.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.4) form.scrollIntoView({ block: 'start' });
      lg.focus({ preventScroll: true });
    }
  }

  function answered(s) {
    if (s.hasAttribute('data-optional')) return true;
    return !!s.querySelector('input:checked');
  }

  function next() {
    if (!answered(steps[i])) {
      err.textContent = steps[i].hasAttribute('data-multi') ? 'Please choose at least one option.' : 'Please choose an option to continue.';
      return;
    }
    if (i < steps.length - 1) show(i + 1, true);
  }

  btnNext.addEventListener('click', next);
  btnBack.addEventListener('click', function () { if (i > 0) show(i - 1, true); });

  // Single-choice questions move on automatically after a mouse or touch selection (not keyboard arrows).
  var lastPointer = 0, timer;
  form.addEventListener('pointerdown', function () { lastPointer = Date.now(); });
  form.addEventListener('change', function (e) {
    if (e.target.type === 'radio' && Date.now() - lastPointer < 1500) { clearTimeout(timer); timer = setTimeout(next, 220); }
  });

  // Multi-select rules: "paper or spreadsheets" is exclusive; data-max caps selections.
  form.addEventListener('change', function (e) {
    var t = e.target;
    if (t.type !== 'checkbox') return;
    var s = t.closest('.fc-step');
    if (!s || !s.hasAttribute('data-multi')) return;
    var boxes = [].slice.call(s.querySelectorAll('input[type=checkbox]'));
    if (t.checked && t.hasAttribute('data-exclusive')) boxes.forEach(function (b) { if (b !== t) b.checked = false; });
    else if (t.checked) boxes.forEach(function (b) { if (b.hasAttribute('data-exclusive')) b.checked = false; });
    var max = +s.getAttribute('data-max');
    if (max) {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      boxes.forEach(function (b) { b.disabled = !b.checked && n >= max; });
    }
    err.textContent = '';
  });

  // Enter in a text field should not submit the form early.
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'submit' && !steps[i].hasAttribute('data-optional')) { e.preventDefault(); next(); }
  });

  /* ---------- scoring ---------- */
  function score() {
    var s = { need: 0, fit: 0, momentum: 0 }, max = { need: 0, fit: 0, momentum: 0 };
    steps.forEach(function (st) {
      Object.keys(s).forEach(function (d) {
        var opts = st.querySelectorAll('input[data-' + d + ']');
        if (!opts.length) return;
        max[d] += Math.max.apply(null, [].map.call(opts, function (o) { return +o.getAttribute('data-' + d); }));
        var c = st.querySelector('input[data-' + d + ']:checked');
        if (c) s[d] += +c.getAttribute('data-' + d);
      });
    });
    var pct = {};
    Object.keys(s).forEach(function (d) { pct[d] = Math.round(100 * s[d] / max[d]); });
    pct.total = Math.round(100 * (s.need + s.fit + s.momentum) / (max.need + max.fit + max.momentum));
    var tier;
    if (pct.total >= 70 && pct.need >= 55 && pct.momentum >= 55) tier = 'strong';
    else if (pct.total >= 45 && pct.need >= 34) tier = 'promising';
    else tier = 'early';
    pct.tier = tier;
    return pct;
  }

  var TIERS = {
    strong: {
      label: 'Result · Strong candidate',
      h: 'A strong candidate for a pilot.',
      p: 'Your answers point to a clear need, the right kind of equipment and the momentum to act. The best next step is a short call to pick one or two critical machines and agree what a low-disruption pilot would measure.',
      book: 'Book a call to discuss a pilot', cta: 'Email us your result', bookFirst: true
    },
    promising: {
      label: 'Result · Worth a conversation',
      h: 'There’s a real opportunity here.',
      p: 'There are good reasons to look at monitoring, and a few things worth firming up first: usually which machines matter most and who will own the result. A short conversation can help you scope it, with no commitment.',
      book: 'Book a call', cta: 'Email us your result', bookFirst: true
    },
    early: {
      label: 'Result · Not yet',
      h: 'Probably not the right time yet, and that’s useful to know.',
      p: 'From your answers, continuous monitoring may not pay its way just now. The steps below will put you in a stronger position, and we’re happy to talk if your situation changes.',
      book: 'Book a call', cta: 'Ask us a question', bookFirst: false
    }
  };

  function recs() {
    var r = [];
    var approach = val('approach'), impact = val('impact'), net = val('network'), data = val('data');
    var owner = val('owner'), pilot = val('pilot'), sys = vals('systems'), out = vals('outcomes');
    if (approach === 'Mostly reactive') r.push(['Start with your most critical machines', 'List the five machines whose failure would hurt most. That is where monitoring earns its place first, and where a pilot should start.']);
    if (approach === 'Planned') r.push(['Test your service intervals against real condition', 'Condition data can show where time-based tasks come too early or too late for a particular machine.']);
    if (approach === 'Some condition monitoring') r.push(['Cover the gaps between inspection rounds', 'Continuous sensing on your most critical machines can show what happens between handheld checks and surveys.']);
    if (approach === 'Continuous monitoring on most critical assets') r.push(['Build on what already works', 'Where existing monitoring does its job, we would look first at the machines it doesn’t cover, rather than replacing it.']);
    if (impact === 'Not sure') r.push(['Put a rough figure on downtime', 'Even an approximate cost per hour helps you rank machines and build the internal case for any monitoring investment.']);
    if (net && net !== 'Reliable wired or wireless network') r.push(['Connectivity needn’t be a blocker', 'The platform processes high-rate signals at the sensor, and connectivity is matched to the site rather than relying on your existing network.']);
    if (data === 'Must stay on site') r.push(['Keep your data on site', 'The platform processes and stores data on site by default. What leaves site, if anything, is your decision.']);
    if (sys.indexOf('Mainly paper or spreadsheets') > -1) r.push(['Keep a simple failure log', 'A record of what failed, when and why makes any monitoring far more useful over time. A shared spreadsheet is a good start.']);
    if (owner === 'An engineer or individual exploring options' || owner === 'Just researching') r.push(['Find a sponsor with operational responsibility', 'Pilots succeed when someone who owns uptime also owns the outcome. A short summary of downtime cost and frequency helps make the case.']);
    if (out.indexOf('Environmental monitoring') > -1) r.push(['Environmental monitoring is a quick start', 'Our first deployment monitored environmental conditions across seven locations in a single facility, installed in one day.']);
    if (pilot === 'Yes' || pilot === 'Possibly, depending on scope') r.push(['Start small and measurable', 'A pilot can begin with sensing, local dashboards and threshold alerts on one or two machines, all available now.']);
    if (!r.length) r.push(['Revisit when things change', 'A rise in breakdowns, a new line or a change in maintenance staffing are good moments to look at monitoring again.']);
    return r.slice(0, 4);
  }

  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function payload(withContact) {
    var p = new URLSearchParams(), seen = {};
    [].forEach.call(form.elements, function (el) {
      if (!el.name || seen[el.name]) return;
      seen[el.name] = 1;
      var v;
      if (el.type === 'radio') v = val(el.name);
      else if (el.type === 'checkbox') v = vals(el.name).join('; ');
      else v = el.value;
      if (!withContact && /^(name|email|company|role|phone|message|updates)$/.test(el.name)) v = '';
      p.append(el.name, v);
    });
    return p.toString();
  }

  function mailto(sc, t) {
    var lines = [
      'Hello ATF,', '',
      'I completed the monitoring fit check and would like to discuss the result.', '',
      'Result: ' + t.label.replace('Result · ', ''),
      'Sector: ' + val('sector'),
      'Critical machines: ' + val('assets'),
      'Maintenance today: ' + val('approach'),
      'Unplanned downtime: ' + val('frequency'),
      'Cost per hour: ' + val('impact'),
      'Timing: ' + val('timing'), ''
    ];
    return 'mailto:hello@aitechfutures.com?subject=' + encodeURIComponent('Fit check: ' + t.label.replace('Result · ', '')) + '&body=' + encodeURIComponent(lines.join('\n'));
  }

  function render(sc, sentMsg) {
    var t = TIERS[sc.tier];
    document.getElementById('fc-r-tier').textContent = t.label;
    document.getElementById('fc-r-h').textContent = t.h;
    document.getElementById('fc-r-p').textContent = t.p;
    document.getElementById('fc-r-sent').textContent = sentMsg || '';
    document.getElementById('fc-r-recs').innerHTML = recs().map(function (x) { return '<li><h3>' + esc(x[0]) + '</h3><p>' + esc(x[1]) + '</p></li>'; }).join('');
    var cta = document.getElementById('fc-r-cta');
    cta.textContent = t.cta;
    cta.href = mailto(sc, t);
    // Booking link leads for stronger results; email leads for "Not yet".
    var book = document.getElementById('fc-r-book');
    book.textContent = t.book;
    book.className = 'btn ' + (t.bookFirst ? 'btn-primary' : 'btn-secondary');
    cta.className = 'btn ' + (t.bookFirst ? 'btn-secondary' : 'btn-primary');
    if (t.bookFirst) book.parentNode.insertBefore(book, cta); else book.parentNode.insertBefore(cta, book);
    form.hidden = true;
    result.hidden = false;
    result.scrollIntoView({ block: 'start' });
    result.focus({ preventScroll: true });
    ['need', 'fit', 'momentum'].forEach(function (d) {
      var m = result.querySelector('[data-dim="' + d + '"]');
      m.querySelector('.v').textContent = sc[d] + '%';
      m.querySelector('.bar').setAttribute('role', 'img');
      m.querySelector('.bar').setAttribute('aria-label', sc[d] + ' per cent');
      requestAnimationFrame(function () { m.querySelector('.bar span').style.width = sc[d] + '%'; });
    });
  }

  function finish(withContact) {
    var sc = score();
    form.score_need.value = sc.need;
    form.score_fit.value = sc.fit;
    form.score_momentum.value = sc.momentum;
    form.score_total.value = sc.total;
    form.result_tier.value = sc.tier;
    form.lead_type.value = withContact ? 'Contact' : 'Anonymous';

    var thanks = withContact ? 'Thank you. Your details have reached the ATF team and we’ll be in touch.' : '';
    if (!LIVE) { render(sc, 'Preview only: answers are not sent from this copy of the site.'); return; }
    form.classList.add('is-busy');
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: payload(withContact) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); render(sc, thanks); })
      .catch(function () { render(sc, withContact ? 'We couldn’t send your details just now. Please use the button below to email us instead.' : ''); })
      .then(function () { form.classList.remove('is-busy'); });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var need = ['name', 'email', 'company'], bad = null;
    need.forEach(function (n) {
      var f = form.elements[n], ok = f.value.trim() && (n !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()));
      f.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok && !bad) bad = f;
    });
    if (bad) {
      err.textContent = 'Please add your name, a valid work email and your company, or skip to see your result.';
      bad.focus();
      return;
    }
    finish(true);
  });
  btnSkip.addEventListener('click', function () { finish(false); });

  document.getElementById('fc-r-restart').addEventListener('click', function () {
    form.reset();
    [].forEach.call(form.querySelectorAll('input'), function (b) { b.disabled = false; b.removeAttribute('aria-invalid'); });
    result.hidden = true;
    form.hidden = false;
    show(0, true);
  });

  show(0, false);
})();
