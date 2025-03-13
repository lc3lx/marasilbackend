const Moyasar = require("moyasar");
require("dotenv").config();
const { Payment } = require("moyasar");
// إعداد مفتاح السر الخاص بمoyasar
Moyasar.apiKey = process.env.MOYASAR_SECRET_KEY;

class MoyasarPlatform {
  static async createPayment(
    amount,
    currency,
    description,
    sourceToken,
    redirectUrl,
    cancelUrl
  ) {
    try {
      const response = await Payment.createPayment({
        amount: parseFloat(amount), // المبلغ (هللة)
        currency: currency || "SAR", // العملة (افتراضيًا SAR)
        description: description || "Recharge wallet", // الوصف
        source: {
          token: sourceToken, // توكن البطاقة من الواجهة الأمامية
        },
        redirect_url:
          redirectUrl || `${process.env.FRONTEND_URL}/payment/success`, // إعادة التوجيه بعد النجاح
        cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`, // إعادة التوجيه عند الإلغاء
      });

      return response; // رد Moyasar
    } catch (error) {
      console.error("Error creating payment:", error.message);
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  static async checkPaymentStatus(paymentId) {
    try {
      const response = await Moyasar.Payment.retrieve(paymentId);
      return response; // حالة الدفع
    } catch (error) {
      console.error("Error checking payment status:", error.message);
      throw new Error(`Failed to check payment status: ${error.message}`);
    }
  }
}

module.exports = MoyasarPlatform;
