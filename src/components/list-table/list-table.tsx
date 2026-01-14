import { ReactNode } from 'react';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';

import { Scrollbar } from 'src/components/scrollbar';
import {
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
  TableNoData,
  TableEmptyRows,
  emptyRows,
} from 'src/components/table';

// TIPO DAS PROPS 
type Props = {
  table: any; 
  tableHead: any[];
  dataFiltered: any[];
  
  children: ReactNode; 
  
  filters?: ReactNode; 
  notFound?: boolean;
  onDeleteRows?: VoidFunction; 
};

export function CustomTable({table, tableHead, dataFiltered, children, filters, notFound, onDeleteRows,}:Props) {

    const { dense, page, rowsPerPage, order, orderBy, selected, onSelectAllRows, onSort, onChangePage, onChangeRowsPerPage } = table;

    return (
        <Card>
        {filters}

        <TableSelectedAction
            dense={dense}
            numSelected={selected.length}
            rowCount={dataFiltered.length}
            onSelectAllRows={(checked) =>
            onSelectAllRows(checked, dataFiltered.map((row: any) => row.id))
            }
            action={
            onDeleteRows && (
                <button onClick={onDeleteRows}>Delete</button>
            )
            }
        />

        <Scrollbar>
            <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <Table size={dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
                
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
                {children}

                <TableEmptyRows
                    height={dense ? 52 : 72}
                    emptyRows={emptyRows(page, rowsPerPage, dataFiltered.length)}
                />

                <TableNoData notFound={!!notFound} />
                </TableBody>
            </Table>
            </TableContainer>
        </Scrollbar>

        <TablePaginationCustom
            count={dataFiltered.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={onChangePage}
            onRowsPerPageChange={onChangeRowsPerPage}
        />
        </Card>
  );
}