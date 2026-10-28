import mongoose from 'mongoose'
import { PLAN_IDS, PAYMENT_METHODS, SUBSCRIPTION_STATUSES } from './plans.js'

const subscriptionSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    plan: { type: String, enum: PLAN_IDS, required: true },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    transactionId: { type: String, required: true, trim: true, index: true },
    screenshot: { type: String, trim: true },
    status: {
      type: String,
      enum: SUBSCRIPTION_STATUSES,
      default: 'pending',
      index: true,
    },
    startDate: { type: Date },
    endDate: { type: Date, index: true },
    notes: { type: String, trim: true },
    rejectionReason: { type: String, trim: true },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
  },
  { timestamps: true },
)

// One pending submission at a time per shop
subscriptionSchema.index(
  { shop: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } },
)

subscriptionSchema.virtual('daysRemaining').get(function () {
  if (!this.endDate) return null
  const ms = this.endDate.getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
})

subscriptionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id
    delete ret._id
    return ret
  },
})

export const Subscription = mongoose.model('Subscription', subscriptionSchema)
