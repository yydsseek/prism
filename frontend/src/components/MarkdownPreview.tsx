'use client';

import { DollarSign, BarChart3, TrendingUp } from 'lucide-react';

interface MarkdownPreviewProps {
  content: string;
  coverImage?: string;
}

export default function MarkdownPreview({ content, coverImage }: MarkdownPreviewProps) {
  // 解析markdown内容
  const parseContent = (text: string) => {
    if (!text) return [];
    
    const lines = text.split('\n');
    const elements = [];
    let currentElement = '';
    let elementType = 'paragraph';
    let inCodeBlock = false;
    let codeLanguage = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 代码块处理
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          // 开始代码块
          if (currentElement.trim()) {
            elements.push({ type: elementType, content: currentElement.trim() });
            currentElement = '';
          }
          inCodeBlock = true;
          codeLanguage = line.substring(3).trim();
          elementType = 'codeblock';
        } else {
          // 结束代码块
          elements.push({ 
            type: 'codeblock', 
            content: currentElement.trim(),
            language: codeLanguage
          });
          currentElement = '';
          inCodeBlock = false;
          elementType = 'paragraph';
        }
        continue;
      }
      
      if (inCodeBlock) {
        currentElement += line + '\n';
        continue;
      }
      
      // 特殊功能块处理
      if (line.includes('[付费内容开始]')) {
        if (currentElement.trim()) {
          elements.push({ type: elementType, content: currentElement.trim() });
          currentElement = '';
        }
        elementType = 'paywall';
        continue;
      }
      
      if (line.includes('[付费内容结束]')) {
        elements.push({ type: 'paywall', content: currentElement.trim() });
        currentElement = '';
        elementType = 'paragraph';
        continue;
      }
      
      if (line.includes('[投票]')) {
        if (currentElement.trim()) {
          elements.push({ type: elementType, content: currentElement.trim() });
          currentElement = '';
        }
        elementType = 'poll';
        continue;
      }
      
      if (line.includes('[/投票]')) {
        elements.push({ type: 'poll', content: currentElement.trim() });
        currentElement = '';
        elementType = 'paragraph';
        continue;
      }
      
      if (line.includes('[金融图表:')) {
        const symbol = line.match(/\[金融图表:\s*([^\]]+)\]/)?.[1] || 'AAPL';
        elements.push({ type: 'chart', content: symbol });
        continue;
      }
      
      // 分割线
      if (line.trim() === '---') {
        if (currentElement.trim()) {
          elements.push({ type: elementType, content: currentElement.trim() });
          currentElement = '';
        }
        elements.push({ type: 'divider', content: '' });
        continue;
      }
      
      // 标题处理
      if (line.startsWith('# ')) {
        if (currentElement.trim()) {
          elements.push({ type: elementType, content: currentElement.trim() });
          currentElement = '';
        }
        elements.push({ type: 'h1', content: line.substring(2) });
        continue;
      }
      
      if (line.startsWith('## ')) {
        if (currentElement.trim()) {
          elements.push({ type: elementType, content: currentElement.trim() });
          currentElement = '';
        }
        elements.push({ type: 'h2', content: line.substring(3) });
        continue;
      }
      
      if (line.startsWith('### ')) {
        if (currentElement.trim()) {
          elements.push({ type: elementType, content: currentElement.trim() });
          currentElement = '';
        }
        elements.push({ type: 'h3', content: line.substring(4) });
        continue;
      }
      
      // 引用处理
      if (line.startsWith('> ')) {
        if (currentElement.trim() && elementType !== 'quote') {
          elements.push({ type: elementType, content: currentElement.trim() });
          currentElement = '';
        }
        elementType = 'quote';
        currentElement += line.substring(2) + '\n';
        continue;
      }
      
      // 图片处理
      const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imageMatch) {
        if (currentElement.trim()) {
          elements.push({ type: elementType, content: currentElement.trim() });
          currentElement = '';
        }
        elements.push({ 
          type: 'image', 
          content: imageMatch[2],
          alt: imageMatch[1]
        });
        continue;
      }
      
      // 普通段落
      if (line.trim() === '') {
        if (currentElement.trim()) {
          elements.push({ type: elementType, content: currentElement.trim() });
          currentElement = '';
          elementType = 'paragraph';
        }
        continue;
      }
      
      currentElement += line + '\n';
    }
    
    // 处理最后一个元素
    if (currentElement.trim()) {
      elements.push({ type: elementType, content: currentElement.trim() });
    }
    
    return elements;
  };

  // 渲染文本格式
  const renderFormattedText = (text: string) => {
    // 粗体
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // 斜体
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // 行内代码
    text = text.replace(/`(.*?)`/g, '<code>$1</code>');
    // 链接
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    return text;
  };

  const elements = parseContent(content);

  return (
    <div className="max-w-4xl mx-auto">
      {/* 封面图片 */}
      {coverImage && (
        <div className="mb-8">
          <img
            src={coverImage}
            alt="封面"
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
      )}
      
      {/* 内容 */}
      <div className="editor-content">
        {elements.map((element, index) => {
          switch (element.type) {
            case 'h1':
              return (
                <h1 key={index} className="text-3xl font-bold text-gray-900 mt-8 mb-4">
                  {element.content}
                </h1>
              );
              
            case 'h2':
              return (
                <h2 key={index} className="text-2xl font-bold text-gray-900 mt-6 mb-3">
                  {element.content}
                </h2>
              );
              
            case 'h3':
              return (
                <h3 key={index} className="text-xl font-bold text-gray-900 mt-4 mb-2">
                  {element.content}
                </h3>
              );
              
            case 'quote':
              return (
                <blockquote key={index} className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4">
                  <div dangerouslySetInnerHTML={{ __html: renderFormattedText(element.content) }} />
                </blockquote>
              );
              
            case 'codeblock':
              return (
                <pre key={index} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
                  <code>{element.content}</code>
                </pre>
              );
              
            case 'image':
              return (
                <div key={index} className="my-6">
                  <img
                    src={element.content}
                    alt={element.alt || ''}
                    className="max-w-full h-auto rounded-lg mx-auto"
                  />
                </div>
              );
              
            case 'divider':
              return <hr key={index} className="border-gray-300 my-8" />;
              
            case 'paywall':
              return (
                <div key={index} className="paywall">
                  <div className="paywall-header">
                    <DollarSign className="paywall-icon" />
                    <h3 className="paywall-title">付费内容</h3>
                  </div>
                  <div className="paywall-content">
                    <div dangerouslySetInnerHTML={{ __html: renderFormattedText(element.content) }} />
                  </div>
                  <button className="paywall-button">
                    解锁阅读 ¥9.9
                  </button>
                </div>
              );
              
            case 'poll':
              const pollOptions = element.content.split('\n').filter(line => line.trim());
              return (
                <div key={index} className="poll-container">
                  <h3 className="poll-title">投票</h3>
                  <div className="space-y-2">
                    {pollOptions.map((option, optionIndex) => (
                      <div key={optionIndex} className="poll-option">
                        <span className="poll-option-text">{option}</span>
                        <span className="poll-option-votes">
                          {Math.floor(Math.random() * 100)} 票
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-sm text-blue-600">
                    总计 {Math.floor(Math.random() * 500)} 人参与投票
                  </div>
                </div>
              );
              
            case 'chart':
              return (
                <div key={index} className="chart-container">
                  <div className="chart-title">
                    <TrendingUp className="inline w-5 h-5 mr-2" />
                    {element.content} 股价走势
                  </div>
                  <div className="chart-placeholder">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-green-400" />
                    <p>图表加载中...</p>
                    <p className="text-sm mt-2">实时股价数据将在此显示</p>
                  </div>
                </div>
              );
              
            default:
              return (
                <p key={index} className="text-gray-800 mb-4">
                  <span dangerouslySetInnerHTML={{ __html: renderFormattedText(element.content) }} />
                </p>
              );
          }
        })}
      </div>
    </div>
  );
} 