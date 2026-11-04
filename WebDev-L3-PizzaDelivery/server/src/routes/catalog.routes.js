const router = require('express').Router();
const ctrl = require('../controllers/catalog.controller');
const { protect } = require('../middleware/auth');

router.get('/pizzas', protect, ctrl.listPizzas);
router.get('/inventory/options', protect, ctrl.builderOptions);

module.exports = router;
