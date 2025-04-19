const axios = require("axios");
class SmsaExpress {
  constructor(apiKey, baseUrl) {
    super();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async createSMSAShipment(shapment, smsaClient) {
    // تحويل بيانات المرسل (المتجر)
    const shipperAddress = {
      City: shapment.senderAddress.city,
      ContactName: shapment.senderAddress.name,
      ContactPhoneNumber: shapment.senderAddress.phone,
      Country: "SA", // افتراضيًا السعودية
      AddressLine1: shapment.senderAddress.addressLine1 || "Not Specified",
      District: shapment.senderAddress.district || "",
    };

    // تحويل بيانات المستلم
    const consigneeAddress = {
      City: shapment.receiverAddress.city,
      ContactName: shapment.receiverAddress.name,
      ContactPhoneNumber: shapment.receiverAddress.phone,
      Country: shapment.receiverAddress.country,
      AddressLine1: shapment.receiverAddress.addressLine1,
      District: shapment.receiverAddress.district || "",
    };

    // تحضير بيانات الشحنة حسب مواصفات API
    const shipmentData = {
      OrderNumber: shapment.orderId,
      Weight: shapment.weight,
      WeightUnit: "KG", // يمكن تغييرها حسب الحاجة
      Parcels: shapment.boxNum,
      CODAmount: shapment.paymentMathod === "COD" ? shapment.ordervalue : 0,
      DeclaredValue: shapment.ordervalue,
      ContentDescription: shapment.orderDescription || "General Goods",
      ShipDate: new Date().toISOString(),
      ShipmentCurrency: "SAR",
      ShipperAddress: shipperAddress,
      ConsigneeAddress: consigneeAddress,
      ServiceCode: "EDDL", // اكتب الخدمة المطلوبة
      SMSARetailID: "1", // الرمز الخاص بفرع SMSA
      WaybillType: "PDF", // تنسيق البوليصة
    };

    // إرسال الطلب
    try {
      const response = await smsaClient.createShipment(shipmentData);

      // حفظ بيانات الإرجاع في الشحنة
      shapment.trackingId = response.awb;
      shapment.providerData = {
        labelUrl: response.labelUrl,
        cost: response.cost,
      };

      return shapment;
    } catch (error) {
      console.error("SMSA API Error:", error.response?.data || error.message);
      throw new Error(`فشل إنشاء الشحنة: ${error.message}`);
    }
  }
  //انشاء شحنة
  async createShipment(shipmentData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/shipment/b2c/new`,
        shipmentData,
        {
          headers: {
            apikey: this.apiKey,
            "Content-Type": "application/json",
          },
          timeout: 10000, // مهلة 10 ثواني
        }
      );

      // معالجة الاستجابة
      if (!response.data.awb) {
        throw new Error("Invalid SMSA response format");
      }

      return {
        awb: response.data.awb,
        labelUrl: response.data.labelUrl,
        cost: response.data.cost,
      };
    } catch (error) {
      const apiError = error.response?.data?.error || error.message;
      throw new Error(`SMSA Error: ${apiError}`);
    }
  }
  //تتبع الشحنة
  async trackShipment(trackingNumber) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/track/${trackingNumber}`,
        { headers: { apikey: this.apiKey } }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to track shipment in smsa express :${error.message}`
      );
    }
  }
  //الغاء شحنة
  async cancelShipment(shipmentId) {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/api/shipment/cancel/${shipmentId}`,
        { headers: { apikey: this.apiKey } }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to cancel shipment in SMSA Express :${error.message}`
      );
    }
  }
  //الاستعلام عن شحنة
  async queryShipment(awb) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/shipment/b2c/query/${awb}`,
        { headers: { apikey: this.apiKey, "Content-Type": "application/json" } }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to query shipment in SMSA Express :${error.message}`
      );
    }
  }
  //الاستعلام عن شحنة رجيع
  async queryReturnShipment(awb) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/shipment/c2b/query/${awb}`,
        { headers: { apikey: this.apiKey, "Content-Type": "application/json" } }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to find this shipment :${error.message}`);
    }
  }
  //ارجاع قائمة العملات و البلدان
  async lookupCurrency() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/lookup/currency`, {
        headers: {
          apikey: this.apiKey,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to find currency :${error.message}`);
    }
  }
  //الغاء شحنة رجيع
  async cancelReturnShipment(awb) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/c2b/cancel/${awb}`,
        null,
        {
          headers: {
            apikey: this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      throw new Error(`Failed to delete this shipment:${error.message}`);
    }
  }
  //تتبع مجموعة من الشحنات
  async trackBulkShipments(awbs) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/track/bulk`,
        awbs,
        {
          headers: {
            apikey: this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Filed to find multpla shipment :${error.message}`);
    }
  }
  //الاستعلام عن شحنة معينة
  async trackShipment(awb) {
    try {
      const response = await axios.get(`${this.baseUrl}/track/single/${awb}`, {
        headers: { "Content-Type": "application/json", apiKey: this.apiKey },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Filed to ifnd this shipment :${error.message}`);
    }
  }

  //معالجة طالبات رفع الفواتير
  async pushInvoice(awb, currency, invoiceDate, weightUnit, items) {
    try {
      const invoiceData = {
        AWB: awb,
        Currency: currency,
        WeightUnit: weightUnit,
        InvoiceDate: invoiceDate,
        Items: items,
      };

      const response = await axios.post(
        `${this.baseUrl}/api/invoice`,
        invoiceData,
        {
          headers: {
            apikey: this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to loged this polesa:${error.message}`);
    }
  }
  //جلب ملف البوليصة
  async getwaybill(awb) {
    try {
      // إرسال الطلب إلى واجهة برمجية (API) لسمسا
      const response = await axios.get(`${BASE_URL}/api/waybill/${awb}`, {
        headers: {
          apikey: API_KEY,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer", // لاستقبال الملف كبيانات ثنائية
      });

      // تحويل البيانات الثنائية إلى ملف PDF
      const pdfData = Buffer.from(response.data);
      return pdfData;
    } catch (error) {
      throw new Error(`Failed to find this waybill :${error.message}`);
    }
  }
}
module.exports = SmsaExpress;
