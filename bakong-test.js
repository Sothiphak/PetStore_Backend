// Run this script locally to test: node test-bakong.js

const { BakongKHQR, khqrData } = require("bakong-khqr");

console.log("=== BAKONG KHQR DEBUG TEST ===\n");

// Check the library version and structure
console.log("1. Checking BakongKHQR structure:");
const khqr = new BakongKHQR();
console.log("   Available methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(khqr)));
console.log("\n");

// Try with MERCHANT info instead of INDIVIDUAL
console.log("2. Testing MERCHANT QR Generation:\n");

const merchantInfo = {
    bakongAccountID: "test_bakong@devb",
    merchantName: "Test Store",
    merchantCity: "Phnom Penh",
    merchantId: "000201",
    acquiringBank: "Dev Bank"
};

const optionalData = {
    currency: khqrData.currency.usd,
    amount: 10.50,
    billNumber: "TEST-001",
    mobileNumber: "85512345678",
    storeLabel: "Test Store",
    terminalLabel: "POS-01"
};

console.log("Merchant Info:", JSON.stringify(merchantInfo, null, 2));
console.log("Optional Data:", JSON.stringify(optionalData, null, 2));
console.log("\n");

// Try generateMerchant instead of generateIndividual
console.log("Test A: Using generateMerchant()");
try {
    const khqr1 = new BakongKHQR();
    const response1 = khqr1.generateMerchant(merchantInfo, optionalData);
    console.log("   Result:", JSON.stringify(response1, null, 2));
    console.log("\n");
} catch (e) {
    console.log("   Error:", e.message);
    console.log("\n");
}

// Try generateIndividual with different structure
console.log("Test B: Using generateIndividual() with acquiringBank");
try {
    const khqr2 = new BakongKHQR();
    const response2 = khqr2.generateIndividual(merchantInfo, optionalData);
    console.log("   Result:", JSON.stringify(response2, null, 2));
    console.log("\n");
} catch (e) {
    console.log("   Error:", e.message);
    console.log("\n");
}

// Try with accountID instead of bakongAccountID
console.log("Test C: Using accountID field");
try {
    const khqr3 = new BakongKHQR();
    const info3 = {
        accountID: "test_bakong@devb",
        merchantName: "Test Store",
        merchantCity: "Phnom Penh",
        merchantId: "000201"
    };
    const response3 = khqr3.generateIndividual(info3, optionalData);
    console.log("   Result:", JSON.stringify(response3, null, 2));
    console.log("\n");
} catch (e) {
    console.log("   Error:", e.message);
    console.log("\n");
}

// Try with minimal required fields
console.log("Test D: Minimal fields only");
try {
    const khqr4 = new BakongKHQR();
    const info4 = {
        bakongAccountID: "test_bakong@devb",
        merchantName: "Test Store",
        merchantCity: "Phnom Penh"
    };
    const data4 = {
        currency: khqrData.currency.usd,
        amount: 10.50
    };
    const response4 = khqr4.generateIndividual(info4, data4);
    console.log("   Result:", JSON.stringify(response4, null, 2));
    console.log("\n");
} catch (e) {
    console.log("   Error:", e.message);
    console.log("\n");
}

// Check if there's a generate() method
console.log("Test E: Using generate() if it exists");
try {
    const khqr5 = new BakongKHQR();
    if (typeof khqr5.generate === 'function') {
        const response5 = khqr5.generate(merchantInfo, optionalData);
        console.log("   Result:", JSON.stringify(response5, null, 2));
    } else {
        console.log("   generate() method not found");
    }
    console.log("\n");
} catch (e) {
    console.log("   Error:", e.message);
    console.log("\n");
}

console.log("=== TEST COMPLETE ===");