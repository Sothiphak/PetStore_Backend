const getOrderStatusHtml = (order, user) => {
  const statusColors = {
    'Processing': '#3B82F6', // Blue
    'Shipped': '#8B5CF6',    // Purple
    'Delivered': '#10B981',  // Green
    'Cancelled': '#EF4444'   // Red
  };

  const statusMessages = {
    'Processing': 'Your order is being processed and will be shipped soon.',
    'Shipped': 'Great news! Your order has been shipped and is on its way.',
    'Delivered': 'Your package has been delivered. Enjoy your purchase!',
    'Cancelled': 'Your order has been cancelled. If you have any questions, please contact support.'
  };

  const color = statusColors[order.status] || '#6B7280';
  const message = statusMessages[order.status] || `Your order status has been updated to ${order.status}.`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #009200; margin: 0; }
        .status-badge { 
          display: inline-block; 
          padding: 10px 20px; 
          background-color: ${color}; 
          color: white; 
          border-radius: 25px; 
          font-weight: bold;
          margin: 20px 0;
        }
        .content { margin-bottom: 30px; }
        .order-details { background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #009200; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>PetStore+</h1>
        </div>
        
        <div class="content" style="text-align: center;">
          <h2>Order Update</h2>
          <p>Hi ${user.firstName},</p>
          
          <div class="status-badge">
            ${order.status.toUpperCase()}
          </div>
          
          <p>${message}</p>
          
          <div class="order-details" style="text-align: left;">
            <strong>Order ID:</strong> ${order._id}<br>
            <strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}<br>
            <strong>Total:</strong> $${order.totalPrice.toFixed(2)}
          </div>

          <a href="https://petstore-plus.vercel.app/profile" class="btn">View Order Details</a>
        </div>

        <div class="footer">
          <p>Thank you for shopping with PetStore+!</p>
          <p>&copy; ${new Date().getFullYear()} PetStore+. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const getPromotionHtml = (promotion) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: auto; padding: 0; border: 1px solid #eee; border-radius: 16px; overflow: hidden; }
        .header { background-color: #009200; padding: 40px 20px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; text-align: center; }
        .promo-box { 
          background: #f0fdf4; 
          border: 2px dashed #009200; 
          padding: 20px; 
          border-radius: 12px; 
          margin: 30px 0;
        }
        .code { font-size: 32px; font-weight: 900; color: #009200; letter-spacing: 2px; display: block; margin-top: 10px; }
        .value { font-size: 24px; font-weight: bold; color: #333; }
        .dates { color: #6b7280; font-size: 14px; margin-top: 10px; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        .btn { display: inline-block; padding: 15px 30px; background-color: #009200; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Special Offer For You! 🎉</h1>
        </div>
        
        <div class="content">
          <p style="font-size: 18px;">We have a special deal just for you. Use the code below at checkout!</p>
          
          <div class="promo-box">
            <div class="value">
              Get ${promotion.type === 'percent' ? `${promotion.value}% OFF` : `$${promotion.value} OFF`}
            </div>
            <span class="code">${promotion.code}</span>
            <div class="dates">
              Valid until ${new Date(promotion.endDate).toLocaleDateString()}
            </div>
          </div>
          
          <a href="https://petstore-plus.vercel.app/shop" class="btn">Shop Now</a>
          
          <p style="margin-top: 30px; color: #666;">
            ${promotion.minPurchase > 0 ? `*Minimum purchase of $${promotion.minPurchase} required.` : ''}
          </p>
        </div>

        <div class="footer">
          <p>You received this email because you are a valued customer of PetStore+.</p>
          <p>&copy; ${new Date().getFullYear()} PetStore+. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = { getOrderStatusHtml, getPromotionHtml };
