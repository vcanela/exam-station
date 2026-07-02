import { HashRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Control from './pages/Control.jsx'
import Display from './pages/Display.jsx'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/control" element={<Control />} />
        <Route path="/display" element={<Display />} />
      </Routes>
    </HashRouter>
  )
}

export default App
