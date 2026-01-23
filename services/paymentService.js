// server/services/paymentService.js
const { BakongKHQR, khqrData, MerchantInfo } = require("bakong-khqr");
const QRCode = require('qrcode');
const axios = require('axios');

class PaymentService {
    constructor() {
        // ✅ 1. USE THIS EXACT TEST ID (It is standard for sandbox testing)
        this.merchantId = "khqr@aclb"; 
        this.merchantName = "PetStore+";
        this.merchantCity = "Phnom Penh";
        this.acquiringBank = "Acleda Bank"; 
        
        // Token for checking status (Keep this)
        this.bakongToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoiMWJkMDEzZTRlNDExNGE0YSJ9LCJpYXQiOjE3NjkxNTc3NTQsImV4cCI6MTc3NjkzMzc1NH0.1lh20A_epTUhJPWFu15yq_CqZ6WbeL2XhV0Z-dclNCo";
        this.bakongApiUrl = "https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5";
    }

    // 1. Generate Dynamic KHQR Code
    async generateKHQR(amount, billNumber) {
        try {
            // ✅ 2. FORCE ROUNDING (Fixes "19.000000001" crashes)
            const safeAmount = Number(parseFloat(amount).toFixed(2));
            
            if (isNaN(safeAmount) || safeAmount <= 0) {
                 console.error("❌ Payment Error: Invalid amount:", amount);
                 return { success: false };
            }

            console.log(`🔄 Generating QR for: $${safeAmount} (Bill: ${billNumber})`);

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

            // ✅ 3. DEBUG LOGGING (Check your Terminal for this!)
            if (response.status.code === 0) {
                console.log("✅ QR Generated Successfully!");
                const qrString = response.data.qr;
                const md5 = response.data.md5;

                // Convert string to Image
                const qrImage = await QRCode.toDataURL(qrString);

                return { success: true, qrImage, md5, qrString };
            } else {
                console.error("❌ KHQR Lib Error:", response.status.message); // <--- LOOK FOR THIS IN TERMINAL
                return { success: false };
            }
        } catch (error) {
            console.error("❌ QR Gen Critical Crash:", error);
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