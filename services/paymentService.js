const { BakongKHQR, khqrData } = require("bakong-khqr");
const axios = require('axios');

// 🟢 SAFE SANDBOX CREDENTIALS
const BAKONG_ACCOUNT_ID = "test_bakong@devb"; 
const MERCHANT_ID = "000201"; 
const MERCHANT_NAME = "PetStore+";
const MERCHANT_CITY = "Phnom Penh";

class PaymentService {
    async generateKHQR(amount, billNumber) {
        try {
            // 1. Force amount to number with 2 decimals
            const safeAmount = Number(parseFloat(amount).toFixed(2));
            
            if (isNaN(safeAmount) || safeAmount <= 0) {
                 return { success: false, message: "Invalid Amount" };
            }

            console.log(`Generating QR for $${safeAmount} with Account: ${BAKONG_ACCOUNT_ID}`);

            // 🟢 FIX: Properly access currency constant
            // The library expects either khqrData.currency.khr (116) or khqrData.currency.usd (840)
            const optionalData = {
                currency: khqrData.currency.usd,  // Remove the || "USD" fallback
                amount: safeAmount,
                mobileNumber: "85512345678",
                billNumber: billNumber || `INV-${Date.now()}`,
                storeLabel: MERCHANT_NAME,
                terminalLabel: "POS-01",
            };

            const individualInfo = {
                bakongAccountID: BAKONG_ACCOUNT_ID,
                accountId: BAKONG_ACCOUNT_ID,       
                merchantName: MERCHANT_NAME,
                merchantCity: MERCHANT_CITY,
                merchantId: MERCHANT_ID,
                acquiringBank: "Bakong Bank", 
            };

            const khqr = new BakongKHQR();
            const response = khqr.generateIndividual(individualInfo, optionalData);

            if (response.status.code === 0) {
                const qrString = response.data.qr;
                const md5 = response.data.md5;
                
                // Public API for QR Image
                const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`;

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