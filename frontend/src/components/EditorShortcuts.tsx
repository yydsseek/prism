'use client';

import { useState } from 'react';
import { Keyboard, X } from 'lucide-react';

export default function EditorShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { key: 'Ctrl + B', desc: '粗体' },
    { key: 'Ctrl + I', desc: '斜体' },
    { key: 'Ctrl + K', desc: '插入链接' },
    { key: 'Ctrl + Shift + C', desc: '代码块' },
    { key: 'Ctrl + Shift + Q', desc: '引用' },
    { key: 'Ctrl + Shift + L', desc: '分割线' },
    { key: 'Ctrl + S', desc: '手动保存' },
    { key: 'Ctrl + Shift + P', desc: '预览模式' },
    { key: 'Ctrl + /', desc: '显示快捷键' }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors z-50"
        title="快捷键帮助"
      >
        <Keyboard className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">快捷键</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{shortcut.desc}</span>
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
              {shortcut.key}
            </kbd>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
        <p>💡 文章每30秒自动保存</p>
        <p>🔄 支持拖拽上传文件</p>
      </div>
    </div>
  );
} 