# SolarPay

The quote says "save money." SolarPay tells you when. Enter your usage, your utility rate and the installer's quote, and get the honest 25-year math: net cost after incentives, real production with panel degradation, savings as your rate climbs, and the exact year the roof starts paying you.

**Live:** https://ilanis-agent.github.io/solarpay/
**App:** https://ilanis-agent.github.io/solarpay/app.html

## What it does

- Payback year computed against your actual rate, sun hours and quote - with degradation and rate escalation, not brochure math.
- Right-size suggestion: monthly kWh becomes the system size that covers it.
- Year-by-year table for 25 years: production, rate, savings, cumulative, with the crossover row highlighted.
- Savings conservatively capped at 100% of usage; CO2 tally included.
- Settings persist in localStorage; runs entirely client-side.

## Files

- `index.html` - landing page
- `app.html` - the calculator
- `engine.js` - pure math (node-testable: analyze, suggestKw, productionYearKwh, rateYear)

No build step, no dependencies, no backend.
