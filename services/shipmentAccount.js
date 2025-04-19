//حساب الشحنات الخاصة بالصناديق
module.exports.shipmentbox = (company, order) => {};

// حساب سعر الشحنات العادية مع تحسينات
module.exports.shipmentnorm = (company, order) => {
  // التحقق من صحة المدخلات
  validateInputs(company, order);

  // استخراج الإعدادات المطلوبة
  const {
    basePrice,
    profitPrice,
    maxWeight,
    baseAdditionalweigth,
    profitAdditionalweigth,
    baseCODfees,
    profitCODfees,
    priceaddedtax,
  } = company.settings;

  // حساب التكلفة الأساسية
  let baseCost = basePrice + profitPrice;

  // حساب التكلفة الإضافية للوزن الزائد
  const additionalWeightCost = calculateAdditionalWeightCost(
    order.weight,
    maxWeight,
    baseAdditionalweigth,
    profitAdditionalweigth
  );

  // حساب رسوم COD إذا كانت الطريقة COD
  const codFees =
    order.paymentMethod === "COD" ? baseCODfees + profitCODfees : 0;

  // حساب الضريبة
  const subtotal = baseCost + additionalWeightCost + codFees;
  const tax = subtotal * priceaddedtax;

  // الإجمالي النهائي
  const total = subtotal + tax;

  return {
    baseCost,
    additionalWeightCost,
    codFees,
    tax,
    total,
  };
};

// دالة التحقق من المدخلات
function validateInputs(company, order) {
  if (!company?.settings) throw new Error("Company settings are missing");
  if (!order?.paymentMethod) throw new Error("Payment method is required");
  if (typeof order.weight !== "number" || order.weight <= 0)
    throw new Error("Invalid weight");
}

// دالة حساب التكلفة الإضافية للوزن
function calculateAdditionalWeightCost(
  weight,
  maxWeight,
  baseAdditional,
  profitAdditional
) {
  if (weight <= maxWeight) return 0;
  const extraWeight = Math.ceil(weight - maxWeight);
  return extraWeight * (baseAdditional + profitAdditional);
}
