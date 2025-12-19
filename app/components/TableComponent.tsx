import React, { useState, useEffect } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { firestore } from '@/firebase'
import { Table, TableBody, TableCell, TableContainer, TableHead, 
    TablePagination, TableRow, Paper, Typography, Box, Collapse, IconButton} from '@mui/material'
import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

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

function fixedHeaderContent() {
    return (
        <TableRow sx={{backgroundColor: '#bdb7ab'}}>
            <TableCell style={{ width: 48 }} />
            {columns.map((column) => (
                <TableCell 
                 key={column.dataKey} 
                 variant='head'
                 align={column.numeric || false ? 'right' : 'left'}
                 style={{ width: column.width }}
                 >
                    {column.label}
                 </TableCell>
            ))}
        </TableRow>
    )
}

function rowContent(_index: number, row: Data) {
    return (
        <React.Fragment key={row.id}>
            <TableRow>
                <TableCell>
                    {row.details ? (
                        <IconButton
                         aria-label="expand row"
                         size="small"
                         onClick={(e) => {
                             // Toggle is managed via DOM event since TableVirtuoso's itemContent is pure render.
                             // We'll use a custom event to signal the component-level handler.
                             const ev = new CustomEvent('toggle-row-expand', { detail: row.id })
                             window.dispatchEvent(ev)
                         }}
                        >
                            <KeyboardArrowDownIcon />
                        </IconButton>
                    ) : null}
                </TableCell>

                {/* Render cells in a fixed order with fallbacks to common field names */}
                <TableCell>{row.name ?? (row as any).itemName ?? row.id}</TableCell>
                <TableCell>{(row.oac_num ?? (row as any).num ?? (row as any).oacNumber) ?? ''}</TableCell>
                <TableCell>{typeof row.in_stock === 'boolean' ? (row.in_stock ? 'Yes' : 'No') : (row.in_stock ?? '')}</TableCell>
                <TableCell>{row.leader_signout ?? (row as any).leader ?? ''}</TableCell>
                <TableCell>{typeof row.loaned === 'boolean' ? (row.loaned ? 'Yes' : 'No') : (row.loaned ?? '')}</TableCell>
                <TableCell>{row.loaned_to ?? (row as any).loanedTo ?? ''}</TableCell>
            </TableRow>

            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={columns.length + 1}>
                    <Collapse in={false} timeout="auto" unmountOnExit>
                        <Box margin={1}>
                            <Typography variant="body2">{row.details}</Typography>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    )
}

export default function ReactVirtualizedTable() {
    const [rows, setRows] = useState<Data[]>(rowsInitial)
    // rows actually passed to Virtuoso (includes inserted detail rows)
    const [displayRows, setDisplayRows] = useState<Array<Data | DetailRow>>([])

    useEffect(() => {
        const q = query(collection(firestore, 'tents'))
        const unsubscribe = onSnapshot(q, (snap) => {
            const items: Data[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
                setRows(items)
                // reset displayRows when base rows change
                setDisplayRows(items)
        })
        return () => unsubscribe()
    }, [])

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
                            <Typography variant="body2">Details: {dr.details}</Typography>
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
