import nodemailer from 'nodemailer';
import dotenv from 'dotenv/config';
import logger from './logger.js';

// Lấy URL Backend trực tiếp từ biến môi trường (fallback: http://localhost:3000)
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true cho port 465, false cho port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Template bọc ngoài dùng chung cho tất cả các Email (Màu chủ đạo #218282)
const getEmailWrapper = (title, contentHtml) => {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 30px 10px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
              
              <!-- Header Brand -->
              <tr>
                <td align="center" style="background-color: #218282; padding: 25px 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 1px;">ESHOP</h1>
                  <p style="color: #e6fffa; margin: 4px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Cửa Hàng Thiết Bị Điện Tử</p>
                </td>
              </tr>

              <!-- Email Body Content -->
              <tr>
                <td style="padding: 30px 25px; color: #1e293b; font-size: 15px; line-height: 1.6;">
                  ${contentHtml}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #f8fafc; padding: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">
                  <p style="margin: 0 0 6px 0;">Nếu bạn có bất kỳ câu hỏi nào, vui lòng phản hồi lại email này.</p>
                  <p style="margin: 0; font-weight: 600; color: #218282;">© ${new Date().getFullYear()} ESHOP. Tất cả các quyền được bảo lưu.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// 1. Email Xác Nhận Tài Khoản
const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const verificationUrl = `${BACKEND_URL}/api/v1/verifyemail?token=${verificationToken}`;
    
    const bodyHtml = `
      <h2 style="color: #218282; margin-top: 0; font-size: 20px; text-align: center;">XÁC NHẬN ĐĂNG KÝ TÀI KHOẢN</h2>
      <p>Xin chào,</p>
      <p>Cảm ơn bạn đã lựa chọn mua sắm tại <strong>ESHOP</strong>! Vui lòng nhấp vào nút bên dưới để hoàn tất việc xác nhận địa chỉ email của bạn (liên kết có hiệu lực trong <strong>24 giờ</strong>):</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" target="_blank" style="background-color: #218282; color: #ffffff; padding: 13px 28px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block; box-shadow: 0 4px 10px rgba(33, 130, 130, 0.25);">
          XÁC NHẬN TÀI KHOẢN NGAY
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; background-color: #f8fafc; padding: 12px; border-radius: 6px; border-left: 3px solid #218282;">
        Nếu nút bấm không hoạt động, hãy dán liên kết sau vào trình duyệt:<br>
        <a href="${verificationUrl}" style="color: #218282; word-break: break-all;">${verificationUrl}</a>
      </p>
    `;

    const mailOptions = {
      from: `"ESHOP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Xác nhận email đăng ký tài khoản - ESHOP',
      html: getEmailWrapper('Xác nhận tài khoản ESHOP', bodyHtml),
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Verification email sent', { email, messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error('Error sending verification email', { email, error: error.message });
    throw error;
  }
};

// 2. Email Xác Nhận Đơn Hàng Thường (COD)
const sendOrderConfirmationEmail = async (email, orderId, userName, totalPrice, address, phone) => {
  try {
    const formattedPrice = Math.round(totalPrice).toLocaleString('vi-VN');
    
    const bodyHtml = `
      <h2 style="color: #218282; margin-top: 0; font-size: 20px;">Cảm ơn bạn đã đặt hàng!</h2>
      <p>Xin chào <strong>${userName}</strong>,</p>
      <p>Đơn hàng của bạn đã được ghi nhận thành công và đang được chuẩn bị để đóng gói.</p>
      
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0; padding: 15px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; width: 140px;">Mã đơn hàng:</td>
          <td style="padding: 6px 0; font-weight: bold; color: #218282;">#${orderId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Tổng giá trị:</td>
          <td style="padding: 6px 0; font-weight: bold; color: #ef4444; font-size: 16px;">${formattedPrice} VNĐ</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Địa chỉ giao hàng:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${address}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Số điện thoại:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${phone}</td>
        </tr>
      </table>

      <p>Chúng tôi sẽ tiếp tục thông báo đến bạn khi đơn hàng bắt đầu được giao. Chúc bạn có trải nghiệm tuyệt vời cùng ESHOP!</p>
    `;

    const mailOptions = {
      from: `"ESHOP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `[ESHOP] Xác nhận đơn hàng thành công #${orderId}`,
      html: getEmailWrapper('Xác nhận đơn hàng', bodyHtml),
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Order confirmation email sent', { email, orderId, messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error('Error sending order confirmation email', { email, orderId, error: error.message });
    throw error;
  }
};

// 3. Email Xác Nhận Thanh Toán ZaloPay
const sendZaloPayConfirmationEmail = async (email, orderId, userName, totalPrice, address, phone, paymentTime) => {
  try {
    const formattedPaymentTime = new Date(paymentTime).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });
    const formattedPrice = Math.round(totalPrice).toLocaleString('vi-VN');

    const bodyHtml = `
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="background-color: #e6fffa; color: #218282; border: 1px solid #b2f5ea; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 13px;">
          ✓ ĐÃ THANH TOÁN ZALOPAY
        </span>
      </div>

      <h2 style="color: #218282; margin-top: 0; font-size: 20px; text-align: center;">Thanh toán thành công!</h2>
      <p>Xin chào <strong>${userName}</strong>,</p>
      <p>Giao dịch thanh toán qua ví điện tử <strong>ZaloPay</strong> cho đơn hàng <strong>#${orderId}</strong> của bạn đã hoàn tất.</p>
      
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0; padding: 15px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; width: 160px;">Mã đơn hàng:</td>
          <td style="padding: 6px 0; font-weight: bold; color: #218282;">#${orderId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Phương thức:</td>
          <td style="padding: 6px 0; font-weight: bold; color: #0068ff;">ZaloPay Gateway</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Thời gian thanh toán:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${formattedPaymentTime}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Tổng số tiền:</td>
          <td style="padding: 6px 0; font-weight: bold; color: #ef4444; font-size: 16px;">${formattedPrice} VNĐ</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Địa chỉ giao hàng:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${address}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Số điện thoại:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${phone}</td>
        </tr>
      </table>

      <p>Đơn hàng sẽ sớm được bàn giao cho đơn vị vận chuyển. Cảm ơn quý khách đã tin tưởng dịch vụ của ESHOP!</p>
    `;

    const mailOptions = {
      from: `"ESHOP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `[ESHOP] Xác nhận thanh toán ZaloPay thành công cho đơn hàng #${orderId}`,
      html: getEmailWrapper('Thanh toán ZaloPay thành công', bodyHtml),
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('ZaloPay confirmation email sent', { email, orderId, messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error('Error sending ZaloPay confirmation email', { email, orderId, error: error.message });
    throw error;
  }
};

// 4. Email Đặt Lại Mật Khẩu
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${BACKEND_URL}/api/v1/reset-password?token=${resetToken}`;
    
    const bodyHtml = `
      <h2 style="color: #218282; margin-top: 0; font-size: 20px; text-align: center;">YÊU CẦU ĐẶT LẠI MẬT KHẨU</h2>
      <p>Xin chào,</p>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email này. Vui lòng bấm vào nút bên dưới để khởi tạo mật khẩu mới (liên kết có hiệu lực trong <strong>1 giờ</strong>):</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" target="_blank" style="background-color: #218282; color: #ffffff; padding: 13px 28px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block; box-shadow: 0 4px 10px rgba(33, 130, 130, 0.25);">
          ĐẶT LẠI MẬT KHẨU
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; background-color: #f8fafc; padding: 12px; border-radius: 6px; border-left: 3px solid #218282;">
        Nếu bạn không đưa ra yêu cầu này, vui lòng bỏ qua email hoặc bảo mật tài khoản của mình.<br>Liên kết thay thế: <a href="${resetUrl}" style="color: #218282; word-break: break-all;">${resetUrl}</a>
      </p>
    `;

    const mailOptions = {
      from: `"ESHOP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Yêu cầu đặt lại mật khẩu - ESHOP',
      html: getEmailWrapper('Đặt lại mật khẩu ESHOP', bodyHtml),
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Password reset email sent', { email, messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error('Error sending password reset email', { email, error: error.message });
    throw error;
  }
};

export {
  sendVerificationEmail,
  sendOrderConfirmationEmail,
  sendZaloPayConfirmationEmail,
  sendPasswordResetEmail,
};