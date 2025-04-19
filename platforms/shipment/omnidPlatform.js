const axios = require("axios");
require("dotenv").config();

class OmnicClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.OMNIC_API_URL,
      auth: {
        username: process.env.OMNIC_USERNAME,
        password: process.env.OMNIC_PASSWORD,
      },
    });
  }

  // طريقة مثاليه للحصول على قائمة الأجهزة
  async getDeviceList() {
    try {
      const response = await this.client.get("/devices");
      return response.data;
    } catch (error) {
      console.error("خطأ في جلب الأجهزة:", error);
      throw error;
    }
  }

  // طريقة مثاليه لإنشاء طلب
  async createOrder(orderData) {
    try {
      const response = await this.client.post("/orders", orderData);
      return response.data;
    } catch (error) {
      console.error("خطأ في إنشاء الطلب:", error);
      throw error;
    }
  }

  // أضف طرق API الأخرى حسب الحاجة
}

module.exports = OmnicClient;

// omnic.service.js
const axios = require("axios");
require("dotenv").config();

class OmnicService {
  constructor() {
    this.api = axios.create({
      baseURL: process.env.OMNIC_API_URL,
      auth: {
        username: process.env.OMNIC_USERNAME,
        password: process.env.OMNIC_PASSWORD,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // طرق الأجهزة
  async getDevices(params = {}) {
    return this.api.get("/devices", { params });
  }

  // طرق الطلبات
  async createOrder(order) {
    return this.api.post("/orders", order);
  }

  async cancelOrder(orderId) {
    return this.api.put(`/orders/${orderId}/cancel`);
  }

  async prepareForWithdrawal(orderId) {
    return this.api.put(`/orders/${orderId}/prepared_to_withdrawal`);
  }

  // طرق السعاة
  async createCourier(courierData) {
    return this.api.post("/couriers", courierData);
  }

  async updateCourier(courierId, updates) {
    return this.api.put(`/couriers/${courierId}`, updates);
  }

  async deleteCourier(courierId) {
    return this.api.delete(`/couriers/${courierId}`);
  }
}

module.exports = new OmnicService();
