const express = require("express");
const router = express.Router();
const shopifyController = require("../controllers/shopifyController");

// إضافة متجر Shopify جديد
router.post("/add", shopifyController.addShopifyStore);

// توجيه الزبون لربط المتجر
router.get("/connect/:storeId", shopifyController.connectShopifyStore);

// التعامل مع الرد بعد الموافقة
router.get("/callback", shopifyController.handleShopifyCallback);

// جلب الطلبات من متجر Shopify
router.get("/orders/:storeId", shopifyController.fetchShopifyOrders);

module.exports = router;
