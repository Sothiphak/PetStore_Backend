const generateInvoiceHtml = (order, user) => {
  const { _id, createdAt, orderItems, itemsPrice, taxPrice, shippingPrice, totalPrice, paymentMethod, shippingAddress } = order;
  const date = new Date(createdAt).toLocaleDateString();

  const itemsHtml = orderItems.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <div style="font-weight: bold;">${item.name}</div>
        <div style="font-size: 12px; color: #777;">Quantity: ${item.quantity}</div>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        $${item.price.toFixed(2)}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
        .header { margin-bottom: 40px; }
        .header h1 { color: #009200; margin: 0; }
        .info-table { width: 100%; margin-bottom: 20px; }
        .info-table td { padding: 5px; vertical-align: top; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th { background: #f8f9fa; border-bottom: 2px solid #ddd; padding: 10px; text-align: left; }
        .totals { width: 100%; text-align: right; }
        .totals-row { margin-bottom: 5px; }
        .grand-total { font-size: 1.2em; font-weight: bold; color: #009200; margin-top: 10px; }
        .footer { margin-top: 50px; text-align: center; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <div class="header">
          <h1>PetStore+ Invoice</h1>
        </div>
        
        <table class="info-table">
          <tr>
            <td>
              <strong>Billed To:</strong><br>
              ${user.firstName} ${user.lastName}<br>
              ${user.email}
            </td>
            <td style="text-align: right;">
              <strong>Order ID:</strong> ${_id}<br>
              <strong>Date:</strong> ${date}<br>
              <strong>Payment Method:</strong> ${paymentMethod}
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top: 15px;">
              <strong>Shipping Address:</strong><br>
              ${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.postalCode}, ${shippingAddress.country}
            </td>
          </tr>
        </table>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">Subtotal: $${itemsPrice.toFixed(2)}</div>
          <div class="totals-row">Tax: $${taxPrice.toFixed(2)}</div>
          <div class="totals-row">Shipping: $${shippingPrice.toFixed(2)}</div>
          <div class="grand-total">Total: $${totalPrice.toFixed(2)}</div>
        </div>

        <div class="footer">
          <p>Thank you for shopping with PetStore+!</p>
          <p>If you have any questions, please contact support.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = { generateInvoiceHtml };
