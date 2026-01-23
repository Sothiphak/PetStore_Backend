// server/services/paymentService.js
const { BakongKHQR, khqrData, MerchantInfo } = require("bakong-khqr");
const QRCode = require('qrcode');
const axios = require('axios');

class PaymentService {
    constructor() {
        // ⚠️ In a real app, move these to your .env file
        this.bakongToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoiMWJkMDEzZTRlNDExNGE0YSJ9LCJpYXQiOjE3NjkxNTc3NTQsImV4cCI6MTc3NjkzMzc1NH0.1lh20A_epTUhJPWFu15yq_CqZ6WbeL2XhV0Z-dclNCo";
        this.merchantId = "petstore_admin@aclb"; 
        this.merchantName = "PetStore+";
        this.merchantCity = "Phnom Penh";
        this.bakongApiUrl = "https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5";
    }

    // 1. Generate Dynamic KHQR Code
    async generateKHQR(amount, billNumber) {
        try {
            const optionalData = {
                currency: khqrData.currency.usd,
                amount: amount,
                billNumber: billNumber,
                storeLabel: "PetStore Main",
                terminalLabel: "POS-01",
            };

            const merchantInfo = new MerchantInfo(
                this.merchantId,
                this.merchantName,
                this.merchantCity,
                "0",
                "Acleda Bank",
                optionalData
            );

            const khqr = new BakongKHQR();
            const response = khqr.generateMerchant(merchantInfo);

            if (response.status.code === 0) {
                const qrString = response.data.qr;
                const md5 = response.data.md5;

                // Convert string to Image Data URL
                const qrImage = await QRCode.toDataURL(qrString);

                return { success: true, qrImage, md5, qrString };
            }
            return { success: false };
        } catch (error) {
            console.error("QR Gen Error:", error);
            return { success: false };
        }
    }

    // 2. Check Transaction Status
    async checkTransaction(md5) {
        try {
            const response = await axios.post(this.bakongApiUrl, {
                md5: md5
            }, {
                headers: {
                    'Authorization': `Bearer ${this.bakongToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.responseCode === 0) {
                return true; // Payment Success
            }
            return false;
        } catch (error) {
            console.error("Bakong Check Error:", error.message);
            return false;
        }
    }
}

module.exports = new PaymentService();