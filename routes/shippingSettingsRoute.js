const express = require("express");
const {
  createShippingSettings,
  getShippingSettings,
  getShippingSettingsByCompany,
  updateShippingSettings,
  toggleShippingCompanyActive,
  calculateShippingCost,
} = require("../controllers/shippingSettingsController");

const router = express.Router();

// حماية جميع الروابط
const { protect, allowedTo } = require("../middlewares/authMiddleware");
router.use(protect);

// روابط حساب التكلفة متاحة للجميع
router.post("/:companyName/calculate-cost", calculateShippingCost);

// روابط الإدارة متاحة فقط للأدمن
router.use(allowedTo("admin"));

router
  .route("/")
  .get(getShippingSettings)
  .post(createShippingSettings);

router
  .route("/:companyName")
  .get(getShippingSettingsByCompany)
  .put(updateShippingSettings);

router.patch("/:companyName/toggle-active", toggleShippingCompanyActive);

module.exports = router;
