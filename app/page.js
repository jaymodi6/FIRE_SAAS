"use client";

import { useState, useCallback } from "react";
import styles from "./page.module.css";

const DEFAULT_INPUTS = {
  currentAge: 30,
  retirementAge: 55,
  lifeExpectancy: 85,
  monthlyExpense: 50000,
  currentCorpus: 2000000,
  monthlySIP: 30000,
  sipStepUpPct: 10,
  expectedReturn: 12,
  returnStdDev: 15,
  inflation: 6,
  inflationStdDev: 2,
  safeWithdrawalRate: 4,
  runs: 3000,
};

function formatCrore(val) {
  if (val === null || val === undefined || isNaN(val)) return "—";
  if (Math.abs(val) >= 1e7) return `₹${(val / 1e7).toFixed(2)}Cr`;
  if (Math.abs(val) >= 1e5) return `₹${(val / 1e5).toFixed(2)}L`;
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
}

function SuccessGauge({ rate }) {
  const pct = Math.round(rate * 100);
  const color = pct >= 85 ? "#22c55e" : pct >= 65 ? "#f59e0b" : "#ef4444";
  const label = pct >= 85 ? "Strong" : pct >= 65 ? "Moderate" : "Risky";
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className={styles.gaugeWrap}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#1e293b" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text x="70" y="65" textAnchor="middle" fill={color} fontSize="26" fontWeight="700" fontFamily="'DM Mono', monospace">{pct}%</text>
        <text x="70" y="85" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="system-ui">{label}</text>
      </svg>
      <p className={styles.gaugeLabel}>Success Rate</p>
    </div>
  );
}

function MiniChart({ chartData, accumulationYears, totalYears }) {
  if (!chartData || chartData.length === 0) return null;

  const W = 700, H = 260, PAD = { top: 20, right: 20, bottom: 40, left: 70 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const allVals = chartData.flatMap(d => [d.p10, d.p90]).filter(v => v > 0 && isFinite(v));
  const maxV = Math.max(...allVals) * 1.05;
  const minV = 0;

  const scaleX = (i) => PAD.left + (i / (totalYears)) * innerW;
  const scaleY = (v) => PAD.top + innerH - ((v - minV) / (maxV - minV)) * innerH;

  const band = (key1, key2) =>
    chartData.map((d, i) => `${scaleX(i)},${scaleY(d[key1])}`).join(" L ") +
    " L " +
    [...chartData].reverse().map((d, i) => `${scaleX(totalYears - i)},${scaleY(d[key2])}`).join(" L ");

  const line = (key) =>
    chartData.map((d, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)},${scaleY(d[key])}`).join(" ");

  const retireLine = scaleX(accumulationYears);

  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = minV + ((maxV - minV) * i) / yTicks;
    return { v, y: scaleY(v) };
  });

  const xLabels = Array.from({ length: 6 }, (_, i) => {
    const idx = Math.round((i / 5) * totalYears);
    return { idx, x: scaleX(idx) };
  });

  return (
    <div className={styles.chartWrap}>
      <p className={styles.chartTitle}>Corpus Projection (Monte Carlo Bands)</p>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
        <defs>
          <linearGradient id="bandGrad90" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="bandGrad75" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yLabels.map(({ v, y }) => (
          <g key={v}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#1e293b" strokeWidth="1" />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill="#475569" fontSize="10" fontFamily="'DM Mono', monospace">
              {formatCrore(v)}
            </text>
          </g>
        ))}

        {/* X labels */}
        {xLabels.map(({ idx, x }) => (
          <text key={idx} x={x} y={H - 8} textAnchor="middle" fill="#475569" fontSize="10" fontFamily="system-ui">Yr {idx}</text>
        ))}

        {/* Retirement line */}
        <line x1={retireLine} y1={PAD.top} x2={retireLine} y2={H - PAD.bottom} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5,3" />
        <text x={retireLine + 4} y={PAD.top + 14} fill="#f59e0b" fontSize="10" fontFamily="system-ui">Retire</text>

        {/* Bands */}
        <path d={`M ${band("p10", "p90")}`} fill="url(#bandGrad90)" />
        <path d={`M ${band("p25", "p75")}`} fill="url(#bandGrad75)" />

        {/* Lines */}
        <path d={line("p10")} fill="none" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.4" />
        <path d={line("p90")} fill="none" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.4" />
        <path d={line("p50")} fill="none" stroke="#60a5fa" strokeWidth="2.5" />
      </svg>
      <div className={styles.chartLegend}>
        <span><span style={{ background: "#60a5fa", width: 20, height: 3, display: "inline-block", verticalAlign: "middle", marginRight: 4 }} />Median (P50)</span>
        <span style={{ color: "#475569" }}>Shaded bands: P10–P90 range</span>
      </div>
    </div>
  );
}

function InputRow({ label, name, value, onChange, min, max, step, prefix, suffix, note }) {
  return (
    <div className={styles.inputRow}>
      <div className={styles.inputMeta}>
        <label htmlFor={name}>{label}</label>
        {note && <span className={styles.inputNote}>{note}</span>}
      </div>
      <div className={styles.inputField}>
        {prefix && <span className={styles.inputAdorn}>{prefix}</span>}
        <input
          id={name} name={name} type="number"
          value={value} min={min} max={max} step={step}
          onChange={e => onChange(name, Number(e.target.value))}
        />
        {suffix && <span className={styles.inputAdorn}>{suffix}</span>}
      </div>
    </div>
  );
}

export default function Home() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = useCallback((name, value) => {
    setInputs(prev => ({ ...prev, [name]: value }));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const years = inputs.retirementAge - inputs.currentAge;
    const postYears = inputs.lifeExpectancy - inputs.retirementAge;

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...inputs, years, postYears }),
      });
      const json = await res.json();
      setResult(json);
    } catch (err) {
      setError("Simulation failed. Please check inputs.");
    } finally {
      setLoading(false);
    }
  }

  const years = inputs.retirementAge - inputs.currentAge;
  const postYears = inputs.lifeExpectancy - inputs.retirementAge;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◈</span>
          <span>FIRE<span className={styles.logoAccent}>calc</span></span>
        </div>
        <p className={styles.tagline}>Monte Carlo retirement planner · {inputs.runs.toLocaleString()} simulations</p>
      </header>

      <main className={styles.main}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Age Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Timeline</h2>
            <div className={styles.inputGrid}>
              <InputRow label="Current Age" name="currentAge" value={inputs.currentAge} onChange={handleChange} min={18} max={60} step={1} suffix="yrs" />
              <InputRow label="Retirement Age" name="retirementAge" value={inputs.retirementAge} onChange={handleChange} min={inputs.currentAge + 1} max={70} step={1} suffix="yrs" note={`${years} yrs to retire`} />
              <InputRow label="Life Expectancy" name="lifeExpectancy" value={inputs.lifeExpectancy} onChange={handleChange} min={inputs.retirementAge + 1} max={100} step={1} suffix="yrs" note={`${postYears} yrs in retirement`} />
            </div>
          </section>

          {/* Money Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Finances</h2>
            <div className={styles.inputGrid}>
              <InputRow label="Current Corpus" name="currentCorpus" value={inputs.currentCorpus} onChange={handleChange} min={0} step={100000} prefix="₹" note="Existing investments" />
              <InputRow label="Monthly SIP" name="monthlySIP" value={inputs.monthlySIP} onChange={handleChange} min={0} step={1000} prefix="₹" note="Monthly investment" />
              <InputRow label="SIP Step-up" name="sipStepUpPct" value={inputs.sipStepUpPct} onChange={handleChange} min={0} max={30} step={1} suffix="% p.a." note="Annual increase in SIP" />
              <InputRow label="Monthly Expense" name="monthlyExpense" value={inputs.monthlyExpense} onChange={handleChange} min={0} step={1000} prefix="₹" note="Today's spending" />
            </div>
          </section>

          {/* Market Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Market Assumptions</h2>
            <div className={styles.inputGrid}>
              <InputRow label="Expected Return" name="expectedReturn" value={inputs.expectedReturn} onChange={handleChange} min={1} max={25} step={0.5} suffix="% p.a." note="Mean equity return" />
              <InputRow label="Return Volatility" name="returnStdDev" value={inputs.returnStdDev} onChange={handleChange} min={1} max={40} step={1} suffix="% σ" note="Standard deviation" />
              <InputRow label="Inflation" name="inflation" value={inputs.inflation} onChange={handleChange} min={1} max={15} step={0.5} suffix="% p.a." />
              <InputRow label="Infl. Volatility" name="inflationStdDev" value={inputs.inflationStdDev} onChange={handleChange} min={0} max={5} step={0.5} suffix="% σ" />
              <InputRow label="Safe Withdrawal" name="safeWithdrawalRate" value={inputs.safeWithdrawalRate} onChange={handleChange} min={2} max={8} step={0.25} suffix="% SWR" note="Annual draw from corpus" />
            </div>
          </section>

          <button type="submit" className={styles.runBtn} disabled={loading}>
            {loading ? (
              <><span className={styles.spinner} /> Running {inputs.runs.toLocaleString()} simulations…</>
            ) : (
              <><span>▶</span> Run Simulation</>
            )}
          </button>

          {error && <p className={styles.error}>{error}</p>}
        </form>

        {result && (
          <div className={styles.results}>
            <div className={styles.resultsHeader}>
              <SuccessGauge rate={result.successRate} />
              <div className={styles.fireNumber}>
                <p className={styles.fireLabel}>FIRE Number (at retirement)</p>
                <p className={styles.fireValue}>{formatCrore(result.fireNumber)}</p>
                <p className={styles.fireSubLabel}>Corpus needed to sustain expenses at {inputs.safeWithdrawalRate}% SWR</p>
              </div>
            </div>

            <div className={styles.statsGrid}>
              {[
                { label: "Pessimistic (P10)", val: result.p10, color: "#ef4444" },
                { label: "Median (P50)", val: result.p50, color: "#60a5fa" },
                { label: "Optimistic (P90)", val: result.p90, color: "#22c55e" },
              ].map(({ label, val, color }) => (
                <div key={label} className={styles.statCard} style={{ borderColor: color + "33" }}>
                  <p className={styles.statLabel}>{label}</p>
                  <p className={styles.statValue} style={{ color }}>{formatCrore(val)}</p>
                  <p className={styles.statSub}>Final corpus at age {inputs.lifeExpectancy}</p>
                </div>
              ))}
            </div>

            {result.avgFailYear && (
              <div className={styles.warningCard}>
                ⚠️ In failing scenarios, corpus depletes around year <strong>{result.avgFailYear}</strong> (age ~{inputs.currentAge + result.avgFailYear}). Consider increasing SIP or reducing expenses.
              </div>
            )}

            <MiniChart
              chartData={result.chartData}
              accumulationYears={result.accumulationYears}
              totalYears={result.totalYears}
            />
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        For educational purposes only. Not financial advice. Results based on historical volatility assumptions.
      </footer>
    </div>
  );
}
