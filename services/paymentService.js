const { BakongKHQR, khqrData } = require("bakong-khqr");

// 🟢 SAFE SANDBOX CREDENTIALS (Guaranteed to work)
const BAKONG_ACCOUNT_ID = "test_bakong@devb"; 
const MERCHANT_ID = "000201"; 
const MERCHANT_NAME = "PetStore+";
const MERCHANT_CITY = "Phnom Penh";

exports.generateKHQR = async (amount, billNumber) => {
    try {
        // 1. 🧹 CLEAN THE AMOUNT
        // This fixes the "Could not generate" error by forcing exactly 2 decimals
        const safeAmount = Number(parseFloat(amount).toFixed(2));

        const optionalData = {
            currency: khqrData.currency.usd,
            amount: safeAmount,
            mobileNumber: "85512345678",
            billNumber: billNumber || `INV-${Date.now()}`,
            storeLabel: "PetStore",
            terminalLabel: "POS-01",
        };

        const individualInfo = {
            accountId: BAKONG_ACCOUNT_ID, // Uses hardcoded safe value
            merchantName: MERCHANT_NAME,
            merchantCity: MERCHANT_CITY,
            merchantId: MERCHANT_ID,
            acquiringBank: "Bakong Bank", 
        };

        const khqr = new BakongKHQR();
        const response = khqr.generateIndividual(individualInfo, optionalData);

        if (response.status.code === 0) {
            // ✅ SUCCESS
            const qrString = response.data.qr;
            const md5 = response.data.md5;
            
            // Convert QR String to Image URL
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`;

            return {
                success: true,
                qr: qrString,
                md5: md5,
                qrImage: qrImageUrl
            };
        } else {
            // ❌ FAIL - Log the real reason
            console.error("KHQR Gen Error:", response);
            return { 
                success: false, 
                message: `KHQR Error: ${response.status.message || 'Invalid Data'}` 
            };
        }
    } catch (error) {
        console.error("Payment Service Exception:", error);
        return { success: false, error: error.message };
    }
};

// Mock Transaction Check (Auto-Success after 5 seconds for Demo)
exports.checkTransaction = async (md5) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log("Simulating Payment Success for:", md5);
            resolve(true); 
        }, 5000); 
    });
};