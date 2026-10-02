/* =========================================================================
   BhoomiShakti — Farmer Tools (farmer-tools.html)
   Weather & spray advisor · Land unit converter · Farm profit planner
   Everything runs in the browser. Only the weather tool uses the network
   (Open-Meteo: free for non-commercial use, no API key, CORS-enabled).
   ========================================================================= */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var icon = function (n) { return '<svg class="ico" aria-hidden="true"><use href="#i-' + n + '"></use></svg>'; };

  /* =======================================================================
     1) WEATHER & SPRAY ADVISOR
     ======================================================================= */
  var WEATHER = {
    geocodeUrl: 'https://geocoding-api.open-meteo.com/v1/search',
    forecastUrl: 'https://api.open-meteo.com/v1/forecast',
    // Thresholds — each one comes from a published source (shown on the page):
    rainDayMm: 2.5,        // IMD: "light rain" starts at 2.5 mm in 24 h
    heatC: 40,             // IMD: heat-wave consideration for plains starts at a maximum of 40 °C
    sprayWindMin: 4.8,     // 3 mph  — pesticide-stewardship guidance (3–8 mph)
    sprayWindMax: 12.9,    // 8 mph
    sprayStartHour: 6,
    sprayEndHour: 18
  };

  // WMO weather interpretation codes (used by Open-Meteo)
  function wmo(code) {
    if (code === 0) return ['Clear sky', 'sun'];
    if (code <= 2) return ['Partly cloudy', 'sun-cloud'];
    if (code === 3) return ['Cloudy', 'cloud'];
    if (code === 45 || code === 48) return ['Fog', 'fog'];
    if (code >= 51 && code <= 57) return ['Drizzle', 'rain'];
    if (code >= 61 && code <= 67) return ['Rain', 'rain'];
    if (code >= 71 && code <= 77) return ['Snow', 'snow'];
    if (code >= 80 && code <= 82) return ['Rain showers', 'rain'];
    if (code >= 85 && code <= 86) return ['Snow showers', 'snow'];
    if (code >= 95) return ['Thunderstorm', 'storm'];
    return ['—', 'cloud'];
  }
  var WX = {
    sun: '<circle cx="24" cy="24" r="9" fill="#F2B43A"/><g stroke="#F2B43A" stroke-width="3" stroke-linecap="round"><path d="M24 5v5M24 38v5M5 24h5M38 24h5M10.6 10.6l3.5 3.5M33.9 33.9l3.5 3.5M10.6 37.4l3.5-3.5M33.9 14.1l3.5-3.5"/></g>',
    'sun-cloud': '<circle cx="18" cy="17" r="8" fill="#F2B43A"/><path d="M15 38h20a8 8 0 0 0 0-16 11 11 0 0 0-21 3 6.5 6.5 0 0 0 1 13Z" fill="#E6EDF3" stroke="#B9C7D3" stroke-width="1.5"/>',
    cloud: '<path d="M12 37h23a9 9 0 0 0 0-18 12 12 0 0 0-23 3.5A7.3 7.3 0 0 0 12 37Z" fill="#E6EDF3" stroke="#AEBFCC" stroke-width="1.5"/>',
    fog: '<path d="M12 27h23a8 8 0 0 0 0-16 11 11 0 0 0-21 3A6.5 6.5 0 0 0 12 27Z" fill="#E6EDF3" stroke="#AEBFCC" stroke-width="1.5"/><g stroke="#AEBFCC" stroke-width="3" stroke-linecap="round"><path d="M10 33h28M14 39h22"/></g>',
    rain: '<path d="M12 29h23a8 8 0 0 0 0-16 11 11 0 0 0-21 3A6.5 6.5 0 0 0 12 29Z" fill="#DCE6EF" stroke="#9DB2C4" stroke-width="1.5"/><g stroke="#3B82C4" stroke-width="3" stroke-linecap="round"><path d="M16 34l-2 6M24 34l-2 6M32 34l-2 6"/></g>',
    snow: '<path d="M12 29h23a8 8 0 0 0 0-16 11 11 0 0 0-21 3A6.5 6.5 0 0 0 12 29Z" fill="#E6EDF3" stroke="#AEBFCC" stroke-width="1.5"/><g fill="#8FB3D9"><circle cx="16" cy="37" r="2.2"/><circle cx="24" cy="40" r="2.2"/><circle cx="32" cy="37" r="2.2"/></g>',
    storm: '<path d="M12 28h23a8 8 0 0 0 0-16 11 11 0 0 0-21 3A6.5 6.5 0 0 0 12 28Z" fill="#C9D3DC" stroke="#8C9DAB" stroke-width="1.5"/><path d="M25 29l-6 9h5l-3 8 9-11h-5l3-6Z" fill="#F2B43A"/>'
  };
  var wxSvg = function (k) { return '<svg class="wx" viewBox="0 0 48 48" aria-hidden="true">' + (WX[k] || WX.cloud) + '</svg>'; };

  var wBox = $('[data-weather]');
  if (wBox) (function weather() {
    var form = $('[data-w-form]', wBox), input = $('#w-place'), country = $('#w-country');
    var results = $('[data-w-results]', wBox), status = $('[data-w-status]', wBox), out = $('[data-w-out]', wBox);
    var daysBox = $('[data-w-days]', wBox), detail = $('[data-w-detail]', wBox);
    var data = null, sel = 0, busy = false;

    function setStatus(kind, html) { status.className = 'w-status' + (kind ? ' is-' + kind : ''); status.innerHTML = html || ''; }
    function getJSON(url) {
      var ctrl = 'AbortController' in window ? new AbortController() : null;
      var t = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;
      return fetch(url, ctrl ? { signal: ctrl.signal } : {}).then(function (r) {
        if (t) clearTimeout(t);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      });
    }
    function netError(err) {
      var offline = !navigator.onLine;
      setStatus('error', icon('info') + '<span>' + (offline ? 'You appear to be offline. Connect to the internet and try again.'
        : 'The weather service could not be reached right now' + (err && /HTTP 429/.test(err.message) ? ' (too many requests — please wait a minute)' : '') + '. Please try again in a moment.') + '</span>');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (q.length < 2) { setStatus('error', icon('info') + '<span>Please type the name of your village or town.</span>'); input.focus(); return; }
      if (busy) return;
      busy = true;
      results.innerHTML = '';
      setStatus('loading', '<span class="w-spin"></span><span>Searching for “' + esc(q) + '”…</span>');
      var name = q.split(',')[0].trim(), hint = q.split(',').slice(1).join(',').trim().toLowerCase();
      var url = WEATHER.geocodeUrl + '?name=' + encodeURIComponent(name) + '&count=10&language=en&format=json' + (country.value ? '&countryCode=' + country.value : '');
      getJSON(url).then(function (j) {
        busy = false;
        var list = (j && j.results) || [];
        if (hint) {
          var filtered = list.filter(function (p) { return [p.admin1, p.admin2, p.admin3, p.country].join(' ').toLowerCase().indexOf(hint) > -1; });
          if (filtered.length) list = filtered;
        }
        if (!list.length) { setStatus('error', icon('info') + '<span>No place called “' + esc(name) + '” was found. Check the spelling, try a nearby town, or use “Use my location”.</span>'); return; }
        if (list.length === 1) { setStatus(''); loadForecast(list[0].latitude, list[0].longitude, label(list[0])); return; }
        setStatus('', '<span>Choose your place:</span>');
        results.innerHTML = list.slice(0, 8).map(function (p, i) {
          return '<button type="button" class="w-pick" data-i="' + i + '">' + icon('pin') + '<span><b>' + esc(p.name) + '</b><small>' + esc([p.admin2, p.admin1, p.country].filter(Boolean).join(', ')) + '</small></span></button>';
        }).join('');
        $$('.w-pick', results).forEach(function (b) {
          b.addEventListener('click', function () { var p = list[+b.getAttribute('data-i')]; results.innerHTML = ''; loadForecast(p.latitude, p.longitude, label(p)); });
        });
        var first = $('.w-pick', results); if (first) first.focus();
      }, function (err) { busy = false; netError(err); });
    });

    function label(p) { return [p.name, p.admin2, p.admin1].filter(Boolean).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(', '); }

    $('[data-w-geo]', wBox).addEventListener('click', function () {
      if (!('geolocation' in navigator)) { setStatus('error', icon('info') + '<span>Location is not available in this browser. Please type your village name.</span>'); return; }
      setStatus('loading', '<span class="w-spin"></span><span>Finding your location… (allow location access if asked)</span>');
      navigator.geolocation.getCurrentPosition(function (pos) {
        var lat = Math.round(pos.coords.latitude * 100) / 100, lon = Math.round(pos.coords.longitude * 100) / 100; // ~1 km precision is enough for a forecast
        loadForecast(lat, lon, 'Your current location (' + lat.toFixed(2) + ', ' + lon.toFixed(2) + ')');
      }, function (err) {
        setStatus('error', icon('info') + '<span>' + (err.code === 1 ? 'Location permission was not given. Please type your village name instead.' : 'Your location could not be found. Please type your village name instead.') + '</span>');
      }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
    });

    $('[data-w-change]', wBox).addEventListener('click', function () { out.hidden = true; input.value = ''; input.focus(); setStatus(''); });

    function loadForecast(lat, lon, name) {
      setStatus('loading', '<span class="w-spin"></span><span>Getting the 7-day forecast…</span>');
      var url = WEATHER.forecastUrl + '?latitude=' + lat + '&longitude=' + lon +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max' +
        '&hourly=precipitation,wind_speed_10m&timezone=auto&forecast_days=7&wind_speed_unit=kmh';
      getJSON(url).then(function (j) {
        if (!j || !j.daily || !j.daily.time) throw new Error('bad data');
        data = j; sel = 0;
        $('[data-w-name]', wBox).textContent = name;
        setStatus('');
        renderDays();
        out.hidden = false;
        out.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }).catch(netError);
    }

    function analyse(i) {
      var d = data.daily, h = data.hourly, day = d.time[i];
      var rain = d.precipitation_sum[i], tmax = d.temperature_2m_max[i];
      var hours = [];
      if (h && h.time) {
        for (var k = 0; k < h.time.length; k++) {
          if (h.time[k].slice(0, 10) !== day) continue;
          var hr = +h.time[k].slice(11, 13);
          if (hr < WEATHER.sprayStartHour || hr >= WEATHER.sprayEndHour) continue;
          var w = h.wind_speed_10m[k], p = h.precipitation[k];
          hours.push({ hr: hr, ok: p === 0 && w >= WEATHER.sprayWindMin && w <= WEATHER.sprayWindMax, w: w, p: p });
        }
      }
      var okHours = hours.filter(function (x) { return x.ok; });
      return {
        rainy: rain != null && rain >= WEATHER.rainDayMm,
        hot: tmax != null && tmax >= WEATHER.heatC,
        hours: hours, okHours: okHours,
        laterRain: hours.some(function (x) { return x.p > 0; })
      };
    }

    function dayName(iso, i) {
      if (i === 0) return 'Today';
      if (i === 1) return 'Tomorrow';
      return new Date(iso + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    }
    function fmtHour(h) { return ((h + 11) % 12 + 1) + (h < 12 ? ' AM' : ' PM'); }
    function ranges(hrs) {
      var out = [], s = null, prev = null;
      hrs.forEach(function (h) { if (s === null) s = h; else if (h !== prev + 1) { out.push([s, prev]); s = h; } prev = h; });
      if (s !== null) out.push([s, prev]);
      return out.map(function (r) { return fmtHour(r[0]) + ' – ' + fmtHour(r[1] + 1); });
    }

    function renderDays() {
      var d = data.daily;
      daysBox.innerHTML = d.time.map(function (t, i) {
        var a = analyse(i), w = wmo(d.weather_code[i]);
        var tags = (a.rainy ? '<i class="tg tg-rain">Rain</i>' : '') + (a.hot ? '<i class="tg tg-hot">Hot</i>' : '') + (a.okHours.length ? '<i class="tg tg-spray">Spray hours</i>' : '');
        return '<button type="button" class="w-day' + (i === sel ? ' on' : '') + '" data-i="' + i + '" aria-pressed="' + (i === sel) + '">' +
          '<span class="wd-name">' + dayName(t, i) + '</span>' + wxSvg(w[1]) +
          '<span class="wd-t"><b>' + Math.round(d.temperature_2m_max[i]) + '°</b><small>' + Math.round(d.temperature_2m_min[i]) + '°</small></span>' +
          '<span class="wd-rain">' + icon('droplet') + (d.precipitation_sum[i] != null ? d.precipitation_sum[i].toFixed(1) : '–') + ' mm</span>' +
          '<span class="wd-tags">' + tags + '</span></button>';
      }).join('');
      $$('.w-day', daysBox).forEach(function (b) {
        b.addEventListener('click', function () { sel = +b.getAttribute('data-i'); $$('.w-day', daysBox).forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); }); renderDetail(); });
      });
      renderDetail();
    }

    function renderDetail() {
      var d = data.daily, i = sel, a = analyse(i), w = wmo(d.weather_code[i]);
      var advice = [];
      if (a.rainy) advice.push(['rain', 'droplet', 'Rain expected (about ' + d.precipitation_sum[i].toFixed(1) + ' mm) — consider delaying irrigation.']);
      if (a.hot) advice.push(['hot', 'sun', 'High heat expected (' + Math.round(d.temperature_2m_max[i]) + ' °C) — plan field work during cooler hours and keep drinking water.']);
      if (a.okHours.length) {
        advice.push(['spray', 'check', 'Weather appears suitable for spraying during: <b>' + ranges(a.okHours.map(function (x) { return x.hr; })).join(', ') + '</b>.' + (a.laterRain ? ' Rain is also forecast on this day — check the product label for how long it must stay dry after spraying.' : '')]);
      } else {
        advice.push(['nospray', 'info', 'No daytime hours meet the spray conditions (no rain, wind 5–13 km/h). Spraying is not suggested by this forecast.']);
      }
      if (!a.rainy && !a.hot) advice.unshift(['calm', 'sprout', 'No heavy weather signals in the forecast for this day.']);

      var timeline = a.hours.map(function (x) {
        var cls = x.p > 0 ? 'r' : x.ok ? 'ok' : (x.w > WEATHER.sprayWindMax ? 'wind' : 'calm');
        var tip = fmtHour(x.hr) + ': ' + (x.p > 0 ? 'rain ' + x.p + ' mm' : 'wind ' + Math.round(x.w) + ' km/h');
        return '<span class="tl-h ' + cls + '" title="' + tip + '"><i></i><small>' + (x.hr % 3 === 0 ? fmtHour(x.hr).replace(' ', '') : '') + '</small></span>';
      }).join('');

      detail.innerHTML =
        '<div class="wdt-head">' + wxSvg(w[1]) + '<div><b>' + dayName(d.time[i], i) + ' · ' + w[0] + '</b>' +
        '<span>' + Math.round(d.temperature_2m_min[i]) + '° – ' + Math.round(d.temperature_2m_max[i]) + ' °C · Rain ' + (d.precipitation_sum[i] || 0).toFixed(1) + ' mm' +
        (d.precipitation_probability_max[i] != null ? ' (chance up to ' + d.precipitation_probability_max[i] + '%)' : '') +
        ' · Wind up to ' + Math.round(d.wind_speed_10m_max[i]) + ' km/h</span></div></div>' +
        '<ul class="wdt-adv">' + advice.map(function (x) { return '<li class="adv-' + x[0] + '">' + icon(x[1]) + '<span>' + x[2] + '</span></li>'; }).join('') + '</ul>' +
        (timeline ? '<div class="wdt-tl"><span class="eyebrow">Daytime spray check (6 AM – 6 PM)</span><div class="tl">' + timeline + '</div>' +
          '<div class="tl-key"><span><i class="k ok"></i>Suitable</span><span><i class="k wind"></i>Too windy</span><span><i class="k calm"></i>Too calm</span><span><i class="k r"></i>Rain</span></div></div>' : '');
    }
  })();

  /* =======================================================================
     2) LAND UNIT CONVERTER  (exact relationships, in square feet)
     ======================================================================= */
  var SQFT = {
    acre: 43560,                    // 1 acre = 43,560 sq ft (exact)
    gunta: 43560 / 40,              // 1 acre = 40 guntas  → 1,089 sq ft
    cent: 43560 / 100,              // 1 acre = 100 cents  → 435.6 sq ft
    hectare: 10000 / 0.09290304,    // 10,000 m² ÷ 0.09290304 m² per sq ft (exact) ≈ 107,639.10
    sqft: 1
  };
  var UNIT_NAME = { acre: ['acre', 'acres'], gunta: ['gunta', 'guntas'], cent: ['cent', 'cents'], hectare: ['hectare', 'hectares'], sqft: ['sq ft', 'sq ft'] };
  function fmtNum(n) {
    if (!isFinite(n)) return '—';
    var abs = Math.abs(n), digits = abs === 0 ? 0 : abs >= 1000 ? 2 : abs >= 1 ? 4 : 6;
    return n.toLocaleString('en-IN', { maximumFractionDigits: digits });
  }
  var uname = function (u, n) { return UNIT_NAME[u][n === 1 ? 0 : 1]; };

  var land = $('[data-land]');
  if (land) (function converter() {
    var val = $('#l-value', land), err = $('[data-l-err]', land);
    var from = function () { return $('input[name="from"]:checked', land).value; };
    var to = function () { return $('input[name="to"]:checked', land).value; };
    function convert(animate) {
      var v = parseFloat(val.value);
      var bad = val.value.trim() === '' || !isFinite(v) || v < 0;
      err.hidden = !bad;
      val.setAttribute('aria-invalid', String(bad));
      if (bad) { $('[data-l-to]', land).textContent = '—'; $('[data-l-from]', land).textContent = ''; $('[data-l-all]', land).innerHTML = ''; return; }
      var sq = v * SQFT[from()], r = sq / SQFT[to()];
      $('[data-l-from]', land).textContent = fmtNum(v) + ' ' + uname(from(), v);
      var toEl = $('[data-l-to]', land);
      toEl.textContent = fmtNum(r) + ' ' + uname(to(), r);
      if (animate) { toEl.classList.remove('pop'); void toEl.offsetWidth; toEl.classList.add('pop'); }
      // field fill: share of one acre shown as a visual (capped)
      var acres = sq / SQFT.acre;
      $('[data-l-fill]', land).style.width = Math.max(2, Math.min(100, acres * 100 / Math.max(1, Math.ceil(acres)))) + '%';
      $('[data-l-all]', land).innerHTML = ['acre', 'gunta', 'cent', 'hectare', 'sqft'].map(function (u) {
        var x = sq / SQFT[u];
        return '<li' + (u === to() ? ' class="on"' : '') + '><b>' + fmtNum(x) + '</b><span>' + uname(u, x) + '</span></li>';
      }).join('');
    }
    land.addEventListener('submit', function (e) { e.preventDefault(); convert(true); });
    land.addEventListener('input', function () { convert(false); });
    land.addEventListener('change', function () { convert(true); });
    $('[data-l-swap]', land).addEventListener('click', function () {
      var f = from(), t = to();
      $('input[name="from"][value="' + t + '"]', land).checked = true;
      $('input[name="to"][value="' + f + '"]', land).checked = true;
      var b = this; b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin');
      convert(true);
    });
    convert(false);
  })();

  /* =======================================================================
     3) FARM PROFIT PLANNER
     ======================================================================= */
  var pf = $('[data-profit]');
  if (pf) (function planner() {
    var out = $('[data-pp-out]'), msg = $('[data-pp-msg]', pf);
    var rs = function (n) { return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 }); };
    var COSTS = [['pp-input', 'Inputs'], ['pp-labour', 'Labour'], ['pp-machine', 'Machinery'], ['pp-water', 'Irrigation'], ['pp-other', 'Other costs']];
    var yieldU = $('#pp-yield-u', pf);
    function perLabel() { return 'per ' + ({ quintal: 'quintal', kg: 'kg', tonne: 'tonne' })[yieldU.value]; }
    yieldU.addEventListener('change', function () { $('[data-pp-per]', pf).textContent = perLabel(); });

    function read(id, mustBePositive) {
      var el = $('#' + id, pf), raw = el.value.trim(), v = parseFloat(raw);
      var ok = raw !== '' && isFinite(v) && (mustBePositive ? v > 0 : v >= 0);
      el.closest('.field').classList.toggle('invalid', !ok);
      el.setAttribute('aria-invalid', String(!ok));
      return ok ? v : null;
    }

    pf.addEventListener('submit', function (e) {
      e.preventDefault();
      var size = read('pp-size', true), yieldV = read('pp-yield', true), price = read('pp-price', false);
      var costs = COSTS.map(function (c) { return read(c[0], false); });
      var missing = [size, yieldV, price].concat(costs).some(function (x) { return x === null; });
      if (missing) {
        msg.hidden = false;
        msg.textContent = 'Some values are missing or not valid (highlighted in red). Enter every value — use 0 for any cost you do not have. Field size and yield must be more than 0.';
        var first = $('.field.invalid input', pf); if (first) first.focus();
        return;
      }
      msg.hidden = true;
      var total = costs.reduce(function (a, b) { return a + b; }, 0);
      var revenue = yieldV * price, profit = revenue - total, minPrice = total / yieldV;
      var sizeU = $('#pp-size-u', pf).value, unitY = yieldU.value;
      var unitWord = { acre: 'acre', hectare: 'hectare', gunta: 'gunta' }[sizeU];

      $('[data-pp-empty]', out).hidden = true;
      $('[data-pp-results]', out).hidden = false;
      var box = $('[data-pp-profit-box]', out);
      box.classList.toggle('loss', profit < 0);
      box.querySelector('span').textContent = profit < 0 ? 'Estimated loss' : 'Estimated profit';
      countTo($('[data-pp-profit]', out), profit);
      $('[data-pp-per-area]', out).textContent = (profit < 0 ? '−' : '') + rs(Math.abs(profit / size)) + ' per ' + unitWord + ' (profit ÷ field size)';
      $('[data-pp-cost]', out).textContent = rs(total);
      $('[data-pp-rev]', out).textContent = rs(revenue);
      $('[data-pp-min]', out).textContent = rs(minPrice) + ' per ' + unitY;
      var max = Math.max(total, revenue, 1);
      $('[data-pp-bar-cost]', out).style.width = (total / max * 100) + '%';
      $('[data-pp-bar-rev]', out).style.width = (revenue / max * 100) + '%';
      $('[data-pp-cost-v]', out).textContent = rs(total);
      $('[data-pp-rev-v]', out).textContent = rs(revenue);
      $('[data-pp-formulas]', out).innerHTML = [
        '<b>Total cost</b> = Inputs + Labour + Machinery + Irrigation + Other = ' + costs.map(rs).join(' + ') + ' = <b>' + rs(total) + '</b>',
        '<b>Expected revenue</b> = Expected yield × Selling price = ' + yieldV.toLocaleString('en-IN') + ' ' + unitY + ' × ' + rs(price) + ' = <b>' + rs(revenue) + '</b>',
        '<b>Estimated profit</b> = Expected revenue − Total cost = ' + rs(revenue) + ' − ' + rs(total) + ' = <b>' + (profit < 0 ? '−' : '') + rs(Math.abs(profit)) + '</b>',
        '<b>Minimum selling price</b> = Total cost ÷ Expected yield = ' + rs(total) + ' ÷ ' + yieldV.toLocaleString('en-IN') + ' ' + unitY + ' = <b>' + rs(minPrice) + ' per ' + unitY + '</b>'
      ].map(function (x) { return '<li>' + x + '</li>'; }).join('');
      $('[data-pp-date]', out).textContent = 'Field: ' + size.toLocaleString('en-IN') + ' ' + unitWord + (size === 1 ? '' : 's') + ' · ' + new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      if (window.matchMedia('(max-width: 1024px)').matches) out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    pf.addEventListener('reset', function () {
      setTimeout(function () {
        $$('.field', pf).forEach(function (f) { f.classList.remove('invalid'); });
        msg.hidden = true;
        $('[data-pp-empty]', out).hidden = false;
        $('[data-pp-results]', out).hidden = true;
        $('[data-pp-per]', pf).textContent = perLabel();
      }, 0);
    });
    pf.addEventListener('input', function (e) { var f = e.target.closest('.field'); if (f) f.classList.remove('invalid'); });

    function countTo(el, target) {
      var neg = target < 0, abs = Math.abs(target);
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) { el.textContent = (neg ? '−' : '') + rs(abs); return; }
      var t0 = null, dur = 700;
      function step(t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = (neg ? '−' : '') + rs(Math.round(abs * e * 100) / 100);
        if (k < 1) requestAnimationFrame(step); else el.textContent = (neg ? '−' : '') + rs(abs);
      }
      requestAnimationFrame(step);
    }

    $('[data-pp-print]', out).addEventListener('click', function () {
      document.body.classList.add('print-planner');
      window.print();
    });
    window.addEventListener('afterprint', function () { document.body.classList.remove('print-planner'); });
  })();
})();
