const axios = require("axios");
const config = require("../config/config");

class SMSAService {
  constructor() {
    this.apiKey = "b60dbb7bc50a4331a3411c820c08dffc".toUpperCase(); // API Key must be in uppercase
    this.baseURL = "https://ecomapis-sandbox.azurewebsites.net";
  }

  /**
   * تحويل عنوان العميل إلى صيغة SMSA
   * @param {Object} address عنوان العميل من قاعدة البيانات
   * @returns {Object} عنوان بصيغة SMSA
   */
  formatAddress(address) {
    return {
      ContactName: address.name || "غير محدد", // بين 5 و150 حرف
      ContactPhoneNumber: address.phone || "0000000000", // رقم الهاتف
      Country: address.country || "SA", // رمز الدولة
      City: address.city || "غير محدد", // اسم المدينة
      AddressLine1: address.addressLine1 || "غير محدد", // العنوان الأساسي
    };
  }
  async createShipment(shipmentData) {
    try {
      // 1. التحقق من صحة البيانات
      if (!shipmentData.receiverAddress || !shipmentData.senderAddress) {
        throw new Error("عنوان المرسل أو المستلم غير متوفر");
      }

      // 2. تحويل البيانات إلى التنسيق المطلوب
      const payload = {
        ConsigneeAddress: this.formatAddress(shipmentData.receiverAddress),
        ShipperAddress: this.formatAddress(shipmentData.senderAddress),
        OrderNumber: String(shipmentData.OrderNumber || "ORD-UNKNOWN"), // تأكد من وجود قيمة افتراضية
        DeclaredValue: parseFloat(shipmentData.ordervalue) || 0.0, // تأكد من وجود قيمة افتراضية
        CODAmount:
          shipmentData.paymentMethod === "COD"
            ? parseFloat(shipmentData.ordervalue) || 0.0
            : 0.0,
        Parcels: parseInt(shipmentData.boxNum, 10) || 1, // تأكد من وجود قيمة افتراضية
        ShipDate: new Date().toISOString(), // تأكد من التنسيق الصحيح
        ShipmentCurrency: "SAR",
        SMSARetailID: shipmentData.SMSARetailID || "0", // قيمة افتراضية
        WaybillType: "PDF",
        Weight: parseFloat(shipmentData.weight) || 0.0, // تأكد من وجود قيمة افتراضية
        WeightUnit: "KG",
        ContentDescription:
          shipmentData.orderDescription || "E-commerce shipment",
        VatPaid: true,
        DutyPaid:
          shipmentData.DutyPaid !== undefined ? shipmentData.DutyPaid : false, // قيمة افتراضية
        ServiceCode: this.getServiceCode(shipmentData.shippingType),
      };

      // 3. التحقق من صحة الطلب قبل الإرسال

      // 4. إرسال الطلب
      const response = await axios.post(
        `${this.baseURL}/api/shipment/b2c/new`,
        payload,
        {
          headers: {
            apikey: this.apiKey.toUpperCase(), // حسب التوثيق
            "Content-Type": "application/json",
            Host: "ecomapis-sandbox.azurewebsites.net",
          },

          validateStatus: function (status) {
            return status < 500; // Resolve only if the status code is less than 500
          },
        }
      );

      // 5. معالجة الردود المختلفة
      if (response.status === 401) {
        throw new Error("غير مصرح: تأكد من صحة API Key");
      }

      if (response.status === 400) {
        const errorDetails = response.data.errors
          ? Object.entries(response.data.errors)
              .map(([field, errors]) => `${field}: ${errors.join(", ")}`)
              .join("\n")
          : JSON.stringify(response.data);
        throw new Error(`خطأ في البيانات:\n${errorDetails}`);
      }

      // 6. التحقق من وجود بيانات الشحنة
      if (response.data?.sawb) {
        return {
          success: true,
          trackingNumber: response.data.sawb,
          awb: response.data.waybills?.[0]?.awb,
          label: response.data.waybills?.[0]?.awbFile,
          createdDate: response.data.createDate,
        };
      }

      throw new Error(`استجابة غير متوقعة: ${JSON.stringify(response.data)}`);
    } catch (error) {
      // 7. معالجة الأخطاء بشكل مفصل
      const errorLog = {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
      };

      console.error("SMSA API Error:", errorLog);
      throw new Error(`فشل إنشاء الشحنة: ${error.message}`);
    }
  }

  /////////////////////
  /**
   * تحويل نوع الشحن إلى رمز الخدمة المناسب
   * @param {String} type نوع الشحن
   * @returns {String} رمز الخدمة
   */
  getServiceCode(type) {
    const serviceMap = {
      DRY: "DRY", // توصيل عادي
      FRZ: "FRZ", // توصيل مبرد
      CREX: "CREX", // توصيل سريع
      BOX: "BOX", // صندوق بريد
    };
    return serviceMap[type] || "DRY";
  }

  /**
   * تتبع شحنة واحدة
   * @param {String} awb رقم الشحنة
   * @returns {Promise<Object>} تفاصيل وحالة الشحنة
   */
  async trackShipment(awb) {
    try {
      if (!awb) {
        throw new Error("رقم الشحنة غير موجود");
      }

      const response = await this.client.get(`/api/shipment/track/${awb}`, {
        headers: {
          apikey: this.apiKey.toUpperCase(),
          "Content-Type": "application/json",
          Host: "ecomapis-sandbox.azurewebsites.net",
        },
        validateStatus: (status) => status < 500,
      });

      if (response.status !== 200) {
        const errorDetails = response.data
          ? response.data.message || JSON.stringify(response.data)
          : "Unknown error";
        throw new Error(`خطأ في تتبع الشحنة: ${errorDetails}`);
      }

      return {
        success: true,
        tracking: response.data,
      };
    } catch (error) {
      const errorLog = {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
      };
      console.error("SMSA Tracking Error:", errorLog);
      throw new Error(
        `فشل في تتبع الشحنة: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * الاستعلام عن شحنة باستخدام رقم الشحنة
   * @param {String} awb رقم الشحنة
   * @returns {Promise<Object>} تفاصيل الشحنة
   */
  async queryShipment(awb) {
    try {
      if (!awb) {
        throw new Error("رقم الشحنة غير موجود");
      }

      const response = await this.client.get(`/api/shipment/b2c/query/${awb}`, {
        headers: {
          apikey: this.apiKey.toUpperCase(),
          "Content-Type": "application/json",
          Host: "ecomapis-sandbox.azurewebsites.net",
        },
        validateStatus: (status) => status < 500,
      });

      if (response.status !== 200) {
        const errorDetails = response.data
          ? response.data.message || JSON.stringify(response.data)
          : "Unknown error";
        throw new Error(`خطأ في الاستعلام عن الشحنة: ${errorDetails}`);
      }

      return {
        success: true,
        sawb: response.data.sawb,
        createDate: response.data.createDate,
        shipmentParcelsCount: response.data.shipmentParcelsCount,
        waybills: response.data.waybills.map((waybill) => ({
          awb: waybill.awb,
          awbFile: waybill.awbFile,
        })),
      };
    } catch (error) {
      const errorLog = {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
      };
      console.error("SMSA Query Error:", errorLog);
      throw new Error(
        `فشل في الاستعلام عن الشحنة: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * إنشاء شحنة مرتجعة
   * @param {Object} returnData بيانات الشحنة المرتجعة
   * @returns {Promise<Object>} نتيجة إنشاء الشحنة المرتجعة
   */
  async createReturnShipment(returnData) {
    try {
      // التحقق من صحة البيانات الأساسية للعنوان
      if (
        !returnData ||
        !returnData.pickupAddress ||
        !returnData.returnToAddress
      ) {
        throw new Error(
          "بيانات العنوان (PickupAddress و ReturnToAddress) مطلوبة لإنشاء الشحنة المرتجعة"
        );
      }

      // إعداد الـ payload بتنسيق SMSA المطلوب
      const payload = {
        PickupAddress: this.formatAddress(returnData.pickupAddress),
        ReturnToAddress: this.formatAddress(returnData.returnToAddress),
        OrderNumber: returnData.orderId || "ORD-RETURN",
        DeclaredValue: parseFloat(returnData.orderValue) || 0.0,
        Parcels: parseInt(returnData.boxNum, 10) || 1,
        ShipDate: new Date().toISOString(),
        ShipmentCurrency: "SAR",
        SMSARetailID: "0",
        WaybillType: "PDF",
        Weight: parseFloat(returnData.weight) || 0.0,
        WeightUnit: "KG",
        ContentDescription: returnData.description || "Return shipment",
        ServiceCode: "EDCR", // رمز خدمة الشحن المرتجع
      };

      // إرسال الطلب عبر POST مع ضبط الـ headers والتأكد من حالة الاستجابة
      const response = await this.client.post("/api/c2b/new", payload, {
        headers: {
          apikey: this.apiKey.toUpperCase(),
          "Content-Type": "application/json",
          Host: "ecomapis-sandbox.azurewebsites.net",
        },
        validateStatus: (status) => status < 500,
      });

      // التحقق من نجاح عملية الطلب عبر رمز الاستجابة
      if (response.status !== 200) {
        const errorDetails = response.data
          ? response.data.message || JSON.stringify(response.data)
          : "حدث خطأ غير معروف";
        throw new Error(`خطأ في إنشاء الشحنة المرتجعة: ${errorDetails}`);
      }

      return {
        success: true,
        trackingNumber: response.data.sawb,
        awb: response.data.waybills?.[0]?.awb,
        label: response.data.waybills?.[0]?.awbFile,
        createdDate: response.data.createDate,
      };
    } catch (error) {
      const errorLog = {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
      };
      console.error("SMSA Return Shipment Error:", errorLog);
      throw new Error(
        `فشل في إنشاء الشحنة المرتجعة: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * الاستعلام عن شحنة مرتجعة باستخدام رقم الشحنة
   * @param {String} awb رقم الشحنة
   * @returns {Promise<Object>} تفاصيل الشحنة المرتجعة
   */
  async queryReturnShipment(awb) {
    try {
      if (!awb) {
        throw new Error("رقم الشحنة غير موجود");
      }

      const response = await this.client.get(`/api/c2b/query/${awb}`, {
        headers: {
          apikey: this.apiKey.toUpperCase(),
          "Content-Type": "application/json",
          Host: "ecomapis-sandbox.azurewebsites.net",
        },
        validateStatus: (status) => status < 500,
      });

      if (response.status !== 200) {
        const errorDetails = response.data
          ? response.data.message || JSON.stringify(response.data)
          : "حدث خطأ غير معروف";
        throw new Error(`خطأ في الاستعلام عن الشحنة المرتجعة: ${errorDetails}`);
      }

      return {
        success: true,
        sawb: response.data.sawb,
        createDate: response.data.createDate,
        shipmentParcelsCount: response.data.shipmentParcelsCount,
        waybills: response.data.waybills.map((waybill) => ({
          awb: waybill.awb,
          awbFile: waybill.awbFile,
        })),
      };
    } catch (error) {
      const errorLog = {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
      };
      console.error("SMSA Return Query Error:", errorLog);
      throw new Error(
        `فشل في الاستعلام عن الشحنة المرتجعة: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * الحصول على قائمة الدول والعملات المدعومة
   * @returns {Promise<Array>} قائمة الدول والعملات
   */
  async getCurrencyCountryLookup() {
    try {
      const response = await this.client.get("/api/lookup/currency", {
        headers: {
          apikey: this.apiKey.toUpperCase(),
          "Content-Type": "application/json",
          Host: "ecomapis-sandbox.azurewebsites.net",
        },
        validateStatus: (status) => status < 500,
      });

      if (response.status !== 200) {
        const errorDetails = response.data
          ? response.data.message || JSON.stringify(response.data)
          : "حدث خطأ غير معروف";
        throw new Error(
          `خطأ في الحصول على قائمة الدول والعملات: ${errorDetails}`
        );
      }

      return response.data.map((item) => ({
        countryName: item.countryName,
        countryCode: item.countryCode,
        currency: item.currency,
        currencyCode: item.currencyCode,
      }));
    } catch (error) {
      console.error(
        "SMSA Currency Lookup Error:",
        error.response?.data || error.message
      );
      throw new Error(
        `فشل في الحصول على قائمة الدول والعملات: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * إرسال فاتورة الشحنة
   * @param {String} awb رقم الشحنة
   * @param {Array} items قائمة المنتجات
   * @param {Object} options خيارات إضافية (العملة، وحدة الوزن، التاريخ)
   * @returns {Promise<Object>} نتيجة إرسال الفاتورة
   */
  async pushShipmentInvoice(awb, items, options = {}) {
    try {
      if (!awb || !Array.isArray(items) || items.length === 0) {
        throw new Error("رقم الشحنة وقائمة المنتجات مطلوبة");
      }
      // تنسيق التاريخ بالصيغة المطلوبة dd/mm/yyyy
      const today = options.invoiceDate || new Date();
      const formattedDate = today.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      // تحضير المنتجات بالصيغة المطلوبة
      const formattedItems = items.map((item, index) => ({
        sequence: index + 1,
        ItemHSCode: item.hsCode,
        QuantityUnit: item.quantityUnit || "UNIT",
        ItemReference: item.reference,
        ItemDescription: item.description,
        Weight: Number(item.weight).toFixed(2),
        ItemValue: Number(item.value).toFixed(2),
        Quantity: item.quantity,
      }));

      const payload = {
        AWB: awb,
        Currency: options.currency || "SAR",
        WeightUnit: options.weightUnit || "KG",
        InvoiceDate: formattedDate,
        Items: formattedItems,
      };

      const response = await this.client.post("/api/invoice", payload, {
        headers: {
          apikey: this.apiKey.toUpperCase(),
          "Content-Type": "application/json",
          Host: "ecomapis-sandbox.azurewebsites.net",
        },
        validateStatus: (status) => status < 500,
      });

      if (response.status !== 200) {
        const errorDetails = response.data
          ? response.data.message || JSON.stringify(response.data)
          : "حدث خطأ غير معروف";
        throw new Error(`خطأ في إرسال الفاتورة: ${errorDetails}`);
      }

      return {
        success: true,
        message: response.data,
      };
    } catch (error) {
      console.error(
        "SMSA Invoice Error:",
        error.response?.data || error.message
      );
      throw new Error(
        `فشل في إرسال الفاتورة: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * إلغاء شحنة مرتجعة
   * @param {String} awb رقم الشحنة المراد إلغاؤها
   * @returns {Promise<Object>} نتيجة إلغاء الشحنة
   */
  async cancelReturnShipment(awb) {
    try {
      if (!awb) {
        throw new Error("رقم الشحنة مطلوب لإلغاء الشحنة المرتجعة");
      }
      const response = await this.client.post(`/api/c2b/cancel/${awb}`, null, {
        headers: {
          apikey: this.apiKey.toUpperCase(),
          "Content-Type": "application/json",
          Host: "ecomapis-sandbox.azurewebsites.net",
        },
        validateStatus: (status) => status < 500,
      });

      if (response.status !== 200) {
        const errorDetails = response.data
          ? response.data.message || JSON.stringify(response.data)
          : "حدث خطأ غير معروف";
        throw new Error(`خطأ في إلغاء الشحنة المرتجعة: ${errorDetails}`);
      }

      return {
        success: true,
        message: response.data,
      };
    } catch (error) {
      console.error(
        "SMSA Cancel Return Error:",
        error.response?.data || error.message
      );
      throw new Error(
        `فشل في إلغاء الشحنة المرتجعة: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * تنسيق بيانات الشحنة
   * @param {Object} shipment بيانات الشحنة من SMSA
   * @returns {Object} بيانات الشحنة بعد التنسيق
   */
  _formatShipmentData(shipment) {
    return {
      awb: shipment.AWB,
      reference: shipment.Reference,
      pieces: shipment.Pieces,
      codAmount: shipment.CODAmount,
      contentDescription: shipment.ContentDesc,
      recipientName: shipment.RecipientName,
      origin: {
        city: shipment.OriginCity,
        country: shipment.OriginCountry,
      },
      destination: {
        city: shipment.DestinationCity,
        country: shipment.DestinationCountry,
      },
      isDelivered: shipment.isDelivered || false,
      scans:
        shipment.Scans?.map((scan) => ({
          dateTime: new Date(scan.DateTime),
          description: scan.Description,
          city: scan.City,
          receivedBy: scan.ReceivedBy || null,
        })) || [],
    };
  }

  /**
   * تتبع مجموعة من الشحنات
   * @param {Array<String>} awbs قائمة أرقام الشحنات
   * @returns {Promise<Array>} تفاصيل وحالة كل شحنة
   */
  async trackBulkShipments(awbs) {
    try {
      if (!Array.isArray(awbs) || awbs.length === 0) {
        throw new Error("قائمة أرقام الشحنات مطلوبة");
      }
      const response = await this.client.post(
        "/api/track/bulk",
        { awbs },
        {
          headers: {
            apikey: this.apiKey.toUpperCase(),
            "Content-Type": "application/json",
            Host: "ecomapis-sandbox.azurewebsites.net",
          },
          validateStatus: (status) => status < 500,
        }
      );

      if (response.status !== 200) {
        const errorDetails = response.data
          ? response.data.message || JSON.stringify(response.data)
          : "حدث خطأ غير معروف";
        throw new Error(`خطأ في تتبع الشحنات: ${errorDetails}`);
      }

      return response.data.map((shipment) =>
        this._formatShipmentData(shipment)
      );
    } catch (error) {
      console.error(
        "SMSA Bulk Track Error:",
        error.response?.data || error.message
      );
      throw new Error(
        `فشل في تتبع الشحنات: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * تتبع شحنة واحدة
   * @param {String} awb رقم الشحنة
   * @returns {Promise<Object>} تفاصيل وحالة الشحنة
   */
  async trackShipment(awb) {
    try {
      if (!awb) {
        throw new Error("رقم الشحنة مطلوب لتتبع الشحنة");
      }
      const response = await this.client.get(`/api/track/single/${awb}`, {
        headers: {
          apikey: this.apiKey.toUpperCase(),
          "Content-Type": "application/json",
          Host: "ecomapis-sandbox.azurewebsites.net",
        },
        validateStatus: (status) => status < 500,
      });

      if (response.status !== 200) {
        const errorDetails = response.data
          ? response.data.message || JSON.stringify(response.data)
          : "حدث خطأ غير معروف";
        throw new Error(`خطأ في تتبع الشحنة: ${errorDetails}`);
      }

      return this._formatShipmentData(response.data);
    } catch (error) {
      console.error("SMSA Track Error:", error.response?.data || error.message);
      throw new Error(
        `فشل في تتبع الشحنة: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * الحصول على قائمة حالات الشحنة مع الوصف باللغتين
   * @returns {Promise<Array>} قائمة حالات الشحنة
   */
  async getStatusLookup() {
    try {
      const response = await this.client.get("/api/track/statuslookup", {
        headers: {
          apikey: this.apiKey.toUpperCase(),
          "Content-Type": "application/json",
          Host: "ecomapis-sandbox.azurewebsites.net",
        },
        validateStatus: (status) => status < 500,
      });

      if (response.status !== 200) {
        const errorDetails = response.data
          ? response.data.message || JSON.stringify(response.data)
          : "حدث خطأ غير معروف";
        throw new Error(`خطأ في الحصول على حالات الشحنة: ${errorDetails}`);
      }

      return response.data.map((status) => ({
        code: status.Code,
        descriptionEn: status.ScanDescEN,
        descriptionAr: status.ScanDescAR,
      }));
    } catch (error) {
      console.error(
        "SMSA Status Lookup Error:",
        error.response?.data || error.message
      );
      throw new Error(
        `فشل في الحصول على حالات الشحنة: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * الحصول على قائمة أنواع الخدمات المتاحة
   * @returns {Promise<Array>} قائمة أنواع الخدمات
   */
  async getServiceTypes() {
    try {
      const response = await this.client.get("/api/lookUp/ServiceTypes", {
        headers: {
          apikey: this.apiKey.toUpperCase(),
          "Content-Type": "application/json",
          Host: "ecomapis-sandbox.azurewebsites.net",
        },
        validateStatus: (status) => status < 500,
      });

      if (response.status !== 200) {
        const errorDetails = response.data
          ? response.data.message || JSON.stringify(response.data)
          : "حدث خطأ غير معروف";
        throw new Error(`خطأ في الحصول على أنواع الخدمات: ${errorDetails}`);
      }

      return response.data.map((service) => ({
        code: service.serviceCode,
        description: service.serviceDescription,
        type: service.serviceType,
        destination: service.destination,
      }));
    } catch (error) {
      console.error(
        "SMSA Service Types Error:",
        error.response?.data || error.message
      );
      throw new Error(
        `فشل في الحصول على أنواع الخدمات: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }
}
async function createSMSAShipment() {
  const apiKey = this.apiKey; // 🔑 بدّلها بمفتاح API الصحيح

  const payload = {
    passkey: "string",
    refno: "REF123456",
    sentDate: "2025-04-15",
    idNo: "1234567890",
    cName: "اسم العميل",
    cntry: "SA",
    cCity: "Riyadh",
    cZip: "12345",
    cPOBox: "123456",
    cMobile: "966500000000",
    cTel1: "0110000000",
    cTel2: "",
    cAddr1: "الرياض، شارع الملك",
    cAddr2: "",
    shipType: "DLV", // نوع الشحنة
    PCs: "1",
    cEmail: "test@example.com",
    carrValue: "100",
    carrCurr: "SAR",
    codAmt: "0",
    weight: "2",
    itemDesc: "منتج إلكتروني",
    custVal: "100",
    custCurr: "SAR",
    insrAmt: "0",
    insrCurr: "SAR",
    sName: "اسم المرسل",
    sContact: "شخص المرسل",
    sAddr1: "عنوان المرسل",
    sAddr2: "",
    sCity: "Riyadh",
    sPhone: "966500000000",
    sCntry: "SA",
    prefDelvDate: "",
    gpsPoints: "24.7136,46.6753",
  };

  try {
    const response = await axios.post(
      `https://track.smsaexpress.com/SecomRestWebApi/api/addship?api_key=${apiKey}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    console.log("📦 رد السيرفر:", response.data);
  } catch (error) {
    console.error("❌ حدث خطأ أثناء إنشاء الشحنة:");
    if (error.response) {
      console.error("الكود:", error.response.status);
      console.error("الرد:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}
module.exports = new SMSAService();
