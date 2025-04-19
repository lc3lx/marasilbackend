const ShippingCompanySettings = require("../models/shippingCompanySettings");

const shippingSettings = [
  {
    companyName: "smsa",
    isWeightBased: true,
    maxBoxesAllowed: 3,
    baseWeightRanges: [
      {
        minWeight: 0.1,
        maxWeight: 15,
        price: 40 // سعر الشركة الأساسي
      }
    ],
    extraWeightPrice: 2, // سعر الكيلو الزائد من الشركة
    extraWeightProfit: 1, // ربح إضافي على كل كيلو زائد
    profitPerShipment: 5, // ربح ثابت على كل شحنة
    baseCodFees: 8, // رسوم الدفع عند الاستلام من الشركة
    codFeesProfit: 2, // ربح إضافي على رسوم الدفع عند الاستلام
    isActive: true
  },
  {
    companyName: "aramex",
    isWeightBased: true,
    maxBoxesAllowed: 3,
    baseWeightRanges: [
      {
        minWeight: 0.1,
        maxWeight: 15,
        price: 45 // سعر الشركة الأساسي
      }
    ],
    extraWeightPrice: 2.5, // سعر الكيلو الزائد من الشركة
    extraWeightProfit: 1.5, // ربح إضافي على كل كيلو زائد
    profitPerShipment: 6, // ربح ثابت على كل شحنة
    baseCodFees: 10, // رسوم الدفع عند الاستلام من الشركة
    codFeesProfit: 2, // ربح إضافي على رسوم الدفع عند الاستلام
    isActive: true
  },
  {
    companyName: "redbox",
    isWeightBased: false,
    maxBoxesAllowed: 3,
    boxSizes: [
      {
        name: "small",
        maxWeight: 15,
        length: 30,
        width: 30,
        height: 30,
        price: 35 // سعر الشركة للصندوق الصغير
      },
      {
        name: "medium",
        maxWeight: 15,
        length: 40,
        width: 40,
        height: 40,
        price: 45 // سعر الشركة للصندوق المتوسط
      },
      {
        name: "large",
        maxWeight: 15,
        length: 50,
        width: 50,
        height: 50,
        price: 55 // سعر الشركة للصندوق الكبير
      }
    ],
    profitPerShipment: 5, // ربح ثابت على كل صندوق
    codFees: 10,
    isActive: true
  },
  {
    companyName: "omnilama",
    isWeightBased: false,
    maxBoxesAllowed: 3,
    boxSizes: [
      {
        name: "xs",
        maxWeight: 15,
        length: 20,
        width: 20,
        height: 20,
        price: 30
      },
      {
        name: "small",
        maxWeight: 15,
        length: 30,
        width: 30,
        height: 30,
        price: 35
      },
      {
        name: "medium",
        maxWeight: 15,
        length: 40,
        width: 40,
        height: 40,
        price: 45
      },
      {
        name: "large",
        maxWeight: 15,
        length: 50,
        width: 50,
        height: 50,
        price: 55
      },
      {
        name: "xl",
        maxWeight: 15,
        length: 60,
        width: 60,
        height: 60,
        price: 65
      },
      {
        name: "xxl",
        maxWeight: 15,
        length: 70,
        width: 70,
        height: 70,
        price: 75
      },
      {
        name: "xxxl",
        maxWeight: 15,
        length: 80,
        width: 80,
        height: 80,
        price: 85
      },
      {
        name: "jumbo",
        maxWeight: 15,
        length: 100,
        width: 100,
        height: 100,
        price: 100
      }
    ],
    profitPerShipment: 5, // ربح ثابت على كل صندوق
    codFees: 10,
    isActive: true
  }
];

const seedShippingSettings = async () => {
  try {
    // حذف البيانات القديمة
    await ShippingCompanySettings.deleteMany();
    
    // إضافة البيانات الجديدة
    await ShippingCompanySettings.create(shippingSettings);
    
    console.log("تم إضافة إعدادات شركات الشحن بنجاح");
    process.exit();
  } catch (error) {
    console.error("خطأ في إضافة إعدادات شركات الشحن:", error);
    process.exit(1);
  }
};

module.exports = seedShippingSettings;
