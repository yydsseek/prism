const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class UploadService {
  constructor() {
    // 确保上传目录存在
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.avatarDir = path.join(this.uploadDir, 'avatars');
    this.coverDir = path.join(this.uploadDir, 'covers');
    this.postDir = path.join(this.uploadDir, 'posts');
    
    this.initDirectories();
    
    // 文件大小限制
    this.limits = {
      avatar: 5 * 1024 * 1024, // 5MB
      cover: 10 * 1024 * 1024, // 10MB
      post: 20 * 1024 * 1024   // 20MB
    };
    
    // 允许的文件类型
    this.allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };
  }

  async initDirectories() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.avatarDir, { recursive: true });
      await fs.mkdir(this.coverDir, { recursive: true });
      await fs.mkdir(this.postDir, { recursive: true });
    } catch (error) {
      console.error('创建上传目录失败:', error);
    }
  }

  /**
   * 配置multer存储
   */
  getStorage(type = 'avatar') {
    return multer.memoryStorage();
  }

  /**
   * 文件过滤器
   */
  getFileFilter(allowedTypes) {
    return (req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
      }
    };
  }

  /**
   * 获取multer中间件配置
   */
  getMulterConfig(type = 'avatar') {
    const config = {
      storage: this.getStorage(type),
      limits: {
        fileSize: this.limits[type] || this.limits.avatar
      },
      fileFilter: this.getFileFilter(this.allowedTypes.image)
    };

    return multer(config);
  }

  /**
   * 处理头像上传
   */
  async processAvatar(file, userId) {
    try {
      const filename = `avatar_${userId}_${uuidv4()}.webp`;
      const filepath = path.join(this.avatarDir, filename);
      
      // 使用sharp处理图片
      await sharp(file.buffer)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 80 })
        .toFile(filepath);

      // 返回相对路径用于存储到数据库
      const relativePath = `/uploads/avatars/${filename}`;
      
      return {
        success: true,
        url: relativePath,
        filename: filename,
        size: file.size,
        originalName: file.originalname
      };
    } catch (error) {
      console.error('头像处理失败:', error);
      throw new Error('头像处理失败');
    }
  }

  /**
   * 处理封面图上传
   */
  async processCover(file, userId) {
    try {
      const filename = `cover_${userId}_${uuidv4()}.webp`;
      const filepath = path.join(this.coverDir, filename);
      
      // 使用sharp处理图片
      await sharp(file.buffer)
        .resize(1200, 600, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 85 })
        .toFile(filepath);

      const relativePath = `/uploads/covers/${filename}`;
      
      return {
        success: true,
        url: relativePath,
        filename: filename,
        size: file.size,
        originalName: file.originalname
      };
    } catch (error) {
      console.error('封面图处理失败:', error);
      throw new Error('封面图处理失败');
    }
  }

  /**
   * 处理文章图片上传
   */
  async processPostImage(file, userId) {
    try {
      const filename = `post_${userId}_${uuidv4()}.webp`;
      const filepath = path.join(this.postDir, filename);
      
      // 使用sharp处理图片
      await sharp(file.buffer)
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 85 })
        .toFile(filepath);

      const relativePath = `/uploads/posts/${filename}`;
      
      return {
        success: true,
        url: relativePath,
        filename: filename,
        size: file.size,
        originalName: file.originalname
      };
    } catch (error) {
      console.error('文章图片处理失败:', error);
      throw new Error('文章图片处理失败');
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(filePath) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      console.error('删除文件失败:', error);
      return false;
    }
  }

  /**
   * 清理过期的临时文件
   */
  async cleanupTempFiles() {
    try {
      const directories = [this.avatarDir, this.coverDir, this.postDir];
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24小时

      for (const dir of directories) {
        const files = await fs.readdir(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
            console.log(`清理过期文件: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('清理临时文件失败:', error);
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(filePath) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      const stats = await fs.stat(fullPath);
      
      return {
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message
      };
    }
  }

  /**
   * 验证图片文件
   */
  validateImageFile(file) {
    const errors = [];

    // 检查文件类型
    if (!this.allowedTypes.image.includes(file.mimetype)) {
      errors.push('不支持的文件类型，请上传 JPEG、PNG、WebP 或 GIF 格式的图片');
    }

    // 检查文件大小
    if (file.size > this.limits.avatar) {
      errors.push(`文件大小不能超过 ${this.limits.avatar / 1024 / 1024}MB`);
    }

    // 检查文件名
    if (!file.originalname) {
      errors.push('文件名不能为空');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 生成缩略图
   */
  async generateThumbnail(filePath, width = 150, height = 150) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      const ext = path.extname(filePath);
      const basename = path.basename(filePath, ext);
      const dir = path.dirname(fullPath);
      
      const thumbnailName = `${basename}_thumb_${width}x${height}.webp`;
      const thumbnailPath = path.join(dir, thumbnailName);
      
      await sharp(fullPath)
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 75 })
        .toFile(thumbnailPath);

      const relativeThumbnailPath = filePath.replace(path.basename(filePath), thumbnailName);
      
      return {
        success: true,
        thumbnailUrl: relativeThumbnailPath
      };
    } catch (error) {
      console.error('生成缩略图失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量处理图片
   */
  async processMultipleImages(files, userId, type = 'post') {
    const results = [];
    
    for (const file of files) {
      try {
        let result;
        
        switch (type) {
          case 'avatar':
            result = await this.processAvatar(file, userId);
            break;
          case 'cover':
            result = await this.processCover(file, userId);
            break;
          case 'post':
            result = await this.processPostImage(file, userId);
            break;
          default:
            throw new Error(`未知的图片类型: ${type}`);
        }
        
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          originalName: file.originalname
        });
      }
    }
    
    return results;
  }

  /**
   * 清理用户的所有上传文件
   * @param {string} userId - 用户ID
   */
  async cleanupUserFiles(userId) {
    try {
      const userDir = path.join(this.uploadDir, userId);
      
      // 检查目录是否存在
      if (await this.directoryExists(userDir)) {
        // 递归删除用户目录及其所有内容
        await fs.rm(userDir, { recursive: true, force: true });
        console.log(`用户文件清理成功: ${userId}`);
      }
    } catch (error) {
      console.error(`清理用户文件失败 - 用户ID: ${userId}`, error);
      throw error;
    }
  }

  /**
   * 检查目录是否存在
   * @param {string} dirPath - 目录路径
   */
  async directoryExists(dirPath) {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch (error) {
      return false;
    }
  }
}

// 创建单例实例
const uploadService = new UploadService();

module.exports = uploadService; 