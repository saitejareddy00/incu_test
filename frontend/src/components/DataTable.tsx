import {
  Box,
  CircularProgress,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  type SxProps,
  type Theme,
} from '@mui/material';

export interface Column<T> {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface Props<T extends { id: string }> {
  columns: Column<T>[];
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSort?: (key: string, dir: 'asc' | 'desc') => void;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  rowsPerPageOptions?: number[];
  loading?: boolean;
  getRowSx?: (row: T) => SxProps<Theme> | undefined;
}

/** Approximate table body height for a given row count (MUI `size="small"`). */
export function tableBodyMinHeight(rowCount: number): number {
  const header = 42;
  const row = 41;
  return header + Math.max(rowCount, 1) * row;
}

export function TableLoadingSkeleton({
  pageSize,
  columnCount,
}: {
  pageSize: number;
  columnCount: number;
}) {
  return (
    <Box data-testid="table-loading-skeleton">
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ minHeight: tableBodyMinHeight(pageSize) }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              {Array.from({ length: columnCount }).map((_, i) => (
                <TableCell key={i}>
                  <Skeleton variant="text" width={i === 0 ? 72 : 56} height={20} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: pageSize }).map((_, rowIdx) => (
              <TableRow key={rowIdx}>
                {Array.from({ length: columnCount }).map((_, colIdx) => (
                  <TableCell key={colIdx}>
                    <Skeleton variant="text" height={24} width={colIdx === 0 ? '70%' : '50%'} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, py: 1 }}>
        <Skeleton variant="rectangular" width={280} height={32} sx={{ borderRadius: 1 }} />
      </Box>
    </Box>
  );
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSort,
  sortBy,
  sortDir = 'asc',
  rowsPerPageOptions = [10, 20, 50],
  loading = false,
  getRowSx,
}: Props<T>) {
  function handleSort(key: string) {
    if (!onSort) return;
    const nextDir = sortBy === key && sortDir === 'asc' ? 'desc' : 'asc';
    onSort(key, nextDir);
  }

  const bodyMinHeight = tableBodyMinHeight(Math.max(rows.length, pageSize));

  return (
    <Box>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ position: 'relative', minHeight: bodyMinHeight }}
      >
        {loading && (
          <Box
            data-testid="table-loading-overlay"
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.72)',
              zIndex: 1,
            }}
          >
            <CircularProgress size={36} aria-label="Loading table data" />
          </Box>
        )}
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {col.sortable && onSort ? (
                    <TableSortLabel
                      active={sortBy === col.key}
                      direction={sortBy === col.key ? sortDir : 'asc'}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover sx={getRowSx?.(row)}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page - 1}
        rowsPerPage={pageSize}
        rowsPerPageOptions={rowsPerPageOptions}
        onPageChange={(_e, newPage) => onPageChange(newPage + 1)}
        onRowsPerPageChange={(e) => {
          const newSize = parseInt(e.target.value, 10);
          onPageSizeChange?.(newSize);
        }}
      />
    </Box>
  );
}
