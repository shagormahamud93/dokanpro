import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SubscriptionGuard } from '@/components/subscription/SubscriptionGuard'
import { Dashboard } from '@/pages/Dashboard'
import { POS } from '@/pages/POS'
import { Login } from '@/pages/Login'
import { Settings } from '@/pages/Settings'
import { Subscription } from '@/pages/Subscription'
import { AdminSubscriptions } from '@/pages/AdminSubscriptions'
import { Placeholder } from '@/pages/Placeholder'
import { Order } from '@/pages/Order'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Always accessible (even without active subscription) */}
        <Route path="subscription" element={<Subscription />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin/subscriptions" element={<AdminSubscriptions />} />

        {/* Subscription-gated */}
        <Route
          index
          element={
            <SubscriptionGuard>
              <Dashboard />
            </SubscriptionGuard>
          }
        />
        <Route
          path="pos"
          element={
            <SubscriptionGuard>
              <POS />
            </SubscriptionGuard>
          }
        />
        <Route
          path="products"
          element={
            <SubscriptionGuard>
              <Placeholder title="Products" />
            </SubscriptionGuard>
          }
        />
        <Route
          path="inventory"
          element={
            <SubscriptionGuard>
              <Placeholder title="Inventory" />
            </SubscriptionGuard>
          }
        />
        <Route
          path="customers"
          element={
            <SubscriptionGuard>
              <Placeholder title="Customers" />
            </SubscriptionGuard>
          }
        />
        <Route
          path="orders"
          element={
            <SubscriptionGuard>
              <Order title="Orders" />
            </SubscriptionGuard>
          }
        />
        <Route
          path="reports"
          element={
            <SubscriptionGuard>
              <Placeholder title="Reports & Analytics" />
            </SubscriptionGuard>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
