import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Control from './pages/Control.jsx'
import Student from './pages/Student.jsx'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Control />} />
        {/* Alias so older #/control bookmarks still work */}
        <Route path="/control" element={<Control />} />
        <Route path="/student" element={<Student />} />
        {/* Anything else falls back to the Control view */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App
