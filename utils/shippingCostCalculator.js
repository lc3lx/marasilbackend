const calculateVAT = (amount) => {
  const VAT_RATE = 0.15; // 15% ضريبة القيمة المضافة
  return amount * VAT_RATE;
};

const calculateWeightBasedCost = (settings, weight, boxCount, isCOD, customerContract = null) => {
  // التحقق من عدد الصناديق المسموح
  if (boxCount > settings.maxBoxesAllowed) {
    throw new Error(`Maximum allowed boxes for ${settings.companyName} is ${settings.maxBoxesAllowed}`);
  }

  let baseCost, profitAmount, extraWeightPrice, extraWeightProfit, codFees, codFeesProfit;

  // إذا كان العميل لديه عقد خاص
  if (customerContract && customerContract.isActive) {
    // البحث عن نطاق الوزن في العقد
    const contractWeightRange = customerContract.weightBasedPrices.find(
      range => weight >= range.minWeight && weight <= range.maxWeight
    );

    if (!contractWeightRange) {
      throw new Error("Weight is outside of contract supported ranges");
    }

    baseCost = contractWeightRange.price;
    profitAmount = customerContract.profitPerShipment;
    extraWeightPrice = customerContract.extraWeightPrice;
    extraWeightProfit = customerContract.extraWeightProfit;
    codFees = customerContract.contractCodFees;
    codFeesProfit = customerContract.codFeesProfit;
  } else {
    // استخدام الأسعار العادية
    const weightRange = settings.baseWeightRanges.find(
      range => weight >= range.minWeight && weight <= range.maxWeight
    );

    if (!weightRange) {
      throw new Error("Weight is outside of supported ranges");
    }

    baseCost = weightRange.price;
    profitAmount = settings.profitPerShipment;
    extraWeightPrice = settings.extraWeightPrice;
    extraWeightProfit = settings.extraWeightProfit;
    codFees = settings.baseCodFees;
    codFeesProfit = settings.codFeesProfit;
  }

  // حساب تكلفة الوزن الزائد
  if (weight > 15) {
    const extraWeight = weight - 15;
    baseCost += extraWeight * extraWeightPrice;
    // إضافة ربح على الوزن الزائد
    profitAmount += extraWeight * extraWeightProfit;
  }

  // ضرب التكلفة بعدد الصناديق
  baseCost *= boxCount;
  profitAmount *= boxCount;

  let totalCost = baseCost + profitAmount;

  // إضافة رسوم الدفع عند الاستلام
  if (isCOD) {
    totalCost += codFees + codFeesProfit;
  }

  // إضافة ضريبة القيمة المضافة
  const vat = calculateVAT(totalCost);
  totalCost += vat;

  return {
    baseCost,
    profitAmount,
    codFees: isCOD ? settings.codFees : 0,
    vat,
    totalCost
  };
};

const calculateBoxBasedCost = (settings, boxes, isCOD, customerContract = null) => {
  // التحقق من عدد الصناديق المسموح
  if (boxes.length > settings.maxBoxesAllowed) {
    throw new Error(`Maximum allowed boxes for ${settings.companyName} is ${settings.maxBoxesAllowed}`);
  }

  let baseCost = 0;
  let profitAmount = 0;

  // حساب تكلفة كل صندوق
  for (const box of boxes) {
    const boxSize = settings.boxSizes.find(size => size.name === box.size);
    if (!boxSize) {
      throw new Error(`Invalid box size: ${box.size}`);
    }

    // التحقق من الوزن الأقصى للصندوق
    if (box.weight > boxSize.maxWeight) {
      throw new Error(`Box weight exceeds maximum allowed weight for size ${box.size}`);
    }

    baseCost += boxSize.price;
    profitAmount += settings.profitPerShipment; // إضافة ربح ثابت لكل صندوق
  }

  let totalCost = baseCost + profitAmount;

  // إضافة رسوم الدفع عند الاستلام
  if (isCOD) {
    totalCost += codFees + codFeesProfit;
  }

  // إضافة ضريبة القيمة المضافة
  const vat = calculateVAT(totalCost);
  totalCost += vat;

  return {
    baseCost,
    profitAmount,
    codFees: isCOD ? settings.codFees : 0,
    vat,
    totalCost
  };
};

const calculateShippingCost = (settings, shipmentData, customerContract = null) => {
  if (!settings.isActive) {
    throw new Error("Shipping company is not active");
  }

  if (settings.isWeightBased) {
    return calculateWeightBasedCost(
      settings,
      shipmentData.weight,
      shipmentData.boxCount,
      shipmentData.paymentMethod === "COD",
      customerContract
    );
  } else {
    return calculateBoxBasedCost(
      settings,
      shipmentData.boxes,
      shipmentData.paymentMethod === "COD",
      customerContract
    );
  }
};

module.exports = {
  calculateShippingCost,
  calculateVAT
};
