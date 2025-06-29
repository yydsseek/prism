const axios = require('axios');

class WechatService {
  constructor() {
    this.appId = process.env.WECHAT_APP_ID;
    this.appSecret = process.env.WECHAT_APP_SECRET;
    this.apiBaseUrl = 'https://api.weixin.qq.com';
  }

  /**
   * 通过code获取access_token和openid
   * @param {string} code - 微信授权码
   */
  async getAccessToken(code) {
    try {
      const url = `${this.apiBaseUrl}/sns/oauth2/access_token`;
      const params = {
        appid: this.appId,
        secret: this.appSecret,
        code: code,
        grant_type: 'authorization_code'
      };

      const response = await axios.get(url, { params });
      
      if (response.data.errcode) {
        throw new Error(response.data.errmsg || '获取微信access_token失败');
      }

      return {
        access_token: response.data.access_token,
        expires_in: response.data.expires_in,
        refresh_token: response.data.refresh_token,
        openid: response.data.openid,
        scope: response.data.scope,
        unionid: response.data.unionid
      };
    } catch (error) {
      console.error('获取微信access_token失败:', error);
      throw new Error('微信授权失败，请重试');
    }
  }

  /**
   * 获取微信用户信息
   * @param {string} accessToken - 访问令牌
   * @param {string} openid - 用户openid
   */
  async getUserInfo(accessToken, openid) {
    try {
      const url = `${this.apiBaseUrl}/sns/userinfo`;
      const params = {
        access_token: accessToken,
        openid: openid,
        lang: 'zh_CN'
      };

      const response = await axios.get(url, { params });
      
      if (response.data.errcode) {
        throw new Error(response.data.errmsg || '获取微信用户信息失败');
      }

      return {
        openid: response.data.openid,
        unionid: response.data.unionid,
        nickname: response.data.nickname,
        sex: response.data.sex,
        province: response.data.province,
        city: response.data.city,
        country: response.data.country,
        headimgurl: response.data.headimgurl,
        privilege: response.data.privilege
      };
    } catch (error) {
      console.error('获取微信用户信息失败:', error);
      throw new Error('获取微信用户信息失败，请重试');
    }
  }

  /**
   * 验证access_token是否有效
   * @param {string} accessToken - 访问令牌
   * @param {string} openid - 用户openid
   */
  async validateAccessToken(accessToken, openid) {
    try {
      const url = `${this.apiBaseUrl}/sns/auth`;
      const params = {
        access_token: accessToken,
        openid: openid
      };

      const response = await axios.get(url, { params });
      return response.data.errcode === 0;
    } catch (error) {
      console.error('验证access_token失败:', error);
      return false;
    }
  }

  /**
   * 刷新access_token
   * @param {string} refreshToken - 刷新令牌
   */
  async refreshAccessToken(refreshToken) {
    try {
      const url = `${this.apiBaseUrl}/sns/oauth2/refresh_token`;
      const params = {
        appid: this.appId,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      };

      const response = await axios.get(url, { params });
      
      if (response.data.errcode) {
        throw new Error(response.data.errmsg || '刷新access_token失败');
      }

      return {
        access_token: response.data.access_token,
        expires_in: response.data.expires_in,
        refresh_token: response.data.refresh_token,
        openid: response.data.openid,
        scope: response.data.scope
      };
    } catch (error) {
      console.error('刷新access_token失败:', error);
      throw new Error('刷新微信授权失败，请重新登录');
    }
  }

  /**
   * 生成微信登录二维码URL
   * @param {string} redirectUri - 回调地址
   * @param {string} state - 状态参数
   */
  generateQRCodeUrl(redirectUri, state = 'login') {
    const params = new URLSearchParams({
      appid: this.appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'snsapi_login',
      state: state
    });

    return `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`;
  }

  /**
   * 生成微信网页授权URL
   * @param {string} redirectUri - 回调地址
   * @param {string} state - 状态参数
   * @param {string} scope - 授权作用域
   */
  generateAuthUrl(redirectUri, state = 'login', scope = 'snsapi_userinfo') {
    const params = new URLSearchParams({
      appid: this.appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope,
      state: state
    });

    return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
  }

  /**
   * 检查微信服务配置
   */
  checkConfig() {
    if (!this.appId || !this.appSecret) {
      throw new Error('微信服务配置不完整，请检查WECHAT_APP_ID和WECHAT_APP_SECRET环境变量');
    }
    return true;
  }

  /**
   * 处理微信登录流程
   * @param {string} code - 微信授权码
   */
  async processLogin(code) {
    try {
      // 检查配置
      this.checkConfig();

      // 获取access_token
      const tokenData = await this.getAccessToken(code);
      
      // 获取用户信息
      const userInfo = await this.getUserInfo(tokenData.access_token, tokenData.openid);
      
      return {
        openid: userInfo.openid,
        unionid: userInfo.unionid,
        nickname: userInfo.nickname,
        avatar: userInfo.headimgurl,
        sex: userInfo.sex,
        province: userInfo.province,
        city: userInfo.city,
        country: userInfo.country
      };
    } catch (error) {
      console.error('微信登录处理失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
const wechatService = new WechatService();

module.exports = wechatService; 