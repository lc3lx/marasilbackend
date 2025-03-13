const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const auth = require("../controllers/authController");
const bankInfoRoute = require("./bankInfoRoutes");
const prsonealInfoRoute = require("./prsonealInfoRoutes");

// nested route
router.use("/:customerId/bankinfo", bankInfoRoute);
router.use("/:customerId/presonealinfo", prsonealInfoRoute);

router.get(
  "/getallcustomer",
  auth.protect,
  auth.allowedTo("superAdmin", "manger"),
  customerController.getCustomer
);
router.get(
  "/getonecustomer/:id",
  auth.protect,
  auth.allowedTo("superAdmin", "manger"),
  customerController.getOneCustomer
);
router.post(
  "/createcustomer",
  auth.protect,
  auth.allowedTo("superAdmin", "manger"),
  customerController.createCustomer
);
router.delete(
  "/deletecustomer/:id",
  auth.protect,
  auth.allowedTo("superAdmin", "manger"),
  customerController.deleteCustomer
);

module.exports = router;
