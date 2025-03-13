const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeController");

router.post("/add", storeController.addStore);
router.get("/connect/:storeId", storeController.connectStore);
router.get("/callback", storeController.handleCallback);
router.post("/refresh/:storeId", storeController.refreshToken);

module.exports = router;
