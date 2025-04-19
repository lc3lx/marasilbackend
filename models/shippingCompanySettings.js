const mongoose = require("mongoose");

const boxSizeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  maxWeight: { type: Number, required: true },
  length: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  price: { type: Number, required: true }
});

const weightRangeSchema = new mongoose.Schema({
  minWeight: { type: Number, required: true },
  maxWeight: { type: Number, required: true },
  price: { type: Number, required: true }
});

const shippingCompanySettingsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    enum: ["smsa", "aramex", "redbox", "omnilama"],
    required: true,
    unique: true
  },
  isWeightBased: {
    type: Boolean,
    required: true
  },
  maxBoxesAllowed: {
    type: Number,
    default: 3
  },
  // للشركات التي تعتمد على الوزن (SMSA & Aramex)
  baseWeightRanges: [weightRangeSchema],
  extraWeightPrice: {
    type: Number, // سعر الكيلو الزائد من الشركة
    default: 0
  },
  extraWeightProfit: {
    type: Number, // ربح إضافي على كل كيلو زائد
    default: 0
  },
  // للشركات التي تعتمد على حجم الصندوق (RedBox & OmniLam)
  boxSizes: [boxSizeSchema],
  // إعدادات عامة
  profitPerShipment: {
    type: Number,
    required: true,
    description: "الربح الثابت على كل شحنة بالريال"
  },
  baseCodFees: {
    type: Number,
    required: true,
    default: 0,
    description: "رسوم الدفع عند الاستلام الأساسية من الشركة بالريال"
  },
  codFeesProfit: {
    type: Number,
    required: true,
    default: 0,
    description: "ربح إضافي على رسوم الدفع عند الاستلام بالريال"
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// إضافة مؤشر للبحث السريع
shippingCompanySettingsSchema.index({ companyName: 1 });

const ShippingCompanySettings = mongoose.model("ShippingCompanySettings", shippingCompanySettingsSchema);

module.exports = ShippingCompanySettings;
