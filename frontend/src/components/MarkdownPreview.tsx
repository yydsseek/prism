'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { DollarSign } from 'lucide-react';
import 'highlight.js/styles/github.css'; // 代码高亮样式

interface MarkdownPreviewProps {
  content: string;
  coverImage?: string;
}

export default function MarkdownPreview({ content, coverImage }: MarkdownPreviewProps) {
  // 处理特殊功能块的预处理
  const preprocessContent = (text: string) => {
    if (!text) return '';
    
    let processed = text;
    
    // 自动将第一行转换为H1标题（如果不是已有的标题格式）
    const lines = processed.split('\n');
    if (lines.length > 0 && lines[0].trim()) {
      const firstLine = lines[0].trim();
      // 检查第一行是否已经是标题格式
      if (!firstLine.startsWith('#')) {
        // 如果不是标题格式，自动添加H1标记
        lines[0] = `# ${firstLine}`;
        processed = lines.join('\n');
      }
    }
    
    // 处理付费墙
    processed = processed.replace(
      /\[付费内容开始\]([\s\S]*?)\[付费内容结束\]/g,
      '<div class="paywall-block">$1</div>'
    );

    
    // 处理投票
    processed = processed.replace(
      /\[投票\]([\s\S]*?)\[\/投票\]/g,
      '<div class="poll-block">$1</div>'
    );
    
    return processed;
  };

  // 自定义组件渲染器
  const components = {
    // 自定义标题渲染
    h1: ({ children, ...props }: any) => (
      <h1 className="text-4xl font-bold text-gray-900 mt-8 mb-6 first:mt-0" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-3xl font-bold text-gray-900 mt-8 mb-4" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-2xl font-bold text-gray-900 mt-6 mb-3" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4 className="text-xl font-bold text-gray-900 mt-4 mb-2" {...props}>
        {children}
      </h4>
    ),
    h5: ({ children, ...props }: any) => (
      <h5 className="text-lg font-bold text-gray-900 mt-4 mb-2" {...props}>
        {children}
      </h5>
    ),
    h6: ({ children, ...props }: any) => (
      <h6 className="text-base font-bold text-gray-900 mt-4 mb-2" {...props}>
        {children}
      </h6>
    ),
    
    // 段落
    p: ({ children, ...props }: any) => (
      <p className="text-gray-800 mb-4 leading-relaxed" {...props}>
        {children}
      </p>
    ),
    
    // 引用
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-indigo-500 pl-6 py-2 my-6 bg-gray-50 italic text-gray-700" {...props}>
        {children}
      </blockquote>
    ),
    
    // 代码块
    pre: ({ children, ...props }: any) => (
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6 text-sm" {...props}>
        {children}
      </pre>
    ),
    
    // 行内代码
    code: ({ children, className, ...props }: any) => {
      // 如果是代码块内的代码，保持原样
      if (className) {
        return <code className={className} {...props}>{children}</code>;
      }
      // 行内代码的样式
      return (
        <code className="bg-gray-100 text-red-600 px-2 py-1 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },
    
    // 强调和粗体
    strong: ({ children, ...props }: any) => (
      <strong className="font-semibold text-gray-900" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }: any) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),
    
    // 删除线
    del: ({ children, ...props }: any) => (
      <del className="line-through text-gray-500" {...props}>
        {children}
      </del>
    ),
    
    // 列表
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-800" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-800" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => {
      // 检查是否是任务列表项
      const content = children?.toString() || '';
      const isTaskItem = content.match(/^\[ \]|^\[x\]/);
      
      if (isTaskItem) {
        const isChecked = content.startsWith('[x]');
        const text = content.replace(/^\[ \]|^\[x\]\s*/, '');
        return (
          <li className="mb-1 flex items-center" {...props}>
            <input 
              type="checkbox" 
              checked={isChecked}
              className="mr-2"
              onChange={() => {}} // 只读展示
            />
            <span className={isChecked ? 'line-through text-gray-500' : ''}>{text}</span>
          </li>
        );
      }
      
      return (
        <li className="mb-1" {...props}>
          {children}
        </li>
      );
    },
    
    // 链接
    a: ({ children, href, ...props }: any) => (
      <a 
        href={href} 
        className="text-indigo-600 hover:text-indigo-800 underline transition-colors"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
    
    // 图片
    img: ({ src, alt, ...props }: any) => (
      <div className="my-6">
        <img
          src={src}
          alt={alt || ''}
          className="max-w-full h-auto rounded-lg mx-auto shadow-sm"
          {...props}
        />
        {alt && (
          <p className="text-center text-sm text-gray-500 mt-2 italic">{alt}</p>
        )}
      </div>
    ),
    
    // 表格
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto my-6">
        <table className="min-w-full border-collapse border border-gray-300" {...props}>
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }: any) => (
      <th className="border border-gray-300 bg-gray-50 px-4 py-2 text-left font-semibold text-gray-900" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="border border-gray-300 px-4 py-2 text-gray-800" {...props}>
        {children}
      </td>
    ),
    
    // 分割线
    hr: ({ ...props }) => (
      <hr className="border-gray-300 my-8" {...props} />
    ),
    
    // 自定义div处理特殊功能块
    div: ({ children, className, ...props }: any) => {
      if (className?.includes('paywall-block')) {
        return (
          <div className="paywall my-6">
            <div className="paywall-header">
              <DollarSign className="paywall-icon" />
              <h3 className="paywall-title">付费内容</h3>
            </div>
            <div className="paywall-content">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeHighlight]}
                components={components}
              >
                {children}
              </ReactMarkdown>
            </div>
            <button className="paywall-button">
              解锁阅读 ¥9.9
            </button>
          </div>
        );
      }
      
      if (className?.includes('poll-block')) {
        const pollOptions = children?.toString().split('\n').filter((line: string) => line.trim()) || [];
        return (
          <div className="poll-container my-6">
            <h3 className="poll-title">投票</h3>
            <div className="space-y-2">
              {pollOptions.map((option: string, index: number) => (
                <div key={index} className="poll-option">
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
      }
      
      return <div className={className} {...props}>{children}</div>;
    }
  };

  const processedContent = preprocessContent(content);

  return (
    <div className="max-w-4xl mx-auto">
      {/* 封面图片 */}
      {coverImage && (
        <div className="mb-8">
          <img
            src={coverImage}
            alt="封面"
            className="w-full h-64 object-cover rounded-lg shadow-sm"
          />
        </div>
      )}
      
      {/* Markdown内容 */}
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeHighlight, rehypeRaw]}
          components={components}
          className="markdown-content"
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
} 