const { BakongKHQR, khqrData, MerchantInfo } = require("bakong-khqr");
const QRCode = require('qrcode');
const axios = require('axios');

class PaymentService {
    constructor() {
        // ✅ FIXED: Use a simple, standard ID for testing (No underscores)
        this.merchantId = "khqr@aclb"; 
        this.merchantName = "PetStore+";
        this.merchantCity = "Phnom Penh";
        this.acquiringBank = "Acleda Bank"; 
        
        // Token for checking status
        this.bakongToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoiMWJkMDEzZTRlNDExNGE0YSJ9LCJpYXQiOjE3NjkxNTc3NTQsImV4cCI6MTc3NjkzMzc1NH0.1lh20A_epTUhJPWFu15yq_CqZ6WbeL2XhV0Z-dclNCo";
        this.bakongApiUrl = "https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5";
    }

    // 1. Generate Dynamic KHQR Code
    async generateKHQR(amount, billNumber) {
        try {
            // Safety: Ensure amount is a number
            const safeAmount = Number(amount);
            if (isNaN(safeAmount) || safeAmount <= 0) {
                 console.error("Payment Error: Invalid amount", amount);
                 return { success: false };
            }

            const optionalData = {
                currency: khqrData.currency.usd,
                amount: safeAmount,
                billNumber: billNumber,
                storeLabel: this.merchantName,
                terminalLabel: "POS-01",
            };

            const merchantInfo = new MerchantInfo(
                this.merchantId,
                this.merchantName,
                this.merchantCity,
                "0",
                this.acquiringBank,
                optionalData
            );

            const khqr = new BakongKHQR();
            const response = khqr.generateMerchant(merchantInfo);

            // Log the result for debugging in Render
            console.log("KHQR Generation Response:", response.status);

            if (response.status.code === 0) {
                const qrString = response.data.qr;
                const md5 = response.data.md5;

                // Convert string to Image
                const qrImage = await QRCode.toDataURL(qrString);

                return { success: true, qrImage, md5, qrString };
            } else {
                console.error("KHQR Lib Error:", response.status.message);
                return { success: false };
            }
        } catch (error) {
            console.error("QR Gen Crash:", error);
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
                return true; 
            }
            return false;
        } catch (error) {
            console.error("Bakong Check Error:", error.message);
            return false;
        }
    }
}

module.exports = new PaymentService();