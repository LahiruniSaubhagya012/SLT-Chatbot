
import React, { useState } from 'react';
import { Mail, ArrowRight, Sparkles, Moon, Sun, ShieldCheck } from 'lucide-react';

interface AuthGateProps {
  onLogin: (email: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onLogin, isDarkMode, onToggleTheme }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setLoading(true);
    setTimeout(() => {
      onLogin(email);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slt-dark flex flex-col items-center justify-center p-6 transition-colors duration-500 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-slt-blue/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slt-accent/10 rounded-full blur-[120px] pointer-events-none"></div>

      <button 
        onClick={onToggleTheme}
        className="absolute top-8 right-8 p-4 text-slate-400 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-all active:scale-95"
      >
        {isDarkMode ? <Sun className="w-6 h-6 text-amber-500" /> : <Moon className="w-6 h-6" />}
      </button>

      <div className="w-full max-w-md animate-in zoom-in-95 duration-700">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl p-12 rounded-[56px] shadow-2xl shadow-slate-200/50 dark:shadow-black border border-white dark:border-slt-mid/20 text-center relative overflow-hidden">
          
          <div className="flex flex-col items-center gap-6 mb-12">
            <div className="w-20 h-20 bg-slt-blue rounded-[32px] flex items-center justify-center shadow-2xl shadow-slt-blue/30 transform rotate-3 hover:rotate-0 transition-transform cursor-default">
              <span className="text-3xl font-black text-white">SLT</span>
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">MobiCare AI</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Enter your SLTMOBITEL ID to begin.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700 group-focus-within:text-slt-blue transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full pl-16 pr-6 py-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-[32px] focus:outline-none focus:ring-4 focus:ring-slt-blue/10 focus:bg-white dark:focus:bg-slate-800 focus:border-slt-blue/30 transition-all font-bold text-slate-900 dark:text-white"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !email.includes('@')}
              className="w-full bg-slt-blue text-white py-6 rounded-[32px] font-black shadow-2xl shadow-slt-blue/40 hover:bg-slt-mid disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-3 text-lg uppercase tracking-widest group"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Enter Workspace <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Enterprise Secure Session</span>
          </div>
        </div>

        <p className="mt-8 text-center text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
          For administrative access use your SLT domain email
        </p>
      </div>
    </div>
  );
};