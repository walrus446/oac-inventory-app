import React, { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { firestore } from '@/firebase'
import { Table, TableBody, TableCell, TableContainer, TableHead, 
    TablePagination, TableRow, Paper} from '@mui/material'

interface Column {
    id: 'name' | 'num' | 'details' | 'in_stock' | 'leader' | 'loaned' | 'loaned_to';
    label: string;
    minWidth?: number;
    align?: 'right';
    format?: (value: number) => string;
}

const columns: readonly Column[] = [
    { id: 'name', label: 'Item Name', minWidth: 170 },
    { id: 'num', label: 'OAC Num', minWidth: 100 },
    { id: 'details', label: 'Details', minWidth: 250},
    { id: 'in_stock', label: 'Availability', minWidth: 100},
    { id: 'leader', label: 'Trip Leader', minWidth: 170},
    { id: 'loaned', label: 'Loaned?', minWidth: 100},
    { id: 'loaned_to', label: 'Loaned To', minWidth: 170}
];

interface Data {
    name: string;
    num: number;
    details: string;
    in_stock: boolean;
    leader: string;
    loaned: boolean;
    loaned_to: string;
}