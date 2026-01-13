
import { useEffect, useState } from 'react'
import axios from 'axios'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'


import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'

type Artwork = {
  id: number
  title: string
  place_of_origin: string | null
  artist_display: string | null
  inscriptions: string | null
  date_start: number | null
  date_end: number | null
}

type ArtApiResponse = {
  data: Artwork[]
  pagination: Pagination
}

type Pagination = {
  current_page: number
  limit: number
  total: number
  total_pages: number
  offset: number
  next_url: string
  prev_url: string
}
function App() {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState<number>(1)

  const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([])

  const [showBulkSelect, setShowBulkSelect] = useState(false);
  const [bulkSelectCount, setBulkSelectCount] = useState<number>(0);
  const [remainingRows, setRemainingRows] = useState<number>(0);


  const handleBulkSelect = () => {
    if (!bulkSelectCount || bulkSelectCount <= 0) return;

    setSelectedArtworks(prev => {
      const newSelection: Artwork[] = [...prev];

      for (let i = 0; i < artworks.length && newSelection.length < bulkSelectCount; i++) {
        if (!newSelection.find(a => a.id === artworks[i].id)) {
          newSelection.push(artworks[i]);
        }
      }

      const stillRemaining = bulkSelectCount - newSelection.length;
      setRemainingRows(stillRemaining > 0 ? stillRemaining : 0);

      return newSelection;
    });

    setShowBulkSelect(false);
  };

  useEffect(() => {
    if (remainingRows <= 0) return;

    setSelectedArtworks(prev => {
      const newSelection: Artwork[] = [...prev];

      for (let i = 0; i < artworks.length && newSelection.length < prev.length + remainingRows; i++) {
        if (!newSelection.find(a => a.id === artworks[i].id)) {
          newSelection.push(artworks[i]);
        }
      }

      const consumed = newSelection.length - prev.length;
      setRemainingRows(r => r - consumed);

      return newSelection;
    });
  }, [artworks]);



  useEffect(() => {
    const fetchArtworks = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await axios.get<ArtApiResponse>(
          `https://api.artic.edu/api/v1/artworks?page=${page}`,
        )
        const normalizedData = (response.data.data ?? []).map(normalizeArtwork)
        setArtworks(normalizedData)
        setPagination(response.data.pagination ?? null)
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.status
              ? `Request failed with status ${err.response.status}`
              : err.message,
          )
        } else {
          setError(err instanceof Error ? err.message : 'Something went wrong')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchArtworks()
  }, [page])

  const onSelectionChange = (e: any) => {
    const newSelection = e.value as Artwork[]

    // HEADER CHECKBOX CHECKED (select all on current page)
    if (newSelection.length === artworks.length) {
      setSelectedArtworks(prev => [...prev, ...newSelection].reduce((acc: Artwork[], currentValue) => {
        if (!acc.find(a => a.id === currentValue.id)) {
          acc.push(currentValue)
        }
        return acc
      }, []));

      setBulkSelectCount(0);
      return
    }
    // HEADER CHECKBOX UNCHECKED (unselect all on current page)
    if (newSelection.length === 0) {
      setSelectedArtworks(prev => prev.reduce((acc: Artwork[], currentValue) => {
        if (!artworks.find(a => a.id === currentValue.id)) {
          acc.push(currentValue)
        } return acc
      }, []));
      setBulkSelectCount(0);
      return
    }

    // NORMAL ROW SELECTION / DESELECTION
    console.log(newSelection)
    setSelectedArtworks(newSelection)
  }

  return (
    <main className="app">
      <header className="app__header">
        <h1>Artworks</h1>
        <p>Data from The Art Institute of Chicago public API.</p>
      </header>

      {error && <div className="app__error">Error: {error}</div>}

      <p>Selected : <span className='selectedRow'>{bulkSelectCount > 0 ? bulkSelectCount : selectedArtworks.length}</span> rows</p>
      <DataTable

        value={artworks}
        dataKey="id"
        selection={selectedArtworks}
        selectionPageOnly={false}
        onSelectionChange={onSelectionChange}
        loading={loading}
        stripedRows
        paginator
        lazy
        rows={pagination?.limit ?? 12}
        first={(page - 1) * (pagination?.limit ?? 12)}
        totalRecords={pagination?.total ?? 0}
        onPage={(e) => {
          if (e.page !== undefined) {
            setPage(e.page + 1)
          }
        }}
        paginatorTemplate={{
          layout: 'CurrentPageReport PrevPageLink PageLinks NextPageLink',
          CurrentPageReport: reportTemplate,
          PrevPageLink: (options: any) => (
            <button
              type="button"
              className={options.className}
              onClick={options.onClick}
              disabled={options.disabled}
            >
              Previous
            </button>
          ),
          NextPageLink: (options: any) => (
            <button
              type="button"
              className={options.className}
              onClick={options.onClick}
              disabled={options.disabled}
            >
              Next
            </button>
          ),
        }}
        emptyMessage="No artworks found."
      >

        <Column
          selectionMode="multiple"
          headerStyle={{ width: '3rem', position: 'relative' }}
          header={
            <div style={{ position: 'relative' }}>
              <i className="pi pi-angle-down" style={{ fontSize: '2rem' }} onClick={() => setShowBulkSelect(!showBulkSelect)}></i>

              {showBulkSelect && (
                <div
                  style={{
                    position: 'absolute',
                    top: '1.8rem',
                    left: 0,
                    width: '260px',
                    padding: '12px',
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                  }}
                >
                  <strong style={{ display: 'block', marginBottom: 6 }}>
                    Select Multiple Rows
                  </strong>

                  <label style={{ fontSize: 12, color: '#555' }}>
                    Enter number of rows to select across all pages
                  </label>

                  <input
                    type="number"
                    value={bulkSelectCount}
                    onChange={(e) => setBulkSelectCount(Number(e.target.value))}
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: '6px',
                      boxSizing: 'border-box',
                    }}
                  />

                  <button
                    onClick={handleBulkSelect}
                    style={{
                      marginTop: 10,
                      width: '100%',
                      padding: '8px',
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Select
                  </button>
                </div>
              )}
            </div>
          }
        />
        <Column field="title" header="Title" />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Start Date" />
        <Column field="date_end" header="End Date" />
      </DataTable>
    </main>
  )
}

export default App


export const reportTemplate = (options: any) => {
  const boldStyle = { fontWeight: 700, color: '#000' }

  return (
    <span className="paginator-report">
      Showing <span style={boldStyle}>{options.first}</span> to{' '}
      <span style={boldStyle}>{options.last}</span> of{' '}
      <span style={boldStyle}>{options.totalRecords}</span> entries
    </span>
  )
}


export const normalizeArtwork = (artwork: Artwork): Artwork => {
  return {
    ...artwork,
    inscriptions: artwork.inscriptions ?? 'N/A',
  }
}
