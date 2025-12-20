'use client' //indicates this is a client-side component

import { useState, useEffect } from 'react'
import { Box, Stack, Typography, Button, Modal, TextField, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'
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
  width: { xs: '90%', sm: 600, md: 800 }, 
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  overflow: 'auto',  
}


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

useEffect(() => {
  updateInventory('packs') //['packs','tents','sleeping-pads','headlamps','filters','cooking','saws','bear','trowels','snowshoes','misc']
}, [])

const addItem = async (item, num, detail, table) => { //adds new item to Firestore
    const name = item?.trim()
    if (!name) return
    const itemID = uuidv4()
    const docRef = doc(collection(firestore, table), itemID) //use normalized id
    await setDoc(docRef, { name: name, oac_num: num, in_stock: true, loaned: false, details: detail, leader_signout: "", loaned_to: "", id: {itemID}}) //creates new doc with quantity 1
    
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
return (
  <Box
   width="100vw"
   height="100vh"
   display={'flex'}
   justifyContent={'center'}
   flexDirection={'column'}
   alignItems={'center'}
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
      <Box sx={style} overflow={'auto'} bgcolor={'#000000'}>
          <Typography id = "modal-modal-title" variant="h6" component="h2" color='#000000'>
              Add New Item
          </Typography>
          <Stack width={'100%'} direction={'row'} spacing={2}>
              <TextField
                  id = "outlined-basic"
                  label = "Item Name"
                  variant = "outlined"
                  fullWidth
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)} //updates itemName state
              />
              <TextField
                  id = "outlined-basic"
                  label = "OAC Number"
                  variant = "outlined"
                  type='number'
                  fullWidth
                  value={itemNum}
                  onChange={(e) => setItemNum(e.target.value)} //updates itemName state
              />
              <TextField
                  id = "outlined-basic"
                  label = "Important Details"
                  variant = "outlined"
                  fullWidth
                  value={itemDetails}
                  onChange={(e) => setItemDetails(e.target.value)} //updates itemName state
              />
              <TextField //Change this to dropdown
                  id = "outlined-basic"
                  label = "Table"
                  variant = "outlined"
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
      <Button variant="contained" onClick={handleOpen}>
          Add New Item
      </Button>
      <Box border={'1px solid #333'}>
          <TabbedTables/>
      </Box>
  </Box>
  )
}