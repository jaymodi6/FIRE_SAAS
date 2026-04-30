/**
 * FIRE Monte Carlo Simulation Engine
 * Improved with:
 * - Box-Muller RNG
 * - Sequence-of-returns risk modelling
 * - Inflation-adjusted SIP step-up
 * - Year-by-year percentile tracking for chart
 * - Detailed failure analysis
 */

function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function runSimulation(input) {
  const {
    years = 25,
    postYears = 30,
    monthlyExpense = 50000,
    currentCorpus = 2000000,
    monthlySIP = 30000,
    sipStepUpPct = 10,       // Annual SIP step-up %
    expectedReturn = 12,      // % p.a. (equity-heavy)
    returnStdDev = 15,        // % volatility
    inflation = 6,            // % p.a.
    inflationStdDev = 2,
    safeWithdrawalRate = 4,   // % SWR
    runs = 5000,
  } = input;

  const mu = expectedReturn / 100;
  const sigma = returnStdDev / 100;
  const inf = inflation / 100;
  const infSig = inflationStdDev / 100;
  const swr = safeWithdrawalRate / 100;
  const totalYears = years + postYears;

  // Track year-by-year corpus for percentile chart
  const yearlyCorpus = Array.from({ length: totalYears + 1 }, () => []);

  let successCount = 0;
  let failureYears = [];
  const finalCorpora = [];

  for (let i = 0; i < runs; i++) {
    let corpus = currentCorpus;
    let expense = monthlyExpense * 12; // annual
    let sip = monthlySIP * 12;        // annual
    let failed = false;
    let failYear = null;

    yearlyCorpus[0].push(corpus);

    for (let y = 0; y < totalYears; y++) {
      const ret = mu + sigma * randn();
      const infl = inf + infSig * randn();

      if (y < years) {
        // Accumulation phase
        corpus = corpus * (1 + ret) + sip;
        sip *= (1 + sipStepUpPct / 100); // step-up SIP
      } else {
        // Distribution phase
        const annualWithdraw = Math.min(expense, corpus * swr);
        corpus = corpus * (1 + ret) - annualWithdraw;
      }

      expense *= (1 + infl);

      if (corpus <= 0 && !failed) {
        failed = true;
        failYear = y;
        corpus = 0;
      }

      yearlyCorpus[y + 1].push(corpus);
    }

    if (!failed) successCount++;
    if (failYear !== null) failureYears.push(failYear);
    finalCorpora.push(corpus);
  }

  finalCorpora.sort((a, b) => a - b);

  // Build year-by-year percentile bands
  const chartData = yearlyCorpus.map((yearArr) => {
    const sorted = [...yearArr].sort((a, b) => a - b);
    const n = sorted.length;
    return {
      p10: sorted[Math.floor(0.10 * n)],
      p25: sorted[Math.floor(0.25 * n)],
      p50: sorted[Math.floor(0.50 * n)],
      p75: sorted[Math.floor(0.75 * n)],
      p90: sorted[Math.floor(0.90 * n)],
    };
  });

  const avgFailYear = failureYears.length
    ? Math.round(failureYears.reduce((a, b) => a + b, 0) / failureYears.length)
    : null;

  // FIRE number: corpus needed at retirement at SWR
  const annualExpenseAtRetirement =
    monthlyExpense * 12 * Math.pow(1 + inflation / 100, years);
  const fireNumber = annualExpenseAtRetirement / swr;

  return {
    successRate: successCount / runs,
    p10: finalCorpora[Math.floor(0.10 * runs)],
    p25: finalCorpora[Math.floor(0.25 * runs)],
    p50: finalCorpora[Math.floor(0.50 * runs)],
    p75: finalCorpora[Math.floor(0.75 * runs)],
    p90: finalCorpora[Math.floor(0.90 * runs)],
    chartData,
    avgFailYear,
    fireNumber,
    accumulationYears: years,
    totalYears,
  };
}
