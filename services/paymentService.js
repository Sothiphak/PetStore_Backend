const { BakongKHQR, khqrData, MerchantInfo } = require("bakong-khqr");
const axios = require('axios');

// Sandbox Credentials
const BAKONG_ACCOUNT_ID = "test_bakong@devb"; 
const MERCHANT_ID = 1243546472; // Must be a NUMBER, not string
const MERCHANT_NAME = "PetStore+";
const MERCHANT_CITY = "Phnom Penh";
const ACQUIRING_BANK = "DEVBKKHPXXX"; // Bank SWIFT code

class PaymentService {
    async generateKHQR(amount, billNumber) {
        try {
            // 1. Force amount to number with 2 decimals
            const safeAmount = Number(parseFloat(amount).toFixed(2));
            
            if (isNaN(safeAmount) || safeAmount <= 0) {
                 return { success: false, message: "Invalid Amount" };
            }

            console.log(`Generating QR for $${safeAmount} with Account: ${BAKONG_ACCOUNT_ID}`);

            // 2. Prepare optional data
            const optionalData = {
                currency: khqrData.currency.usd,
                amount: safeAmount,
                billNumber: billNumber || `INV-${Date.now()}`,
                mobileNumber: "85512345678",
                storeLabel: MERCHANT_NAME,
                terminalLabel: "POS-01",
                expirationTimestamp: Date.now() + (15 * 60 * 1000), // 15 minutes expiry
                merchantCategoryCode: "5999", // General merchandise
            };

            // Use MerchantInfo Class instead of plain object
            const merchantInfo = new MerchantInfo(
                BAKONG_ACCOUNT_ID,
                MERCHANT_NAME,
                MERCHANT_CITY,
                MERCHANT_ID,
                ACQUIRING_BANK,
                optionalData
            );

            // 4. Generate KHQR
            const khqr = new BakongKHQR();
            const response = khqr.generateMerchant(merchantInfo);

            console.log("KHQR Response:", JSON.stringify(response.status, null, 2));

            if (response.status.code === 0) {
                const qrString = response.data.qr;
                const md5 = response.data.md5;
                
                // Public API for QR Image
                const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`;

                console.log("QR Generated Successfully");

                return {
                    success: true,
                    qr: qrString,
                    md5: md5,
                    qrImage: qrImage
                };
            } else {
                console.error("KHQR Gen Error:", response);
                return { 
                    success: false, 
                    message: `KHQR Error: ${response.status.message || 'Invalid Data'}` 
                };
            }
        } catch (error) {
            console.error("Payment Service Exception:", error);
            return { success: false, message: error.message };
        }
    }

    async checkTransaction(md5) {
        // Auto-approve after 3 seconds for DEMO purposes
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log("Simulating Payment Success for:", md5);
                resolve(true); 
            }, 3000); 
        });
    }
}

module.exports = new PaymentService();