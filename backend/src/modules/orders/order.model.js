import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      index: true,
    },
    orderNumber: { type: String, required: true, unique: true, index: true },
    clientId: { type: String },
    cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true },
    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bkash', 'nagad', 'card'],
      required: true,
      index: true,
    },
    paymentReference: { type: String, trim: true },
    tendered: { type: Number, min: 0 },
    change: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['completed', 'refunded', 'voided'],
      default: 'completed',
      index: true,
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
)

orderSchema.index({ shop: 1, createdAt: -1 })
orderSchema.index(
  { shop: 1, clientId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      shop: { $type: 'objectId' },
      clientId: { $type: 'string', $gt: '' },
    },
  },
)

orderSchema.methods.toJSON = function () {
  const obj = this.toObject({ versionKey: false })
  obj.id = obj._id
  delete obj._id
  return obj
}

export const Order = mongoose.model('Order', orderSchema)
