// server/services/paymentService.js
const { BakongKHQR, khqrData, MerchantInfo } = require("bakong-khqr");
const QRCode = require('qrcode');
const axios = require('axios');

class PaymentService {
    constructor() {
        // TEST CREDENTIALS
        this.merchantId = process.env.BAKONG_MERCHANT_ID;
        this.merchantName = process.env.BAKONG_MERCHANT_NAME;
        this.merchantCity = "Phnom Penh";
        this.acquiringBank = process.env.BAKONG_ACQUIRING_BANK;
        this.bakongToken = process.env.BAKONG_API_TOKEN;
        this.bakongApiUrl = "https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5";
    }

    async generateKHQR(amount, billNumber) {
        try {
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
                // ✅ ADDED THIS: QR Expires in 15 minutes (in milliseconds)
                expirationTimestamp: Date.now() + (15 * 60 * 1000) 
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

            if (response.status.code === 0) {
                console.log("✅ QR Generated Successfully!");
                const qrString = response.data.qr;
                const md5 = response.data.md5;
                const qrImage = await QRCode.toDataURL(qrString);

                return { success: true, qrImage, md5, qrString };
            } else {
                console.error("❌ KHQR Lib Error:", response.status.message);
                return { success: false };
            }
        } catch (error) {
            console.error("❌ QR Gen Critical Crash:", error);
            return { success: false };
        }
    }

    async checkTransaction(md5) {
        try {
            const response = await axios.post(this.bakongApiUrl, { md5: md5 }, {
                headers: { 'Authorization': `Bearer ${this.bakongToken}`, 'Content-Type': 'application/json' }
            });
            return response.data && response.data.responseCode === 0;
        } catch (error) {
            console.error("Bakong Check Error:", error.message);
            return false;
        }
    }
}

module.exports = new PaymentService();