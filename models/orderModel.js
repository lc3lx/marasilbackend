const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  storeId: { type: String, required: true, ref: "Store" }, // معرف المتجر
  platform: { type: String, required: true }, // نوع المنصة
  orderId: { type: String, required: true }, // معرف الطلب
  status: { type: String, required: true, default: "unknown" }, // حالة الطلب
  totalAmount: { type: Number, required: true, default: 0 }, // المبلغ الإجمالي
  createdAt: { type: Date, default: Date.now }, // تاريخ الإنشاء
  data: { type: mongoose.Schema.Types.Mixed, default: {} }, // حقل عام لتخزين بيانات إضافية
});

// إضافة فهارس لتحسين البحث
orderSchema.index({ "data.payment_method": 1 }); // فهرس لنوع الدفع
orderSchema.index({ status: 1 }); // فهرس لحالة الطلب
orderSchema.index({ "data.shipping_address.city": "text" }); // فهرس باسم المدينة
orderSchema.index({ "data.shipping_method": "text" }); // فهرس لطريقة الشحن
orderSchema.index({ createdAt: 1 }); // فهرس لتاريخ الإنشاء

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
