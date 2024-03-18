import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Typography } from '@mui/material'



function BookReader(){
  return <>
    <div style={{height:'100%', width:'50%'}} className='basic-border'>
      <div>
        <Typography variant='h6' className='frame-title'>Book</Typography>
      </div>
      
    </div>
  </>
}

function GeneralSummary(){
  return <>
    <div style={{height:'50%'}} className='basic-border'>
      <Typography variant='h6' className='frame-title'>General Summary</Typography>
    </div>
  </>
}

function PageSummary(){
  return <>
    <div style={{height:'50%'}} className='basic-border'>
      <Typography variant='h6' className='frame-title'>Page Summary</Typography>
    </div>
  </>
}



function App() {
  

  return (
    <>
      <div className='App' style={{display:'flex', height:'100%'}}>
        <BookReader />
        <div style={{display:'flex', width:'50%', flexDirection:'column'}}>
          <GeneralSummary />
          <PageSummary />
        </div>
      </div>
    </>
  )
}

export default App
