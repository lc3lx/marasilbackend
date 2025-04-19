const Shapment = require("../models/shapmentModel");
const CustomerAddress = require("../models/customerAddress");
const Order = require("../models/orderModel");
const shappingCompany = require("../models/shipping_company");
const smsaExxpress = require("../platforms/shipment/smsaExpressPlatform");
const Wallet = require("../models/walletModel");
const salla = require("../controllers/sallaController");
const ApiEror = require("../utils/apiError");
const Math = require("math");
const asyncHandler = require("express-async-handler");
const { shipmentnorm } = require("../services/shipmentAccount");
const Aramex = require("../platforms/shipment/aramexPlatform");

module.exports.createsmsaShapment = asyncHandler(async (req, res, next) => {
  try {
    // 1. التحقق من وجود الطلب
    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new ApiEror("no order in this id ", 404));
    }
    // 2. التحقق من اختيار الشركة
    const { company } = req.body;
    if (!company) {
      return next(new ApiEror("choose one of shapment company ", 404));
    }
    if (company !== "smsa") {
      return next(new ApiEror("choose a smsa ", 404));
    }
    // 3. جلب بيانات شركة الشحن
    const smsa = await shappingCompany.findOne({ "company.name": company });
    if (!smsa) {
      return next(new ApiEror("no data conn for this company ", 404));
    }
    // 4. جلب عنوان التاجر
    const senderAddress = await CustomerAddress.findOne({
      customerId: order.customerId,
    });

    const smsashapment = new smsaExxpress(smsa.data.api_key, smsa.data.baseUrl);

    const wallet = await Wallet.findOne({ customerId: order.customerId });
    let shippingDetails;
    try {
      shippingDetails = shipmentnorm(smsa, order);
    } catch (error) {
      return next(new ApiEror("some worn in cuclet price "), 400);
    }
    const { tax, total } = shippingDetails;

    if (wallet.balance < shapmentprice) {
      return new ApiEror("you dont have many for this method ", 402);
    }
    const shapment = new Shapment({
      orderId: order.orderId,
      orderSou: order.platform,
      ordervalue: order.ordervalue,
      weight: order.weight || req.body.weight,
      senderAddress: customer,
      paymentMathod: order.paymentMathod,
      orderDescription: order.orderDescription,
      boxNum: req.body.boxNum,
      receiverAddress: receiverAddress,
      trackingId: providerResponse.awb,
      status: "created",
      shapmentCompany: company,
      shapmentingType: req.body.shapmentingType,
      shapmentType: req.body.shapmentType,
      shapmentPrice: total,
      priceaddedtax: tax,
      basePrice: smsa.settings.basePrice,
      baseAdditionalweigth: smsa.settings.baseAdditionalweigth,
      baseCODfees: smsa.settings.baseCODfees,
      basepickUpPrice: smsa.settings.basepickUpPrice,
      baseRTOprice: smsa.settings.baseRTOprice,
      byocPrice: smsa.settings.byocPrice,
      insurancecost: smsa.settings.insurancecost,
      profitAdditionalweigth: smsa.settings.profitAdditionalweigth,
      profitCODfees: smsa.settings.profitCODfees,
      profitpickUpPrice: smsa.settings.profitpickUpPrice,
      profitPrice: smsa.settings.profitPrice,
      profitRTOprice: smsa.settings.profitRTOprice,
    });
    const providerResponse = await smsashapment.createSMSAShipment(
      shapment,
      smsa
    );
    shapment.trackingId = providerResponse.awb;
    await shapment.save();
    order.status = "shipped";
    await order.save();
    if (order.platform === "salla") {
      order.params.id = order.orderId;
      await salla.updateOrderStatus(order.orderId, { status: "shipped" });
    }
    wallet.balance -= shapmentprice;
    await wallet.save();

    res.status(201).json({ status: "success", data: shapment });
  } catch (error) {
    next(new ApiEror(`failed to create shipment :${error.message}`, 500));
  }
});

module.exports.createAramexShipment = asyncHandler(async (req, res, next) => {
  try {
    // 1. التحقق من وجود الطلب
    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new ApiEror("no order in this id ", 404));
    }

    // 2. التحقق من اختيار الشركة
    const { company } = req.body;
    if (!company) {
      return next(new ApiEror("choose one of shapment company ", 404));
    }
    if (company !== "aramex") {
      return next(new ApiEror("choose aramex ", 404));
    }

    // 3. جلب بيانات شركة الشحن
    const aramex = await shappingCompany.findOne({ "company.name": company });
    if (!aramex) {
      return next(new ApiEror("no data conn for this company ", 404));
    }

    // 4. جلب عنوان التاجر
    const senderAddress = await CustomerAddress.findOne({
      customerId: order.customerId,
    });

    // 5. تهيئة عميل Aramex
    const aramexClient = new Aramex(
      aramex.data.username,
      aramex.data.password,
      aramex.data.account_number,
      aramex.data.pin,
      aramex.data.entity,
      aramex.data.country_code,
      aramex.baseUrl
    );

    // 6. حساب تكلفة الشحن
    let shippingDetails;
    try {
      shippingDetails = shipmentnorm(aramex, order);
    } catch (error) {
      return next(new ApiEror("error in calculate price ", 400));
    }
    const { tax, total } = shippingDetails;

    // 7. التحقق من رصيد المحفظة
    const wallet = await Wallet.findOne({ customerId: order.customerId });
    if (wallet.balance < total) {
      return next(new ApiEror("insufficient balance ", 402));
    }

    // 8. تحضير بيانات الشحنة
    const shipmentData = {
      Reference1: order.orderId,
      Reference2: order.platform,
      Reference3: order.orderDescription,
      Shipper: {
        Reference1: order.customerId,
        Reference2: order.platform,
        AccountNumber: aramex.data.account_number,
        PartyAddress: {
          Line1: senderAddress.addressLine1,
          Line2: senderAddress.addressLine2 || "",
          Line3: "",
          City: senderAddress.city,
          StateOrProvinceCode: senderAddress.state,
          PostCode: senderAddress.postalCode,
          CountryCode: senderAddress.country,
        },
        Contact: {
          Department: "",
          PersonName: senderAddress.name,
          Title: "",
          CompanyName: senderAddress.company || "",
          PhoneNumber1: senderAddress.phone,
          PhoneNumber1Ext: "",
          PhoneNumber2: "",
          PhoneNumber2Ext: "",
          FaxNumber: "",
          CellPhone: senderAddress.phone,
          EmailAddress: senderAddress.email,
          Type: "",
        },
      },
      Consignee: {
        Reference1: order.orderId,
        Reference2: "",
        AccountNumber: "",
        PartyAddress: {
          Line1: order.customer.addressLine1,
          Line2: order.customer.addressLine2 || "",
          Line3: "",
          City: order.customer.city,
          StateOrProvinceCode: order.customer.state,
          PostCode: order.customer.postalCode,
          CountryCode: order.customer.country,
        },
        Contact: {
          Department: "",
          PersonName: order.customer.name,
          Title: "",
          CompanyName: order.customer.company || "",
          PhoneNumber1: order.customer.phone,
          PhoneNumber1Ext: "",
          PhoneNumber2: "",
          PhoneNumber2Ext: "",
          FaxNumber: "",
          CellPhone: order.customer.phone,
          EmailAddress: order.customer.email,
          Type: "",
        },
      },
      ThirdParty: {
        Reference1: "",
        Reference2: "",
        AccountNumber: "",
        PartyAddress: {
          Line1: "",
          Line2: "",
          Line3: "",
          City: "",
          StateOrProvinceCode: "",
          PostCode: "",
          CountryCode: "",
        },
        Contact: {
          Department: "",
          PersonName: "",
          Title: "",
          CompanyName: "",
          PhoneNumber1: "",
          PhoneNumber1Ext: "",
          PhoneNumber2: "",
          PhoneNumber2Ext: "",
          FaxNumber: "",
          CellPhone: "",
          EmailAddress: "",
          Type: "",
        },
      },
      ShippingDateTime: new Date().toISOString(),
      DueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      Comments: order.orderDescription,
      PickupLocation: "Reception",
      OperationsInstructions: "",
      AccountingInstrcutions: "",
      Details: {
        Dimensions: {
          Length: order.dimension?.length || 0,
          Width: order.dimension?.width || 0,
          Height: order.dimension?.height || 0,
          Unit: "cm",
        },
        ActualWeight: {
          Value: order.weight,
          Unit: "KG",
        },
        ChargeableWeight: {
          Value: order.weight,
          Unit: "KG",
        },
        DescriptionOfGoods: order.orderDescription,
        GoodsOriginCountry: senderAddress.country,
        NumberOfPieces: order.boxNum,
        ProductGroup: "EXP",
        ProductType: "PPX",
        PaymentType: order.paymentMethod === "COD" ? "P" : "P",
        PaymentOptions: order.paymentMethod === "COD" ? "ASCC" : "",
        Services: "",
        Items: [
          {
            PackageType: "Box",
            Quantity: order.boxNum,
            Weight: {
              Value: order.weight,
              Unit: "KG",
            },
            Comments: order.orderDescription,
            Reference: "",
          },
        ],
      },
      CustomsValueAmount: {
        CurrencyCode: "SAR",
        Value: order.ordervalue,
      },
      CashOnDeliveryAmount: {
        CurrencyCode: "SAR",
        Value: order.paymentMethod === "COD" ? order.ordervalue : 0,
      },
      InsuranceAmount: {
        CurrencyCode: "SAR",
        Value: order.ordervalue,
      },
      CollectAmount: {
        CurrencyCode: "SAR",
        Value: 0,
      },
      CashAdditionalAmount: {
        CurrencyCode: "SAR",
        Value: 0,
      },
      CashAdditionalAmountDescription: "",
    };

    // 9. إنشاء الشحنة
    const providerResponse = await aramexClient.createShipment(shipmentData);

    // 10. حفظ بيانات الشحنة
    const shapment = new Shapment({
      orderId: order.orderId,
      orderSou: order.platform,
      ordervalue: order.ordervalue,
      weight: order.weight,
      senderAddress: senderAddress,
      paymentMathod: order.paymentMethod,
      orderDescription: order.orderDescription,
      boxNum: order.boxNum,
      receiverAddress: order.customer,
      trackingId: providerResponse.Shipments.Shipment.ID,
      status: "created",
      shapmentCompany: company,
      shapmentingType: req.body.shapmentingType,
      shapmentType: req.body.shapmentType,
      shapmentPrice: total,
      priceaddedtax: tax,
      basePrice: aramex.settings.basePrice,
      baseAdditionalweigth: aramex.settings.baseAdditionalweigth,
      baseCODfees: aramex.settings.baseCODfees,
      basepickUpPrice: aramex.settings.basepickUpPrice,
      baseRTOprice: aramex.settings.baseRTOprice,
      byocPrice: aramex.settings.byocPrice,
      insurancecost: aramex.settings.insurancecost,
      profitAdditionalweigth: aramex.settings.profitAdditionalweigth,
      profitCODfees: aramex.settings.profitCODfees,
      profitpickUpPrice: aramex.settings.profitpickUpPrice,
      profitPrice: aramex.settings.profitPrice,
      profitRTOprice: aramex.settings.profitRTOprice,
    });

    await shapment.save();

    // 11. تحديث حالة الطلب
    order.status = "shipped";
    await order.save();

    // 12. تحديث رصيد المحفظة
    wallet.balance -= total;
    await wallet.save();

    // 13. إرجاع النتيجة
    res.status(201).json({
      status: "success",
      data: shapment,
      trackingNumber: providerResponse.Shipments.Shipment.ID,
      labelUrl: providerResponse.Shipments.Shipment.LabelURL,
    });
  } catch (error) {
    next(new ApiEror(`failed to create shipment: ${error.message}`, 500));
  }
});
