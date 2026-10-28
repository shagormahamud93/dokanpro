import mongoose from 'mongoose'

const customerSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      index: true,
    },
    name: { type: String, required: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    totalSpent: { type: Number, default: 0, min: 0 },
    visitCount: { type: Number, default: 0, min: 0 },
    due: { type: Number, default: 0 },
    lastVisitAt: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
)

customerSchema.index(
  { shop: 1, phone: 1 },
  { unique: true, partialFilterExpression: { shop: { $type: 'objectId' } } },
)

customerSchema.methods.toJSON = function () {
  const obj = this.toObject({ versionKey: false })
  obj.id = obj._id
  delete obj._id
  return obj
}

export const Customer = mongoose.model('Customer', customerSchema)
