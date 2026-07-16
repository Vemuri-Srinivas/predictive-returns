import styles from './Sidebar.module.css'

const OPTIONS = {
  customer_type: ['new', 'repeat'],
  material_group: ['shirts', 'pants', 'shoes', 'dresses', 't-shirts', 'jackets', 'bags'],
  size: ['S', 'M', 'L', 'XL'],
  season: ['Spring', 'Summer', 'Autumn', 'Winter'],
  brand: ['BrandA', 'BrandB', 'BrandC', 'BrandD'],
  channel: ['Online', 'Retail Store', 'Marketplace'],
}

const FIELDS = [
  { key: 'customer_type', label: 'Customer Type', type: 'select' },
  { key: 'material_group', label: 'Material Group', type: 'select' },
  { key: 'price', label: 'Price (₹)', type: 'number', placeholder: 'e.g. 1999' },
  { key: 'size', label: 'Size', type: 'select' },
  { key: 'discount', label: 'Discount (%)', type: 'number', placeholder: 'e.g. 35.5' },
  { key: 'quantity', label: 'Quantity', type: 'number', placeholder: 'e.g. 2' },
  { key: 'season', label: 'Season', type: 'select' },
  { key: 'brand', label: 'Brand', type: 'select' },
  { key: 'channel', label: 'Channel', type: 'select' },
  { key: 'customer_purchase_count', label: 'Customer Purchase Count', type: 'number', placeholder: 'e.g. 3' },
]

function AppIcon() {
  return (
    <div className={styles.iconBox}>
      <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
        <rect width="38" height="38" rx="8" fill="#0070F2" />
        {/* Box/package outline */}
        <path d="M10 14l9-5 9 5v10l-9 5-9-5V14z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
        {/* Box middle line */}
        <path d="M10 14l9 5 9-5" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
        {/* Vertical center line */}
        <line x1="19" y1="19" x2="19" y2="29" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        {/* Return arrow curving around */}
        <path d="M23 10.5 Q28 8 28 13" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        <polyline points="26,12.5 28,13 27.5,10.8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  )
}

export default function Sidebar({ formData, onChange, onPredict, isLoading, canPredict }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.scrollArea}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <AppIcon />
            <div>
              <div className={styles.title}>Predictive Return Model</div>
            </div>
          </div>
        </div>

        <div className={styles.fields}>
          {FIELDS.map((field) => (
            <div className={styles.fieldGroup} key={field.key}>
              <label className={styles.label}>{field.label.toUpperCase()}</label>
              {field.type === 'select' ? (
                <div className={styles.selectWrapper}>
                  <select
                    className={styles.input}
                    value={formData[field.key]}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="">Select {field.label}</option>
                    {OPTIONS[field.key].map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <svg className={styles.selectArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              ) : (
                <input
                  className={styles.input}
                  type="number"
                  placeholder={field.placeholder}
                  value={formData[field.key]}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  disabled={isLoading}
                  min="0"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <button
          className={styles.predictBtn}
          onClick={onPredict}
          disabled={!canPredict || isLoading}
        >
          {isLoading ? (
            <>
              <span className={styles.btnSpinner} />
              Predicting...
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
                <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z" opacity="0.8" />
              </svg>
              Predict Return Risk
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
