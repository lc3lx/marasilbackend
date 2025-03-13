const axios = require("axios");

class ShopifyPlatform {
  static getAuthUrl(clientId, redirectUri, state) {
    return `https://${state}.myshopify.com/admin/oauth/authorize?client_id=${clientId}&scope=read_orders&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${state}`;
  }

  static async getAccessToken(
    code,
    clientId,
    clientSecret,
    storeName,
    redirectUri
  ) {
    const tokenUrl = `https://${storeName}.myshopify.com/admin/oauth/access_token`;

    try {
      const response = await axios.post(tokenUrl, {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        console.error("Token Request Error Response:", error.response.data);
        throw new Error(
          `Token request failed: ${JSON.stringify(error.response.data)}`
        );
      } else {
        console.error("Token Request Error Details:", error.message);
        throw new Error(`Token request failed: ${error.message}`);
      }
    }
  }
}

module.exports = ShopifyPlatform;
