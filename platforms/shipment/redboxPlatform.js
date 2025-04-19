const axios = require("axios");

class RedBox {
  constructor(api_token, baseUrl) {
    this.api_token = api_token;
    this.baseUrl = baseUrl;
  }

  // الحصول على نقاط التسليم حسب المدينة
  async getPointsByCity(city_code, type) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v3/cities/${city_code}/points?type=${type}`,
        {
          headers: { Authorization: `Bearer ${this.api_token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get points by city: ${error.message}`);
    }
  }

  // الحصول على قائمة طلبات الاستلام
  async getListOfPickupRequests(business_id) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v3/businesses/pickup-requests`,
        {
          headers: { Authorization: `Bearer ${this.api_token}` },
          params: { business_id },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to get list of pickup requests: ${error.message}`
      );
    }
  }

  // إنشاء شحنة جديدة
  async createShipment(data) {
    try {
      const response = await axios.post(`${this.baseUrl}/v3/shipments`, data, {
        headers: { Authorization: `Bearer ${this.api_token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create shipment: ${error.message}`);
    }
  }

  // الحصول على تفاصيل الشحنة
  async getShipmentDetails(id) {
    try {
      const response = await axios.get(`${this.baseUrl}/v3/shipments/${id}`, {
        headers: { Authorization: `Bearer ${this.api_token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get shipment details: ${error.message}`);
    }
  }

  // تحديث بيانات الشحنة
  async updateShipment(id, data) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/v3/shipments/${id}`,
        data,
        {
          headers: { Authorization: `Bearer ${this.api_token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update shipment: ${error.message}`);
    }
  }

  // إلغاء الشحنة
  async cancelShipment(id) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v3/shipments/${id}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${this.api_token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to cancel shipment: ${error.message}`);
    }
  }

  // إنشاء طلب استلام جديد
  async createPickupRequest(data) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v3/pickup-requests`,
        data,
        {
          headers: { Authorization: `Bearer ${this.api_token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create pickup request: ${error.message}`);
    }
  }

  // الحصول على تفاصيل نقطة التسليم
  async getPointDetails(point_id) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v3/points/${point_id}`,
        {
          headers: { Authorization: `Bearer ${this.api_token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get point details: ${error.message}`);
    }
  }

  // إنشاء موقع استلام جديد
  async createPickupLocation(data) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v3/pickup-locations`,
        data,
        {
          headers: { Authorization: `Bearer ${this.api_token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create pickup location: ${error.message}`);
    }
  }

  // تحديث موقع الاستلام
  async updatePickupLocation(location_id, data) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/v3/pickup-locations/${location_id}`,
        data,
        {
          headers: { Authorization: `Bearer ${this.api_token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update pickup location: ${error.message}`);
    }
  }

  // إنشاء Webhook
  async createWebhook(data) {
    try {
      const response = await axios.post(`${this.baseUrl}/v3/webhooks`, data, {
        headers: { Authorization: `Bearer ${this.api_token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create webhook: ${error.message}`);
    }
  }

  // حذف Webhook
  async deleteWebhook(original_id) {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/v3/webhooks/${original_id}`,
        {
          headers: { Authorization: `Bearer ${this.api_token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete webhook: ${error.message}`);
    }
  }

  // إنشاء طلب جديد عبر Omni
  async createOrder(data) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v3/omni/orders`,
        data,
        {
          headers: { Authorization: `Bearer ${this.api_token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  // تحديث طلب عبر Omni
  async updateOrder(order_id, data) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/v3/omni/orders/${order_id}`,
        data,
        {
          headers: { Authorization: `Bearer ${this.api_token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update order: ${error.message}`);
    }
  }

  // إلغاء طلب عبر Omni
  async cancelOrder(order_id, data) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v3/omni/orders/${order_id}/cancel`,
        data,
        {
          headers: { Authorization: `Bearer ${this.api_token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  }

  // الحصول على قائمة الأعمال المسجلة تحت وكالة
  async getBusinesses() {
    try {
      const response = await axios.get(`${this.baseUrl}/v3/businesses`, {
        headers: { Authorization: `Bearer ${this.api_token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get businesses: ${error.message}`);
    }
  }

  // إنشاء عمل جديد تحت وكالة
  async createBusiness(data) {
    try {
      const response = await axios.post(`${this.baseUrl}/v3/businesses`, data, {
        headers: { Authorization: `Bearer ${this.api_token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create business: ${error.message}`);
    }
  }

  // إنشاء شحنة لعمل مرتبط بوكالة
  async createBusinessShipment(data) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v3/businesses/shipments`,
        data,
        {
          headers: { Authorization: `Bearer ${this.api_token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create business shipment: ${error.message}`);
    }
  }
}

module.exports = RedBox;
