'use client' //indicates this is a client-side component

import { useState, useEffect } from 'react'
import { Box, Stack, Typography, Button, Modal, TextField } from '@mui/material'
import { firestore } from '@/firebase'
import { v4 as uuidv4 } from 'uuid'
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

export default function Home() {
  const updateInventory = async () => {
  const snapshot = query(collection(firestore, 'tents'))
  const docs = await getDocs(snapshot)
  const inventoryList = []
  docs.forEach((doc) => {
    inventoryList.push({ name: doc.id, ...doc.data() })
  })
  setInventory(inventoryList)
}

useEffect(() => {
  updateInventory()
}, [])

const addItem = async (item) => { //adds new item to Firestore
    const name = item?.trim()
    if (!name) return
    const itemID = uuidv4()
    const docRef = doc(collection(firestore, 'tents'), itemID) //use normalized id
    await setDoc(docRef, { name: name, oac_num: 0, in_stock: true, loaned: false, details: "", leader_signout: "", loaned_to: "", id: {itemID}}) //creates new doc with quantity 1
    
    await updateInventory() //refreshes inventory list
}

const removeItem = async (item) => { //removes or decrements item in Firestore
    const docRef = doc(collection(firestore, 'tents'), item.id.itemID)
    await deleteDoc(docRef)
    await updateInventory() //refreshes inventory list
}

const handleOpen = () => setOpen(true) //opens modal
const handleClose = () => setOpen(false) //closes modal

const [inventory, setInventory] = useState([]) //manages inventory list
const [open, setOpen] = useState(false) //manages modal visibility
const [itemName, setItemName] = useState('') //manages new item name
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
  >
      <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style} overflow={'auto'}>
          <Typography id = "modal-modal-title" variant="h6" component="h2">
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
              <Button variant="outlined" onClick={() => {
                  addItem(itemName) //calls addItem function
                  setItemName('') //resets itemName state
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
          <Box width="1250px" height={'100px'} bgcolor={'#ADD8E6'} display={'flex'} justifyContent={'space-between'} alignItems={'center'} paddingX={5}>
              <Typography variant="h6" color="#333" textAlign={'center'}>
                  Tents
              </Typography>
              <Typography variant="body1" color="#333" textAlign={'center'}>
                  OAC Number
              </Typography>
              <Typography variant="body1" color="#333" textAlign={'center'}>
                  Available?
              </Typography>

          </Box>
          <Stack width="fill" height="700px" overflow="auto">
              {inventory.map((item) => (
                  <Box key={item.id.itemID} width="100%" minHeight={'50px'} display={'flex'} justifyContent={'space-between'} alignItems={'center'} bgcolor={'#f0f0f0'} paddingX={5}>
                      <Typography variant={'h6'} color='#333' textAlign={'left'}>
                          {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                      </Typography>
                      <Typography variant='body1' color='#333' textAlign={'center'}>
                          {item.oac_num}
                      </Typography>
                      <Typography variant='body1' color='#333' textAlign={'center'}>
                            {item.in_stock}
                      </Typography>
                      <Button variant='contained' onClick={() => removeItem(item)}>
                          Remove
                      </Button>
                  </Box>
              ))}
          </Stack>
      </Box>
  </Box>
  )
}