
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import { Bot, User, AlertCircle, ShieldCheck, ThumbsUp, ThumbsDown, ExternalLink, Sparkles, Link as LinkIcon, BookOpen, Image as ImageIcon, Globe, CheckCircle2 } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  onFeedback?: (id: string, type: 'positive' | 'negative') => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onFeedback }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3 group`}>
        
        {/* Avatar with Glow Effect */}
        <div className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center shadow-md
          ${isUser 
            ? 'bg-gradient-to-br from-slt-blue to-slt-mid shadow-slt-blue/20' 
            : isError 
              ? 'bg-red-500 shadow-red-500/10' 
              : 'bg-slt-dark dark:bg-slate-800 border border-slate-700/50'}`}>
          {isUser ? <User className="text-white w-4 h-4" /> : isError ? <AlertCircle className="text-white w-4 h-4" /> : <Sparkles className="text-slt-accent w-4 h-4" />}
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          <div className={`px-5 py-4 rounded-2xl shadow-sm text-sm leading-relaxed relative border backdrop-blur-sm
              ${isUser 
                ? 'bg-slt-blue text-white rounded-tr-none border-white/10' 
                : isError 
                  ? 'bg-red-50/90 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300 rounded-tl-none' 
                  : 'bg-white/90 dark:bg-slate-800/90 border-slate-100 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 rounded-tl-none hover:border-slt-accent/30'
              }`}>
            
            {!isUser && !isError && (
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-slt-accent rounded-full animate-pulse"></div>
                  <span className="text-[9px] font-black text-slt-blue dark:text-slt-accent uppercase tracking-widest">MobiCare Verified</span>
                </div>
                {message.ticketId && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md border border-green-500/20">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Ref: {message.ticketId}</span>
                  </div>
                )}
              </div>
            )}

            {/* Attached Image Rendering */}
            {message.image && (
              <div className="mb-4 rounded-xl overflow-hidden border-2 border-white dark:border-slate-700 shadow-md max-w-full group/img relative">
                <img src={message.image} alt="Visual Guide" className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-4">
                   <p className="text-white text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                     <ImageIcon className="w-3 h-3" /> SLT-MOBITEL MEDIA
                   </p>
                </div>
              </div>
            )}
            
            <div className={`prose prose-slate dark:prose-invert max-w-none ${isUser ? 'prose-invert' : 'prose-xs md:prose-sm'}`}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({node, ...props}) => (
                    <div className="overflow-x-auto my-4 -mx-2">
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 bg-slate-50/30 dark:bg-slate-900/40 rounded-xl border border-slate-100/50 dark:border-slate-700/50" {...props} />
                    </div>
                  ),
                  th: ({node, ...props}) => <th className="px-4 py-3 text-left text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100/50 dark:bg-slate-800/80" {...props} />,
                  td: ({node, ...props}) => <td className="px-4 py-3 text-xs font-semibold border-t border-slate-100/50 dark:border-slate-700/50" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-black text-slt-blue dark:text-slt-accent mt-4 mb-3 first:mt-0 tracking-tight" {...props} />,
                  p: ({node, ...props}) => <p className="mb-3 last:mb-0 font-medium leading-relaxed opacity-95" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-3 space-y-1.5" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-black text-slt-blue dark:text-slt-accent" {...props} />,
                  code: ({node, ...props}) => <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 rounded text-slt-blue dark:text-slt-accent font-bold text-[11px]" {...props} />
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>

            {/* Suggested Quick Fixes Section */}
            {message.quickFixes && message.quickFixes.length > 0 && (
              <div className="mt-6 p-4 bg-slt-blue/5 dark:bg-slt-blue/10 rounded-xl border border-slt-blue/10 dark:border-slt-blue/20">
                <div className="flex items-center gap-2 mb-3">
                   <ShieldCheck className="w-3.5 h-3.5 text-slt-blue dark:text-slt-accent" />
                   <span className="text-[9px] font-black text-slt-blue dark:text-slt-accent uppercase tracking-widest">Suggested Quick Fixes</span>
                </div>
                <div className="space-y-2">
                  {message.quickFixes.map((fix, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="mt-1 w-1 h-1 bg-slt-blue dark:bg-slt-accent rounded-full flex-shrink-0"></div>
                      <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{fix}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced References Section */}
            {message.groundingLinks && message.groundingLinks.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-2 mb-3">
                   <BookOpen className="w-3.5 h-3.5 text-slt-blue" />
                   <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Source Intelligence</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {message.groundingLinks.map((link, i) => (
                    <a key={i} href={link.uri} target="_blank" rel="noreferrer" 
                      className="flex items-center justify-between group/link px-3 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 hover:border-slt-blue dark:hover:border-slt-accent border border-slate-100 dark:border-slate-700/50 rounded-xl transition-all shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg flex items-center justify-center text-[10px] font-black text-slt-blue group-hover/link:bg-slt-blue group-hover/link:text-white transition-colors">
                          {i + 1}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{link.title}</span>
                        </div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-300 group-hover/link:text-slt-accent transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Action Footer for Feedback */}
          {!isUser && !isError && (
            <div className="flex items-center gap-3 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => onFeedback?.(message.id, 'positive')} className={`p-1.5 rounded-md transition-all ${message.feedback === 'positive' ? 'bg-green-500/20 text-green-500' : 'text-slate-300 hover:text-green-500 hover:bg-green-500/10'}`}><ThumbsUp className="w-3.5 h-3.5" /></button>
               <button onClick={() => onFeedback?.(message.id, 'negative')} className={`p-1.5 rounded-md transition-all ${message.feedback === 'negative' ? 'bg-red-500/20 text-red-500' : 'text-slate-300 hover:text-red-500 hover:bg-red-500/10'}`}><ThumbsDown className="w-3.5 h-3.5" /></button>
               <div className="h-3 w-px bg-slate-200 dark:bg-slate-800"></div>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(message.timestamp)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
