import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      index: true,
    },
    name: { type: String, required: true, trim: true, index: true },
    nameBn: { type: String, trim: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    barcode: { type: String, trim: true },
    category: { type: String, default: 'General', index: true },
    price: { type: Number, required: true, min: 0 },
    cost: { type: Number, min: 0, default: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    reorderPoint: { type: Number, min: 0, default: 10 },
    unit: { type: String, enum: ['pcs', 'kg', 'ltr', 'dz'], default: 'pcs' },
    image: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

// Tenant-scoped uniqueness. Partial filters keep unmigrated (no shop) rows
// out of the unique index so existing data does not block index creation.
productSchema.index(
  { shop: 1, sku: 1 },
  { unique: true, partialFilterExpression: { shop: { $type: 'objectId' } } },
)
productSchema.index(
  { shop: 1, barcode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      shop: { $type: 'objectId' },
      barcode: { $type: 'string', $gt: '' },
    },
  },
)
productSchema.index({ shop: 1, active: 1 })
productSchema.index({ name: 'text', nameBn: 'text', sku: 'text' })

productSchema.methods.toJSON = function () {
  const obj = this.toObject({ versionKey: false })
  obj.id = obj._id
  delete obj._id
  return obj
}

export const Product = mongoose.model('Product', productSchema)
