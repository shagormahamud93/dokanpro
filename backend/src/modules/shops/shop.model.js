import mongoose from 'mongoose'

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    /** Pointer to the latest active subscription, denormalized for fast lookup. */
    currentSubscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
  },
  { timestamps: true },
)

shopSchema.methods.toJSON = function () {
  const obj = this.toObject({ versionKey: false })
  obj.id = obj._id
  delete obj._id
  return obj
}

export const Shop = mongoose.model('Shop', shopSchema)
