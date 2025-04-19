const express = require("express");
const {
  createsmsaShapment,
  createAramexShipment,
} = require("../controllers/shapmentController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// حماية جميع الروابط
router.use(protect);

// إنشاء شحنة SMSA
router.post("/smsa/:id", createsmsaShapment);

// إنشاء شحنة Aramex
router.post("/aramex/:id", createAramexShipment);

module.exports = router;
