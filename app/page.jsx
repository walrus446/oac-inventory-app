'use client' //indicates this is a client-side component

import { useState, useEffect } from 'react'
import { Box, Stack, Typography, Button, Modal, TextField, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
    Checkbox, FormControlLabel, Divider } from '@mui/material'
import { firestore } from '@/firebase'
import { v4 as uuidv4 } from 'uuid'
import { TabbedTables } from './components/TabbedTable'
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore'
import { get } from 'http'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90vw',
  height: '90vh',
  bgcolor: '#333',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  overflow: 'hidden',
}

const TABLES = ['packs','tents','sleeping-pads','headlamps','filters','cooking','saws','bear','trowels','snowshoes','misc']

export default function Home() {
  const updateInventory = async (table) => {
  const snapshot = query(collection(firestore, table))
  const docs = await getDocs(snapshot) 
  const inventoryList = []
  docs.forEach((doc) => {
    inventoryList.push({ name: doc.id, ...doc.data() })
})
  setInventory(inventoryList)
}

const fetchAllInventory = async () => {
    const all = await Promise.all(TABLES.map(async (t) => {
        const snap = await getDocs(query(collection(firestore, t)))
        const arr = []
        snap.forEach(d => arr.push({ table: t, name: d.id, ...d.data() }))
        return arr
    }))
    setInventory(all.flat())
}

useEffect(() => {
  fetchAllInventory()
}, [])

const addItem = async (item, num, detail, table) => { //adds new item to Firestore
    const name = item?.trim()
    if (!name) return
    const itemID = uuidv4()
    const docRef = doc(collection(firestore, table), itemID) //use normalized id
    await setDoc(docRef, { name: name, oac_num: num, in_stock: true, details: detail, leader_signout: "", id: {itemID}}) //creates new doc with quantity 1
    
    await updateInventory(table) //refreshes inventory list
}

const removeItem = async (item, table) => { //removes or decrements item in Firestore
    const docRef = doc(collection(firestore, table), item.id.itemID)
    await deleteDoc(docRef)
    await updateInventory() //refreshes inventory list
}

const handleOpen = () => setOpen(true) //opens modal
const handleClose = () => setOpen(false) //closes modal

const [inventory, setInventory] = useState([]) //manages inventory list
const [open, setOpen] = useState(false) //manages modal visibility
const [itemName, setItemName] = useState('') //manages new item name
const [itemNum, setItemNum] = useState(0)
const [itemDetails, setItemDetails] = useState('')
const [itemTable, setItemTable] = useState('')

const [checkoutOpen, setCheckoutOpen] = useState(false)
const [transferOpen, setTransferOpen] = useState(false)
const [checkedMap, setCheckedMap] = useState({}) // key: itemID, value: true
const [currentUser, setCurrentUser] = useState('leader@example.com') // set from auth in real app
const [isAdmin, setIsAdmin] = useState(false) // set from auth/role in real app
const [transferTo, setTransferTo] = useState('')

const toggleCheck = (item) => {
    const id = item?.id?.itemID || item.name
    setCheckedMap(prev => ({ ...prev, [id]: !prev[id] }))
}

const checkedItems = () => {
    return inventory.filter(it => {
        const id = it?.id?.itemID || it.name
        return !!checkedMap[id]
    })
}

const openCheckout = async () => {
    await fetchAllInventory()
    setCheckoutOpen(true)
}

const closeCheckout = async () => {
    setCheckoutOpen(false)
    setCheckedMap({})
}

const checkoutSelected = async () => {
    const items = checkedItems()
    if (!items.length) return
    for (const it of items) {
        const id = it.id?.itemID
        if (!id) continue
        const docRef = doc(collection(firestore, it.table), id)
        await setDoc(docRef, {in_stock: false, leader_signout: currentUser, date: new Date().toISOString()}, { merge: true })
    }
    await fetchAllInventory()
    closeCheckout()
}

const canOpenTransfer = () => {
    if (isAdmin) return true
    return checkedItems().some(it => it.leader_signout === currentUser)
}

const openTransfer = async () => {
    await fetchAllInventory()
    if (!canOpenTransfer()) {
        alert('Only admin or current holders of selected items can transfer them.')
        return
    }
    setTransferOpen(true)
}

const closeTransfer = () => {
    setTransferOpen(false)
    setTransferTo('')
    setCheckedMap({})
}

const transferSelected = async () => {
    const items = checkedItems()
    if (!items.length) return
    for (const it of items) {
        const id = it.id?.itemID
        if (!id) continue
        if (!isAdmin && it.leader_signout !== currentUser) continue
        const docRef = doc(collection(firestore, it.table), id)
        await setDoc(docRef, { leader_signout: transferTo, date: new Date().toISOString()}, { merge: true })
    }
    await fetchAllInventory()
    closeTransfer()
}


return (
  <Box
   width="100vw"
   height="100vh"
   display={'flex'}
   justifyContent={'center'}
   flexDirection={'row'}
   alignItems={'flex-start'}
   gap={2}
   overflow={'auto'}
   bgcolor={'#000000'}
  >
      <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      bgcolor='#bdb7ab'
      size="md"
    >
      <Box sx={style} overflow={'auto'}>
          <Typography id = "modal-modal-title" variant="h6" component="h2">
              Add New Item
          </Typography>
          <Stack width={'100%'} direction={'row'} spacing={2}>
              <TextField
                  id = "outlined-basic"
                  label = "Item Name"
                  InputLabelProps={{style: { color: '#c0c0c0ff' },}}
                  variant = "outlined"
                  sx={{input: {color: '#ffff'}}}
                  fullWidth
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)} //updates itemName state
              />
              <TextField
                  id = "outlined-basic"
                  label = "OAC Number"
                  variant = "outlined"
                  type='number'
                  InputLabelProps={{style: { color: '#c0c0c0ff' },}}
                  sx={{input: {color: '#ffff'}}}
                  fullWidth
                  value={itemNum}
                  onChange={(e) => setItemNum(e.target.value)} //updates itemName state
              />
              <TextField
                  id = "outlined-basic"
                  label = "Important Details"
                  variant = "outlined"
                  fullWidth
                  InputLabelProps={{style: { color: '#c0c0c0ff' },}}
                  sx={{input: {color: '#ffff'}}}
                  value={itemDetails}
                  onChange={(e) => setItemDetails(e.target.value)} //updates itemName state
              />
              <TextField //Change this to dropdown
                  id = "outlined-basic"
                  label = "Table"
                  variant = "outlined"
                  InputLabelProps={{style: { color: '#c0c0c0ff' },}}
                  sx={{input: {color: '#ffffffff'}}}
                  fullWidth
                  value={itemTable}
                  onChange={(e) => setItemTable(e.target.value)} //updates itemName state
              />
              <Button variant="outlined" onClick={() => {
                  addItem(itemName, itemNum, itemDetails, itemTable) //calls addItem function
                  setItemName('') //resets itemName state
                  setItemNum(0)
                  setItemDetails('')
                  setItemTable('')
                  handleClose() //closes modal
              }}
              >
                  Add
              </Button>
              </Stack>
      </Box>
      </Modal>
      <Box width="50%" minHeight="50%" border="1px solid #333" p={1}>
          <TabbedTables/>
      </Box>

      <Box width="50%" minHeight="100%" border="1px solid transparent" p={1}>
            <Stack direction="row" spacing={1} alignItems={'center'}>
                <TextField label="Current user" value={currentUser} onChange={(e)=>setCurrentUser(e.target.value)} size="small"/>
                <Button variant='outlined' onClick={()=>setIsAdmin(!isAdmin)}>{isAdmin ? 'Revoke Admin' : 'Make Admin'}</Button>
            </Stack>

            <Divider/>

            <Button variant='contained' onClick={openCheckout} sx={{width: '100%'}}>Checkout Items</Button>
            <Divider/>
            <Button variant='contained' onClick={openTransfer} disabled={!canOpenTransfer()} sx={{width: '100%'}}>Transfer Items</Button>
            <Divider/>
            <Button variant="contained" onClick={handleOpen} disabled={!isAdmin} sx={{width: '100%'}}>
                Add New Item
            </Button>
      
      </Box>

      {/* Checkout Modal */}
      <Modal open={checkoutOpen} onClose={closeCheckout} aria-labelledby="checkout-modal">
        <Box sx={style}>
            <Typography variant="h5">Checkout Items</Typography>
            <Typography variant='body2'>Select items to checkout. Make sure you take out the correct items with the corresponding numbers.</Typography>
            <Divider/>
            <Box sx={{overflow: 'auto', mt: 1, pb: 2 }}>
                {TABLES.map(tableName => {
                    const items = inventory.filter(i => i.table === tableName && ((i.in_stock === undefined || i.in_stock === true)))
                    .sort((a,b) => {
                    // sort by numeric oac_num if present, else by name
                    const na = a.oac_num ?? ''
                    const nb = b.oac_num ?? ''
                    if (na !== '' && nb !== '') return String(na).localeCompare(String(nb), undefined, { numeric: true })
                    return (a.name || '').localeCompare(b.name || '')
                    })
                    if (!items.length) return null
                    return (
                        <Box key={tableName} mb={1}>
                            <Typography variant='subtitle1' sx={{textTransform: 'capitalize'}}>{tableName}</Typography>
                            <Stack>
                                {items.map(it => {
                                    const id = it?.id?.itemID || it.name
                                    const label = `${it.name} — OAC ${it.oac_num ?? 'n/a'}${it.leader_signout ? ` (held by ${it.leader_signout})` : ''}`
                                    return (
                                        <FormControlLabel key={id} control={<Checkbox checked={!!checkedMap[id]} onChange={()=>toggleCheck(it)}/>} label={label}/>
                                    )
                                })}
                            </Stack>
                            <Divider sx={{my:1}}/>
                        </Box>
                    )
                })}
            </Box>

            <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
              <Button variant="outlined" onClick={closeCheckout}>Cancel</Button>
              <Button variant="contained" onClick={checkoutSelected}>Checkout Selected</Button>
            </Stack>
        </Box>
      </Modal>

      {/* Transfer Modal */}
      <Modal open={transferOpen} onClose={closeTransfer} aria-labelledby="transfer-modal">
        <Box sx={style}>
            <Typography variant="h5">Transfer Items</Typography>
            <Typography variant="body2">Only admins or current holders of selected items may transfer them.</Typography>
            <Divider/>
            <Box sx={{overflow:'auto', mt:1,pb:2}}>
                <Typography variant='subtitle1'>Your held items</Typography>
                <Stack>
                  {inventory
                    .filter(i => i.leader_signout === currentUser)
                    .sort((a,b) => (a.oac_num ?? '').toString().localeCompare((b.oac_num ?? '').toString()))
                    .map(it => {
                     const id = it?.id?.itemID || it.name
                     return (
                          <FormControlLabel
                            key={id}
                            control={<Checkbox checked={!!checkedMap[id]} onChange={()=>toggleCheck(it)} />}
                            label={`${it.table} / ${it.name} — OAC ${it.oac_num ?? 'n/a'}`}
                          />
                     )
                     })}
                </Stack>
            </Box>

            {!isAdmin && (
                <Box mb={1}>
                    <Typography variant='subtitle2'>Selected items</Typography>
                    <Stack>
                  {checkedItems()
                    .filter(it => it.leader_signout === currentUser)
                    .map(it => {
                      const id = it?.id?.itemID || it.name
                      return <FormControlLabel key={id} control={<Checkbox checked={!!checkedMap[id]} onChange={()=>toggleCheck(it)}/> } label={`${it.table} / ${it.name} — OAC ${it.oac_num ?? 'n/a'}`} />
                    })}
                </Stack>
                </Box>
            )}

            {isAdmin && (() => {
                const held = inventory.filter(i => i.leader_signout)
                const byHolder = held.reduce((acc, it) => {
                    const h = it.leader_signout || 'n/a'
                    acc[h] = acc[h] || []
                    acc[h].push(it)
                    return acc
                }, {})
                return Object.keys(byHolder).map(holder => (
                    <Box key={holder} mb={1}>
                        <Typography variant='subtitle1'>{holder}</Typography>
                        <Stack>
                            {byHolder[holder].sort((a,b) =>(a.oac_num ?? '').toString().localeCompare((b.oac_num ?? '').toString())).map(it => {
                                const id = it?.id?.itemID || it.name
                                return (
                                    <FormControlLabel
                                    key={id}
                                    control={<Checkbox checked={!!checkedMap[id]} onChange={()=>toggleCheck(it)} />}
                                    label={`${it.table} / ${it.name} — OAC ${it.oac_num ?? 'n/a'}`}
                                    />
                                )
                            })}
                        </Stack>
                        <Divider sx={{my:1}}/>
                    </Box>
                ))
            })}

            {/* change to dropdown of all users when user auth is added */}
            <TextField label="Transfer to (user id/email)" value={transferTo} onChange={(e)=>setTransferTo(e.target.value)} fullWidth/>

            <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
              <Button variant="outlined" onClick={closeTransfer}>Cancel</Button>
              <Button variant="contained" onClick={transferSelected} disabled={!transferTo}>Transfer</Button>
            </Stack>
        </Box>
      </Modal>
  </Box>
  )
}