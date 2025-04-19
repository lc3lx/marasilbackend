const ShippingCompanySettings = require("../models/shippingCompanySettings");
const ApiError = require("../utils/apiError");
const asyncHandler = require("express-async-handler");

// @desc    إضافة إعدادات شركة شحن جديدة
// @route   POST /api/v1/shipping-settings
// @access  Private/Admin
exports.createShippingSettings = asyncHandler(async (req, res) => {
  const settings = await ShippingCompanySettings.create(req.body);
  res.status(201).json({
    status: "success",
    data: settings,
  });
});

// @desc    الحصول على إعدادات جميع شركات الشحن
// @route   GET /api/v1/shipping-settings
// @access  Private/Admin
exports.getShippingSettings = asyncHandler(async (req, res) => {
  const settings = await ShippingCompanySettings.find();
  res.status(200).json({
    status: "success",
    results: settings.length,
    data: settings,
  });
});

// @desc    الحصول على إعدادات شركة شحن محددة
// @route   GET /api/v1/shipping-settings/:companyName
// @access  Private/Admin
exports.getShippingSettingsByCompany = asyncHandler(async (req, res, next) => {
  const settings = await ShippingCompanySettings.findOne({
    companyName: req.params.companyName,
  });

  if (!settings) {
    return next(new ApiError(`No settings found for ${req.params.companyName}`, 404));
  }

  res.status(200).json({
    status: "success",
    data: settings,
  });
});

// @desc    تحديث إعدادات شركة شحن
// @route   PUT /api/v1/shipping-settings/:companyName
// @access  Private/Admin
exports.updateShippingSettings = asyncHandler(async (req, res, next) => {
  const settings = await ShippingCompanySettings.findOneAndUpdate(
    { companyName: req.params.companyName },
    req.body,
    { new: true, runValidators: true }
  );

  if (!settings) {
    return next(new ApiError(`No settings found for ${req.params.companyName}`, 404));
  }

  res.status(200).json({
    status: "success",
    data: settings,
  });
});

// @desc    تفعيل/تعطيل شركة شحن
// @route   PATCH /api/v1/shipping-settings/:companyName/toggle-active
// @access  Private/Admin
exports.toggleShippingCompanyActive = asyncHandler(async (req, res, next) => {
  const settings = await ShippingCompanySettings.findOne({
    companyName: req.params.companyName,
  });

  if (!settings) {
    return next(new ApiError(`No settings found for ${req.params.companyName}`, 404));
  }

  settings.isActive = !settings.isActive;
  await settings.save();

  res.status(200).json({
    status: "success",
    data: settings,
  });
});

// @desc    حساب تكلفة الشحن
// @route   POST /api/v1/shipping-settings/:companyName/calculate-cost
// @access  Private
exports.calculateShippingCost = asyncHandler(async (req, res, next) => {
  const { calculateShippingCost } = require("../utils/shippingCostCalculator");
  
  const settings = await ShippingCompanySettings.findOne({
    companyName: req.params.companyName,
  });

  if (!settings) {
    return next(new ApiError(`No settings found for ${req.params.companyName}`, 404));
  }

  const cost = calculateShippingCost(settings, req.body);

  res.status(200).json({
    status: "success",
    data: cost,
  });
});
