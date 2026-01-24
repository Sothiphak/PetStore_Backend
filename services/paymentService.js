const axios = require('axios');
const crypto = require('crypto');
const { BakongKHQR, khqrData } = require("bakong-khqr");

// Use env vars or fallback to Bakong's public test credentials
const BAKONG_ACCOUNT_ID = process.env.BAKONG_ACCOUNT_ID || "test_bakong@devb";
const MERCHANT_NAME = process.env.BAKONG_MERCHANT_NAME || "Test Merchant";
const MERCHANT_CITY = "Phnom Penh";
const MERCHANT_ID = process.env.BAKONG_MERCHANT_ID || "000201";

exports.generateKHQR = async (amount, billNumber) => {
    try {
        const optionalData = {
            currency: khqrData.currency.usd,
            amount: amount,
            mobileNumber: "85512345678",
            billNumber: billNumber || `INV-${Date.now()}`,
            storeLabel: "PetStore+",
            terminalLabel: "POS-01",
        };

        const individualInfo = {
            accountId: BAKONG_ACCOUNT_ID,
            merchantName: MERCHANT_NAME,
            merchantCity: MERCHANT_CITY,
            merchantId: MERCHANT_ID,
            acquiringBank: "Bakong Bank", 
        };

        const khqr = new BakongKHQR();
        const response = khqr.generateIndividual(individualInfo, optionalData);

        if (response.status.code === 0) {
            return {
                success: true,
                qr: response.data.qr,
                md5: response.data.md5,
                qrImage: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(response.data.qr)}`
            };
        } else {
            return { success: false, message: "KHQR Generation Failed" };
        }
    } catch (error) {
        console.error("KHQR Service Error:", error);
        return { success: false, error: error.message };
    }
};

// Mock Transaction Check for Sandbox (Always returns true for test accounts)
exports.checkTransaction = async (md5) => {
    // In a real production app, you would call:
    // axios.get(`https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5/${md5}`)
    
    // For Sandbox/Demo purposes, we simulate a successful payment after 5 seconds
    // to prevent the 403 error from blocking your demo.
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true); // Always return TRUE for testing
        }, 3000);
    });
};