const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: "config.env" });
const sallaRoutes = require("./routes/sallaRoutes");
const zadRoutes = require("./routes/zadRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRutes");
const customerRoutes = require("./routes/customerRoutes");
const bankInfoRoutes = require("./routes/bankInfoRoutes");
const prsonealInfoRoutes = require("./routes/prsonealInfoRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const walletRoutes = require("./routes/walletRoutes");
const transactionsRoutes = require("./routes/transactitonsRoutes");
const { webhookCheckout } = require("./controllers/walletController");
const app = express();
const PORT = process.env.PORT || 3000;

// توصيل MongoDB
mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware لتحليل JSON
app.use(express.json());
app.use(express.static(path.join(__dirname, "uploads")));

app.post("/webhook/moyasar", webhookCheckout);

// تحميل الروابط
app.use("/api/salla", sallaRoutes);
app.use("/api/zad", zadRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/bankinfo", bankInfoRoutes);
app.use("/api/personinfo", prsonealInfoRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/tranactions", transactionsRoutes);

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
