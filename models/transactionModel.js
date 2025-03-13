const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  walletId: { type: String, required: true, ref: "Wallet" },
  amount: { type: Number, required: true }, // المبلغ بالهللة (مثال: 500 SAR = 50000 هللة)
  method: {
    type: String,
    enum: ["bank_transfer", "moyasar"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  proofOfPayment: String, // للتحويل البنكي
  moyasarPaymentId: String, // معرف الدفع في Moyasar
  createdAt: { type: Date, default: Date.now },
});

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
