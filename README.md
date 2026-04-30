# FIREcalc — Monte Carlo Retirement Planner

A production-grade FIRE (Financial Independence, Retire Early) calculator for Indian investors, powered by Monte Carlo simulation.

## Features

- **5,000-run Monte Carlo simulation** with stochastic returns and inflation
- **Year-by-year corpus chart** with P10/P50/P90 bands
- **FIRE Number calculator** based on Safe Withdrawal Rate
- **SIP step-up modelling** (annual increase in SIP)
- **Sequence-of-returns risk** built into the model
- **Failure analysis** — shows average year of corpus depletion in bad scenarios
- Dark, polished UI optimised for desktop and mobile

## Local Development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

## Deploy to Netlify

### Option A: Netlify CLI (fastest)

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir .next
```

### Option B: GitHub → Netlify (recommended for ongoing updates)

1. Push this folder to a GitHub repo
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
3. Connect your GitHub repo
4. Build settings are auto-detected via `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. Click **Deploy**

The `@netlify/plugin-nextjs` plugin is declared in `netlify.toml` and installed automatically by Netlify — you don't need to add it manually.

## Project Structure

```
fire-saas/
├── app/
│   ├── layout.js              # Root layout + metadata
│   ├── page.js                # Main calculator UI
│   ├── page.module.css        # Scoped styles
│   ├── globals.css            # CSS reset
│   └── api/simulate/route.js  # POST /api/simulate
│
├── lib/
│   └── simulation.js          # Monte Carlo engine
│
├── netlify.toml               # Netlify build config
├── next.config.mjs
└── package.json
```

## Simulation Model

- **Accumulation phase**: Corpus grows with stochastic returns + SIP (with annual step-up)
- **Distribution phase**: Annual withdrawal = min(inflation-adjusted expense, corpus × SWR)
- **Returns**: Normal distribution, mean = `expectedReturn`, σ = `returnStdDev`
- **Inflation**: Normal distribution, mean = `inflation`, σ = `inflationStdDev`
- **Success**: Corpus > 0 at life expectancy age

## Roadmap

- [ ] Supabase auth + save/load simulations
- [ ] Portfolio allocation slider (equity/debt mix)
- [ ] Rental income / part-time income during retirement
- [ ] PDF report export
- [ ] Shareable simulation URLs
