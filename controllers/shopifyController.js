const ShopifyStore = require("../models/ecomercModel/shopifyStoreModel");
const ShopifyPlatform = require("../platforms/shopifyPlatform");
const dotenv = require("dotenv");
dotenv.config();

// إضافة متجر Shopify جديد
exports.addShopifyStore = async (req, res) => {
  try {
    const { customerId, storeName } = req.body;

    const store = new ShopifyStore({
      customerId,
      storeName,
    });

    await store.save();
    res
      .status(201)
      .json({ message: "Shopify store added successfully.", store });
  } catch (error) {
    console.error("Error adding Shopify store:", error.message);
    res.status(500).json({ error: "Failed to add Shopify store." });
  }
};

// توجيه الزبون لربط المتجر
exports.connectShopifyStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await ShopifyStore.findById(storeId);

    if (!store) {
      return res.status(404).json({ error: "Shopify store not found." });
    }

    const redirectUri = process.env.SHOPIFY_REDIRECT_URI;

    // بناء الرابط لطلب الموافقة
    const authUrl = ShopifyPlatform.getAuthUrl(
      process.env.SHOPIFY_CLIENT_ID,
      redirectUri,
      store.storeName
    );

    console.log("Authorization URL:", authUrl); // تسجيل الرابط للتحقق منه
    res.redirect(authUrl);
  } catch (error) {
    console.error("Error preparing Shopify auth URL:", error.message);
    res.status(500).json({ error: "Failed to prepare Shopify auth URL." });
  }
};

// التعامل مع الرد بعد الموافقة
exports.handleShopifyCallback = async (req, res) => {
  try {
    const { code, shop } = req.query;

    if (!code || !shop) {
      return res.status(400).json({ error: "Missing code or shop." });
    }

    const store = await ShopifyStore.findOne({ storeName: shop });

    if (!store) {
      return res.status(404).json({ error: "Shopify store not found." });
    }

    const redirectUri = process.env.SHOPIFY_REDIRECT_URI;

    // الحصول على الاعتمادات
    const tokenData = await ShopifyPlatform.getAccessToken(
      code,
      process.env.SHOPIFY_CLIENT_ID,
      process.env.SHOPIFY_CLIENT_SECRET,
      store.storeName,
      redirectUri
    );

    // تحديث بيانات المتجر
    store.access_token = tokenData.access_token;
    await store.save();

    res.send("Shopify store connected successfully!");
  } catch (error) {
    console.error("Error handling Shopify callback:", error.message);
    res
      .status(500)
      .json({
        error: "Failed to connect Shopify store.",
        details: error.message,
      });
  }
};

// جلب الطلبات من متجر Shopify
exports.fetchShopifyOrders = async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await ShopifyStore.findById(storeId);

    if (!store || !store.access_token) {
      return res
        .status(404)
        .json({
          error: "Shopify store not found or no access token available.",
        });
    }

    const ordersUrl = `https://${store.storeName}.myshopify.com/admin/api/2023-07/orders.json`;

    const response = await axios.get(ordersUrl, {
      headers: {
        "X-Shopify-Access-Token": store.access_token,
      },
    });

    const ordersData = response.data.orders;

    // تخزين الطلبات في قاعدة البيانات
    await Promise.all(
      ordersData.map(async (order) => {
        const existingOrder = await Order.findOne({
          orderId: order.id,
          storeId: store._id,
        });

        if (!existingOrder) {
          const newOrder = new Order({
            storeId: store._id,
            platform: "shopify",
            orderId: order.id.toString(),
            status: order.financial_status || "unknown",
            totalAmount: parseFloat(order.total_price) || 0,
            createdAt: new Date(order.created_at || Date.now()),
            data: order, // تخزين البيانات المختلفة
          });

          await newOrder.save();
        }
      })
    );

    res.json({
      message: "Shopify orders fetched and stored successfully.",
      orders: ordersData,
    });
  } catch (error) {
    console.error("Error fetching Shopify orders:", error.message);

    // إرجاع رسالة خطأ واضحة
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: "No orders found for this store." });
    }

    res
      .status(500)
      .json({
        error: "Failed to fetch Shopify orders.",
        details: error.message,
      });
  }
};
