import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { env } from '../../config/env.js'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['admin', 'staff'],
      default: 'staff',
      index: true,
    },
    /** Tenant — required for staff, null for SaaS admins. */
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      default: null,
      index: true,
    },
    active: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
)

userSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, env.bcryptRounds)
}

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash)
}

userSchema.methods.toJSON = function () {
  const { _id, name, email, phone, role, shop, active, lastLoginAt, createdAt, updatedAt } = this
  return { id: _id, name, email, phone, role, shop, active, lastLoginAt, createdAt, updatedAt }
}

export const User = mongoose.model('User', userSchema)
