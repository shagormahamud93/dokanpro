export type Theme = 'light' | 'dark' | 'system'

export interface Product {
  id: string
  name: string
  nameBn?: string
  sku: string
  category: string
  price: number
  cost?: number
  stock: number
  unit: 'pcs' | 'kg' | 'ltr' | 'dz'
  image?: string
  barcode?: string
}

export interface CartLine {
  product: Product
  quantity: number
  discount?: number
}

export interface Customer {
  id: string
  name: string
  phone: string
  totalSpent: number
  lastVisit: Date
  due?: number
}

export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'card'

export interface Transaction {
  id: string
  orderNumber: string
  date: Date
  customer?: string
  itemCount: number
  total: number
  paymentMethod: PaymentMethod
  status: 'completed' | 'refunded' | 'held'
}
