const axios = require("axios");
const Aramex = require("../platforms/shipment/aramexPlatform");

async function runTest() {
  console.log("Starting Aramex Test API Test...");

  // Initialize Aramex client with test credentials
  const aramexClient = new Aramex(
    "info@marasil.sa", // Username
    "Mm@059977111", // Password
    "72469040", // Account Number
    "589944", // Account Pin
    "JED", // Account Entity
    "SA", // Account Country Code
    "https://ws.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/CreateShipments" // Production URL without /json
  );

  // Format dates in Aramex's required format
  const formatDate = (date) => `/Date(${date.getTime()})/`;
  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  // Real shipment data
  const realShipmentData = {
    Reference1: "MARASIL-TEST-" + Date.now(),
    Reference2: "API-TEST",
    Reference3: "Test Order",
    Shipper: {
      Reference1: "Sender-" + Date.now(),
      Reference2: "MARASIL",
      AccountNumber: "72469040",
      PartyAddress: {
        Line1: "شارع الأمير سلطان",
        Line2: "",
        Line3: "",
        City: "جدة",
        StateOrProvinceCode: "",
        PostCode: "23434",
        CountryCode: "SA",
      },
      Contact: {
        Department: "",
        PersonName: "Marasil",
        Title: "",
        CompanyName: "Marasil",
        PhoneNumber1: "0599771111",
        PhoneNumber1Ext: "",
        PhoneNumber2: "",
        PhoneNumber2Ext: "",
        FaxNumber: "",
        CellPhone: "0599771111",
        EmailAddress: "info@marasil.sa",
        Type: "",
      },
    },
    Consignee: {
      Reference1: "TEST-" + Date.now(),
      Reference2: "",
      AccountNumber: "",
      PartyAddress: {
        Line1: "شارع الملك فهد",
        Line2: "حي العليا",
        Line3: "",
        City: "الرياض",
        StateOrProvinceCode: "",
        PostCode: "12214",
        CountryCode: "SA",
      },
      Contact: {
        Department: "",
        PersonName: "محمد احمد",
        Title: "",
        CompanyName: "",
        PhoneNumber1: "0500000000",
        PhoneNumber1Ext: "",
        PhoneNumber2: "",
        PhoneNumber2Ext: "",
        FaxNumber: "",
        CellPhone: "0500000000",
        EmailAddress: "test@test.com",
        Type: "",
      },
    },
    ShippingDateTime: formatDate(now),
    DueDate: formatDate(twoDaysFromNow),
    Comments: "طلب تجريبي",
    PickupLocation: "المستودع الرئيسي",
    OperationsInstructions: "يرجى الاتصال قبل التوصيل",
    AccountingInstrcutions: "",
    Details: {
      Dimensions: {
        Length: 20,
        Width: 15,
        Height: 10,
        Unit: "cm",
      },
      ActualWeight: {
        Value: 1,
        Unit: "KG",
      },
      ChargeableWeight: {
        Value: 1,
        Unit: "KG",
      },
      DescriptionOfGoods: "ملابس",
      GoodsOriginCountry: "SA",
      NumberOfPieces: 1,
      ProductGroup: "DOM", // DOM for domestic shipments
      ProductType: "CDS", // CDS for domestic shipping
      PaymentType: "P", // P for Prepaid
      PaymentOptions: "",
      Services: "", // COD can be added here if needed
      Items: [
        {
          PackageType: "Box",
          Quantity: 1,
          Weight: {
            Value: 1,
            Unit: "KG",
          },
          Comments: "منتج تجريبي",
          Reference: "",
        },
      ],
    },
    ForeignHAWB: "",
    TransportType: 0,
    PickupGUID: "",
    Number: null,
    CustomsValueAmount: {
      CurrencyCode: "SAR",
      Value: 100,
    },
    CashOnDeliveryAmount: {
      CurrencyCode: "SAR",
      Value: 0, // Set to actual amount if COD is needed
    },
    InsuranceAmount: {
      CurrencyCode: "SAR",
      Value: 0,
    },
    CollectAmount: {
      CurrencyCode: "SAR",
      Value: 0,
    },
    CashAdditionalAmount: {
      CurrencyCode: "SAR",
      Value: 0,
    },
    CashAdditionalAmountDescription: "",
  };

  try {
    console.log("Creating real shipment with Aramex...");
    const response = await aramexClient.createShipment(realShipmentData);

    console.log("\n✅ Shipment Created Successfully!");
    console.log("\n📦 Shipment Details:");
    console.log(JSON.stringify(response, null, 2));

    if (response.Shipments?.Shipment?.ID) {
      console.log("\n🏷️ Important Information:");
      console.log("Shipment Number:", response.Shipments.Shipment.ID);
      console.log(
        "Tracking Number:",
        response.Shipments.Shipment.TrackingNumber
      );
      console.log("Label URL:", response.Shipments.Shipment.LabelURL);
    }
  } catch (error) {
    console.error("\n❌ Error creating shipment:", error.message);
    if (error.response?.data) {
      console.error(
        "Error details:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
  }
}

// Run the test
runTest();
