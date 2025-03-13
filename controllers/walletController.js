const Wallet = require("../models/walletModel");
const Transaction = require("../models/transactionModel");
const MoyasarPaymentService = require("../services/MoyasarPaymentService");
const multer = require("multer"); // لرفع الصور
const upload = multer({ dest: "uploads/" }); // مسار التخزين

const moyasarService = new MoyasarPaymentService();

// شحن المحفظة
exports.rechargeWallet = async (req, res) => {
  try {
    const { walletId, amount, method } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ error: "المبلغ يجب أن يكون أكبر من صفر" });
    }

    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      return res.status(404).json({ error: "المحفظة غير موجودة" });
    }

    // إنشاء معاملة جديدة
    let transactionData;
    if (method === "bank_transfer") {
      // التحويل البنكي: رفع صورة الإيصال
      upload.single("proof")(req, res, async () => {
        if (!req.file) {
          return res.status(400).json({ error: "صورة الإيصال مطلوبة" });
        }
        transactionData = {
          walletId,
          amount: amount * 100, // تحويل SAR إلى هللة
          method,
          proofOfPayment: `/uploads/${req.file.filename}`,
        };
        const transaction = await Transaction.create(transactionData);
        res.json({
          message: "معاملة التحويل البنكي تم إنشاؤها بنجاح",
          transaction,
          note: "يرجى انتظار تحقق الإدارة",
        });
      });
    } else if (method === "moyasar") {
      // Moyasar: إنشاء دفع إلكتروني
      const data = {
        amount: amount * 100, // هللة
        currency: "SAR",
        description: "شحن محفظة",
        source: { token: req.body.token }, // توكن البطاقة من الواجهة الأمامية
      };

      const paymentResponse = await moyasarService.sendPayment({ body: data });
      if (!paymentResponse.success) {
        return res.status(500).json({ error: paymentResponse.error });
      }

      const transaction = await Transaction.create({
        walletId,
        amount: data.amount,
        method,
        moyasarPaymentId: paymentResponse.url.split("/").pop(), // استخراج معرف الدفع من الرابط
      });

      res.json({
        message: "دفع Moyasar تم إنشاؤه بنجاح",
        paymentLink: paymentResponse.url,
        transactionId: transaction._id,
      });
    }
  } catch (error) {
    console.error("حدث خطأ:", error.message);
    res.status(500).json({ error: "فشل في شحن المحفظة" });
  }
};
