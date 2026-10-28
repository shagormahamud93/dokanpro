import type { Product, Transaction, Customer } from '@/types'

export const products: Product[] = [
  { id: 'p1', name: 'Basmati Rice', nameBn: 'বাসমতি চাল', sku: 'RC-BAS-5', category: 'Grocery', price: 850, stock: 24, unit: 'kg', barcode: '8901234567890' },
  { id: 'p2', name: 'Sunflower Oil', nameBn: 'সানফ্লাওয়ার তেল', sku: 'OIL-SF-2', category: 'Grocery', price: 420, stock: 12, unit: 'ltr' },
  { id: 'p3', name: 'Red Lentil', nameBn: 'মসুর ডাল', sku: 'PUL-RED-1', category: 'Grocery', price: 145, stock: 38, unit: 'kg' },
  { id: 'p4', name: 'Sugar', nameBn: 'চিনি', sku: 'SUG-WHT-1', category: 'Grocery', price: 130, stock: 6, unit: 'kg' },
  { id: 'p5', name: 'Coca-Cola 1.5L', nameBn: 'কোকা কোলা', sku: 'BEV-COKE-15', category: 'Beverage', price: 95, stock: 42, unit: 'pcs' },
  { id: 'p6', name: 'Pran Mango Juice', nameBn: 'প্রাণ ম্যাঙ্গো জুস', sku: 'BEV-PRAN-1', category: 'Beverage', price: 60, stock: 28, unit: 'pcs' },
  { id: 'p7', name: 'Lays Classic', nameBn: 'লেইস চিপস', sku: 'SNK-LAY-50', category: 'Snacks', price: 50, stock: 60, unit: 'pcs' },
  { id: 'p8', name: 'Dairy Milk', nameBn: 'ডেইরি মিল্ক', sku: 'CHO-DM-40', category: 'Snacks', price: 80, stock: 4, unit: 'pcs' },
  { id: 'p9', name: 'Eggs (Tray)', nameBn: 'ডিম', sku: 'EGG-TR-30', category: 'Dairy', price: 380, stock: 8, unit: 'dz' },
  { id: 'p10', name: 'Milk Pack', nameBn: 'দুধ', sku: 'MLK-PCK-1', category: 'Dairy', price: 95, stock: 22, unit: 'ltr' },
  { id: 'p11', name: 'Toilet Soap', nameBn: 'সাবান', sku: 'PER-SOP-1', category: 'Personal', price: 65, stock: 35, unit: 'pcs' },
  { id: 'p12', name: 'Toothpaste', nameBn: 'টুথপেস্ট', sku: 'PER-TP-1', category: 'Personal', price: 145, stock: 18, unit: 'pcs' },
]

export const categories = ['All', 'Grocery', 'Beverage', 'Snacks', 'Dairy', 'Personal'] as const

export const recentTransactions: Transaction[] = [
  { id: 't1', orderNumber: '#1248', date: new Date(Date.now() - 1000 * 60 * 4), itemCount: 5, total: 1245, paymentMethod: 'bkash', status: 'completed', customer: 'Karim Mia' },
  { id: 't2', orderNumber: '#1247', date: new Date(Date.now() - 1000 * 60 * 18), itemCount: 2, total: 380, paymentMethod: 'cash', status: 'completed' },
  { id: 't3', orderNumber: '#1246', date: new Date(Date.now() - 1000 * 60 * 35), itemCount: 8, total: 2150, paymentMethod: 'nagad', status: 'completed', customer: 'Rahima Khatun' },
  { id: 't4', orderNumber: '#1245', date: new Date(Date.now() - 1000 * 60 * 62), itemCount: 1, total: 95, paymentMethod: 'cash', status: 'completed' },
  { id: 't5', orderNumber: '#1244', date: new Date(Date.now() - 1000 * 60 * 90), itemCount: 4, total: 720, paymentMethod: 'card', status: 'completed', customer: 'Salim Hossain' },
  { id: 't6', orderNumber: '#1243', date: new Date(Date.now() - 1000 * 60 * 120), itemCount: 3, total: 540, paymentMethod: 'bkash', status: 'refunded' },
]

export const customers: Customer[] = [
  { id: 'c1', name: 'Karim Mia', phone: '+8801712345678', totalSpent: 18500, lastVisit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), due: 250 },
  { id: 'c2', name: 'Rahima Khatun', phone: '+8801812345678', totalSpent: 32400, lastVisit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) },
  { id: 'c3', name: 'Salim Hossain', phone: '+8801912345678', totalSpent: 9800, lastVisit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), due: 1200 },
]

export const salesChartData = [
  { day: 'Sat', sales: 8400 },
  { day: 'Sun', sales: 11200 },
  { day: 'Mon', sales: 9800 },
  { day: 'Tue', sales: 14500 },
  { day: 'Wed', sales: 12300 },
  { day: 'Thu', sales: 16800 },
  { day: 'Fri', sales: 19200 },
]

export const paymentSplitData = [
  { name: 'bKash', value: 42, color: '#E2136E' },
  { name: 'Cash', value: 28, color: '#10B981' },
  { name: 'Nagad', value: 18, color: '#F47A1F' },
  { name: 'Card', value: 12, color: '#2563EB' },
]

export const topProductsData = [
  { name: 'Basmati Rice', sales: 142 },
  { name: 'Sunflower Oil', sales: 118 },
  { name: 'Coca-Cola 1.5L', sales: 96 },
  { name: 'Red Lentil', sales: 84 },
  { name: 'Lays Classic', sales: 72 },
]
