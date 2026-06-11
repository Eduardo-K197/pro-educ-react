import { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';

import { varAlpha } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import {
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
  TableNoData,
  TableEmptyRows,
  TableSkeleton,
  emptyRows,
} from 'src/components/table';

// ----------------------------------------------------------------------

type Props = {
  table: any;
  tableHead: any[];
  dataFiltered: any[];
  children: ReactNode;
  filters?: ReactNode;
  notFound?: boolean;
  loading?: boolean;
  onDeleteRows?: VoidFunction;
  totalCount?: number;
  rowsPerPageOptions?: number[];
};

export function CustomTable({
  table,
  tableHead,
  dataFiltered,
  children,
  filters,
  notFound,
  loading,
  onDeleteRows,
  totalCount,
  rowsPerPageOptions = [10, 25, 50],
}: Props) {
  const {
    dense,
    page,
    rowsPerPage,
    order,
    orderBy,
    selected,
    onSelectAllRows,
    onSort,
    onChangePage,
    onChangeRowsPerPage,
  } = table;

  const isServerSide = totalCount !== undefined;
  const paginationCount = isServerSide ? totalCount : dataFiltered.length;
  const emptyRowCount = isServerSide
    ? emptyRows(0, rowsPerPage, dataFiltered.length)
    : emptyRows(page, rowsPerPage, dataFiltered.length);

  const from = paginationCount === 0 ? 0 : page * rowsPerPage + 1;
  const to = Math.min((page + 1) * rowsPerPage, paginationCount);

  return (
    <Card
      sx={{
        borderRadius: 2,
        border: (theme) => `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
        boxShadow: (theme) =>
          `0 0 2px 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}, 0 4px 24px -4px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
      }}
    >
      {/* Filters slot */}
      {filters && (
        <>
          {filters}
          <Divider />
        </>
      )}

      {/* Loading bar */}
      <Box sx={{ height: 2 }}>
        {loading && <LinearProgress sx={{ height: 2, borderRadius: 0 }} />}
      </Box>

      {/* Selected action bar */}
      <TableSelectedAction
        dense={dense}
        numSelected={selected.length}
        rowCount={dataFiltered.length}
        onSelectAllRows={(checked) =>
          onSelectAllRows(checked, dataFiltered.map((row: any) => row.id))
        }
        action={
          onDeleteRows && (
            <Tooltip title="Excluir selecionados">
              <IconButton color="error" onClick={onDeleteRows}>
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          )
        }
      />

      <Scrollbar>
        <TableContainer sx={{ position: 'relative', overflow: 'unset', minWidth: 800 }}>
          <Table
            size={dense ? 'small' : 'medium'}
            sx={{
              '& .MuiTableHead-root .MuiTableCell-root': {
                bgcolor: (theme) => varAlpha(theme.vars.palette.primary['mainChannel'], 0.04),
                color: 'text.primary',
                fontWeight: 700,
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                whiteSpace: 'nowrap',
                py: dense ? 1 : 1.5,
                borderBottom: (theme) =>
                  `2px solid ${varAlpha(theme.vars.palette.primary['mainChannel'], 0.12)}`,
              },
              '& .MuiTableBody-root .MuiTableRow-root': {
                transition: 'background-color 0.15s',
                '&:hover': {
                  bgcolor: (theme) => varAlpha(theme.vars.palette.primary['mainChannel'], 0.04),
                },
                '&:last-child .MuiTableCell-root': { borderBottom: 0 },
              },
              '& .MuiTableCell-root': {
                borderBottom: (theme) =>
                  `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
              },
            }}
          >
            <TableHeadCustom
              order={order}
              orderBy={orderBy}
              headLabel={tableHead}
              rowCount={dataFiltered.length}
              numSelected={selected.length}
              onSort={onSort}
              onSelectAllRows={(checked) =>
                onSelectAllRows(checked, dataFiltered.map((row: any) => row.id))
              }
            />

            <TableBody>
              {loading
                ? Array.from({ length: rowsPerPage > 5 ? 5 : rowsPerPage }).map((_, i) => (
                    <TableSkeleton key={i} />
                  ))
                : children}

              {!loading && (
                <TableEmptyRows height={dense ? 52 : 72} emptyRows={emptyRowCount} />
              )}

              <TableNoData notFound={!!notFound && !loading} />
            </TableBody>
          </Table>
        </TableContainer>
      </Scrollbar>

      {/* Footer */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          borderTop: (theme) => `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
          bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.02),
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {onDeleteRows && selected.length > 0 && (
            <Button
              size="small"
              color="error"
              variant="soft"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" width={16} />}
              onClick={onDeleteRows}
            >
              Excluir {selected.length} selecionado(s)
            </Button>
          )}

          {!loading && paginationCount > 0 && (
            <Typography variant="caption" color="text.disabled">
              Exibindo{' '}
              <Chip
                size="small"
                label={`${from}–${to}`}
                sx={{ height: 18, fontSize: 11, fontWeight: 600, px: 0.25 }}
              />{' '}
              de {paginationCount}
            </Typography>
          )}
        </Stack>

        <TablePaginationCustom
          count={paginationCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={onChangePage}
          onRowsPerPageChange={onChangeRowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
        />
      </Stack>
    </Card>
  );
}
