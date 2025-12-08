import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'
import ItemDetail from './ItemDetail'

interface Item {
  id: string;
  title: string;
  description: string;
  date: string;
}

function ItemList() {
  const [allItems, setAllItems] = useState<Item[]>([])
  const [displayedItems, setDisplayedItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [displayCount, setDisplayCount] = useState(10)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [source1Response, source2Response] = await Promise.all([
          fetch('/source1.json'),
          fetch('/source2.json')
        ])

        const source1Data: Item[] = await source1Response.json()
        const source2Data: Item[] = await source2Response.json()

        const combined = [...source1Data, ...source2Data]

        const sorted = combined.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        setAllItems(sorted)
        setDisplayedItems(sorted.slice(0, 10))
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || displayedItems.length >= allItems.length) return

      const scrollHeight = document.documentElement.scrollHeight
      const scrollTop = document.documentElement.scrollTop
      const clientHeight = document.documentElement.clientHeight

      if (scrollTop + clientHeight >= scrollHeight - 100) {
        setLoadingMore(true)
        setTimeout(() => {
          const newCount = displayCount + 10
          setDisplayedItems(allItems.slice(0, newCount))
          setDisplayCount(newCount)
          setLoadingMore(false)
        }, 500)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [allItems, displayedItems.length, displayCount, loadingMore])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Infinite Scroll Demo</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Showing {displayedItems.length} of {allItems.length} items
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {displayedItems.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(`/item/${item.id}`)}
            style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#f9f9f9',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#000' }}>{item.title}</h2>
            <p style={{ margin: '0 0 8px 0', color: '#666' }}>{item.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999' }}>
              <span>ID: {item.id}</span>
              <span>{new Date(item.date).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
      {loadingMore && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          Loading more items...
        </div>
      )}
      {displayedItems.length >= allItems.length && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          All items loaded
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<ItemList />} />
      <Route path="/item/:id" element={<ItemDetail />} />
    </Routes>
  )
}

export default App
