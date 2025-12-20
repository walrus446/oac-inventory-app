import React, { useState, useEffect, useMemo } from 'react'
import { alpha } from '@mui/material/styles';
import { collection, onSnapshot, query } from 'firebase/firestore'
import { firestore } from '@/firebase'
import { Table, TableBody, TableCell, TableContainer, TableHead, 
    TablePagination, TableRow, Paper, Typography, Box, Collapse, IconButton,
    Toolbar, TableSortLabel, Tooltip, FormControlLabel, Switch} from '@mui/material'
import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { visuallyHidden } from '@mui/utils';

interface Data {
    id: string;
    name?: string;
    oac_num?: number;
    details?: string;
    in_stock?: boolean;
    leader_signout?: string;
    loaned?: boolean;
    loaned_to?: string;
}

interface DetailRow {
    id: string;
    _isDetail: true;
    parentId: string;
    details?: string;
}

interface ColumnData {
    dataKey: keyof Data;
    label: string;
    numeric?: boolean;
    width?: number;
}

const columns: ColumnData[] = [
    { width: 200, label: 'Item Name', dataKey: 'name' },
    { width: 120, label: 'OAC Number', dataKey: 'oac_num' },
    { width: 120, label: 'Availability', dataKey: 'in_stock' },
    { width: 160, label: 'Trip Leader', dataKey: 'leader_signout' },
    { width: 120, label: 'Loaned?', dataKey: 'loaned' },
    { width: 160, label: 'Loaned To', dataKey: 'loaned_to' },
]

const rowsInitial: Data[] = []


const VirtuosoTableComponents: TableComponents<Data> = {
    Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
        <TableContainer component={Paper} {...props} ref={ref} sx={{backgroundColor: '#FFFFFF00'}}/>
    )),
    Table: (props) => (
        <Table {...props} sx={{ borderCollapse: 'separate', tableLayout: 'fixed',backgroundColor: '#808080'}} />
    ),
    TableRow: (React.forwardRef<HTMLTableRowElement, any>((props, ref) => (
        <TableRow {...props} ref={ref} />
    )) as unknown) as any,
    TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
        <TableBody {...props} ref={ref} />
    )),
}

export default function ReactVirtualizedTable(props: { table: string; }) {
    const { table } = props
    const [rows, setRows] = useState<Data[]>(rowsInitial)
    // rows actually passed to Virtuoso (includes inserted detail rows)
    const [displayRows, setDisplayRows] = useState<Array<Data | DetailRow>>([])

    const [sortConfig, setSortConfig] = useState<{ key: keyof Data; direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending'})

    const sortData = (key: keyof Data) => {
        let direction: 'ascending' | 'descending' = 'ascending'
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending'
        }

        const sortedRows = [...rows].sort((a, b) => {
            const va = a[key]
            const vb = b[key]

            if (va == null && vb == null) return 0
            if (va == null) return direction === 'ascending' ? -1 : 1
            if (vb == null) return direction === 'ascending' ? 1 : -1

            if (typeof va === 'number' && typeof vb === 'number') {
                return direction === 'ascending' ? va - vb : vb - va
            }

            const sa = String(va).toLowerCase()
            const sb = String(vb).toLowerCase()
            if (sa < sb) return direction === 'ascending' ? -1 : 1
            if (sa > sb) return direction === 'ascending' ? 1 : -1
            return 0
        })

        setRows(sortedRows)
        // when sorting, collapse details and set displayRows to sorted base rows
        setDisplayRows(sortedRows)
        setSortConfig({ key, direction })
    }

    useEffect(() => {
        const q = query(collection(firestore, table))
        const unsubscribe = onSnapshot(q, (snap) => {
            const items: Data[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
            // sort immediately by name (ascending)
            const sortedItems = [...items].sort((a, b) => {
                const sa = String(a.name ?? '').toLowerCase()
                const sb = String(b.name ?? '').toLowerCase()
                if (sa < sb) return -1
                if (sa > sb) return 1
                return 0
            })
            setRows(sortedItems)
            setDisplayRows(sortedItems)
            setSortConfig({ key: 'name', direction: 'ascending' })
        })
        return () => unsubscribe()
    }, [table])

    // fixed header content now uses parent state and sortData
    const fixedHeaderContent = () => {
        return (
            <TableRow sx={{backgroundColor: '#bdb7ab'}}>
                <TableCell style={{ width: 48 }} />
                {columns.map((column) => (
                    <TableCell 
                     key={column.dataKey as string} 
                     variant='head'
                     onClick={() => sortData(column.dataKey)}
                     align={column.numeric || false ? 'right' : 'left'}
                     style={{ width: column.width }}
                     >
                        {column.label}
                        {sortConfig.key === column.dataKey && (
                            <span>{sortConfig.direction === 'ascending' ? <KeyboardArrowUpIcon/> : <KeyboardArrowDownIcon/>}</span>
                        )}
                     </TableCell>
                ))}
            </TableRow>
        )
    }

    // toggle detail row for an item by inserting/removing a detail row immediately after it
    const toggleDetail = (id: string) => {
        setDisplayRows(prev => {
            const idx = prev.findIndex(r => (r as any).id === id)
            if (idx === -1) return prev
            const next = prev[idx + 1]
            // if next is a detail for this id, remove it
            if ((next as any)?._isDetail && (next as any).parentId === id) {
                const copy = [...prev]
                copy.splice(idx + 1, 1)
                return copy
            }

            // otherwise insert a new detail row after idx
            const parent = prev[idx] as Data
            const detail: DetailRow = { id: `${id}-detail`, _isDetail: true, parentId: id, details: parent.details }
            const copy = [...prev]
            copy.splice(idx + 1, 0, detail)
            return copy
        })
    }

    // itemContent now renders either a normal data row's cells, or a full-width detail row cell
    const itemContent = (_index: number, row: Data | DetailRow) => {
        // detail row
        if ((row as DetailRow)._isDetail) {
            const dr = row as DetailRow
            return (
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={columns.length + 1}>
                    <Collapse in={true} timeout="auto" unmountOnExit>
                        <Box margin={1}>
                            <Typography variant="body2">Details - {dr.details}</Typography>
                        </Box>
                    </Collapse>
                </TableCell>
            )
        }

        const dataRow = row as Data
        return (
            <>
                <TableCell>
                    {dataRow.details ? (
                        <IconButton
                         aria-label="expand row"
                         size="small"
                         onClick={() => toggleDetail(dataRow.id)}
                        >
                            <KeyboardArrowDownIcon />
                        </IconButton>
                    ) : null}
                </TableCell>

                {columns.map((column) => {
                    const raw = dataRow[column.dataKey]
                    const display = typeof raw === 'boolean' ? (raw ? 'Yes' : 'No') : (raw ?? '')
                    return (
                        <TableCell
                         key={String(column.dataKey)}
                         align={column.numeric || false ? 'right' : 'left'}
                         >
                            {display}
                         </TableCell>
                    )
                })}
            </>
        )
    }

    return (
        <Paper style={{ height: 400, width: 1500 }} sx={{ backgroundColor: '#FFFFFF00' }}>
            <TableVirtuoso
             data={displayRows}
             components={VirtuosoTableComponents}
             fixedHeaderContent={fixedHeaderContent}
             itemContent={itemContent}
             />
        </Paper>
    )
}
