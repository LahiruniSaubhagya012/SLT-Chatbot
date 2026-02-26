
import React, { useState, useEffect, useRef } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { AuthGate } from './components/AuthGate';
import { ChatMessage } from './components/ChatMessage';
import { ShieldCheck, Wifi, Phone, Globe, HelpCircle, ArrowUpRight, Moon, Sun, LogOut, User, MessageSquare, Calculator, ShoppingBag, Wrench, Mic, Sparkles, Loader2 } from 'lucide-react';
import { AgentType, Message } from './types';
import { saveFeedback } from './services/firestoreService';

const ADMIN_EMAILS = ['admin@slt.lk', 'manager@slt.lk', 'test@slt.lk'];

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('slt_mobicare_theme');
    if (!saved) return window.matchMedia('(prefers-color-scheme: dark)').matches;
    return saved === 'dark';
  });

  const [user, setUser] = useState<{ email: string; isAdmin: boolean } | null>(() => {
    const saved = localStorage.getItem('slt_mobicare_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { return null; }
    }
    return null;
  });

  const [language, setLanguage] = useState<'si' | 'en'>('si');
  const [agent, setAgent] = useState<AgentType>('main');
  const [voiceTrigger, setVoiceTrigger] = useState(0);
  const [showBillCalc, setShowBillCalc] = useState(false);
  
  // Message state moved to App.tsx as requested
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('slt_mobicare_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) { return []; }
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scrolling logic
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages, isLoading]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('slt_mobicare_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('slt_mobicare_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('slt_mobicare_logs', JSON.stringify(messages));
  }, [messages]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogin = (email: string) => {
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
    const userData = { email, isAdmin };
    setUser(userData);
    localStorage.setItem('slt_mobicare_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('slt_mobicare_user');
    localStorage.removeItem('slt_mobicare_logs'); // Clear history on logout for privacy
  };

  if (!user) {
    return <AuthGate onLogin={handleLogin} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#000B25] text-slate-900 dark:text-slate-100 font-sans selection:bg-slt-light selection:text-slt-blue transition-colors">
      
      {/* Header */}
      <header className="bg-white/80 dark:bg-[#000B25]/80 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-200/60 dark:border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6">
          {/* Top Bar */}
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slt-blue rounded-xl flex items-center justify-center text-white shadow-md relative">
                <MessageSquare className="w-5 h-5" />
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-[#000B25]"></div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">Mobicare AI</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/5 text-[7px] font-black text-slate-500 dark:text-slate-400 rounded uppercase tracking-widest border border-slate-200 dark:border-white/10">System Active</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
               <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10 mr-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{user.email.split('@')[0]}</span>
               </div>

               <button 
                  onClick={toggleTheme}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
               >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
               </button>

               <button 
                  onClick={() => setLanguage(l => l === 'si' ? 'en' : 'si')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slt-blue hover:text-white transition-all border border-slate-200 dark:border-white/10"
               >
                  <Globe className="w-3.5 h-3.5" />
                  {language === 'si' ? 'EN' : 'සිංහල'}
               </button>

               <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                  title="Logout"
               >
                  <LogOut className="w-4 h-4" />
               </button>

               <button 
                  onClick={() => setVoiceTrigger(prev => prev + 1)}
                  className="flex items-center gap-2 px-4 py-2 bg-slt-blue text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-slt-mid transition-all active:scale-95 ml-1"
               >
                  <Mic className="w-3.5 h-3.5" />
                  Voice
               </button>
            </div>
          </div>

          {/* Sub Header / Agent Selection */}
          <div className="h-12 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setAgent('main')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${agent === 'main' ? 'bg-slt-blue text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                General
              </button>
              <button 
                onClick={() => setAgent('sales')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${agent === 'sales' ? 'bg-slt-blue text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Sales
              </button>
              <button 
                onClick={() => setAgent('existing')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${agent === 'existing' ? 'bg-slt-blue text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
              >
                <User className="w-3.5 h-3.5" />
                Service
              </button>
              <button 
                onClick={() => setAgent('support')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${agent === 'support' ? 'bg-slt-blue text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
              >
                <Wrench className="w-3.5 h-3.5" />
                Support
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowBillCalc(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 hover:bg-slt-blue hover:text-white transition-all"
              >
                <Calculator className="w-3.5 h-3.5" />
                Bill Calc
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Bill Calculator Modal */}
      {showBillCalc && (
        <div className="fixed inset-0 z-[100] bg-slt-dark/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white dark:bg-[#001543] rounded-[40px] shadow-2xl w-full max-w-md border border-white/10 p-10 relative overflow-hidden">
            <button onClick={() => setShowBillCalc(false)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all text-slate-400"><LogOut className="w-5 h-5" /></button>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-slt-blue/10 text-slt-blue rounded-2xl"><Calculator className="w-8 h-8" /></div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">Bill Estimator</h3>
                <p className="text-slate-500 text-sm font-medium">Calculate your monthly SLT commitment.</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Package</label>
                <select className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 font-bold">
                  <option>Fiber Unlimited 100</option>
                  <option>Fiber Family 50</option>
                  <option>Mobitel Unlimited 5G</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Add-ons (Data/VAS)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button className="px-4 py-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10 text-xs font-bold text-left hover:border-slt-blue transition-all">Social Media Pack</button>
                  <button className="px-4 py-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10 text-xs font-bold text-left hover:border-slt-blue transition-all">Gaming Add-on</button>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100 dark:border-white/10">
                <div className="flex justify-between items-end mb-6">
                  <span className="text-slate-500 font-bold">Estimated Total</span>
                  <span className="text-3xl font-black text-slt-blue dark:text-slt-accent tracking-tighter">Rs. 5,450.00</span>
                </div>
                <button className="w-full py-5 bg-slt-blue text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slt-blue/20">Apply This Plan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8 flex flex-col gap-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {user.isAdmin 
                ? (language === 'si' ? 'පාලන මධ්‍යස්ථානය' : 'Command Center') 
                : (language === 'si' ? 'AI සහාය මධ්‍යස්ථානය' : 'AI Support Hub')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
              {user.isAdmin 
                ? (language === 'si' ? 'සේවා බුද්ධිය කළමනාකරණය කරන්න සහ ප්‍රවණතා විශ්ලේෂණය කරන්න.' : 'Manage service intelligence, analyze trends, and tune knowledge grounding.') 
                : (language === 'si' ? 'SLTMOBITEL සේවා කළමනාකරණය සහ තාක්ෂණික රෝග විනිශ්චය සඳහා බුද්ධිමත් ද්වාරය.' : 'Intelligent gateway to SLTMOBITEL service management and technical diagnostics.')}
            </p>
        </div>
        
        {/* Chat Area Container */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[32px] shadow-[0_20px_80px_rgba(0,0,0,0.08)] dark:shadow-black border border-slate-200/60 dark:border-slate-800 overflow-hidden relative group h-[700px]">
          <ChatInterface 
            isAdmin={user.isAdmin} 
            user={user} 
            language={language} 
            agent={agent}
            onAgentChange={setAgent}
            voiceTrigger={voiceTrigger}
            onTriggerBillCalc={() => setShowBillCalc(true)}
            messages={messages}
            setMessages={setMessages}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          >
            {/* Message Loop Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 md:px-12 bg-transparent relative no-scrollbar">
              <div className="absolute inset-0 opacity-[0.01] dark:opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0058A8 1.5px, transparent 0)', backgroundSize: '32px 32px' }}></div>
              
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700 relative z-10 text-center">
                   <div className="w-20 h-20 bg-gradient-to-br from-slt-blue to-slt-mid rounded-[24px] flex items-center justify-center shadow-lg mb-6 transform rotate-3 animate-float">
                     <Sparkles className="text-white w-10 h-10" />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">MobiCare AI Hub</h3>
                   <p className="text-slate-500 dark:text-slate-400 font-bold mb-10 max-w-xs mx-auto leading-relaxed text-sm">Sri Lanka's most advanced telecommunications support agent. How can I assist you today?</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 relative z-10">
                  {messages.map((msg) => (
                    <ChatMessage 
                      key={msg.id} 
                      message={msg} 
                      onFeedback={(id, type) => {
                        setMessages(prev => prev.map(m => m.id === id ? { ...m, feedback: type } : m));
                        if (user?.email) {
                          saveFeedback(user.email, id, type);
                        }
                      }} 
                    />
                  ))}
                </div>
              )}

              {/* Thinking Indicator */}
              {isLoading && (
                <div className="flex justify-start mb-8 animate-in fade-in slide-in-from-left-4 duration-500 relative z-10 mt-4">
                   <div className="flex flex-row gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slt-dark flex items-center justify-center shadow-md border border-slate-800 animate-bounce">
                        <Sparkles className="text-slt-accent w-5 h-5 animate-pulse" />
                      </div>
                      <div className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl rounded-tl-none shadow-lg flex items-center gap-3 text-slate-600 dark:text-slate-200 text-sm font-black">
                         <div className="relative flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin text-slt-blue" />
                         </div>
                         <span className="tracking-tight animate-pulse">
                           {language === 'si' ? 'ජාල බුද්ධිය සංස්ලේෂණය කරමින්...' : 'Thinking...'}
                         </span>
                      </div>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ChatInterface>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-16 text-center">
        <div className="h-px bg-slate-200/60 dark:bg-slt-mid/20 w-full mb-10"></div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">
            Official SLTMOBITEL Digital Hub &middot; 2025
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slt-blue dark:hover:text-slt-accent transition-colors uppercase tracking-widest">Privacy Policy</a>
            <a href="#" className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slt-blue dark:hover:text-slt-accent transition-colors uppercase tracking-widest">Terms of Use</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;