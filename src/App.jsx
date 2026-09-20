import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/components/LoginPage'
import Dashboard from '@/components/Dashboard'
import { clearTokens } from '@/lib/api'

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dw_username')
    const token = localStorage.getItem('dw_jwt') || localStorage.getItem('dw_token')
    return saved && token ? saved : null
  })

  const handleLogin = (username) => {
    setUser(username)
  }

  const handleLogout = () => {
    setUser(null)
    clearTokens()
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/wishes" replace />} />
        <Route path="/dashboard" element={<Navigate to="/wishes" replace />} />
        <Route path="/*" element={<Dashboard username={user} onLogout={handleLogout} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
