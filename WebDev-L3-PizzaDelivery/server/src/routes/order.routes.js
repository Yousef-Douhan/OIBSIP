const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/order.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const userOnly = (req, res, next) =>
  req.user.role === 'user' ? next() : res.status(403).json({ message: 'Orders are placed by customers only' });

router.use(protect, userOnly);

const itemsRule = body('items').isObject().withMessage('items is required');

router.post('/quote', [itemsRule], validate, ctrl.quote);
router.post('/checkout', [itemsRule], validate, ctrl.checkout);
router.post(
  '/mock-pay',
  [
    body('gatewayOrderId').notEmpty().withMessage('gatewayOrderId is required'),
    body('outcome').isIn(['success', 'failure']).withMessage('outcome must be success or failure'),
  ],
  validate,
  ctrl.mockPay
);
router.post(
  '/verify',
  [
    body('gatewayOrderId').notEmpty(),
    body('paymentId').notEmpty(),
    body('signature').notEmpty(),
  ],
  validate,
  ctrl.verify
);
router.get('/my', ctrl.myOrders);

module.exports = router;
