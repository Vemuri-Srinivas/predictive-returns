import { useState } from 'react'
import styles from './App.module.css'
import Sidebar from './components/Sidebar.jsx'
import MainContent from './components/MainContent.jsx'

export default function App() {
  const [formData, setFormData] = useState({
    customer_type: '',
    material_group: '',
    price: '',
    size: '',
    discount: '',
    quantity: '',
    season: '',
    brand: '',
    channel: '',
    customer_purchase_count: '',
  })
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setResult(null)
    setError(null)
  }

  const canPredict = Object.values(formData).every((v) => v !== '')

  async function handlePredict() {
    if (!canPredict || isLoading) return
    setIsLoading(true)
    setError(null)
    setResult(null)
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          discount: parseFloat(formData.discount),
          quantity: parseInt(formData.quantity),
          customer_purchase_count: parseInt(formData.customer_purchase_count),
        }),
      })
      if (!response.ok) throw new Error('Prediction failed. Please try again.')
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.layout}>
      <Sidebar
        formData={formData}
        onChange={handleChange}
        onPredict={handlePredict}
        isLoading={isLoading}
        canPredict={canPredict}
      />
      <MainContent
        result={result}
        isLoading={isLoading}
        error={error}
        formData={formData}
      />
    </div>
  )
}
