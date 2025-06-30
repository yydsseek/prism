'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/navigation';

import MarkdownPreview from '../../components/MarkdownPreview';
import EditorShortcuts from '../../components/EditorShortcuts';
import { 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  Image, 
  Video, 
  FileText, 
  Code, 
  Quote, 
  Minus, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Save, 
  Eye, 
  Settings, 
  History, 
  Upload,
  Plus,
  Trash2,
  ChevronDown,
  Edit3,
  Monitor,
  ArrowLeft
} from 'lucide-react';

interface EditorState {
  content: string;
  coverImage: string;
  status: 'draft' | 'published';
  isPaid: boolean;
  price: number;
  lastSaved: Date | null;
}

interface HistoryEntry {
  id: string;
  timestamp: Date;
  title: string;
  content: string;
  action: string;
}

export default function CreatePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [editorState, setEditorState] = useState<EditorState>({
    content: '',
    coverImage: '',
    status: 'draft',
    isPaid: false,
    price: 0,
    lastSaved: null
  });

  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showToolbar, setShowToolbar] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [isDragging, setIsDragging] = useState(false);

  // 检查用户登录状态
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // 自动保存功能
  const autoSave = useCallback(async () => {
    if (!editorState.content) return;
    
    setIsAutoSaving(true);
    try {
      // 模拟保存到后端
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 保存到localStorage作为备份
      const saveData = {
        ...editorState,
        lastSaved: new Date()
      };
      localStorage.setItem('draft-post', JSON.stringify(saveData));
      
      setEditorState(prev => ({ ...prev, lastSaved: new Date() }));
      
      // 添加到历史记录
      const historyEntry: HistoryEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        title: editorState.content.split('\n')[0] || '无标题',
        content: editorState.content.substring(0, 100),
        action: '自动保存'
      };
      setHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
      
    } catch (error) {
      console.error('自动保存失败:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [editorState]);

  // 设置自动保存定时器
  useEffect(() => {
    const timer = setInterval(autoSave, 30000); // 每30秒自动保存
    return () => clearInterval(timer);
  }, [autoSave]);

  // 加载草稿
  useEffect(() => {
    const savedDraft = localStorage.getItem('draft-post');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setEditorState(prev => ({
          ...prev,
          ...parsed,
          lastSaved: parsed.lastSaved ? new Date(parsed.lastSaved) : null
        }));
      } catch (error) {
        console.error('加载草稿失败:', error);
      }
    }
  }, []);

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + S: 手动保存
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        autoSave();
        return;
      }
      
      // Ctrl + B: 粗体
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        formatText('bold');
        return;
      }
      
      // Ctrl + I: 斜体
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        formatText('italic');
        return;
      }
      
      // Ctrl + Shift + C: 代码块
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        formatText('codeblock');
        return;
      }
      
      // Ctrl + Shift + Q: 引用
      if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
        e.preventDefault();
        formatText('quote');
        return;
      }
      
      // Ctrl + Shift + L: 分割线
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        formatText('divider');
        return;
      }
      
      // Ctrl + Shift + P: 切换预览模式
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setViewMode(prev => prev === 'preview' ? 'edit' : 'preview');
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [autoSave]);

  // 自动调整textarea高度
  useEffect(() => {
    if (editorRef.current) {
      const textarea = editorRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(textarea.scrollHeight, 600) + 'px';
    }
  }, [editorState.content]);

  // 插入文本到光标位置
  const insertAtCursor = (text: string) => {
    if (!editorRef.current) return;
    
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const content = editorState.content;
    
    const newContent = content.substring(0, start) + text + content.substring(end);
    setEditorState(prev => ({ ...prev, content: newContent }));
    
    // 设置光标位置
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.setSelectionRange(start + text.length, start + text.length);
      }
    }, 0);
  };

  // 格式化工具函数
  const formatText = (format: string) => {
    const selection = window.getSelection()?.toString() || '';
    let formatText = '';
    
    switch (format) {
      case 'bold':
        formatText = selection ? `**${selection}**` : '**粗体文本**';
        break;
      case 'italic':
        formatText = selection ? `*${selection}*` : '*斜体文本*';
        break;
      case 'code':
        formatText = selection ? `\`${selection}\`` : '`代码`';
        break;
      case 'quote':
        formatText = selection ? `> ${selection}` : '> 引用文本';
        break;
      case 'divider':
        formatText = '\n---\n';
        break;
      case 'codeblock':
        formatText = '\n```\n代码块\n```\n';
        break;
      case 'paywall':
        formatText = '\n[付费内容开始]\n\n这里是付费内容...\n\n[付费内容结束]\n';
        break;
      case 'poll':
        formatText = '\n[投票]\n选项1\n选项2\n选项3\n[/投票]\n';
        break;
      case 'chart':
        formatText = '\n[金融图表: AAPL]\n';
        break;
    }
    
    insertAtCursor(formatText);
  };

  // 文件上传处理
  const handleFileUpload = async (file: File, type: 'image' | 'video' | 'file') => {
    try {
      // 模拟文件上传
      const formData = new FormData();
      formData.append('file', file);
      
      // 这里应该调用实际的上传API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const fileUrl = URL.createObjectURL(file);
      let insertText = '';
      
      switch (type) {
        case 'image':
          insertText = `\n![${file.name}](${fileUrl})\n`;
          break;
        case 'video':
          insertText = `\n[视频: ${file.name}](${fileUrl})\n`;
          break;
        case 'file':
          insertText = `\n[文件: ${file.name}](${fileUrl})\n`;
          break;
      }
      
      insertAtCursor(insertText);
    } catch (error) {
      console.error('文件上传失败:', error);
    }
  };

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        handleFileUpload(file, 'image');
      } else if (file.type.startsWith('video/')) {
        handleFileUpload(file, 'video');
      } else {
        handleFileUpload(file, 'file');
      }
    });
  };

  // 发布文章
  const publishPost = async () => {
    try {
      // 这里应该调用发布API
      console.log('发布文章:', editorState);
      // 清除草稿
      localStorage.removeItem('draft-post');
      router.push('/dashboard');
    } catch (error) {
      console.error('发布失败:', error);
    }
  };

  // 恢复历史版本
  const restoreFromHistory = (historyEntry: HistoryEntry) => {
    setEditorState(prev => ({
      ...prev,
      content: historyEntry.content
    }));
    setShowHistory(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 编辑器顶部栏 */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* 左侧：返回按钮和状态 */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="返回控制台"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">返回</span>
                <span className="sm:hidden">←</span>
              </button>
              
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                草稿
              </span>
              
              {isAutoSaving && (
                <span className="text-sm text-gray-500 flex items-center">
                  <Save className="w-4 h-4 mr-1 animate-spin" />
                  <span className="hidden sm:inline">保存中...</span>
                </span>
              )}
              
              {editorState.lastSaved && !isAutoSaving && (
                <span className="text-sm text-gray-500 hidden md:inline">
                  上次保存: {editorState.lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
            
            {/* 中间：视图模式切换 */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('edit')}
                className={`flex items-center px-3 py-2 text-sm transition-colors ${
                  viewMode === 'edit' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Edit3 className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">编辑</span>
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`flex items-center px-3 py-2 text-sm transition-colors ${
                  viewMode === 'split' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Monitor className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">分屏</span>
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center px-3 py-2 text-sm transition-colors ${
                  viewMode === 'preview' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Eye className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">预览</span>
              </button>
            </div>
            
            {/* 右侧：工具和发布按钮 */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* 移动端工具菜单 */}
              <div className="relative sm:hidden">
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  title="工具"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              
              {/* 桌面端工具按钮 */}
              <button
                onClick={() => setShowHistory(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors hidden sm:block"
                title="查看历史"
              >
                <History className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors hidden sm:block"
                title="设置"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <button
                onClick={publishPost}
                className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium text-sm"
              >
                发布
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 固定工具栏 */}
      {(viewMode === 'edit' || viewMode === 'split') && (
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-16 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap gap-y-1">
              <button
                onClick={() => formatText('bold')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="粗体 (Ctrl+B)"
              >
                <Bold className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => formatText('italic')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="斜体 (Ctrl+I)"
              >
                <Italic className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => formatText('code')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="行内代码"
              >
                <Code className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => formatText('quote')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="引用 (Ctrl+Shift+Q)"
              >
                <Quote className="w-4 h-4" />
              </button>
              
              <div className="w-px h-4 sm:h-6 bg-gray-300"></div>
              
              <button
                onClick={() => imageInputRef.current?.click()}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="插入图片"
              >
                <Image className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => videoInputRef.current?.click()}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="插入视频"
              >
                <Video className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="插入文件"
              >
                <FileText className="w-4 h-4" />
              </button>
              
              <div className="w-px h-4 sm:h-6 bg-gray-300"></div>
              
              <button
                onClick={() => formatText('divider')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="分割线 (Ctrl+Shift+L)"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => formatText('codeblock')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="代码块 (Ctrl+Shift+C)"
              >
                <Code className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => formatText('chart')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors hidden sm:inline-flex"
                title="金融图表"
              >
                <TrendingUp className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => formatText('paywall')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors hidden sm:inline-flex"
                title="付费墙"
              >
                <DollarSign className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => formatText('poll')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors hidden sm:inline-flex"
                title="投票"
              >
                <BarChart3 className="w-4 h-4" />
              </button>

              <div className="flex-1"></div>
              
              {/* 右侧工具 */}
              <div className="flex items-center space-x-2 ml-auto">
                <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">
                  字数: {editorState.content.length}
                </span>
                {isAutoSaving && (
                  <span className="text-xs sm:text-sm text-blue-600 flex items-center">
                    <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" />
                    <span className="hidden sm:inline">保存中...</span>
                    <span className="sm:hidden">保存</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主编辑区域 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className={`${viewMode === 'split' ? 'grid grid-cols-2 gap-6' : ''}`}>
          {/* 编辑器部分 */}
          {(viewMode === 'edit' || viewMode === 'split') && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* 封面图片 */}
              {editorState.coverImage && (
                <div className="relative">
                  <img
                    src={editorState.coverImage}
                    alt="封面"
                    className="w-full h-64 object-cover"
                  />
                  <button
                    onClick={() => setEditorState(prev => ({ ...prev, coverImage: '' }))}
                    className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <div 
                className={`p-8 relative ${isDragging ? 'bg-indigo-50 border-2 border-dashed border-indigo-300' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  backgroundImage: isDragging ? 'none' : `
                    radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.02) 1px, transparent 0),
                    linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.4) 100%)
                  `,
                  backgroundSize: '20px 20px, 100% 100%'
                }}
              >
                {isDragging && (
                  <div className="absolute inset-0 bg-indigo-50 bg-opacity-90 flex items-center justify-center z-10">
                    <div className="text-center">
                      <Upload className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                      <p className="text-lg font-medium text-indigo-900">松开鼠标上传文件</p>
                      <p className="text-sm text-indigo-600">支持图片、视频和文档</p>
                    </div>
                  </div>
                )}
                
                {/* 统一的内容编辑器 */}
                <textarea
                  ref={editorRef}
                  placeholder="# 文章标题&#10;&#10;在这里开始写作...&#10;&#10;💡 提示：&#10;- 第一行会自动作为标题显示&#10;- 支持完整的 Markdown 语法&#10;- 可以直接拖拽文件上传&#10;- 使用工具栏快速插入特殊内容&#10;- 使用 # 创建标题，## 创建副标题"
                  value={editorState.content}
                  onChange={(e) => {
                    setEditorState(prev => ({ ...prev, content: e.target.value }));
                    setCursorPosition(e.target.selectionStart);
                    // 自动调整高度
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.max(e.target.scrollHeight, 600) + 'px';
                  }}
                  className="w-full text-lg text-gray-900 placeholder-gray-400 border-none outline-none resize-none rounded-xl transition-all duration-300"
                  style={{ 
                    fontFamily: 'ui-serif, Georgia, serif', 
                    lineHeight: '1.75',
                    padding: '0',
                    background: 'transparent',
                    minHeight: '600px',
                    height: 'auto',
                    overflow: 'hidden',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none'
                  }}
                />
              </div>
            </div>
          )}
          
          {/* 预览部分 */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">预览</h2>
                  <span className="text-sm text-gray-500">实时预览</span>
                </div>
                <div className="prose prose-lg max-w-none">
                  <MarkdownPreview
                    content={editorState.content}
                    coverImage={editorState.coverImage}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          files.forEach(file => handleFileUpload(file, 'file'));
        }}
      />
      
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          files.forEach(file => handleFileUpload(file, 'image'));
        }}
      />
      
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          files.forEach(file => handleFileUpload(file, 'video'));
        }}
      />

      {/* 历史记录模态框 */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">修改历史</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-80">
              {history.length === 0 ? (
                <p className="text-gray-500 text-center">暂无历史记录</p>
              ) : (
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => restoreFromHistory(entry)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{entry.title}</span>
                        <span className="text-sm text-gray-500">
                          {entry.timestamp.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{entry.content}</p>
                      <span className="text-xs text-indigo-600">{entry.action}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 设置模态框 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">文章设置</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">付费文章</span>
                <input
                  type="checkbox"
                  checked={editorState.isPaid}
                  onChange={(e) => setEditorState(prev => ({ ...prev, isPaid: e.target.checked }))}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              
              {editorState.isPaid && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    价格 (元)
                  </label>
                  <input
                    type="number"
                    value={editorState.price}
                    onChange={(e) => setEditorState(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 快捷键帮助 */}
      <EditorShortcuts />
    </div>
  );
} 