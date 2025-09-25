import './App.css'
import {Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Relatorio from './pages/Relatorio'
import CreateTicket from './pages/CreateTicket'
import Settings from './pages/Settings'

function App() {

  return (
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/relatorio' element={<Relatorio/>}/>
        <Route path='/create' element={<CreateTicket/>}/>
        <Route path='/settings' element={<Settings/>}/>
      </Routes>
  )
}

export default App
