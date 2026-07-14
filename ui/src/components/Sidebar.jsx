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

export default function Sidebar({ formData, onChange, onPredict, isLoading, canPredict }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.scrollArea}>
        <div className={styles.header}>
          <div className={styles.title}>Predictive Return Model</div>
          <span className={styles.badge}>AI-based output: Review with Caution</span>
        </div>

        <div className={styles.fields}>
          {FIELDS.map((field) => (
            <div className={styles.fieldGroup} key={field.key}>
              <label className={styles.label}>{field.label}</label>
              {field.type === 'select' ? (
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
          {isLoading ? 'Predicting...' : 'Predict Return Risk'}
        </button>
      </div>
    </aside>
  )
}
