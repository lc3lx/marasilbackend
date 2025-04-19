const mongoose = require("mongoose");

const shapmentSchema = new mongoose.Schema({
  receiverAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomerAddress",
    required: true,
  },
  ordervalue: {
    type: Number,
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  senderAddress: {
    type: Object,
    required: true,
  },
  boxNum: {
    type: Number,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  dimension: {
    high: Number,
    width: Number,
    length: Number,
  },
  orderDescription: {
    type: String,
  },
  paymentMathod: {
    type: String,
    enum: ["Prepaid", "COD"],
  },

  shapmentingType: {
    type: String,
    enum: ["Dry", "Cold", "Quick", "Box"],
  },
  shapmentCompany: {
    type: String,
    enum: ["smsa", "aramex", "redbox", "omnillama"],
  },
  trackingId: {
    type: String,
    required: true,
  },
  storId: {
    type: String,
    required: true,
  },
  shapmentType: {
    type: String,
    required: true,
    enum: ["straight", "reverse"],
  },
  shapmentPrice: {
    type: Number,
    required: true,
  },
  orderSou: {
    type: String,
    required: true,
  },
  priceaddedtax: { type: Number, required: true, default: 0.15 },
  basePrice: { type: Number, required: true }, // السعر الأساسي (للمتعاقدين فقط)
  profitPrice: { type: Number, required: true },
  profitRTOprice: { type: Number, required: true },
  baseAdditionalweigth: { type: Number, required: true },
  profitAdditionalweigth: { type: Number, required: true },
  baseCODfees: { type: Number, required: true },
  profitCODfees: { type: Number, required: true },
  insurancecost: { type: Number, required: true },
  byocPrice: { type: Number, required: true, default: 0.0 },
  basepickUpPrice: { type: Number, required: true, default: 0.0 },
  profitpickUpPrice: { type: Number, required: true, default: 0.0 },
  baseRTOprice: { type: Number, required: true, default: 0.0 }, // رسوم الإرجاع
});

// إضافة indexes إضافية
shapmentSchema.index({ trackingId: 1 });
shapmentSchema.index({ orderId: 1 });
shapmentSchema.index({ status: 1 });

const Shapment = mongoose.model("Shapment", shapmentSchema);
module.exports = Shapment;
