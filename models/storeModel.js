const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
  customerId: { type: String, required: true, ref: "Customer" }, // معرف الزبون
  storeName: { type: String, required: true }, // اسم المتجر
  platform: { type: String, required: true }, // نوع المنصة (salla, shopify, woocommerce...)
  client_id: { type: String }, // Client ID الخاص بالمتجر (اختياري بناءً على المنصة)
  client_secret: { type: String }, // Client Secret الخاص بالمتجر (اختياري بناءً على المنصة)
  access_token: { type: String }, // Access Token
  refresh_token: { type: String }, // Refresh Token
  createdAt: { type: Date, default: Date.now },
});

const Store = mongoose.model("Store", storeSchema);

module.exports = Store;
