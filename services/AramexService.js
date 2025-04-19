const axios = require("axios");
const config = require("../config/config");

class AramexService {
  constructor() {
    this.baseURL = config.aramex.sandbox ? "https://ws.sbx.aramex.net" : "https://ws.aramex.net";
    this.clientInfo = {
      UserName: config.aramex.username,
      Password: config.aramex.password,
      Version: "v1.0",
      AccountNumber: config.aramex.accountNumber,
      AccountPin: config.aramex.accountPin,
      AccountEntity: config.aramex.accountEntity,
      AccountCountryCode: config.aramex.accountCountryCode,
    };
  }

  /**
   * تحويل عنوان العميل إلى صيغة Aramex
   * @param {Object} address عنوان العميل من قاعدة البيانات
   * @returns {Object} عنوان بصيغة Aramex
   */
  formatAddress(address) {
    return {
      Line1: address.addressLine1 || "غير محدد",
      Line2: address.addressLine2 || "",
      Line3: address.addressLine3 || "",
      City: address.city || "غير محدد",
      CountryCode: address.country || "SA",
      PostCode: address.postcode || "",
      Contact: {
        PersonName: address.name || "غير محدد",
        CompanyName: address.company || "",
        PhoneNumber1: address.phone || "0000000000",
        EmailAddress: address.email || "",
      },
    };
  }

  /**
   * إنشاء شحنة جديدة
   * @param {Object} shipmentData بيانات الشحنة
   * @returns {Promise<Object>} نتيجة إنشاء الشحنة
   */
  async createShipment(shipmentData) {
    try {
      // 1. التحقق من صحة البيانات
      if (!shipmentData.receiverAddress || !shipmentData.senderAddress) {
        throw new Error("عنوان المرسل أو المستلم غير متوفر");
      }

      // 2. تحويل البيانات إلى التنسيق المطلوب
      const payload = {
        ClientInfo: this.clientInfo,
        Transaction: {
          Reference1: shipmentData.orderId || "ORD-UNKNOWN",
        },
        Shipments: [
          {
            Reference1: shipmentData.orderId || "ORD-UNKNOWN",
            Reference2: shipmentData.reference2 || "",
            Shipper: {
              Reference1: shipmentData.senderReference || "SENDER-REF",
              AccountNumber: this.clientInfo.AccountNumber,
              PartyAddress: this.formatAddress(shipmentData.senderAddress),
            },
            Consignee: {
              Reference1: shipmentData.receiverReference || "RECEIVER-REF",
              PartyAddress: this.formatAddress(shipmentData.receiverAddress),
            },
            ShippingDateTime: new Date().toISOString(),
            Details: {
              PaymentType: shipmentData.paymentType || "P", // P: Prepaid, C: Collect
              ProductGroup: shipmentData.productGroup || "EXP", // EXP: Express, DOM: Domestic
              ProductType: shipmentData.productType || "PDX", // PDX: Priority Document Express
              NumberOfPieces: parseInt(shipmentData.boxNum, 10) || 1,
              ActualWeight: {
                Value: parseFloat(shipmentData.weight) || 1.0,
                Unit: "KG",
              },
              CashOnDeliveryAmount: {
                Value:
                  shipmentData.paymentMethod === "COD"
                    ? parseFloat(shipmentData.ordervalue) || 0.0
                    : 0.0,
                CurrencyCode: shipmentData.currency || "SAR",
              },
              DescriptionOfGoods: shipmentData.orderDescription || "E-commerce shipment",
              Services: this.getServiceType(shipmentData.shippingType),
            },
          },
        ],
      };

      // 3. إرسال الطلب
      const response = await axios.post(
        `${this.baseURL}/api/Shipping/ShipmentCreation`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          validateStatus: (status) => status < 500,
        }
      );

      // 4. معالجة الردود
      if (response.status === 401) {
        throw new Error("غير مصرح: تأكد من صحة بيانات الاعتماد");
      }

      if (response.status === 400 || response.data.HasErrors) {
        const errorDetails = response.data.Notifications
          ? response.data.Notifications.map((n) => `${n.Code}: ${n.Message}`).join("\n")
          : JSON.stringify(response.data);
        throw new Error(`خطأ في البيانات:\n${errorDetails}`);
      }

      // 5. التحقق من وجود بيانات الشحنة
      const shipment = response.data.Shipments?.[0];
      if (shipment?.ID) {
        return {
          success: true,
          trackingNumber: shipment.ID,
          label: shipment.ShipmentLabel?.LabelURL || "",
          createdDate: new Date().toISOString(),
        };
      }

      throw new Error(`استجابة غير متوقعة: ${JSON.stringify(response.data)}`);
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
      console.error("Aramex API Error:", errorLog);
      throw new Error(`فشل إنشاء الشحنة: ${error.message}`);
    }
  }

  /**
   * إنشاء شحنة مرتجعة
   * @param {Object} returnData بيانات الشحنة المرتجعة
   * @returns {Promise<Object>} نتيجة إنشاء الشحنة المرتجعة
   */
  async createReturnShipment(returnData) {
    try {
      if (!returnData.pickupAddress || !returnData.returnToAddress) {
        throw new Error("بيانات العنوان (PickupAddress و ReturnToAddress) مطلوبة");
      }

      const payload = {
        ClientInfo: this.clientInfo,
        Transaction: {
          Reference1: returnData.orderId || "RETURN-ORD",
        },
        Shipments: [
          {
            Reference1: returnData.orderId || "RETURN-ORD",
            Shipper: {
              Reference1: returnData.senderReference || "RETURN-SENDER",
              PartyAddress: this.formatAddress(returnData.pickupAddress),
            },
            Consignee: {
              Reference1: returnData.receiverReference || "RETURN-RECEIVER",
              PartyAddress: this.formatAddress(returnData.returnToAddress),
            },
            ShippingDateTime: new Date().toISOString(),
            Details: {
              PaymentType: "P",
              ProductGroup: "DOM",
              ProductType: "RPU", // Return Pickup
              NumberOfPieces: parseInt(returnData.boxNum, 10) || 1,
              ActualWeight: {
                Value: parseFloat(returnData.weight) || 1.0,
                Unit: "KG",
              },
              DescriptionOfGoods: returnData.description || "Return shipment",
              Services: "RPU",
            },
          },
        ],
      };

      const response = await axios.post(
        `${this.baseURL}/api/Shipping/ShipmentCreation`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          validateStatus: (status) => status < 500,
        }
      );

      if (response.status !== 200 || response.data.HasErrors) {
        const errorDetails = response.data.Notifications
          ? response.data.Notifications.map((n) => `${n.Code}: ${n.Message}`).join("\n")
          : JSON.stringify(response.data);
        throw new Error(`خطأ في إنشاء الشحنة المرتجعة: ${errorDetails}`);
      }

      const shipment = response.data.Shipments?.[0];
      if (shipment?.ID) {
        return {
          success: true,
          trackingNumber: shipment.ID,
          label: shipment.ShipmentLabel?.LabelURL || "",
          createdDate: new Date().toISOString(),
        };
      }

      throw new Error(`استجابة غير متوقعة: ${JSON.stringify(response.data)}`);
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
      console.error("Aramex Return Shipment Error:", errorLog);
      throw new Error(`فشل في إنشاء الشحنة المرتجعة: ${error.message}`);
    }
  }

  /**
   * طلب استلام شحنة
   * @param {Object} pickupData بيانات الاستلام
   * @returns {Promise<Object>} نتيجة طلب الاستلام
   */
  async schedulePickup(pickupData) {
    try {
      if (!pickupData.pickupAddress || !pickupData.pickupDate) {
        throw new Error("عنوان الاستلام أو تاريخ الاستلام غير متوفر");
      }

      const payload = {
        ClientInfo: this.clientInfo,
        Transaction: {
          Reference1: pickupData.reference || "PICKUP-REF",
        },
        Pickup: {
          PickupAddress: this.formatAddress(pickupData.pickupAddress),
          PickupDate: new Date(pickupData.pickupDate).toISOString(),
          ReadyTime: pickupData.readyTime || new Date().toISOString(),
          LastPickupTime: pickupData.lastPickupTime || new Date().toISOString(),
          ClosingTime: pickupData.closingTime || new Date().toISOString(),
          Reference1: pickupData.reference || "PICKUP-REF",
          Vehicle: pickupData.vehicleType || "STANDARD",
          Shipments: pickupData.shipments?.map((s) => ({
            Reference1: s.orderId || "SHIP-REF",
            ShipmentNumber: s.trackingNumber || "",
          })) || [],
        },
      };

      const response = await axios.post(
        `${this.baseURL}/api/Shipping/SchedulePickup`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          validateStatus: (status) => status < 500,
        }
      );

      if (response.status !== 200 || response.data.HasErrors) {
        const errorDetails = response.data.Notifications
          ? response.data.Notifications.map((n) => `${n.Code}: ${n.Message}`).join("\n")
          : JSON.stringify(response.data);
        throw new Error(`خطأ في طلب الاستلام: ${errorDetails}`);
      }

      return {
        success: true,
        pickupGuid: response.data.PickupGUID,
        message: response.data.Message,
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
      console.error("Aramex Pickup Error:", errorLog);
      throw new Error(`فشل في طلب الاستلام: ${error.message}`);
    }
  }

  /**
   * طباعة بطاقة شحن
   * @param {String} trackingNumber رقم الشحنة
   * @returns {Promise<Object>} رابط بطاقة الشحن
   */
  async printLabel(trackingNumber) {
    try {
      if (!trackingNumber) {
        throw new Error("رقم الشحنة غير موجود");
      }

      const payload = {
        ClientInfo: this.clientInfo,
        Transaction: {
          Reference1: `LABEL-${trackingNumber}`,
        },
        ShipmentNumber: trackingNumber,
      };

      const response = await axios.post(
        `${this.baseURL}/api/Shipping/PrintLabel`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          validateStatus: (status) => status < 500,
        }
      );

      if (response.status !== 200 || response.data.HasErrors) {
        const errorDetails = response.data.Notifications
          ? response.data.Notifications.map((n) => `${n.Code}: ${n.Message}`).join("\n")
          : JSON.stringify(response.data);
        throw new Error(`خطأ في طباعة بطاقة الشحن: ${errorDetails}`);
      }

      return {
        success: true,
        labelUrl: response.data.LabelURL,
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
      console.error("Aramex Label Error:", errorLog);
      throw new Error(`فشل في طباعة بطاقة الشحن: ${error.message}`);
    }
  }

  /**
   * تتبع شحنة واحدة
   * @param {String} trackingNumber رقم الشحنة
   * @returns {Promise<Object>} تفاصيل وحالة الشحنة
   */
  async trackShipment(trackingNumber) {
    try {
      if (!trackingNumber) {
        throw new Error("رقم الشحنة غير موجود");
      }

      const payload = {
        ClientInfo: this.clientInfo,
        Transaction: {
          Reference1: `TRACK-${trackingNumber}`,
        },
        Shipments: [trackingNumber],
      };

      const response = await axios.post(
        `${this.baseURL}/api/Tracking/ShipmentTracking`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          validateStatus: (status) => status < 500,
        }
      );

      if (response.status !== 200 || response.data.HasErrors) {
        const errorDetails = response.data.Notifications
          ? response.data.Notifications.map((n) => `${n.Code}: ${n.Message}`).join("\n")
          : JSON.stringify(response.data);
        throw new Error(`خطأ في تتبع الشحنة: ${errorDetails}`);
      }

      const trackingResults = response.data.TrackingResults?.[0]?.Results || [];
      return {
        success: true,
        tracking: trackingResults.map((result) => ({
          dateTime: result.UpdateDateTime,
          description: result.UpdateDescription,
          location: result.Location,
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
      console.error("Aramex Tracking Error:", errorLog);
      throw new Error(`فشل في تتبع الشحنة: ${error.message}`);
    }
  }

  /**
   * تتبع مجموعة من الشحنات
   * @param {Array<String>} trackingNumbers قائمة أرقام الشحنات
   * @returns {Promise<Array>} تفاصيل وحالة كل شحنة
   */
  async trackBulkShipments(trackingNumbers) {
    try {
      if (!Array.isArray(trackingNumbers) || trackingNumbers.length === 0) {
        throw new Error("قائمة أرقام الشحنات مطلوبة");
      }

      const payload = {
        ClientInfo: this.clientInfo,
        Transaction: {
          Reference1: `BULK-TRACK-${Date.now()}`,
        },
        Shipments: trackingNumbers,
      };

      const response = await axios.post(
        `${this.baseURL}/api/Tracking/ShipmentTracking`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          validateStatus: (status) => status < 500,
        }
      );

      if (response.status !== 200 || response.data.HasErrors) {
        const errorDetails = response.data.Notifications
          ? response.data.Notifications.map((n) => `${n.Code}: ${n.Message}`).join("\n")
          : JSON.stringify(response.data);
        throw new Error(`خطأ في تتبع الشحنات: ${errorDetails}`);
      }

      return response.data.TrackingResults.map((result) => ({
        trackingNumber: result.Key,
        tracking: result.Results.map((r) => ({
          dateTime: r.UpdateDateTime,
          description: r.UpdateDescription,
          location: r.Location,
        })),
      }));
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
      console.error("Aramex Bulk Tracking Error:", errorLog);
      throw new Error(`فشل في تتبع الشحنات: ${error.message}`);
    }
  }

  /**
   * الحصول على قائمة الدول
   * @returns {Promise<Array>} قائمة الدول
   */
  async getCountries() {
    try {
      const payload = {
        ClientInfo: this.clientInfo,
        Transaction: {
          Reference1: `COUNTRIES-${Date.now()}`,
        },
      };

      const response = await axios.post(
        `${this.baseURL}/api/Location/Countries`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          validateStatus: (status) => status < 500,
        }
      );

      if (response.status !== 200 || response.data.HasErrors) {
        const errorDetails = response.data.Notifications
          ? response.data.Notifications.map((n) => `${n.Code}: ${n.Message}`).join("\n")
          : JSON.stringify(response.data);
        throw new Error(`خطأ في الحصول على قائمة الدول: ${errorDetails}`);
      }

      return response.data.Countries.map((country) => ({
        code: country.Code,
        name: country.Name,
        requiresPostCode: country.RequiresPostCode,
      }));
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
      console.error("Aramex Countries Error:", errorLog);
      throw new Error(`فشل في الحصول على قائمة الدول: ${error.message}`);
    }
  }

  /**
   * الحصول على قائمة المدن
   * @param {String} countryCode رمز الدولة
   * @param {String} [startsWith] بادئة اسم المدينة (اختياري)
   * @returns {Promise<Array>} قائمة المدن
   */
  async getCities(countryCode, startsWith = "") {
    try {
      if (!countryCode) {
        throw new Error("رمز الدولة مطلوب");
      }

      const payload = {
        ClientInfo: this.clientInfo,
        Transaction: {
          Reference1: `CITIES-${countryCode}`,
        },
        CountryCode: countryCode,
        NameStartsWith: startsWith,
      };

      const response = await axios.post(
        `${this.baseURL}/api/Location/Cities`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          validateStatus: (status) => status < 500,
        }
      );

      if (response.status !== 200 || response.data.HasErrors) {
        const errorDetails = response.data.Notifications
          ? response.data.Notifications.map((n) => `${n.Code}: ${n.Message}`).join("\n")
          : JSON.stringify(response.data);
        throw new Error(`خطأ في الحصول على قائمة المدن: ${errorDetails}`);
      }

      return response.data.Cities;
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
      console.error("Aramex Cities Error:", errorLog);
      throw new Error(`فشل في الحصول على قائمة المدن: ${error.message}`);
    }
  }

  /**
   * التحقق من صحة العنوان
   * @param {Object} address بيانات العنوان
   * @returns {Promise<Object>} نتيجة التحقق
   */
  async validateAddress(address) {
    try {
      if (!address.countryCode || !address.city) {
        throw new Error("رمز الدولة والمدينة مطلوبان");
      }

      const payload = {
        ClientInfo: this.clientInfo,
        Transaction: {
          Reference1: `VALIDATE-ADDRESS-${Date.now()}`,
        },
        Address: {
          CountryCode: address.countryCode,
          City: address.city,
          PostCode: address.postcode || "",
          Line1: address.addressLine1 || "",
        },
      };

      const response = await axios.post(
        `${this.baseURL}/api/Location/ValidateAddress`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          validateStatus: (status) => status < 500,
        }
      );

      if (response.status !== 200 || response.data.HasErrors) {
        const errorDetails = response.data.Notifications
          ? response.data.Notifications.map((n) => `${n.Code}: ${n.Message}`).join("\n")
          : JSON.stringify(response.data);
        throw new Error(`خطأ في التحقق من العنوان: ${errorDetails}`);
      }

      return {
        success: true,
        isValid: response.data.IsValid,
        suggestedCities: response.data.SuggestedCities || [],
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
      console.error("Aramex Validate Address Error:", errorLog);
      throw new Error(`فشل في التحقق من العنوان: ${error.message}`);
    }
  }

  /**
   * الحصول على مواقع مكاتب Aramex
   * @param {String} countryCode رمز الدولة
   * @returns {Promise<Array>} قائمة المكاتب
   */
  async getOffices(countryCode) {
    try {
      if (!countryCode) {
        throw new Error("رمز الدولة مطلوب");
      }

      const payload = {
        ClientInfo: this.clientInfo,
        Transaction: {
          Reference1: `OFFICES-${countryCode}`,
        },
        CountryCode: countryCode,
      };

      const response = await axios.post(
        `${this.baseURL}/api/Location/Offices`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          validateStatus: (status) => status < 500,
        }
      );

      if (response.status !== 200 || response.data.HasErrors) {
        const errorDetails = response.data.Notifications
          ? response.data.Notifications.map((n) => `${n.Code}: ${n.Message}`).join("\n")
          : JSON.stringify(response.data);
        throw new Error(`خطأ في الحصول على مواقع المكاتب: ${errorDetails}`);
      }

      return response.data.Offices.map((office) => ({
        name: office.Name,
        address: office.Address,
        phone: office.Phone,
        workingHours: office.WorkingHours,
        coordinates: office.Coordinates,
      }));
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
      console.error("Aramex Offices Error:", errorLog);
      throw new Error(`فشل في الحصول على مواقع المكاتب: ${error.message}`);
    }
  }

  /**
   * حساب تكلفة الشحن
   * @param {Object} rateData بيانات الحساب
   * @returns {Promise<Object>} تكلفة الشحن
   */
  async calculateRate(rateData) {
    try {
      if (!rateData.origin || !rateData.destination || !rateData.weight) {
        throw new Error("بيانات الأصل والوجهة والوزن مطلوبة");
      }

      const payload = {
        ClientInfo: this.clientInfo,
        Transaction: {
          Reference1: `RATE-${Date.now()}`,
        },
        OriginAddress: this.formatAddress(rateData.origin),
        DestinationAddress: this.formatAddress(rateData.destination),
        ShipmentDetails: {
          Weight: {
            Value: parseFloat(rateData.weight) || 1.0,
            Unit: "KG",
          },
          NumberOfPieces: parseInt(rateData.pieces, 10) || 1,
          ProductGroup: rateData.productGroup || "EXP",
          ProductType: rateData.productType || "PDX",
        },
      };

      const response = await axios.post(
        `${this.baseURL}/api/Rate/Calculate`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          validateStatus: (status) => status < 500,
        }
      );

      if (response.status !== 200 || response.data.HasErrors) {
        const errorDetails = response.data.Notifications
          ? response.data.Notifications.map((n) => `${n.Code}: ${n.Message}`).join("\n")
          : JSON.stringify(response.data);
        throw new Error(`خطأ في حساب تكلفة الشحن: ${errorDetails}`);
      }

      return {
        success: true,
        rates: response.data.Rates.map((rate) => ({
          serviceType: rate.ServiceType,
          totalAmount: rate.TotalAmount,
          currency: rate.CurrencyCode,
          transitTime: rate.TransitTime,
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
      console.error("Aramex Rate Error:", errorLog);
      throw new Error(`فشل في حساب تكلفة الشحن: ${error.message}`);
    }
  }

  /**
   * تحويل نوع الشحن إلى رمز الخدمة المناسب
   * @param {String} type نوع الشحن
   * @returns {String} رمز الخدمة
   */
  getServiceType(type) {
    const serviceMap = {
      EXPRESS: "PDX", // Priority Document Express
      DOMESTIC: "OND", // Overnight Domestic
      PRIORITY: "PPX", // Priority Parcel Express
      ECONOMY: "ECO", // Economy Parcel
      RETURN: "RPU", // Return Pickup
    };
    return serviceMap[type] || "PDX";
  }
}

module.exports = new AramexService();