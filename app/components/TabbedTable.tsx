import React, { useState } from 'react'
import { Tabs, Tab, Box, Typography } from '@mui/material'
import ReactVirtualizedTable from './TableComponent'
import { v4 as uuidv4 } from 'uuid'

function TabPanel(props: { [x: string]: any; children: any; value: any; index: any }) {
    const { children, value, index, ...other } = props
    return (
        <span
          role="tabpanel"
          hidden={value !== index}
          id={uuidv4()}
          aria-labelledby='simple-tab-${id}'
          {...other}
          >
            {value === index && (
                <Box sx={{ p: 3}}>
                    <Typography>{children}</Typography>
                </Box>
            )}
          </span>
    )
}

export function TabbedTables() {
    const [value, setValue] = useState(0)

    const handleChange = (_event: any, newValue: React.SetStateAction<number>) => {
        setValue(newValue)
    }

    return (
    <Box sx={{ width: '100%', height:'90%'}}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: '#bdb7ab' }}>
        <Tabs value={value} onChange={handleChange} variant='scrollable' scrollButtons='auto' allowScrollButtonsMobile aria-label="basic tabs example" sx={{minHeight: 0}}>
          <Tab label="Packs" id={uuidv4()} aria-controls="simple-tabpanel-${id}" />
          <Tab label="Tents" id={uuidv4()} aria-controls="simple-tabpanel-${id}" />
          <Tab label="Sleeping Pads" id={uuidv4()} aria-controls="simple-tabpanel-${id}" />
          <Tab label="Headlamps" id={uuidv4()} aria-controls="simple-tabpanel-${id}" />
          <Tab label="Filters" id={uuidv4()} aria-controls="simple-tabpanel-${id}" />
          <Tab label="Cooking" id={uuidv4()} aria-controls="simple-tabpanel-${id}" />
          <Tab label="Saws" id={uuidv4()} aria-controls="simple-tabpanel-${id}" />
          <Tab label="Bear" id={uuidv4()} aria-controls="simple-tabpanel-${id}" />
          <Tab label="Trowels" id={uuidv4()} aria-controls="simple-tabpanel-${id}" />
          <Tab label="Snowshoes" id={uuidv4()} aria-controls="simple-tabpanel-${id}" />
          <Tab label="Misc. - White Box" id={uuidv4()} aria-controls="simple-tabpanel-${id}" />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0} component="span">
        {/* Pass data to the first table component */}
        <ReactVirtualizedTable table='packs'/> {/* make this take in a prop for which table*/}
      </TabPanel>
      <TabPanel value={value} index={1} component="span">
        {/* Pass data to the second table component */}
        <ReactVirtualizedTable table='tents'/>
      </TabPanel>
      <TabPanel value={value} index={2} component="span">
        <ReactVirtualizedTable table='sleeping-pads'/>
      </TabPanel>
      <TabPanel value={value} index={3} component="span">
        <ReactVirtualizedTable table='headlamps'/>
      </TabPanel>
      <TabPanel value={value} index={4} component="span">
        <ReactVirtualizedTable table='filters'/>
      </TabPanel>
      <TabPanel value={value} index={5} component="span">
        <ReactVirtualizedTable table='cooking'/>
      </TabPanel>
      <TabPanel value={value} index={6} component="span">
        <ReactVirtualizedTable table='saws'/>
      </TabPanel>
      <TabPanel value={value} index={7} component="span">
        <ReactVirtualizedTable table='bear'/>
      </TabPanel>
      <TabPanel value={value} index={8} component="span">
        <ReactVirtualizedTable table='trowels'/>
      </TabPanel>
      <TabPanel value={value} index={9} component="span">
        <ReactVirtualizedTable table='snowshoes'/>
      </TabPanel>
      <TabPanel value={value} index={10} component="span">
        <ReactVirtualizedTable table='misc'/>
      </TabPanel>
    </Box>
  )
}