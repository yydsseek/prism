'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/navigation';
import { postApi } from '../../lib/api';

import MarkdownPreview from '../../components/MarkdownPreview';
import EditorShortcuts from '../../components/EditorShortcuts';
import { 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  Image, 
  FileText, 
  Code, 
  Code2,
  SquareCode,
  Quote, 
  Minus, 
  DollarSign, 

  Save, 
  Eye, 
  Settings, 
  FolderOpen,
  Upload,
  Plus,
  Trash2,
  ChevronDown,
  Edit3,
  Monitor,
  ArrowLeft,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Table,
  CheckSquare
} from 'lucide-react';

interface EditorState {
  content: string;
  coverImage: string;
  status: 'draft' | 'published';
  isPaid: boolean;
  price: number;
  lastSaved: Date | null;
}

interface DraftEntry {
  id: string;
  timestamp: Date;
  title: string;
  content: string;
  coverImage: string;
}

export default function CreatePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);


  const [editorState, setEditorState] = useState<EditorState>({
    content: '',
    coverImage: '',
    status: 'draft',
    isPaid: false,
    price: 0,
    lastSaved: null
  });

  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<DraftEntry | null>(null);
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);
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

  // 保存到草稿箱功能
  const saveToDrafts = useCallback(async () => {
    if (!editorState.content.trim()) {
      return Promise.resolve();
    }
    
    setIsAutoSaving(true);
    try {
      // 创建草稿条目
      const draftEntry: DraftEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        title: editorState.content.split('\n')[0]?.replace(/^#+\s*/, '') || '无标题',
        content: editorState.content,
        coverImage: editorState.coverImage
      };
      
      // 更新草稿列表
      setDrafts(prev => {
        const updated = [draftEntry, ...prev.filter(d => d.title !== draftEntry.title).slice(0, 9)];
        // 保存到localStorage
        localStorage.setItem('draft-posts', JSON.stringify(updated));
        return updated;
      });
      
      setEditorState(prev => ({ ...prev, lastSaved: new Date() }));
      
      // 添加一个小延迟以模拟保存过程
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error('保存草稿失败:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [editorState]);

  // 显示删除确认弹窗
  const showDeleteConfirmation = (draft: DraftEntry) => {
    setDraftToDelete(draft);
    setShowDeleteConfirm(true);
  };

  // 确认删除草稿
  const confirmDeleteDraft = () => {
    if (draftToDelete) {
      setDrafts(prev => {
        const updated = prev.filter(d => d.id !== draftToDelete.id);
        localStorage.setItem('draft-posts', JSON.stringify(updated));
        return updated;
      });
    }
    setShowDeleteConfirm(false);
    setDraftToDelete(null);
  };

  // 取消删除
  const cancelDeleteDraft = () => {
    setShowDeleteConfirm(false);
    setDraftToDelete(null);
  };

  // 设置自动保存定时器 - 每分钟保存一次
  useEffect(() => {
    const timer = setInterval(saveToDrafts, 60000); // 每60秒自动保存
    return () => clearInterval(timer);
  }, [saveToDrafts]);

  // 页面卸载时自动保存
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (editorState.content.trim()) {
        // 同步保存草稿以确保在页面卸载前完成
        const draftEntry: DraftEntry = {
          id: Date.now().toString(),
          timestamp: new Date(),
          title: editorState.content.split('\n')[0]?.replace(/^#+\s*/, '') || '无标题',
          content: editorState.content,
          coverImage: editorState.coverImage
        };
        
        const currentDrafts = JSON.parse(localStorage.getItem('draft-posts') || '[]');
        const updated = [draftEntry, ...currentDrafts.filter((d: DraftEntry) => d.title !== draftEntry.title).slice(0, 9)];
        localStorage.setItem('draft-posts', JSON.stringify(updated));
      }
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && editorState.content.trim()) {
        // 当页面变为不可见时保存草稿
        await saveToDrafts();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [editorState.content, editorState.coverImage, saveToDrafts]);

  // 加载草稿列表
  useEffect(() => {
    const savedDrafts = localStorage.getItem('draft-posts');
    if (savedDrafts) {
      try {
        const parsed = JSON.parse(savedDrafts);
        // 确保timestamp是Date对象
        const draftsWithDates = parsed.map((draft: any) => ({
          ...draft,
          timestamp: new Date(draft.timestamp)
        }));
        setDrafts(draftsWithDates);
      } catch (error) {
        console.error('加载草稿列表失败:', error);
      }
    }
    
    // 清除旧的草稿数据
    localStorage.removeItem('draft-post');
  }, []);

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC: 关闭删除确认弹窗
      if (e.key === 'Escape' && showDeleteConfirm) {
        e.preventDefault();
        cancelDeleteDraft();
        return;
      }
      
      // Ctrl + S: 手动保存到草稿箱
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveToDrafts();
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
  }, [saveToDrafts, showDeleteConfirm, cancelDeleteDraft]);

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
    if (!editorRef.current) return;
    
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const selectedText = editorState.content.substring(start, end);
    const beforeText = editorState.content.substring(0, start);
    const afterText = editorState.content.substring(end);
    
    // 检查前后是否需要换行
    const needsNewlineBefore = () => {
      return beforeText.length > 0 && !beforeText.endsWith('\n');
    };
    
    const needsNewlineAfter = () => {
      return true;
    };
    
    let newText = '';
    let cursorOffset = 0;
    
    switch (format) {
      case 'bold':
        newText = selectedText ? `**${selectedText}**` : '**粗体文本** ';
        cursorOffset = selectedText ? newText.length : 6;
        break;
      case 'italic':
        newText = selectedText ? `*${selectedText}*` : '*斜体文本* ';
        cursorOffset = selectedText ? newText.length : 5;
        break;
      case 'code':
        newText = selectedText ? `\`${selectedText}\`` : '`代码`';
        cursorOffset = selectedText ? newText.length : 3;
        break;
      case 'quote':
        // 引用需要在新行开始
        const quotePrefix = needsNewlineBefore() ? '\n' : '';
        const quoteSuffix = needsNewlineAfter() ? '\n' : '';
        
        if (selectedText.includes('\n')) {
          newText = quotePrefix + selectedText.split('\n').map(line => `> ${line}`).join('\n') + quoteSuffix;
        } else {
          newText = quotePrefix + (selectedText ? `> ${selectedText}` : '> 引用文本') + quoteSuffix;
        }
        cursorOffset = newText.length - quoteSuffix.length;
        break;
      case 'codeblock':
        // 代码块需要前后换行
        const codePrefix = needsNewlineBefore() ? '\n' : '';
        const codeSuffix = needsNewlineAfter() ? '\n' : '';
        
        newText = codePrefix + (selectedText ? 
          `\`\`\`\n${selectedText}\n\`\`\`` : 
          '```javascript\n// 代码块\nconsole.log("Hello World");\n```') + codeSuffix;
        cursorOffset = selectedText ? newText.length - codeSuffix.length : codePrefix.length + 14;
        break;
      case 'divider':
        // 分割线需要前后换行
        const dividerPrefix = '\n'
        const dividerSuffix = '\n'
        newText = dividerPrefix + '---' + dividerSuffix;
        cursorOffset = newText.length;
        break;
      case 'link':
        newText = selectedText ? 
          `[${selectedText}](https://example.com)` : 
          '[链接文本](https://example.com)';
        cursorOffset = selectedText ? newText.length - 1 : 5;
        break;
      case 'paywall':
        // 付费墙需要前后换行
        const paywallPrefix = '\n' ;
        const paywallSuffix = '\n' ;
        newText = paywallPrefix + '[付费内容开始]\n\n这里是付费内容...\n\n[付费内容结束]' + paywallSuffix;
        cursorOffset = paywallPrefix.length + 17;
        break;
      
      
      case 'h1':
        // 标题需要在新行开始
        const h1Prefix = needsNewlineBefore() ? '\n' : '';
        const h1Suffix = needsNewlineAfter() ? '\n' : '';
        newText = h1Prefix + (selectedText ? `# ${selectedText}` : '# 一级标题') + h1Suffix;
        cursorOffset = selectedText ? newText.length - h1Suffix.length : h1Prefix.length + 6;
        break;
      case 'h2':
        // 标题需要在新行开始
        const h2Prefix = needsNewlineBefore() ? '\n' : '';
        const h2Suffix = needsNewlineAfter() ? '\n' : '';
        newText = h2Prefix + (selectedText ? `## ${selectedText}` : '## 二级标题') + h2Suffix;
        cursorOffset = selectedText ? newText.length - h2Suffix.length : h2Prefix.length + 7;
        break;
      case 'h3':
        // 标题需要在新行开始
        const h3Prefix = needsNewlineBefore() ? '\n' : '';
        const h3Suffix = needsNewlineAfter() ? '\n' : '';
        newText = h3Prefix + (selectedText ? `### ${selectedText}` : '### 三级标题') + h3Suffix;
        cursorOffset = selectedText ? newText.length - h3Suffix.length : h3Prefix.length + 8;
        break;
      case 'ul':
        // 列表需要在新行开始
        const ulPrefix = needsNewlineBefore() ? '\n' : '';
        const ulSuffix = needsNewlineAfter() ? '\n' : '';
        
        if (selectedText.includes('\n')) {
          newText = ulPrefix + selectedText.split('\n').map(line => line.trim() ? `- ${line.trim()}` : '').join('\n') + ulSuffix;
        } else {
          newText = ulPrefix + (selectedText ? `- ${selectedText}` : '- 列表项') + ulSuffix;
        }
        cursorOffset = newText.length - ulSuffix.length;
        break;
      case 'ol':
        // 有序列表需要在新行开始
        const olPrefix = needsNewlineBefore() ? '\n' : '';
        const olSuffix = needsNewlineAfter() ? '\n' : '';
        
        if (selectedText.includes('\n')) {
          const lines = selectedText.split('\n').filter(line => line.trim());
          newText = olPrefix + lines.map((line, index) => `${index + 1}. ${line.trim()}`).join('\n') + olSuffix;
        } else {
          newText = olPrefix + (selectedText ? `1. ${selectedText}` : '1. 列表项') + olSuffix;
        }
        cursorOffset = newText.length - olSuffix.length;
        break;
      case 'table':
        // 表格需要前后换行
        const tablePrefix = needsNewlineBefore() ? '\n' : '';
        const tableSuffix = needsNewlineAfter() ? '\n' : '';
        newText = tablePrefix + '| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 内容1 | 内容2 | 内容3 |\n| 内容4 | 内容5 | 内容6 |' + tableSuffix;
        cursorOffset = tablePrefix.length + 7;
        break;
      case 'checkbox':
        // 任务列表需要在新行开始
        const checkboxPrefix = needsNewlineBefore() ? '\n' : '';
        const checkboxSuffix = needsNewlineAfter() ? '\n' : '';
        
        if (selectedText.includes('\n')) {
          newText = checkboxPrefix + selectedText.split('\n').map(line => line.trim() ? `- [ ] ${line.trim()}` : '').join('\n') + checkboxSuffix;
        } else {
          newText = checkboxPrefix + (selectedText ? `- [ ] ${selectedText}` : '- [ ] 待办事项') + checkboxSuffix;
        }
        cursorOffset = newText.length - checkboxSuffix.length;
        break;
      case 'strikethrough':
        newText = selectedText ? `~~${selectedText}~~` : '~~删除线文本~~';
        cursorOffset = selectedText ? newText.length : 2;
        break;
      default:
        return;
    }
    
    const finalContent = beforeText + newText + afterText;
    setEditorState(prev => ({ ...prev, content: finalContent }));
    
    // 设置光标位置
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        const newCursorPos = start + cursorOffset;
        editorRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // 处理键盘输入增强
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const { key, ctrlKey, metaKey, shiftKey } = e;
    const isCmd = ctrlKey || metaKey;
    
    // 自动列表
    if (key === 'Enter') {
      const start = editorRef.current?.selectionStart || 0;
      const beforeCursor = editorState.content.substring(0, start);
      const currentLine = beforeCursor.split('\n').pop() || '';
      
      // 检查是否在列表中
      const listMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s/);
      if (listMatch) {
        e.preventDefault();
        const indent = listMatch[1];
        const marker = listMatch[2];
        
        // 如果当前行只有列表标记，删除它
        if (currentLine.trim() === marker) {
          const newContent = editorState.content.substring(0, start - currentLine.length) + 
                           editorState.content.substring(start);
          setEditorState(prev => ({ ...prev, content: newContent }));
          setTimeout(() => {
            if (editorRef.current) {
              editorRef.current.setSelectionRange(start - currentLine.length, start - currentLine.length);
            }
          }, 0);
        } else {
          // 继续列表
          const nextMarker = marker.match(/\d+/) ? 
            `${parseInt(marker) + 1}.` : marker;
          insertAtCursor(`\n${indent}${nextMarker} `);
        }
        return;
      }
      
      // 检查是否在引用中
      if (currentLine.startsWith('> ')) {
        e.preventDefault();
        insertAtCursor('\n> ');
        return;
      }
    }
    
    // Tab 键处理缩进
    if (key === 'Tab') {
      e.preventDefault();
      if (shiftKey) {
        // Shift+Tab 减少缩进
        const start = editorRef.current?.selectionStart || 0;
        const end = editorRef.current?.selectionEnd || 0;
        const beforeSelection = editorState.content.substring(0, start);
        const selection = editorState.content.substring(start, end);
        const afterSelection = editorState.content.substring(end);
        
        const lines = selection.split('\n');
        const unindentedLines = lines.map(line => 
          line.startsWith('  ') ? line.substring(2) : line
        );
        
        const newContent = beforeSelection + unindentedLines.join('\n') + afterSelection;
        setEditorState(prev => ({ ...prev, content: newContent }));
      } else {
        // Tab 增加缩进
        const start = editorRef.current?.selectionStart || 0;
        const end = editorRef.current?.selectionEnd || 0;
        
        if (start === end) {
          // 单纯插入制表符
          insertAtCursor('  ');
        } else {
          // 多行缩进
          const beforeSelection = editorState.content.substring(0, start);
          const selection = editorState.content.substring(start, end);
          const afterSelection = editorState.content.substring(end);
          
          const lines = selection.split('\n');
          const indentedLines = lines.map(line => '  ' + line);
          
          const newContent = beforeSelection + indentedLines.join('\n') + afterSelection;
          setEditorState(prev => ({ ...prev, content: newContent }));
        }
      }
      return;
    }
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
      } else {
        handleFileUpload(file, 'file');
      }
    });
  };

  // 发布文章
  const publishPost = async () => {
    try {
      // 检查内容是否为空
      if (!editorState.content.trim()) {
        alert('请输入文章内容');
        return;
      }

      // 发布前先保存草稿
      if (editorState.content.trim()) {
        await saveToDrafts();
      }
      
      // 从内容中提取标题（第一行）
      const lines = editorState.content.trim().split('\n');
      const title = lines[0].replace(/^#\s*/, '') || '无标题';
      
      // 准备发布数据
      const postData = {
        title,
        content: editorState.content,
        excerpt: editorState.content.substring(0, 150) + '...',
        category: 'general',
        tags: [],
        visibility: (editorState.isPaid ? 'subscribers' : 'public') as 'public' | 'subscribers' | 'private',
        status: 'published' as 'draft' | 'published',
        featuredImage: editorState.coverImage || undefined,
      };
      
      // 调用API发布文章
      const response = await postApi.createPost(postData);
      
      if (response.success) {
        // 发布成功
        alert('文章发布成功！');
        
        // 清除当前编辑的内容
        setEditorState({
          content: '',
          coverImage: '',
          status: 'draft',
          isPaid: false,
          price: 0,
          lastSaved: null
        });
        
        router.push('/dashboard');
      } else {
        // 发布失败
        console.error('发布失败:', response);
        
        // 处理验证错误
        if (response.errors && Array.isArray(response.errors)) {
          const errorMessages = response.errors.map((err: any) => err.msg || err.message).join('\n');
          alert(`发布失败:\n${errorMessages}`);
        } else {
          alert(`发布失败: ${response.error || response.message || '未知错误'}`);
        }
      }
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败，请检查网络连接');
    }
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
                onClick={async () => {
                  // 退出前自动保存草稿
                  if (editorState.content.trim()) {
                    await saveToDrafts();
                  }
                  router.push('/dashboard');
                }}
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
                onClick={() => saveToDrafts()}
                className={`p-2 rounded-md transition-colors hidden sm:block ${
                  isAutoSaving || !editorState.content.trim() 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                title="立即保存草稿 (Ctrl+S)"
                disabled={isAutoSaving || !editorState.content.trim()}
              >
                <Save className={`w-5 h-5 ${isAutoSaving ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={async () => {
                  // 打开草稿箱前先保存当前内容
                  if (editorState.content.trim()) {
                    await saveToDrafts();
                  }
                  setShowDrafts(true);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors hidden sm:block"
                title="保存并查看草稿"
              >
                <FolderOpen className="w-5 h-5" />
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
              {/* 文本格式 */}
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
                onClick={() => formatText('strikethrough')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="删除线"
              >
                <Underline className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => formatText('code')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="行内代码"
              >
                <Code className="w-4 h-4" />
              </button>
              
              <div className="w-px h-4 sm:h-6 bg-gray-300"></div>
              
              {/* 标题 */}
              <button
                onClick={() => formatText('h1')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="一级标题"
              >
                <Heading1 className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => formatText('h2')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="二级标题"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => formatText('h3')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="三级标题"
              >
                <Heading3 className="w-4 h-4" />
              </button>
              
              <div className="w-px h-4 sm:h-6 bg-gray-300"></div>
              
              {/* 列表和表格 */}
              <button
                onClick={() => formatText('ul')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="无序列表"
              >
                <List className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => formatText('ol')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="有序列表"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => formatText('checkbox')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="任务列表"
              >
                <CheckSquare className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => formatText('table')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="插入表格"
              >
                <Table className="w-4 h-4" />
              </button>
              
              <div className="w-px h-4 sm:h-6 bg-gray-300"></div>
              
              <button
                onClick={() => formatText('quote')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="引用 (Ctrl+Shift+Q)"
              >
                <Quote className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => formatText('link')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="插入链接"
              >
                <Link className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => formatText('codeblock')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title="代码块 (Ctrl+Shift+C)"
              >
                <SquareCode className="w-4 h-4" />
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
                onClick={() => formatText('paywall')}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors hidden sm:inline-flex"
                title="付费墙"
              >
                <DollarSign className="w-4 h-4" />
              </button>
              


              <div className="flex-1"></div>
              
              {/* 右侧工具 */}
              <div className="flex items-center space-x-2 ml-auto">
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
        <div className={`${viewMode === 'split' ? 'grid grid-cols-2 gap-6' : 'flex justify-center'}`}>
          {/* 编辑器部分 */}
          {(viewMode === 'edit' || viewMode === 'split') && (
            <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${viewMode === 'edit' ? 'max-w-4xl w-full' : ''}`}>
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
                      <p className="text-sm text-indigo-600">支持图片和文档</p>
                    </div>
                  </div>
                )}
                
                {/* 统一的内容编辑器 */}
                <div className="max-w-2xl mx-auto">
                  <textarea
                    ref={editorRef}
                    placeholder={`# 文章标题

在这里开始写作...

💡 提示：
- 第一行会自动作为标题显示
- 支持完整的 Markdown 语法，如# h1 ## h2
- 可以直接拖拽文件上传
- 工具栏可以插入付费墙等功能`}
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
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* 预览部分 */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full max-w-4xl w-full">
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
      


      {/* 草稿箱模态框 */}
      {showDrafts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">草稿箱</h3>
                <button
                  onClick={() => setShowDrafts(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-80">
              {drafts.length === 0 ? (
                <p className="text-gray-500 text-center">暂无草稿</p>
              ) : (
                <div className="space-y-3">
                  {drafts.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 group"
                    >
                      <div
                        className="cursor-pointer"
                        onClick={async () => {
                          // 切换前自动保存当前内容
                          if (editorState.content.trim()) {
                            await saveToDrafts();
                          }
                          setEditorState(prev => ({
                            ...prev,
                            content: entry.content,
                            coverImage: entry.coverImage
                          }));
                          setShowDrafts(false);
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{entry.title}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              {entry.timestamp.toLocaleString()}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                showDeleteConfirmation(entry);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                              title="删除草稿"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{entry.content}</p>
                      </div>
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

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
          onClick={cancelDeleteDraft}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full mx-4 transform transition-all duration-300 ease-out scale-100 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">删除草稿</h3>
                  <p className="text-sm text-gray-500">此操作无法撤销</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  确定要删除草稿 "<span className="font-medium">{draftToDelete?.title}</span>" 吗？
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 truncate">
                    {draftToDelete?.content}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    创建时间: {draftToDelete?.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDeleteDraft}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmDeleteDraft}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  确认删除
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