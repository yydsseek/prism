const nodemailer = require('nodemailer');

// 创建邮件传输器
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// 发送邮箱验证邮件
const sendVerificationEmail = async (email, token) => {
  const transporter = createTransporter();
  
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '验证您的邮箱地址 - Prism',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333;">欢迎加入 Prism!</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
          <h2 style="color: #555; margin-bottom: 20px;">验证您的邮箱地址</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            感谢您注册 Prism 平台！为了确保您的账户安全，请点击下面的按钮验证您的邮箱地址：
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;
                      font-weight: bold;">
              验证邮箱地址
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
            如果按钮无法点击，请复制以下链接到浏览器地址栏：
          </p>
          
          <p style="color: #007bff; word-break: break-all; margin-bottom: 25px;">
            ${verificationUrl}
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
            此链接将在 24 小时后失效。如果您没有注册 Prism 账户，请忽略此邮件。
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 14px;">
          <p>© 2024 Prism. 保留所有权利。</p>
        </div>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

// 发送密码重置邮件
const sendPasswordResetEmail = async (email, token) => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '重置您的密码 - Prism',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333;">密码重置</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
          <h2 style="color: #555; margin-bottom: 20px;">重置您的密码</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            我们收到了您的密码重置请求。请点击下面的按钮重置您的密码：
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;
                      font-weight: bold;">
              重置密码
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
            如果按钮无法点击，请复制以下链接到浏览器地址栏：
          </p>
          
          <p style="color: #dc3545; word-break: break-all; margin-bottom: 25px;">
            ${resetUrl}
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
            此链接将在 1 小时后失效。如果您没有请求重置密码，请忽略此邮件。
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 14px;">
          <p>© 2024 Prism. 保留所有权利。</p>
        </div>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

// 发送新文章通知邮件
const sendNewPostNotification = async (subscriberEmail, creatorName, postTitle, postUrl) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: subscriberEmail,
    subject: `${creatorName} 发布了新文章 - Prism`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333;">新文章发布</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
          <h2 style="color: #555; margin-bottom: 20px;">${creatorName} 发布了新文章</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            您订阅的创作者 ${creatorName} 刚刚发布了一篇新文章：
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 10px;">${postTitle}</h3>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${postUrl}" 
               style="background-color: #28a745; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;
                      font-weight: bold;">
              阅读文章
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 14px;">
          <p>© 2024 Prism. 保留所有权利。</p>
        </div>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

// 发送订阅确认邮件
const sendSubscriptionConfirmation = async (subscriberEmail, creatorName, plan, amount) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: subscriberEmail,
    subject: `订阅确认 - ${creatorName} - Prism`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333;">订阅确认</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
          <h2 style="color: #555; margin-bottom: 20px;">感谢您的订阅！</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            您已成功订阅 ${creatorName} 的内容。
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 15px;">订阅详情</h3>
            <p style="color: #666; margin-bottom: 5px;"><strong>创作者：</strong> ${creatorName}</p>
            <p style="color: #666; margin-bottom: 5px;"><strong>订阅计划：</strong> ${plan}</p>
            <p style="color: #666; margin-bottom: 5px;"><strong>金额：</strong> $${amount}</p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
            您现在可以访问所有订阅内容。我们会通过邮件通知您新文章的发布。
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 14px;">
          <p>© 2024 Prism. 保留所有权利。</p>
        </div>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

// 发送订阅取消邮件
const sendSubscriptionCancellation = async (subscriberEmail, creatorName) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: subscriberEmail,
    subject: `订阅已取消 - ${creatorName} - Prism`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333;">订阅已取消</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
          <h2 style="color: #555; margin-bottom: 20px;">订阅已成功取消</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            您已成功取消对 ${creatorName} 的订阅。
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
            感谢您使用 Prism 平台。如果您有任何问题或建议，请随时联系我们。
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 14px;">
          <p>© 2024 Prism. 保留所有权利。</p>
        </div>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNewPostNotification,
  sendSubscriptionConfirmation,
  sendSubscriptionCancellation
}; 