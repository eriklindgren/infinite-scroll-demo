import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

interface Item {
  id: string;
  title: string;
  description: string;
  date: string;
}

function ItemDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const [source1Response, source2Response] = await Promise.all([
          fetch('/source1.json'),
          fetch('/source2.json')
        ])

        const source1Data: Item[] = await source1Response.json()
        const source2Data: Item[] = await source2Response.json()

        const allItems = [...source1Data, ...source2Data]
        const foundItem = allItems.find(item => item.id === id)

        setItem(foundItem || null)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching item:', error)
        setLoading(false)
      }
    }

    fetchItem()
  }, [id])

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  if (!item) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Item not found</h1>
        <button onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>Back to list</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: '20px',
          display: 'inline-block',
          background: 'none',
          border: 'none',
          color: '#0066cc',
          textDecoration: 'underline',
          cursor: 'pointer',
          fontSize: '16px',
          padding: 0
        }}
      >
        ← Back to list
      </button>
      <div style={{
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '24px',
        backgroundColor: '#f9f9f9',
        marginTop: '20px'
      }}>
        <h1 style={{ margin: '0 0 16px 0', color: '#000' }}>{item.title}</h1>
        <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '16px' }}>{item.description}</p>
        <div style={{ fontSize: '14px', color: '#999' }}>
          <div>ID: {item.id}</div>
          <div>Date: {new Date(item.date).toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}

export default ItemDetail
