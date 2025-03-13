const SallaStore = require("../models/sallaStoreModel");
const SallaPlatform = require("../platforms/sallaPlatform");

const Order = require("../models/orderModel");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

// إضافة متجر سلة جديد
exports.addSallaStore = async (req, res) => {
  try {
    const { customerId, storeName, client_id, client_secret } = req.body;

    const store = new SallaStore({
      customerId,
      storeName,
      client_id,
      client_secret,
    });

    await store.save();
    res.status(201).json({ message: "Salla store added successfully.", store });
  } catch (error) {
    console.error("Error adding Salla store:", error.message);
    res.status(500).json({ error: "Failed to add Salla store." });
  }
};

// توجيه الزبون لربط المتجر
exports.connectSallaStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await SallaStore.findById(storeId);

    if (!store) {
      return res.status(404).json({ error: "Salla store not found." });
    }

    const redirectUri = process.env.SALLA_REDIRECT_URI;
    const authUrl = SallaPlatform.getAuthUrl(
      store.client_id,
      redirectUri,
      storeId
    );

    // تسجيل الرابط للتحقق منه
    console.log("Authorization URL:", authUrl);

    res.redirect(authUrl);
  } catch (error) {
    console.error("Error preparing Salla auth URL:", error.message);
    res.status(500).json({ error: "Failed to prepare Salla auth URL." });
  }
};

// التعامل مع الرد بعد الموافقة
exports.handleSallaCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: "Missing code or state." });
    }

    const store = await SallaStore.findById(state);

    if (!store) {
      return res.status(404).json({ error: "Salla store not found." });
    }
    console.log(store.toJSON(), "error");
    const redirectUri = process.env.SALLA_REDIRECT_URI; // الحصول على redirect_uri من .env

    if (!redirectUri) {
      return res
        .status(500)
        .json({ error: "Redirect URI is not configured in .env file." });
    }

    // تسجيل المعاملات المرسلة للتحقق منها
    console.log("Token Request Parameters:", {
      client_id: store.client_id,
      client_secret: store.client_secret,
      code,
      redirect_uri: redirectUri,
    });

    const tokenData = await SallaPlatform.getAccessToken(
      code,
      store.client_id,
      store.client_secret,
      redirectUri
    );

    // تحديث بيانات المتجر
    store.access_token = tokenData.access_token;
    store.refresh_token = tokenData.refresh_token;
    await store.save();

    res.send("Salla store connected successfully!");
  } catch (error) {
    console.error("Error handling Salla callback:", error.message);

    // إرجاع تفاصيل الخطأ للمساعدة في الت-debug
    res.status(500).json({
      error: "Failed to connect Salla store.",
      details: error.message,
    });
  }
};
// تجديد access_token
exports.refreshSallaToken = async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await SallaStore.findById(storeId);

    if (!store || !store.refresh_token) {
      return res.status(404).json({
        error: "Salla store not found or no refresh token available.",
      });
    }

    const refreshedToken = await SallaPlatform.refreshAccessToken(
      store.refresh_token,
      store.client_id,
      store.client_secret
    );

    // تحديث بيانات المتجر
    store.access_token = refreshedToken.access_token;
    store.refresh_token = refreshedToken.refresh_token || null;
    await store.save();

    res.json({
      message: "Salla token refreshed successfully.",
      token: refreshedToken,
    });
  } catch (error) {
    console.error("Error refreshing Salla token:", error.message);
    res.status(500).json({ error: "Failed to refresh Salla token." });
  }
};
/////////////////////////////////////////////////////////////////\

// جلب الطلبات من متجر سلة
exports.fetchSallaOrders = async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await SallaStore.findById(storeId);

    if (!store || !store.access_token) {
      return res
        .status(404)
        .json({ error: "Salla store not found or no access token available." });
    }

    // ضمان صلاحية access_token
    const validAccessToken = await ensureValidToken(store);

    const ordersUrl = "https://api.salla.dev/admin/v2/orders";

    const response = await axios.get(ordersUrl, {
      headers: {
        Authorization: `Bearer ${validAccessToken}`,
      },
    });

    let ordersData = response.data;

    // التأكد من وجود حقل data في الرد
    if (!Array.isArray(ordersData.data)) {
      console.error("Unexpected response format:", ordersData);
      throw new Error(
        "The response from Salla API does not contain a valid orders array."
      );
    }

    ordersData = ordersData.data; // استخدام الحقل data فقط

    // تخزين الطلبات في قاعدة البيانات
    await Promise.all(
      ordersData.map(async (order) => {
        // استخراج القيم المشتركة
        const status = order.status?.slug || order.status?.name || "unknown"; // حالة الطلب
        const totalAmount = parseFloat(order.total?.amount) || 0; // المبلغ الإجمالي
        const createdAt = order.date?.created_at || new Date(); // تاريخ الإنشاء

        // استخراج البيانات المختلفة
        const additionalData = {
          reference_id: order.reference_id,
          payment_method: order.payment_method,
          is_pending_payment: order.is_pending_payment,
          pending_payment_ends_at: order.pending_payment_ends_at,
          features: order.features,
          items: order.items,
          customer: order.customer,
        };

        const existingOrder = await Order.findOne({
          orderId: order.id,
          storeId: store._id,
        });

        if (!existingOrder) {
          const newOrder = new Order({
            storeId: store._id,
            platform: "salla",
            orderId: order.id,
            status: status,
            totalAmount: totalAmount,
            createdAt: new Date(createdAt),
            data: additionalData, // تخزين البيانات المختلفة في الحقل data
          });

          await newOrder.save();
        }
      })
    );

    res.json({
      message: "Orders fetched and stored successfully.",
      orders: ordersData,
    });
  } catch (error) {
    console.error("Error fetching Salla orders:", error.message);

    // إرجاع رسالة خطأ واضحة
    if (
      error.message.includes(
        "response from Salla API does not contain a valid orders array"
      )
    ) {
      return res.status(500).json({
        error: "Failed to fetch Salla orders.",
        details: "The response format is unexpected.",
      });
    }

    res
      .status(500)
      .json({ error: "Failed to fetch Salla orders.", details: error.message });
  }
};

// عرض الطلبات المخزنة
exports.getStoredOrders = async (req, res) => {
  try {
    const { storeId } = req.params;
    const orders = await Order.find({ storeId, platform: "salla" });

    res.json({ message: "Stored orders retrieved successfully.", orders });
  } catch (error) {
    console.error("Error retrieving stored orders:", error.message);
    res.status(500).json({ error: "Failed to retrieve stored orders." });
  }
};

// وظيفة تجديد الاعتمادات
async function ensureValidToken(store) {
  if (!store.access_token || !store.refresh_token) {
    throw new Error("No valid tokens available.");
  }

  try {
    // اختبار access_token الحالي
    const testUrl = "https://api.salla.dev/admin/v2/orders";
    const testResponse = await axios.get(testUrl, {
      headers: {
        Authorization: `Bearer ${store.access_token}`,
      },
    });

    if (testResponse.status === 200) {
      return store.access_token; // الاعتماد صالح
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // الاعتماد منتهٍ، قم بتجديده
      const refreshedToken = await SallaPlatform.refreshAccessToken(
        store.refresh_token,
        store.client_id,
        store.client_secret
      );

      // تحديث بيانات المتجر
      store.access_token = refreshedToken.access_token;
      store.refresh_token = refreshedToken.refresh_token || null;
      await store.save();

      return refreshedToken.access_token;
    } else {
      throw error;
    }
  }
}
