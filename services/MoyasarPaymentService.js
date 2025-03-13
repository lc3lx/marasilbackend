// في ملف services/MoyasarPaymentService.js
callBack = async (req) => {
  const requestData = req.body;
  const status = req.query.status;

  try {
    // التحقق من توقيع webhook (إضافة حسب احتياجاتك)
    // ...

    if (status === "paid") {
      const paymentId = requestData.data.id;
      const transaction = await Transaction.findOne({
        moyasarPaymentId: paymentId,
      });

      if (!transaction || transaction.status !== "pending") {
        return false;
      }

      // تحديث حالة المعاملة والمحفظة
      transaction.status = "completed";
      await transaction.save();

      const wallet = await Wallet.findById(transaction.walletId);
      wallet.balance += transaction.amount / 100; // هللة إلى SAR
      await wallet.save();

      return true;
    }
    return false;
  } catch (error) {
    console.error("فشل في تحديث المحفظة:", error);
    return false;
  }
};
