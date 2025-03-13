const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");
const webhookController = require("../Controllers/webhookController");

// شحن المحفظة
router.post("/recharge", walletController.rechargeWallet);

// معالجة webhook من Moyasar
router.post("/webhook/moyasar", webhookController.handleMoyasarWebhook);

module.exports = router;
