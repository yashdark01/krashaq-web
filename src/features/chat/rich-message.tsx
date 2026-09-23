'use client';

import { Children, isValidElement, type ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import type { ChatEvidence } from '@/lib/api/platform.api';

function CitationText({
  children,
  evidence,
  onCitation,
}: {
  children: ReactNode;
  evidence: ChatEvidence[];
  onCitation: (evidence: ChatEvidence, index: number) => void;
}) {
  function render(node: ReactNode): ReactNode {
    if (typeof node === 'string') {
      return node.split(/(\[\d+\])/gu).map((part, index) => {
        const match = /^\[(\d+)\]$/u.exec(part);
        const citationIndex = match ? Number(match[1]) : 0;
        const source =
          citationIndex > 0 ? evidence[citationIndex - 1] : undefined;
        return source ? (
          <button
            type="button"
            className="chat-citation"
            aria-label={`Open source ${citationIndex}: ${source.sourceName}`}
            onClick={() => onCitation(source, citationIndex)}
            key={`${part}-${index}`}
          >
            {citationIndex}
          </button>
        ) : (
          part
        );
      });
    }
    if (Array.isArray(node)) return node.map(render);
    if (isValidElement<{ children?: ReactNode }>(node))
      return {
        ...node,
        props: { ...node.props, children: render(node.props.children) },
      };
    return node;
  }
  return <>{Children.map(children, render)}</>;
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="chat-code-block">
      <div>
        <span>{language || 'text'}</span>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}{' '}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneLight}
        customStyle={{ margin: 0, background: 'transparent', padding: '1rem' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export function RichMessage({
  content,
  evidence,
  onCitation,
}: {
  content: string;
  evidence: ChatEvidence[];
  onCitation: (evidence: ChatEvidence, index: number) => void;
}) {
  const wrap = (children: ReactNode) => (
    <CitationText evidence={evidence} onCitation={onCitation}>
      {children}
    </CitationText>
  );
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        p: ({ children }) => <p>{wrap(children)}</p>,
        li: ({ children }) => <li>{wrap(children)}</li>,
        blockquote: ({ children }) => <blockquote>{wrap(children)}</blockquote>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="chat-table-wrap">
            <table>{children}</table>
          </div>
        ),
        code: ({ className, children }) => {
          const language =
            /language-([\w-]+)/u.exec(className ?? '')?.[1] ?? '';
          const code = String(children).replace(/\n$/u, '');
          return language || code.includes('\n') ? (
            <CodeBlock language={language} code={code} />
          ) : (
            <code>{children}</code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
