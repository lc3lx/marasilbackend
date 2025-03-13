const mongoose = require("mongoose");

const ShippingCompanySchema = new mongoose.Schema({
  name: { type: String, required: true }, // اسم الشركة <button class="citation-flag" data-index="9">
  logo: String, // رابط الصورة <button class="citation-flag" data-index="9">
  minShipments: { type: Number, required: true }, // أقل عدد شحنات للاستلام <button class="citation-flag" data-index="9">
  deliveryTime: String, // وقت التوصيل (مثال: "3-5 أيام") <button class="citation-flag" data-index="9">
  notes: String, // ملاحظات الشركة <button class="citation-flag" data-index="9">
  pricingType: {
    type: String,
    enum: ["contract", "customer_account"], // نوع السعر <button class="citation-flag" data-index="9">
    required: true,
  },
  basePrice: Number, // السعر الأساسي (للمتعاقدين فقط) <button class="citation-flag" data-index="9">
  fixedFee: Number, // الرسوم الثابتة (لحسابات العملاء) <button class="citation-flag" data-index="9">
  allowedWeight: {
    // الوزن المسموح
    min: Number,
    max: Number,
  },
  shippingTypes: [
    // أنواع الشحن (4 أنواع)
    {
      type: String,
      enum: ["جاف", "مبرد", "مراسيل", "محطات الطرود"],
      required: true,
    },
  ],
});

module.exports = mongoose.model("ShippingCompany", ShippingCompanySchema);
