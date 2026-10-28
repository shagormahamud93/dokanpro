import { Router } from 'express'
import { protect, restrictTo } from '../../middlewares/auth.js'
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
} from './user.controller.js'

const router = Router()

router.use(protect, restrictTo('admin'))

router.route('/').get(listUsers).post(createUser)
router.route('/:id').get(getUser).put(updateUser).delete(deleteUser)

export default router
