/* SolarPay engine - the honest payback on rooftop solar. Pure math, no DOM. */
(function (root) {
  'use strict';

  var CO2_TONS_PER_KWH = 0.000386; // EPA grid average ~0.85 lb CO2 per kWh

  function num(v, name) {
    var n = typeof v === 'string' ? parseFloat(v) : v;
    if (typeof n !== 'number' || !isFinite(n) || isNaN(n)) throw new Error(name + ' must be a number');
    return n;
  }
  function round2(x) { return Math.round(x * 100) / 100; }
  function range(v, name, lo, hi) {
    var n = num(v, name);
    if (n < lo || n > hi) throw new Error(name + ' must be in [' + lo + ', ' + hi + ']');
    return n;
  }

  function suggestKw(monthlyKwh, sunHours) {
    var raw = (num(monthlyKwh, 'monthlyKwh') * 12) / (num(sunHours, 'sunHours') * 365);
    var snapped = Math.round(raw * 2) / 2;
    return Math.min(50, Math.max(1, snapped));
  }

  function productionYearKwh(systemKw, sunHours, year, degradePct) {
    var base = systemKw * sunHours * 365;
    return base * Math.pow(1 - degradePct / 100, year - 1);
  }
  function rateYear(ratePerKwh, escPct, year) {
    return ratePerKwh * Math.pow(1 + escPct / 100, year - 1);
  }

  function analyze(o) {
    if (!o || typeof o !== 'object') throw new Error('options required');
    var monthlyKwh = range(o.monthlyKwh === undefined ? 900 : o.monthlyKwh, 'monthlyKwh', 0, 100000);
    var ratePerKwh = range(o.ratePerKwh === undefined ? 0.17 : o.ratePerKwh, 'ratePerKwh', 0.001, 2);
    var escPct = range(o.escPct === undefined ? 3 : o.escPct, 'escPct', -10, 20);
    var sunHours = range(o.sunHours === undefined ? 4.5 : o.sunHours, 'sunHours', 1, 9);
    var systemKw = range(o.systemKw === undefined ? suggestKw(monthlyKwh, sunHours) : o.systemKw, 'systemKw', 0.5, 100);
    var costPerWatt = range(o.costPerWatt === undefined ? 2.75 : o.costPerWatt, 'costPerWatt', 0.1, 20);
    var incentivePct = range(o.incentivePct === undefined ? 30 : o.incentivePct, 'incentivePct', 0, 100);
    var degradePct = range(o.degradePct === undefined ? 0.5 : o.degradePct, 'degradePct', 0, 5);
    var horizon = 25;

    var grossCost = systemKw * 1000 * costPerWatt;
    var netCost = grossCost * (1 - incentivePct / 100);
    var usageKwhYear = monthlyKwh * 12;

    var rows = [];
    var cum = 0, paybackYears = null, totalOffset = 0;
    var year1 = null;
    for (var y = 1; y <= horizon; y++) {
      var prod = productionYearKwh(systemKw, sunHours, y, degradePct);
      var offset = Math.min(prod, usageKwhYear);
      var rate = rateYear(ratePerKwh, escPct, y);
      var savings = offset * rate;
      var cumBefore = cum;
      cum += savings;
      totalOffset += offset;
      if (year1 === null) year1 = { productionKwh: prod, savings: savings, rate: rate };
      if (paybackYears === null && netCost > 0 && cum >= netCost && savings > 0) {
        paybackYears = (y - 1) + (netCost - cumBefore) / savings;
      }
      rows.push({ year: y, productionKwh: round2(prod), rate: round2(rate * 100) / 100, savings: round2(savings), cumSavings: round2(cum) });
    }
    if (netCost <= 0) paybackYears = 0;

    return {
      systemKw: systemKw,
      grossCost: round2(grossCost),
      netCost: round2(netCost),
      year1ProductionKwh: round2(year1.productionKwh),
      year1Rate: round2(year1.rate * 100) / 100,
      year1Savings: round2(year1.savings),
      year1MonthlyAvgSavings: round2(year1.savings / 12),
      paybackYears: paybackYears === null ? null : round2(paybackYears),
      total25Savings: round2(cum),
      net25: round2(cum - netCost),
      roiMultiple: netCost > 0 ? round2(cum / netCost) : null,
      co2Tons25: round2(totalOffset * CO2_TONS_PER_KWH),
      rows: rows
    };
  }

  var api = {
    analyze: analyze,
    suggestKw: suggestKw,
    productionYearKwh: productionYearKwh,
    rateYear: rateYear,
    CO2_TONS_PER_KWH: CO2_TONS_PER_KWH
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SolarPayEngine = api;
})(typeof self !== 'undefined' ? self : this);
