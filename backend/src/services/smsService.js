const Dysmsapi = require('@alicloud/dysmsapi20170525');
const OpenApi = require('@alicloud/openapi-client');
const Util = require('@alicloud/tea-util');

class SMSService {
  constructor() {
    // 阿里云配置
    const config = new OpenApi.Config({
      accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
      endpoint: 'dysmsapi.aliyuncs.com'
    });
    
    this.client = new Dysmsapi.default(config);
    this.signName = process.env.SMS_SIGN_NAME || 'Prism平台';
    
    // 模板配置
    this.templates = {
      register: process.env.SMS_TEMPLATE_REGISTER || 'SMS_123456789',
      login: process.env.SMS_TEMPLATE_LOGIN || 'SMS_123456790',
      reset_password: process.env.SMS_TEMPLATE_RESET || 'SMS_123456791',
      change_phone: process.env.SMS_TEMPLATE_CHANGE || 'SMS_123456792'
    };
  }

  /**
   * 生成6位数字验证码
   */
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 发送短信验证码
   * @param {string} phone - 手机号
   * @param {string} code - 验证码
   * @param {string} type - 验证码类型 (register, login, reset_password, change_phone)
   */
  async sendVerificationCode(phone, code, type = 'register') {
    try {
      const templateCode = this.templates[type];
      if (!templateCode) {
        throw new Error(`未知的短信模板类型: ${type}`);
      }

      const sendSmsRequest = new Dysmsapi.SendSmsRequest({
        phoneNumbers: phone,
        signName: this.signName,
        templateCode: templateCode,
        templateParam: JSON.stringify({ code })
      });

      const runtime = new Util.RuntimeOptions({});
      const response = await this.client.sendSmsWithOptions(sendSmsRequest, runtime);

      if (response.body.code === 'OK') {
        console.log(`短信发送成功: ${phone}, 验证码: ${code}, 类型: ${type}`);
        return {
          success: true,
          message: '短信发送成功',
          bizId: response.body.bizId
        };
      } else {
        console.error('短信发送失败:', response.body);
        return {
          success: false,
          message: response.body.message || '短信发送失败',
          code: response.body.code
        };
      }
    } catch (error) {
      console.error('短信发送异常:', error);
      
      // 开发环境下直接返回成功（用于测试）
      if (process.env.NODE_ENV === 'development') {
        console.log(`开发环境模拟短信发送: ${phone}, 验证码: ${code}, 类型: ${type}`);
        return {
          success: true,
          message: '短信发送成功（开发环境模拟）'
        };
      }
      
      return {
        success: false,
        message: '短信服务异常，请稍后重试',
        error: error.message
      };
    }
  }

  /**
   * 批量发送短信
   * @param {Array} phoneList - 手机号列表
   * @param {string} code - 验证码
   * @param {string} type - 验证码类型
   */
  async sendBatchSMS(phoneList, code, type = 'register') {
    const results = [];
    
    for (const phone of phoneList) {
      try {
        const result = await this.sendVerificationCode(phone, code, type);
        results.push({
          phone,
          ...result
        });
      } catch (error) {
        results.push({
          phone,
          success: false,
          message: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * 验证手机号格式
   * @param {string} phone - 手机号
   */
  validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 格式化手机号显示
   * @param {string} phone - 手机号
   */
  formatPhone(phone) {
    if (!phone || phone.length !== 11) return phone;
    return `${phone.slice(0, 3)} ${phone.slice(3, 7)} ${phone.slice(7)}`;
  }

  /**
   * 手机号脱敏显示
   * @param {string} phone - 手机号
   */
  maskPhone(phone) {
    if (!phone || phone.length !== 11) return phone;
    return `${phone.slice(0, 3)}****${phone.slice(7)}`;
  }

  /**
   * 检查短信发送频率限制
   * @param {string} phone - 手机号
   * @param {string} type - 验证码类型
   */
  async checkSendLimit(phone, type) {
    // 这里可以实现Redis缓存来检查发送频率
    // 简单实现：每个手机号每分钟最多发送1条，每天最多发送10条
    
    const cacheKey = `sms_limit:${phone}:${type}`;
    const dailyKey = `sms_daily:${phone}`;
    
    // 实际项目中应该使用Redis
    // 这里返回允许发送
    return {
      allowed: true,
      remainingCount: 9,
      nextAllowTime: null
    };
  }

  /**
   * 获取短信模板内容（用于测试）
   * @param {string} type - 模板类型
   */
  getTemplateContent(type) {
    const templates = {
      register: '您的注册验证码是：${code}，5分钟内有效，请勿泄露。',
      login: '您的登录验证码是：${code}，5分钟内有效，请勿泄露。',
      reset_password: '您的密码重置验证码是：${code}，5分钟内有效，请勿泄露。',
      change_phone: '您的手机号变更验证码是：${code}，5分钟内有效，请勿泄露。'
    };
    
    return templates[type] || '验证码：${code}，请勿泄露。';
  }
}

// 创建单例实例
const smsService = new SMSService();

module.exports = smsService; 