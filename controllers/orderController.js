const Order = require("../models/orderModel");

// إنشاء طلب جديد (Create)
exports.createOrder = async (req, res) => {
  try {
    const { storeId, platform, orderId, status, totalAmount, data } = req.body;

    const existingOrder = await Order.findOne({ orderId, storeId });

    if (existingOrder) {
      return res.status(400).json({ error: "Order already exists." });
    }

    const newOrder = new Order({
      storeId,
      platform,
      orderId,
      status,
      totalAmount,
      data,
    });

    await newOrder.save();
    res
      .status(201)
      .json({ message: "Order created successfully.", order: newOrder });
  } catch (error) {
    console.error("Error creating order:", error.message);
    res.status(500).json({ error: "Failed to create order." });
  }
};

// عرض جميع الطلبات المرتبطة بمتجر معين (Read All)
exports.getOrdersByStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const orders = await Order.find({ storeId });

    res.json({ message: "Orders retrieved successfully.", orders });
  } catch (error) {
    console.error("Error retrieving orders:", error.message);
    res.status(500).json({ error: "Failed to retrieve orders." });
  }
};

// عرض طلب محدد (Read One)
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.json({ message: "Order retrieved successfully.", order });
  } catch (error) {
    console.error("Error retrieving order by ID:", error.message);
    res.status(500).json({ error: "Failed to retrieve order by ID." });
  }
};

// تحديث طلب موجود (Update)
exports.updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updates = req.body;

    const order = await Order.findByIdAndUpdate(orderId, updates, {
      new: true,
      runValidators: true,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.json({ message: "Order updated successfully.", order });
  } catch (error) {
    console.error("Error updating order:", error.message);
    res.status(500).json({ error: "Failed to update order." });
  }
};

// حذف طلب (Delete)
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByIdAndDelete(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.json({ message: "Order deleted successfully." });
  } catch (error) {
    console.error("Error deleting order:", error.message);
    res.status(500).json({ error: "Failed to delete order." });
  }
};
// البحث برقم الطلب
exports.searchOrderByOrderId = async (req, res) => {
  try {
    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required." });
    }

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.json({ message: "Order retrieved successfully.", order });
  } catch (error) {
    console.error("Error searching for order by order ID:", error.message);
    res.status(500).json({ error: "Failed to search for order by order ID." });
  }
};

// البحث بمعلومات العميل (مثل البريد الإلكتروني أو الاسم)
exports.searchOrdersByCustomerInfo = async (req, res) => {
  try {
    const { email, name } = req.query;

    if (!email && !name) {
      return res.status(400).json({ error: "Email or Name is required." });
    }

    // بناء شروط البحث
    const searchCriteria = {};
    if (email) {
      searchCriteria["data.customer.email"] = email; // البحث بالبريد الإلكتروني
    }
    if (name) {
      searchCriteria["data.customer.name"] = { $regex: name, $options: "i" }; // البحث بالاسم (غير حساس للأحرف الكبيرة/الصغيرة)
    }

    const orders = await Order.find(searchCriteria);

    if (orders.length === 0) {
      return res
        .status(404)
        .json({ error: "No orders found matching the criteria." });
    }

    res.json({ message: "Orders retrieved successfully.", orders });
  } catch (error) {
    console.error(
      "Error searching for orders by customer info:",
      error.message
    );
    res
      .status(500)
      .json({ error: "Failed to search for orders by customer info." });
  }
};
// البحث بفلاتر متعددة بما في ذلك المنصة
exports.searchOrders = async (req, res) => {
  try {
    const {
      paymentMethod,
      status,
      city,
      shippingMethod,
      dateFrom,
      dateTo,
      platform,
    } = req.query;

    // بناء شروط البحث
    const searchCriteria = {};

    if (paymentMethod) {
      searchCriteria["data.payment_method"] = paymentMethod; // البحث بنوع الدفع
    }

    if (status) {
      searchCriteria.status = status; // البحث بحالة الطلب
    }

    if (city) {
      searchCriteria["data.shipping_address.city"] = {
        $regex: city,
        $options: "i",
      }; // البحث باسم المدينة (غير حساس للأحرف الكبيرة/الصغيرة)
    }

    if (shippingMethod) {
      searchCriteria["data.shipping_method"] = {
        $regex: shippingMethod,
        $options: "i",
      }; // البحث بطريق الشحن
    }

    if (dateFrom || dateTo) {
      searchCriteria.createdAt = {}; // البحث بتاريخ الإنشاء
      if (dateFrom) {
        searchCriteria.createdAt.$gte = new Date(dateFrom); // التاريخ >= dateFrom
      }
      if (dateTo) {
        searchCriteria.createdAt.$lte = new Date(dateTo); // التاريخ <= dateTo
      }
    }

    if (platform) {
      searchCriteria.platform = platform; // البحث بالمنصة
    }

    // تنفيذ البحث
    const orders = await Order.find(searchCriteria);

    if (orders.length === 0) {
      return res
        .status(404)
        .json({ error: "No orders found matching the criteria." });
    }

    res.json({ message: "Orders retrieved successfully.", orders });
  } catch (error) {
    console.error("Error searching for orders:", error.message);
    res.status(500).json({ error: "Failed to search for orders." });
  }
};
