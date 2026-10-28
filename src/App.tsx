import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import { AuthProvider } from '@/context/AuthContext'
import { SocketProvider } from '@/context/SocketContext'
import { SubscriptionProvider } from '@/context/SubscriptionContext'
import { I18nProvider } from '@/context/I18nContext'
import { AppRoutes } from '@/routes/AppRoutes'

function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <AuthProvider>
            <SocketProvider>
              <SubscriptionProvider>
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </SubscriptionProvider>
            </SocketProvider>
          </AuthProvider>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}

export default App
