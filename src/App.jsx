import { HashRouter, Routes, Route } from 'react-router-dom'
import Control from './pages/Control.jsx'
import Student from './pages/Student.jsx'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Control />} />
        <Route path="/student" element={<Student />} />
      </Routes>
    </HashRouter>
  )
}

export default App
