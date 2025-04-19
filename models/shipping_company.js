const mongoose = require("mongoose");

const ShippingCompanySchema = new mongoose.Schema({
  countries: {
    fromCountry: { type: String, required: true },
    toCountry: { type: String, required: true },
  },
  company: {
    name: {
      type: String,
      enum: ["smsa", "redbox", "omniclama", "aramex"],
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function (value) {
          const company = this.company.name;
          switch (company) {
            case "smsa":
              return (
                value.api_key ||
                value.b2b_key ||
                (value.username && value.account_number && value.password)
              );
            case "redbox":
              return value.token;
            case "omniclama":
              return value.client_id && value.client_secret;
            case "aramex":
              return (
                value.username &&
                value.password &&
                value.account_number &&
                value.pin &&
                value.entity &&
                value.version
              );
            default:
              return true;
          }
        },
        message: "Invalid credentials for {VALUE}",
      },
    },
    apiEndpoints: {
      cities: { type: String }, // رابط API لجلب المدن (مثل: "https://api.smsa.com/cities")
      zones: { type: String }, // رابط API لجلب المناطق (إذا كان متاحاً)
    },
  },
  baseUrl: {
    type: String,
    required: true,
  },

  // إعدادات الشحن
  settings: {
    byoc: { type: Boolean, required: true },
    COD: { type: Boolean, required: true },
    maxCodAmount: { type: Number, required: true },
    maxWeight: { type: Number, required: true }, // الحد الأقصى للوزن
    maxBoxes: { type: Number, required: true },

    pricingType: {
      type: String,
      enum: ["contract", "customer_account"],
      required: true,
    },
    priceaddedtax: { type: Number, required: true, default: 0.15 },
    basePrice: { type: Number, required: true }, // السعر الأساسي (للمتعاقدين فقط)
    profitPrice: { type: Number, required: true },
    baseRTOprice: { type: Number, required: true, default: 0.0 }, // رسوم الإرجاع
    profitRTOprice: { type: Number, required: true },
    baseAdditionalweigth: { type: Number, required: true },
    profitAdditionalweigth: { type: Number, required: true },
    baseCODfees: { type: Number, required: true },
    profitCODfees: { type: Number, required: true },
    insurancecost: { type: Number, required: true },
    byocPrice: { type: Number, required: true, default: 0.0 },
    basepickUpPrice: { type: Number, required: true, default: 0.0 },
    profitpickUpPrice: { type: Number, required: true, default: 0.0 },
  },

  // أنواع الشحن
  shippingTypes: [
    {
      type: String,
      enum: ["Dry", "Cold", "Quick", "Box"],
      required: true,
    },
  ],
  // الحد الأدنى لعدد الشحنات
  minShipments: { type: Number, required: true },

  // حالة الشركة
  status: {
    type: String,
    required: true,
    enum: ["Enabled", "Disabled"],
  },
  conditions: { type: String, required: true },
  details: { type: String, required: true },
  conditionsAr: { type: String, required: true },
  detailsAr: { type: String, required: true },
  trackingURL: { type: String },
  pickUpStatus: {
    type: String,
    required: true,
    enum: ["Yes", "No"],
  },
});
const ShippingCompany = mongoose.model(
  "ShippingCompany",
  ShippingCompanySchema
);
module.exports = ShippingCompany;
