import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import './App.css'
import ItemDetail from './ItemDetail'

interface Item {
  id: string;
  title: string;
  description: string;
  date: string;
}

function ItemList() {
  const [source1Items, setSource1Items] = useState<Item[]>([])
  const [source2Items, setSource2Items] = useState<Item[]>([])
  const [source1All, setSource1All] = useState<Item[]>([])
  const [source2All, setSource2All] = useState<Item[]>([])
  const [source1Page, setSource1Page] = useState(1)
  const [source2Page, setSource2Page] = useState(1)
  const [displayedItems, setDisplayedItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const shouldRestoreScroll = useRef(false)
  const savedScrollPosition = useRef(0)
  const listContainerRef = useRef<HTMLDivElement>(null)
  const isNavigatingAway = useRef(false)

  const updateURL = (s1Page: number, s2Page: number, displayCount: number, push: boolean = false) => {
    if (location.pathname !== '/' || isNavigatingAway.current) return
    const params = new URLSearchParams()
    params.set('s1', s1Page.toString())
    params.set('s2', s2Page.toString())
    params.set('count', displayCount.toString())

    if (push) {
      navigate(`/?${params.toString()}`)
    } else {
      setSearchParams(params, { replace: true })
    }
  }

  const handleItemClick = (itemId: string) => {
    isNavigatingAway.current = true
    const currentScroll = window.scrollY
    const params = new URLSearchParams(searchParams)
    params.set('scroll', currentScroll.toString())
    navigate(`/?${params.toString()}`)
    setTimeout(() => {
      navigate(`/item/${itemId}`)
    }, 0)
  }

  const fetchMoreFromSource = async (source: 1 | 2, page: number) => {
    const allData = source === 1 ? source1All : source2All
    const startIndex = (page - 1) * 10
    const nextBatch = allData.slice(startIndex, startIndex + 10)

    if (source === 1) {
      setSource1Items(prev => [...prev, ...nextBatch])
      setSource1Page(page)
    } else {
      setSource2Items(prev => [...prev, ...nextBatch])
      setSource2Page(page)
    }

    return nextBatch
  }

  useEffect(() => {
    isNavigatingAway.current = false

    const fetchInitialData = async () => {
      try {
        const [source1Response, source2Response] = await Promise.all([
          fetch('/source1.json'),
          fetch('/source2.json')
        ])

        const source1Data: Item[] = await source1Response.json()
        const source2Data: Item[] = await source2Response.json()

        setSource1All(source1Data)
        setSource2All(source2Data)

        const s1PageParam = parseInt(searchParams.get('s1') || '1', 10)
        const s2PageParam = parseInt(searchParams.get('s2') || '1', 10)
        const countParam = parseInt(searchParams.get('count') || '10', 10)
        const scrollParam = parseInt(searchParams.get('scroll') || '0', 10)

        const source1Count = s1PageParam * 10
        const source2Count = s2PageParam * 10

        const source1Items = source1Data.slice(0, source1Count)
        const source2Items = source2Data.slice(0, source2Count)

        setSource1Items(source1Items)
        setSource2Items(source2Items)
        setSource1Page(s1PageParam)
        setSource2Page(s2PageParam)

        const combined = [...source1Items, ...source2Items]
        const sorted = combined.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        const itemsToDisplay = Math.min(countParam, sorted.length)
        setDisplayedItems(sorted.slice(0, itemsToDisplay))

        if (!searchParams.get('s1') && !searchParams.get('s2')) {
          updateURL(s1PageParam, s2PageParam, itemsToDisplay)
        }

        if (scrollParam > 0) {
          shouldRestoreScroll.current = true
          savedScrollPosition.current = scrollParam
        }

        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  useEffect(() => {
    const handleScroll = async () => {
      if (loadingMore) return

      const scrollHeight = document.documentElement.scrollHeight
      const scrollTop = document.documentElement.scrollTop
      const clientHeight = document.documentElement.clientHeight

      if (scrollTop + clientHeight >= scrollHeight - 100) {
        setLoadingMore(true)

        let newSource1Page = source1Page
        let newSource2Page = source2Page
        let newSource1Items = source1Items
        let newSource2Items = source2Items

        const source1InDisplay = displayedItems.filter(item => item.id.startsWith('s1-')).length
        const source2InDisplay = displayedItems.filter(item => item.id.startsWith('s2-')).length
        const source1Buffer = source1Items.length - source1InDisplay
        const source2Buffer = source2Items.length - source2InDisplay

        if (source1Buffer < 10 && source1Page * 10 < source1All.length) {
          newSource1Page = source1Page + 1
          const batch = await fetchMoreFromSource(1, newSource1Page)
          newSource1Items = [...source1Items, ...batch]
        }
        if (source2Buffer < 10 && source2Page * 10 < source2All.length) {
          newSource2Page = source2Page + 1
          const batch = await fetchMoreFromSource(2, newSource2Page)
          newSource2Items = [...source2Items, ...batch]
        }

        const allFetchedItems = [...newSource1Items, ...newSource2Items]
        const sortedAll = allFetchedItems.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        const currentDisplayedCount = displayedItems.length
        const newDisplayCount = currentDisplayedCount + 10
        const newItems = sortedAll.slice(0, newDisplayCount)

        setDisplayedItems(newItems)
        updateURL(newSource1Page, newSource2Page, newItems.length, true)
        setLoadingMore(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [source1Items, source2Items, displayedItems, loadingMore, source1Page, source2Page, source1All, source2All])

  useEffect(() => {
    if (!loading && shouldRestoreScroll.current) {
      setTimeout(() => {
        window.scrollTo({
          top: savedScrollPosition.current,
          behavior: 'auto'
        })
        shouldRestoreScroll.current = false
      }, 100)
    }
  }, [loading, displayedItems])


  if (loading) {
    return <div>Loading...</div>
  }

  const totalItems = source1All.length + source2All.length
  const allItemsLoaded = displayedItems.length >= totalItems

  const source1InDisplay = displayedItems.filter(item => item.id.startsWith('s1-')).length
  const source2InDisplay = displayedItems.filter(item => item.id.startsWith('s2-')).length
  const source1Buffer = source1Items.length - source1InDisplay
  const source2Buffer = source2Items.length - source2InDisplay
  const source1Remaining = source1All.length - source1Items.length
  const source2Remaining = source2All.length - source2Items.length


  return (
    <div style={{ display: 'flex', padding: '20px', gap: '20px' }}>
      <div style={{
        position: 'sticky',
        top: 20,
        alignSelf: 'flex-start',
        width: '280px',
        backgroundColor: '#f5f5f5',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '13px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        height: 'fit-content',
        color: '#000'
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#333' }}>Stats</h3>

        <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #ddd' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Display</div>
          <div>Showing: {displayedItems.length} of {totalItems}</div>
          <div>Source 1: {source1InDisplay} items</div>
          <div>Source 2: {source2InDisplay} items</div>
        </div>

        <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #ddd' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Pages Fetched</div>
          <div>Source 1: Page {source1Page} ({source1Items.length} items)</div>
          <div>Source 2: Page {source2Page} ({source2Items.length} items)</div>
        </div>

        <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #ddd' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Buffer</div>
          <div>Source 1: {source1Buffer} items</div>
          <div>Source 2: {source2Buffer} items</div>
          <div style={{ marginTop: '5px', fontSize: '11px', color: '#666' }}>
            (fetched but not displayed)
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Remaining</div>
          <div>Source 1: {source1Remaining} items</div>
          <div>Source 2: {source2Remaining} items</div>
        </div>
      </div>

      <div ref={listContainerRef} style={{ flex: 1, maxWidth: '800px' }}>
        <h1>Infinite Scroll Demo</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {displayedItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item.id)}
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
      {allItemsLoaded && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          All items loaded
        </div>
      )}
      </div>
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
