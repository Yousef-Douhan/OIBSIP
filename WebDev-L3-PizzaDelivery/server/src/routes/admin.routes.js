const router = require('express').Router();
const { body, param } = require('express-validator');
const authCtrl = require('../controllers/auth.controller');
const ctrl = require('../controllers/admin.controller');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const { protect, isAdmin } = require('../middleware/auth');
const { ORDER_STATUSES } = require('../models/Order');

// public: admin login page
router.post(
  '/login',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  authCtrl.adminLogin
);

// everything below requires an admin token
router.use(protect, isAdmin);

const idRule = param('id').isMongoId().withMessage('Invalid id');

router.get('/inventory', ctrl.listInventory);
router.patch(
  '/inventory/:id',
  [
    idRule,
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be 0 or more').toInt(),
    body('threshold').optional().isInt({ min: 0 }).withMessage('Threshold must be 0 or more').toInt(),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be 0 or more').toFloat(),
    body('isActive').optional().isBoolean().toBoolean(),
  ],
  validate,
  ctrl.updateInventory
);

router.get('/orders', ctrl.listOrders);
router.patch(
  '/orders/:id/status',
  [idRule, body('status').isIn(ORDER_STATUSES).withMessage(`Status must be one of: ${ORDER_STATUSES.join(', ')}`)],
  validate,
  ctrl.updateOrderStatus
);

module.exports = router;
