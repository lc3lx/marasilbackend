const express = require("express");
const router = express.Router();
const sallaController = require("../controllers/sallaController");

// إضافة متجر سلة جديد
router.post("/add", sallaController.addSallaStore);

// توجيه الزبون لربط المتجر
router.get("/connect/:storeId", sallaController.connectSallaStore);

// التعامل مع الرد بعد الموافقة
router.get("/callback", sallaController.handleSallaCallback);

// تجديد access_token
router.post("/refresh/:storeId", sallaController.refreshSallaToken);
// جلب الطلبات من متجر سلة
router.get("/orders/:storeId", sallaController.fetchSallaOrders);

// عرض الطلبات المخزنة
router.get("/stored-orders/:storeId", sallaController.getStoredOrders);

module.exports = router;
