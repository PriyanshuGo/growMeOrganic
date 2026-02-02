
import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Column } from 'primereact/column'


import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import { DataTable } from 'primereact/datatable'
import {
  PaginatorPrevPageLinkOptions,
  PaginatorNextPageLinkOptions,
  PaginatorCurrentPageReportOptions,
} from 'primereact/paginator'


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

type RowSelection = {
  pageNo: number;
  selectedItems: number[];
};

type BulkRowSelelction = {
  pageNo: number;
  count: number; // how many rows to select on this page
};



function App() {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState<number>(1)

  const [showBulkSelect, setShowBulkSelect] = useState(false);
  const [bulkSelectCount, setBulkSelectCount] = useState<number>(0);
  const bulkInputRef = useRef<number>(bulkSelectCount);

  const [globalSelection, setGlobalSelection] = useState<RowSelection[]>([]);
  const [globalBulkSelection, setGlobalBulkSelection] = useState<BulkRowSelelction[]>([]);
  const selectedIdsForCurrentPage = globalSelection.find(p => p.pageNo === page)?.selectedItems ?? [];
  const selectedRows = artworks.filter(a =>
    selectedIdsForCurrentPage.includes(a.id)
  );

  const onSelectionChange = (e: { value: Artwork[] }) => {
    const ids = e.value.map(a => a.id);

    setGlobalSelection(prev => {
      const pageEntry = prev.find(p => p.pageNo === page);
console.log(pageEntry,"page entery matched as per pageno. found in the globalselection array.")
      // if page already exists → update it
      if (pageEntry) {
        return prev.map(p =>
          p.pageNo === page
            ? { ...p, selectedItems: ids }
            : p
        );
      }

      // else → add new page entry
      return [...prev, { pageNo: page, selectedItems: ids }];
    });

    setGlobalBulkSelection(prev => {
      const bulkForPage = prev.find(p => p.pageNo === page);

      // no bulk active → do nothing
      if (!bulkForPage) return prev;

      // 🚨 user selected MORE rows than bulk planned
      if (ids.length > bulkForPage.count) {
        // bulk selection is no longer valid
        return [];
      }

      // ✅ user deselected rows → shrink bulk count
      return prev.map(p =>
        p.pageNo === page
          ? { ...p, count: ids.length }
          : p
      );
    });

    setBulkSelectCount(0);
  };


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


  // useEffect(() => {
  //   if (!bulkSelectCount || !pagination?.limit) return; // guard clause

  //   let remaining = bulkSelectCount;
  //   let currentPage = 1;
  //   const rowsPerPage = pagination.limit;
  //   const plan: { pageNo: number; count: number }[] = [];

  //   while (remaining > 0) {
  //     const count = Math.min(remaining, rowsPerPage);
  //     plan.push({ pageNo: currentPage, count });
  //     remaining -= count;
  //     currentPage += 1;
  //   }
  //   setGlobalBulkSelection(plan);
  //   setBulkSelectCount(0)
  //   setShowBulkSelect(false);


  // }, [bulkSelectCount, pagination?.limit]);
useEffect(() => {
  if (!bulkSelectCount || !pagination?.limit) return;

  // 🔥 RESET previous state
  setGlobalSelection([]);

  let remaining = bulkSelectCount;
  let currentPage = 1;
  const rowsPerPage = pagination.limit;
  const plan: BulkRowSelelction[] = [];

  while (remaining > 0) {
    const count = Math.min(remaining, rowsPerPage);
    plan.push({ pageNo: currentPage, count });
    remaining -= count;
    currentPage += 1;
  }

  setGlobalBulkSelection(plan);
  setBulkSelectCount(0);
  setShowBulkSelect(false);
}, [bulkSelectCount, pagination?.limit]);

  // useEffect(() => {
  //   if (!artworks.length) return;

  //   // find bulk plan for current page
  //   const bulkForPage = globalBulkSelection.find(
  //     p => p.pageNo === page
  //   );

  //   if (!bulkForPage) return;

  //   // pick first N rows from current page
  //   const idsToSelect = artworks
  //     .slice(0, bulkForPage.count)
  //     .map(a => a.id);

  //   setGlobalSelection(prev => {
  //     const existing = prev.find(p => p.pageNo === page);

  //     // update page if already exists
  //     if (existing) {
  //       return prev.map(p =>
  //         p.pageNo === page
  //           ? { ...p, selectedItems: idsToSelect }
  //           : p
  //       );
  //     }

  //     // else add new page entry
  //     return [...prev, { pageNo: page, selectedItems: idsToSelect }];
  //   });

  // }, [artworks, page, globalBulkSelection]);
useEffect(() => {
  if (!artworks.length) return;
  if (globalBulkSelection.length === 0) return;

  const bulkForPage = globalBulkSelection.find(p => p.pageNo === page);
  if (!bulkForPage) return;

  const idsToSelect = artworks
    .slice(0, bulkForPage.count)
    .map(a => a.id);

  setGlobalSelection(prev => {
    const existing = prev.find(p => p.pageNo === page);

    if (existing) {
      return prev.map(p =>
        p.pageNo === page 
          ? { ...p, selectedItems: idsToSelect }
          : p
      );
    }

    return [...prev, { pageNo: page, selectedItems: idsToSelect }];
  });
}, [artworks, page, globalBulkSelection]);


  return (
    <main className="app">
      <header className="app__header">
        <h1>Artworks</h1>
        <p>Data from The Art Institute of Chicago public API.</p>
      </header>

      {error && <div className="app__error">Error: {error}</div>}

      <p>
        Selected:{' '}
        <span className="selectedRow">
          {(() => {
            // CASE 1: No bulk selection → manual only
            if (globalBulkSelection.length === 0) {
              return globalSelection.reduce(
                (sum, p) => sum + p.selectedItems.length,
                0
              );
            }

            // CASE 2: Bulk + manual adjustments
            const bulkTotal = globalBulkSelection.reduce(
              (sum, p) => sum + p.count,
              0
            );

            const manualDelta = globalSelection.reduce((sum, sel) => {
              const bulk = globalBulkSelection.find(b => b.pageNo === sel.pageNo);
              if (!bulk) return sum;
              return sum + (sel.selectedItems.length - bulk.count);
            }, 0);

            return bulkTotal + manualDelta;
          })()}
        </span>{' '}
        rows
      </p>
      <DataTable
        value={artworks}
        dataKey="id"
        selection={selectedRows}
        selectionPageOnly={false}
        onSelectionChange={onSelectionChange}
        selectionMode="multiple"
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
          PrevPageLink: (options: PaginatorPrevPageLinkOptions) => (
            <button
              type="button"
              className={options.className}
              onClick={options.onClick}
              disabled={options.disabled}
            >
              Previous
            </button>
          ),
          NextPageLink: (options: PaginatorNextPageLinkOptions) => (
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
                    defaultValue={bulkSelectCount}
                    onChange={(e) => {
                      bulkInputRef.current = Number(e.target.value); // store in ref
                    }}
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: '6px',
                      boxSizing: 'border-box',
                    }}
                  />

                  <button
                    onClick={() => setBulkSelectCount(bulkInputRef.current)}

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


const reportTemplate = (options: PaginatorCurrentPageReportOptions) => {
  const boldStyle = { fontWeight: 700, color: '#000' }

  return (
    <span className="paginator-report">
      Showing <span style={boldStyle}>{options.first}</span> to{' '}
      <span style={boldStyle}>{options.last}</span> of{' '}
      <span style={boldStyle}>{options.totalRecords}</span> entries
    </span>
  )
}


const normalizeArtwork = (artwork: Artwork): Artwork => {
  return {
    ...artwork,
    inscriptions: artwork.inscriptions ?? 'N/A',
  }
}
