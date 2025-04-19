require("dotenv").config();
import { create } from "axios";

class OmnicDeliveryService {
  constructor() {
    this.client = create({
      baseURL: process.env.OMNIC_API_BASE_URL || "https://api.omnic.solutions",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  }

  /**
   * إنشاء رأس الطلب مع المصادقة
   */
  _getAuthHeaders() {
    return {
      "X-API-KEY": process.env.OMNIC_API_KEY,
      "X-API-SECRET": process.env.OMNIC_API_SECRET,
    };
  }
  async testConnection() {
    try {
      const res = await this.client.get("/delivery/ping", {
        headers: this._getAuthHeaders(),
      });
      return {
        success: true,
        message: res.data.message || "الاتصال ناجح 🎉",
      };
    } catch (error) {
      return this._handleError(error, "اختبار الاتصال");
    }
  }

  /**
   * إنشاء شحنة جديدة
   * @param {Object} shipmentData بيانات الشحنة
   * @returns {Promise} نتيجة إنشاء الشحنة
   */
  async createShipment(shipmentData) {
    try {
      const response = await this.client.post(
        "/delivery/shipments",
        shipmentData,
        {
          headers: this._getAuthHeaders(),
        }
      );

      return {
        success: true,
        data: response.data,
        trackingNumber: response.data.tracking_id,
        labelUrl: response.data.label_url,
      };
    } catch (error) {
      return this._handleError(error, "إنشاء الشحنة");
    }
  }

  /**
   * تتبع الشحنة
   * @param {String} trackingNumber رقم التتبع
   * @returns {Promise} حالة الشحنة
   */
  async trackShipment(trackingNumber) {
    try {
      const response = await this.client.get(
        `/delivery/shipments/${trackingNumber}/track`,
        {
          headers: this._getAuthHeaders(),
        }
      );

      return {
        success: true,
        status: response.data.status,
        events: response.data.events,
        estimatedDelivery: response.data.estimated_delivery,
      };
    } catch (error) {
      return this._handleError(error, "تتبع الشحنة");
    }
  }

  /**
   * إلغاء الشحنة
   * @param {String} trackingNumber رقم التتبع
   * @returns {Promise} نتيجة الإلغاء
   */
  async cancelShipment(trackingNumber) {
    try {
      const response = await this.client.delete(
        `/delivery/shipments/${trackingNumber}`,
        {
          headers: this._getAuthHeaders(),
        }
      );

      return {
        success: true,
        message: response.data.message,
        refundStatus: response.data.refund_status,
      };
    } catch (error) {
      return this._handleError(error, "إلغاء الشحنة");
    }
  }

  /**
   * حساب تكلفة الشحن
   * @param {Object} rateData بيانات حساب التكلفة
   * @returns {Promise} تكلفة الشحن
   */
  async calculateShippingRate(rateData) {
    try {
      const response = await this.client.post("/delivery/rates", rateData, {
        headers: this._getAuthHeaders(),
      });

      return {
        success: true,
        rates: response.data.rates,
        currency: response.data.currency,
        deliveryOptions: response.data.delivery_options,
      };
    } catch (error) {
      return this._handleError(error, "حساب تكلفة الشحن");
    }
  }

  /**
   * جلب المواعيد المتاحة للتسليم
   * @param {String} postalCode الرمز البريدي
   * @param {String} countryCode رمز البلد
   * @returns {Promise} المواعيد المتاحة
   */
  async getAvailableSlots(postalCode, countryCode) {
    try {
      const response = await this.client.get("/delivery/slots", {
        params: { postalCode, countryCode },
        headers: this._getAuthHeaders(),
      });

      return {
        success: true,
        availableSlots: response.data.slots,
        cutoffTime: response.data.cutoff_time,
      };
    } catch (error) {
      return this._handleError(error, "جلب المواعيد المتاحة");
    }
  }

  async downloadLabel(trackingNumber) {
    try {
      const response = await this.client.get(
        `/delivery/shipments/${trackingNumber}/label`,
        {
          headers: this._getAuthHeaders(),
          responseType: "arraybuffer", // هنا نطلب البيانات كـ باينري
        }
      );

      return {
        success: true,
        labelBuffer: response.data, // هذا هو ملف PDF بصيغته الخام
      };
    } catch (error) {
      return this._handleError(error, "تحميل ملصق الشحنة");
    }
  }

  async updateShipment(trackingNumber, updatedData) {
    try {
      const response = await this.client.patch(
        `/delivery/shipments/${trackingNumber}`,
        updatedData,
        {
          headers: this._getAuthHeaders(),
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this._handleError(error, "تحديث بيانات الشحنة");
    }
  }

  async trackShipmentsBulk(trackingNumbers) {
    try {
      const response = await this.client.post(
        `/delivery/shipments/track/bulk`,
        {
          tracking_numbers: trackingNumbers,
        },
        {
          headers: this._getAuthHeaders(),
        }
      );

      return {
        success: true,
        results: response.data,
      };
    } catch (error) {
      return this._handleError(error, "تتبع جماعي للشحنات");
    }
  }
  /**
   * معالجة الأخطاء
   */
  _handleError(error, operation) {
    console.error(
      `خطأ في ${operation}:`,
      error.response?.data || error.message
    );

    return {
      success: false,
      error: error.response?.data?.message || error.message,
      details: error.response?.data?.errors || null,
      statusCode: error.response?.status || 500,
    };
  }
}

export default new OmnicDeliveryService();
