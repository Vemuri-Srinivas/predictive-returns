import styles from './MainContent.module.css'

function RiskGauge({ probability }) {
  const pct = Math.round(probability * 100)
  const isHigh = pct >= 50
  const color = isHigh ? 'var(--color-red)' : 'var(--color-green)'

  return (
    <div className={styles.gaugeWrapper}>
      <div className={styles.gaugeLabel}>Return Risk Probability</div>
      <div className={styles.gaugeTrack}>
        <div
          className={styles.gaugeFill}
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className={styles.gaugePct} style={{ color }}>{pct}%</div>
    </div>
  )
}

function RiskBadge({ flag }) {
  return (
    <div className={flag === 1 ? styles.badgeHigh : styles.badgeLow}>
      {flag === 1 ? 'High Risk — Likely to be Returned' : 'Low Risk — Unlikely to be Returned'}
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className={styles.summaryRow}>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={styles.summaryValue}>{value}</span>
    </div>
  )
}

export default function MainContent({ result, isLoading, error, formData }) {
  if (isLoading) {
    return (
      <main className={styles.main}>
        <div className={styles.centered}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Analyzing order...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className={styles.main}>
        <div className={styles.centered}>
          <div className={styles.errorBox}>{error}</div>
        </div>
      </main>
    )
  }

  if (!result) {
    return (
      <main className={styles.main}>
        <div className={styles.centered}>
          <div className={styles.emptyIcon}>📦</div>
          <div className={styles.emptyTitle}>No Prediction Yet</div>
          <div className={styles.emptySubtitle}>Fill in the order details and click Predict Return Risk</div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Prediction Result</div>
          <RiskBadge flag={result.return_risk_flag} />
          <RiskGauge probability={result.return_risk_prob} />
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Order Summary</div>
          <SummaryRow label="Customer Type" value={formData.customer_type} />
          <SummaryRow label="Material Group" value={formData.material_group} />
          <SummaryRow label="Price" value={`₹${formData.price}`} />
          <SummaryRow label="Size" value={formData.size} />
          <SummaryRow label="Discount" value={`${formData.discount}%`} />
          <SummaryRow label="Quantity" value={formData.quantity} />
          <SummaryRow label="Season" value={formData.season} />
          <SummaryRow label="Brand" value={formData.brand} />
          <SummaryRow label="Channel" value={formData.channel} />
          <SummaryRow label="Purchase Count" value={formData.customer_purchase_count} />
        </div>
      </div>
    </main>
  )
}
