import nodemailer from 'nodemailer';
import dotenv from 'dotenv/config';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true cho port 465, false cho port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const verificationUrl = `http://localhost:3000/api/v1/verifyemail?token=${verificationToken}`;
    const mailOptions = {
      from: `"ESHOP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Xác nhận email đăng ký',
      html: `
        <h3>Xác nhận tài khoản của bạn</h3>
        <p>Vui lòng nhấp vào liên kết dưới đây để xác nhận email (hết hạn sau 24 giờ):</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

const sendOrderConfirmationEmail = async (email, orderId, userName, totalPrice, address, phone) => {
  try {
    const mailOptions = {
      from: `"ESHOP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Xác nhận đơn hàng thành công',
      html: `
        <h3>Xin chào ${userName},</h3>
        <p>Cảm ơn bạn đã đặt hàng tại ESHOP! Đơn hàng của bạn đã được ghi nhận với thông tin sau:</p>
        <ul>
          <li><strong>Mã đơn hàng:</strong> ${orderId}</li>
          <li><strong>Tổng giá trị:</strong> ${totalPrice.toFixed(2)} VND</li>
          <li><strong>Địa chỉ giao hàng:</strong> ${address}</li>
          <li><strong>Số điện thoại:</strong> ${phone}</li>
        </ul>
        <p>Chúng tôi sẽ xử lý đơn hàng và thông báo đến bạn sớm nhất. Nếu có thắc mắc, vui lòng liên hệ qua email này.</p>
        <p>Trân trọng,</p>
        <p>Đội ngũ ESHOP</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw error;
  }
};

const sendZaloPayConfirmationEmail = async (email, orderId, userName, totalPrice, address, phone, paymentTime) => {
  try {
    const formattedPaymentTime = new Date(paymentTime).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });
    const mailOptions = {
      from: `"ESHOP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Xác nhận thanh toán đơn hàng qua ZaloPay',
      html: `
        <h3>Xin chào ${userName},</h3>
        <p>Thanh toán đơn hàng của bạn qua ZaloPay đã hoàn tất! Dưới đây là thông tin chi tiết:</p>
        <ul>
          <li><strong>Mã đơn hàng:</strong> ${orderId}</li>
          <li><strong>Tổng giá trị:</strong> ${totalPrice.toFixed(2)} VND</li>
          <li><strong>Phương thức thanh toán:</strong> ZaloPay</li>
          <li><strong>Thời gian thanh toán:</strong> ${formattedPaymentTime}</li>
          <li><strong>Địa chỉ giao hàng:</strong> ${address}</li>
          <li><strong>Số điện thoại:</strong> ${phone}</li>
        </ul>
        <p>Đơn hàng của bạn đang được xử lý. Chúng tôi sẽ thông báo khi đơn hàng được giao. Nếu có thắc mắc, vui lòng liên hệ qua email này.</p>
        <p>Trân trọng,</p>
        <p>Đội ngũ ESHOP</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`ZaloPay confirmation email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending ZaloPay confirmation email:', error);
    throw error;
  }
};

// đổi mât khẩu
// email.js (already correct, just for reference)
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `http://localhost:3000/api/v1/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: `"ESHOP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Yêu cầu đặt lại mật khẩu',
      html: `
        <h3>Đặt lại mật khẩu</h3>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấp vào liên kết dưới đây để đặt lại mật khẩu (liên kết hết hạn sau 1 giờ):</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};



export { sendVerificationEmail, sendOrderConfirmationEmail, sendZaloPayConfirmationEmail, sendPasswordResetEmail };