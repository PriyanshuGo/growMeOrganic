
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

  useEffect(() => {
    const fetchArtworks = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await axios.get<ArtApiResponse>(
          `https://api.artic.edu/api/v1/artworks?page=${page}`,
        )
        setArtworks(response.data.data ?? [])
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

  return (
    <main className="app">
      <header className="app__header">
        <h1>Artworks</h1>
        <p>Data from The Art Institute of Chicago public API.</p>
      </header>

      {error && <div className="app__error">Error: {error}</div>}

      <DataTable
        value={artworks}
        loading={loading}
        stripedRows
        paginator
        lazy
        rows={pagination?.limit ?? 12}
        first={(page - 1) * (pagination?.limit ?? 12)}
        totalRecords={pagination?.total ?? 0}
        onPage={(e) => {
          console.log(e)
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

        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
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

