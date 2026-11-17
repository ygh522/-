/* InBody result-sheet OCR: lazy-loads Tesseract (vendored), preprocesses the photo, and
   parses the key metrics with plausibility checks + cross-validation. */
window.F = window.F || {};
(function (F) {
  'use strict';
  const O = (F.OCR = {});
  const LOCAL = location.protocol !== 'file:';
  const abs = (p) => new URL(p, location.href).href;

  let libP = null;
  const loadLib = () => libP || (libP = new Promise((res, rej) => {
    if (window.Tesseract) return res(window.Tesseract);
    const s = document.createElement('script');
    s.src = 'vendor/tesseract/tesseract.min.js';
    s.onload = () => res(window.Tesseract);
    s.onerror = () => { libP = null; rej(new Error('OCR 라이브러리를 불러오지 못했어요')); };
    document.head.appendChild(s);
  }));

  let workerP = null;
  O.worker = (onProgress) => workerP || (workerP = (async () => {
    const T = await loadLib();
    const opts = {
      logger: (m) => { if (O._progress) O._progress(m); },
      errorHandler: (e) => console.warn('ocr', e),
    };
    if (LOCAL) {
      opts.workerPath = abs('vendor/tesseract/worker.min.js');
      opts.corePath = abs('vendor/tesseract/core');
      opts.langPath = abs('vendor/tesseract/lang');
    } // file:// → library defaults (jsDelivr CDN), since workers cannot load file URLs
    const w = await T.createWorker(['kor', 'eng'], 1, opts);
    await w.setParameters({ preserve_interword_spaces: '1' });
    return w;
  })().catch((e) => { workerP = null; throw e; }));

  /** Downscale + grayscale + contrast-stretch for better recognition. Returns a canvas. */
  O.preprocess = (file) => new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const maxSide = 2400;
      const sc = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const up = Math.max(img.naturalWidth, img.naturalHeight) < 1400 ? 1600 / Math.max(img.naturalWidth, img.naturalHeight) : 1;
      const k = sc * up;
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0, c.width, c.height);
      const d = g.getImageData(0, 0, c.width, c.height);
      const px = d.data, hist = new Uint32Array(256);
      for (let i = 0; i < px.length; i += 4) {
        const y = (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) / 1000 | 0;
        px[i] = px[i + 1] = px[i + 2] = y; hist[y]++;
      }
      const total = px.length / 4; let acc = 0, lo = 0, hi = 255;
      for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > total * 0.02) { lo = v; break; } }
      acc = 0;
      for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > total * 0.02) { hi = v; break; } }
      const span = Math.max(1, hi - lo);
      for (let i = 0; i < px.length; i += 4) {
        const v = F.clamp(((px[i] - lo) * 255) / span, 0, 255);
        px[i] = px[i + 1] = px[i + 2] = v;
      }
      g.putImageData(d, 0, 0);
      URL.revokeObjectURL(url);
      res(c);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('이미지를 읽을 수 없어요')); };
    img.src = url;
  });

  O.recognize = async (file, onProgress) => {
    O._progress = onProgress;
    const canvas = await O.preprocess(file);
    const w = await O.worker();
    const { data } = await w.recognize(canvas);
    O._progress = null;
    return data.text || '';
  };

  /* ---------------- Parsing ---------------- */
  const SPEC = {
    weight: { re: [/체중(?!조절)/, /weight(?!control)/i], ex: /조절|적정|표준|control|target/i, min: 30, max: 250, dec: true },
    smm: { re: [/골격근량/, /골격근/, /skeletalmusclemass/i, /smm/i], min: 10, max: 70, dec: true },
    bfm: { re: [/체지방량/, /bodyfatmass/i, /체지방(?![률율])/], ex: /조절|control|률|율|percent/i, min: 2, max: 120, dec: true },
    pbf: { re: [/체지방률/, /체지방율/, /percentbodyfat/i, /pbf/i], min: 3, max: 70, dec: true },
    bmi: { re: [/bmi/i, /신체질량지수/], min: 12, max: 70, dec: true },
    bmr: { re: [/기초대사량/, /basalmetabolicrate/i, /bmr/i], min: 800, max: 3500, dec: false },
    vfl: { re: [/내장지방레벨/, /visceralfatlevel/i, /내장지방/], ex: /면적|area/i, min: 1, max: 25, dec: false, int: true },
    score: { re: [/인바디점수/, /inbody점수/i, /inbodyscore/i, /점수/], min: 30, max: 110, dec: false, int: true },
    whr: { re: [/복부지방률/, /waist.?hipratio/i, /whr/i], min: 0.6, max: 1.3, dec: true },
    tbw: { re: [/체수분/, /totalbodywater/i], min: 15, max: 80, dec: true },
    ffm: { re: [/제지방량/, /fatfreemass/i], min: 25, max: 120, dec: true },
  };
  const NUM = /\d{1,4}(?:[.,]\d{1,2})?/g;

  const candidatesAfter = (rest, spec) => {
    // drop bar-chart scales such as "55 70 85 100 115 130 ... %" and thousands separators
    rest = rest.replace(/(?:\d{2,3}\s+){4,}\d{2,3}\s*%/g, ' ').replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
    const nums = (rest.match(NUM) || []).map((s) => ({ s, v: parseFloat(s.replace(',', '.')), hasDec: /[.,]/.test(s) }));
    const out = [];
    for (const n of nums) {
      let v = n.v;
      if (spec.int && n.hasDec) continue;
      if (v < spec.min || v > spec.max) {
        // OCR often drops the decimal point: 902 → 90.2
        if (spec.dec && !n.hasDec && v / 10 >= spec.min && v / 10 <= spec.max && n.s.length >= 3) v = v / 10;
        else continue;
      }
      out.push({ v, hasDec: n.hasDec });
    }
    return out;
  };

  O.parse = (text, ctx = {}) => {
    const lines = text.split(/\n+/).map((l) => l.replace(/[|]/g, ' ').replace(/[Oo](?=\d)/g, '0').trim()).filter(Boolean);
    // compact (no whitespace) copy for label matching + index map back to the original line
    const prepared = lines.map((line) => {
      const map = []; let compact = '';
      for (let i = 0; i < line.length; i++) if (!/\s/.test(line[i])) { map.push(i); compact += line[i]; }
      return { line, compact, map, heading: /분석|analysis/i.test(compact) };
    });
    const values = {}, src = {}, warnings = [];
    for (const [key, spec] of Object.entries(SPEC)) {
      const votes = new Map();
      prepared.forEach((pl, li) => {
        if (pl.heading) return;
        for (const re of spec.re) {
          const m = pl.compact.match(re);
          if (!m) continue;
          if (spec.ex && spec.ex.test(pl.compact.slice(Math.max(0, m.index - 4), m.index + m[0].length + 6)) && key !== 'pbf') break;
          const endC = m.index + m[0].length;
          const pos = endC < pl.map.length ? pl.map[endC] : pl.line.length;
          let cands = candidatesAfter(pl.line.slice(pos), spec);
          const next = prepared[li + 1];
          if (!cands.length && next && /^[\s(]*\d/.test(next.line)) cands = candidatesAfter(next.line, spec);
          if (spec.dec) { const withDec = cands.filter((c) => c.hasDec); if (withDec.length) cands = withDec; }
          if (cands.length) {
            const v = Math.round(cands[0].v * 100) / 100;
            votes.set(v, (votes.get(v) || 0) + (cands[0].hasDec || !spec.dec ? 2 : 1));
          }
          break;
        }
      });
      if (votes.size) {
        const best = [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0];
        values[key] = best; src[key] = 'ocr';
      }
    }
    // date
    const dm = text.replace(/\s+/g, ' ').match(/(20\d{2})\s?[.\-/년]\s?(\d{1,2})\s?[.\-/월]\s?(\d{1,2})/);
    let date = null;
    if (dm) {
      const y = +dm[1], mo = +dm[2], d = +dm[3];
      if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) date = `${y}-${F.pad(mo)}-${F.pad(d)}`;
    }
    // cross-validation & derived values
    const h = ctx.height;
    if (values.weight && values.bfm && values.pbf == null) { values.pbf = Math.round((values.bfm / values.weight) * 1000) / 10; src.pbf = 'calc'; }
    if (values.weight && values.pbf != null && values.bfm == null) { values.bfm = Math.round((values.weight * values.pbf) / 10) / 10; src.bfm = 'calc'; }
    if (values.weight && values.bfm && values.pbf != null) {
      const calc = (values.bfm / values.weight) * 100;
      if (Math.abs(calc - values.pbf) > 2) warnings.push(`체지방률(${values.pbf}%)과 체지방량÷체중(${calc.toFixed(1)}%)이 맞지 않아요. 확인해 주세요.`);
    }
    if (values.weight && h && values.bmi == null) { values.bmi = Math.round(F.E.bmi(values.weight, h) * 10) / 10; src.bmi = 'calc'; }
    if (values.weight && h && values.bmi && src.bmi === 'ocr') {
      const calc = F.E.bmi(values.weight, h);
      if (Math.abs(calc - values.bmi) > 1.2) warnings.push(`BMI(${values.bmi})가 키 ${h}cm·체중 ${values.weight}kg 계산값(${calc.toFixed(1)})과 달라요.`);
    }
    if (values.weight && values.smm && (values.smm > values.weight * 0.65 || values.smm < values.weight * 0.18)) {
      warnings.push('골격근량 값이 체중 대비 비정상적이에요. 확인해 주세요.'); src.smm = 'check';
    }
    if (values.weight && values.bfm && values.ffm == null) { values.ffm = Math.round((values.weight - values.bfm) * 10) / 10; src.ffm = 'calc'; }
    return { values, src, warnings, date, lines: lines.length };
  };
})(window.F);
