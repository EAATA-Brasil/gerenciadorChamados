import React from 'react'
import './App.css'
import {Routes, Route } from 'react-router-dom'
import CreateTicket from './pages/CreateTicket'

function App() {

  return (
      <Routes>
        <Route path='/' element={<CreateTicket/>}/>
      </Routes>
  )
}

export default App
