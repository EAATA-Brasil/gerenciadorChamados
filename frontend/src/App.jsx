import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Relatorio from './pages/Relatorio'
import CreateTicket from './pages/CreateTicket'

function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/relatorio' element={<Relatorio/>}/>
        <Route path='/create' element={<CreateTicket/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
