const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  customerId: { type: String, required: true, ref: "Customer" }, // معرف الزبون
  balance: { type: Number, required: true, default: 0 }, // الرصيد الحالي
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }], // قائمة المعاملات
  createdAt: { type: Date, default: Date.now },
});

const Wallet = mongoose.model("Wallet", walletSchema);
module.exports = Wallet;
