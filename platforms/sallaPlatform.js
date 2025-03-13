const fetchs = import("node-fetch");

class SallaPlatform {
  static getAuthUrl(clientId, redirectUri, state) {
    return `https://accounts.salla.sa/oauth2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=offline_access&state=${state}`;
  }
  static async getAccessToken(code, clientId, clientSecret, redirectUri) {
    const tokenUrl = "https://accounts.salla.sa/oauth2/token";

    try {
      // إعداد POST Body باستخدام URLSearchParams
      const formData = new URLSearchParams();
      formData.append("client_id", clientId);
      formData.append("client_secret", clientSecret);
      formData.append("grant_type", "authorization_code");
      formData.append("code", code);
      formData.append("redirect_uri", redirectUri);

      // إرسال الطلب باستخدام node-fetch
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded", // التنسيق الصحيح
        },
        body: formData.toString(), // تحويل المعاملات إلى سلسلة
      });

      // التحقق من حالة الاستجابة
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Token Request Error Response:", errorData);
        throw new Error(`Token request failed: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Token Request Error Details:", error.message);
      throw new Error(`Token request failed: ${error.message}`);
    }
  }

  static async refreshAccessToken(refreshToken, clientId, clientSecret) {
    const tokenUrl = "https://accounts.salla.sa/oauth2/token";

    try {
      // إعداد POST Body بشكل صحيح
      const response = await fetchs(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded", // يجب تحديد هذا الرأس
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      });

      // التحقق من حالة الاستجابة
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Refresh Token Request Error Response:", errorData);
        throw new Error(
          `Refresh token request failed: ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Refresh Token Request Error Details:", error.message);
      throw new Error(`Refresh token request failed: ${error.message}`);
    }
  }
}

module.exports = SallaPlatform;
