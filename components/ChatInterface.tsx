
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, RefreshCcw, X, Wifi, Search, AlertTriangle, Zap, FileUp, Database, FileText, Trash2, CheckCircle, UploadCloud, Lock, KeyRound, ShieldAlert, Globe, MapPin, Smartphone, Phone, CreditCard, ChevronRight, ArrowRight, Navigation, LayoutGrid, Activity, BookOpen, BarChart3, TrendingUp, History, Image as ImageIcon, LogOut, MessageSquarePlus, Copy, Mail, Check, PartyPopper, Terminal, Cpu, Link as LinkIcon, Layers, Mic, MicOff } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { Message, KnowledgeSource, WebResource, IncidentReport, AgentType } from '../types';
import { sendMessageToGemini, resetSession, analyzeConversationHistory } from '../services/geminiService';
import { saveChatHistory, saveFeedback, saveReport } from '../services/firestoreService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const QUICK_ACTIONS = [
  { text: "Check Balance", icon: <CreditCard className="w-4 h-4" />, type: 'balance', color: "bg-slt-light dark:bg-slt-blue/10 text-slt-blue dark:text-slt-accent border-slt-blue/10 dark:border-slt-mid/20 hover:bg-slt-blue hover:text-white" },
  { text: "Outage Map", icon: <Navigation className="w-4 h-4" />, type: 'outage', color: "bg-slt-light dark:bg-slt-blue/10 text-slt-blue dark:text-slt-accent border-slt-blue/10 dark:border-slt-mid/20 hover:bg-slt-blue hover:text-white" },
  { text: "Unlimited Plans", icon: <Zap className="w-4 h-4" />, type: 'packages', color: "bg-slt-light dark:bg-slt-blue/10 text-slt-blue dark:text-slt-accent border-slt-blue/10 dark:border-slt-mid/20 hover:bg-slt-blue hover:text-white" },
  { text: "Report Issue", icon: <AlertTriangle className="w-4 h-4" />, type: 'report', color: "bg-orange-50 dark:bg-orange-950/20 text-orange-600 border-orange-100 dark:border-orange-900/20 hover:bg-orange-600 hover:text-white" }
];

const PACKAGES = [
  { name: "SMAX Ultra Fiber", speed: "100Mbps", price: "Rs. 4,990", icon: <Zap className="w-5 h-5 text-amber-500" /> },
  { name: "Mobitel Unlimited 5G", speed: "Unlimited", price: "Rs. 2,490", icon: <Smartphone className="w-5 h-5 text-slt-blue" /> },
  { name: "Gaming Pro Pack", speed: "Low Latency", price: "Rs. 1,200", icon: <Activity className="w-5 h-5 text-green-500" /> }
];

const OFFICIAL_LINKS: WebResource[] = [
  { id: '1', title: 'Q1 2025 Profit Growth', uri: 'https://www.slt.lk/en/news/slt-mobitel-surges-ahead-robust-q1-2025-profit-growth' },
  { id: '2', title: 'Revenue Growth 1H 2024', uri: 'https://www.slt.lk/en/news/despite-challenges-market-slt-mobitel-reports-moderate-revenue-growth-1h-2024' },
  { id: '3', title: 'Financial Recovery Q3 2024', uri: 'https://www.slt.lk/en/news/slt-mobitel-achieves-financial-recovery-q3-2024' },
  { id: '4', title: 'Annual Report 2024', uri: 'https://sltmobitel.lk/documents/Annual-Reports/an_2024.pdf' },
  { id: '5', title: 'Wikipedia SLTMobitel', uri: 'https://en.wikipedia.org/wiki/SLTMobitel' },
];

interface ChatInterfaceProps {
  isAdmin?: boolean;
  user?: { email: string; isAdmin: boolean };
  language?: 'si' | 'en';
  agent?: AgentType;
  onAgentChange?: (agent: AgentType) => void;
  voiceTrigger?: number;
  onTriggerBillCalc?: () => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  children?: React.ReactNode;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  isAdmin = false, 
  user, 
  language = 'si', 
  agent = 'main', 
  onAgentChange, 
  voiceTrigger = 0, 
  onTriggerBillCalc,
  messages,
  setMessages,
  isLoading,
  setIsLoading,
  children
}) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  
  // Modals & Alerts
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false); 
  const [showBalanceForm, setShowBalanceForm] = useState(false);
  const [showOutageForm, setShowOutageForm] = useState(false);
  const [showPackagesModal, setShowPackagesModal] = useState(false);
  const [reportSuccessAlert, setReportSuccessAlert] = useState<{ email: string; ticketId: string } | null>(null);
  
  // Admin State
  const [activeTab, setActiveTab] = useState<'pdfs' | 'web' | 'analysis'>('pdfs');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUri, setNewLinkUri] = useState('');
  
  // AI Analysis Results
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);
  
  // Knowledge Base State
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [webResources, setWebResources] = useState<WebResource[]>(OFFICIAL_LINKS);
  
  // Form States
  const [reportData, setReportData] = useState<IncidentReport>({ customerName: '', email: '', serviceType: 'Fiber', location: '', issueDescription: '' });
  const [balanceData, setBalanceData] = useState({ serviceType: 'Mobile', accountNumber: '' });
  const [outageArea, setOutageArea] = useState('');
  
  // Voice Recognition
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('slt_mobicare_logs', JSON.stringify(messages));
  }, [messages]);

  // Agent Switching Auto-messages
  const prevAgentRef = useRef<AgentType>(agent);
  useEffect(() => {
    const greetings: Record<AgentType, string> = {
      main: "I m SLT mobitel customer support AI how can i help you",
      sales: "I am the Sales agent. I can help you with new connections and pricing.",
      existing: "I am the Service agent. I can help you with plan upgrades and VAS.",
      support: "i am supporgent i m here for suppor"
    };

    if (messages.length === 0) {
      const initialMsg: Message = {
        id: 'initial-' + Date.now(),
        role: 'model',
        text: greetings[agent],
        timestamp: new Date()
      };
      setMessages([initialMsg]);
    } else if (prevAgentRef.current !== agent) {
      const switchMsg: Message = {
        id: 'switch-' + Date.now(),
        role: 'model',
        text: greetings[agent],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, switchMsg]);
    }
    prevAgentRef.current = agent;
  }, [agent]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Update recognition language
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'si' ? 'si-LK' : 'en-US';
    }
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    if (voiceTrigger > 0 && !isListening) {
      toggleListening();
    }
  }, [voiceTrigger]);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingImage(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  const handleQuickAction = (type: string) => {
    if (type === 'balance') setShowBalanceForm(true);
    if (type === 'outage') setShowOutageForm(true);
    if (type === 'packages') setShowPackagesModal(true);
    if (type === 'report') setShowReportForm(true);
  };

  const handleSendMessage = async (text: string, userFacingLabel?: string, metaEmail?: string) => {
    if ((!text.trim() && !selectedImage) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userFacingLabel || text,
      image: selectedImage || undefined,
      timestamp: new Date()
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    
    // Save user message to Firestore
    if (user?.email) {
      saveChatHistory(user.email, userMessage);
    }

    setInputValue('');
    const currentImage = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const { text: responseText, links, image: modelImage, ticketId, switchAgent, triggerBillCalc } = await sendMessageToGemini(text, messages, knowledgeSources, webResources, currentImage || undefined, language, agent);
      
      if (switchAgent && onAgentChange) {
        onAgentChange(switchAgent.target);
        // Add a system message about the switch
        const switchMsg: Message = {
          id: (Date.now() + 2).toString(),
          role: 'model',
          text: `*System: Switching to ${switchAgent.target} agent. Reason: ${switchAgent.reason}*`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, switchMsg]);
      }

      if (triggerBillCalc && onTriggerBillCalc) {
        onTriggerBillCalc();
      }

      if (ticketId && metaEmail) {
        setReportSuccessAlert({ email: metaEmail, ticketId: ticketId });
      }

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        image: modelImage,
        groundingLinks: links,
        ticketId: ticketId,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, modelMessage]);

      // Save model message to Firestore
      if (user?.email) {
        saveChatHistory(user.email, modelMessage);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I encountered a communication error. Please ensure you're connected to the network.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    resetSession();
    setMessages([]);
    localStorage.removeItem('slt_mobicare_logs');
  };

  // Fix: Handle the incident report form submission and trigger AI tool call
  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    try {
      // Save report to Firestore
      await saveReport(reportData);

      await handleSendMessage(
        `agent_task: submit_report ${JSON.stringify(reportData)}`,
        `Filing a service report for ${reportData.customerName}...`,
        reportData.email
      );
      setShowReportForm(false);
    } catch (error) {
      console.error("Report Error:", error);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Fix: Handle balance inquiry submission
  const submitBalanceCheck = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(`I want to check my ${balanceData.serviceType} balance for account ${balanceData.accountNumber}`);
    setShowBalanceForm(false);
  };

  // Fix: Handle outage map search queries
  const submitOutageCheck = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(`Are there any reported network outages in ${outageArea}?`);
    setShowOutageForm(false);
  };

  // Fix: Handle package selection from the recommendations modal
  const selectPackage = (packageName: string) => {
    handleSendMessage(`Tell me more about the ${packageName} plan.`);
    setShowPackagesModal(false);
  };

  // Fix: Add a web resource from admin panel
  const addWebResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkTitle.trim() || !newLinkUri.trim()) return;
    
    const newResource: WebResource = {
      id: Date.now().toString(),
      title: newLinkTitle,
      uri: newLinkUri
    };
    
    setWebResources(prev => [...prev, newResource]);
    setNewLinkTitle('');
    setNewLinkUri('');
  };

  // Fix: Handle PDF upload
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.type !== 'application/pdf') {
      alert("Please upload PDF files only.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      const newSource: KnowledgeSource = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        data: base64Data,
        mimeType: file.type
      };
      setKnowledgeSources(prev => [...prev, newSource]);
    };
    reader.readAsDataURL(file);
  };

  // Fix: Remove a knowledge source
  const removeKnowledgeSource = (id: string) => {
    setKnowledgeSources(prev => prev.filter(s => s.id !== id));
  };

  // Fix: Remove a web resource from admin panel grounding list
  const removeWebResource = (id: string) => {
    setWebResources(prev => prev.filter(r => r.id !== id));
  };

  // Fix: Run AI conversation analysis for admin reporting
  const handleRunAnalysis = async () => {
    if (messages.length === 0) return;
    setIsAnalyzing(true);
    try {
      const report = await analyzeConversationHistory(messages);
      setAnalysisReport(report);
    } catch (error) {
      console.error("Analysis Error:", error);
      setAnalysisReport("Failed to generate analysis report.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* MODAL: REPORT ISSUE */}
      {showReportForm && (
        <div className="fixed inset-0 z-[500] bg-slt-dark/40 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-xl border border-white/20 p-8 relative overflow-hidden">
            <button onClick={() => setShowReportForm(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-orange-100 dark:bg-orange-950/30 text-orange-600 rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Technical Incident Report</h3>
                <p className="text-slate-500 text-xs font-medium">Lodge a formal ticket with our network team.</p>
              </div>
            </div>
            <form onSubmit={submitReport} className="grid grid-cols-2 gap-4">
               <div className="col-span-2 space-y-1.5">
                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                 <input required value={reportData.customerName} onChange={e => setReportData({...reportData, customerName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 font-bold text-sm" />
               </div>
               <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                 <input type="email" required value={reportData.email} onChange={e => setReportData({...reportData, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 font-bold text-sm" />
               </div>
               <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Service Type</label>
                 <select value={reportData.serviceType} onChange={e => setReportData({...reportData, serviceType: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 font-bold text-sm">
                   <option>Fiber</option>
                   <option>Mobile</option>
                   <option>PEOTV</option>
                 </select>
               </div>
               <div className="col-span-2 space-y-1.5">
                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Issue Description</label>
                 <textarea required value={reportData.issueDescription} onChange={e => setReportData({...reportData, issueDescription: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 font-bold text-sm min-h-[80px]" placeholder="e.g. Red light blinking on router since morning..." />
               </div>
               <button type="submit" className="col-span-2 w-full py-4 bg-orange-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2">
                 {isSubmittingReport ? <Loader2 className="animate-spin w-4 h-4" /> : <>Submit Report <CheckCircle className="w-4 h-4" /></>}
               </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHECK BALANCE */}
      {showBalanceForm && (
        <div className="fixed inset-0 z-[500] bg-slt-dark/40 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl w-full max-w-sm border border-white/20 p-10 relative">
            <button onClick={() => setShowBalanceForm(false)} className="absolute top-8 right-8 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400"><X /></button>
            <div className="flex flex-col items-center text-center gap-4 mb-8">
              <div className="p-5 bg-slt-light dark:bg-slt-blue/20 text-slt-blue rounded-[30px]"><CreditCard className="w-10 h-10" /></div>
              <h3 className="text-2xl font-black tracking-tight">Quick Balance Check</h3>
              <p className="text-slate-500 text-sm font-medium">Enter your SLT account details below.</p>
            </div>
            <form onSubmit={submitBalanceCheck} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Number</label>
                <input required placeholder="e.g. 0112345678" value={balanceData.accountNumber} onChange={e => setBalanceData({...balanceData, accountNumber: e.target.value})} className="w-full px-7 py-5 bg-slate-50 dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700 font-black text-xl text-center" />
              </div>
              <button type="submit" className="w-full py-6 bg-slt-blue text-white rounded-[28px] font-black uppercase tracking-[0.2em] text-xs hover:bg-slt-mid shadow-2xl shadow-slt-blue/30 transition-all active:scale-95">Check My Balance</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PACKAGES */}
      {showPackagesModal && (
        <div className="fixed inset-0 z-[500] bg-slt-dark/40 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl w-full max-w-2xl border border-white/20 p-12 relative overflow-hidden">
            <button onClick={() => setShowPackagesModal(false)} className="absolute top-8 right-8 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400"><X /></button>
            <h3 className="text-3xl font-black tracking-tight mb-8">Recommended Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PACKAGES.map((pkg, i) => (
                <div key={i} onClick={() => selectPackage(pkg.name)} className="group p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[38px] border border-slate-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 hover:border-slt-accent cursor-pointer transition-all hover:-translate-y-2 shadow-sm hover:shadow-2xl">
                   <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-sm">{pkg.icon}</div>
                   <h4 className="font-black text-lg mb-1 leading-tight">{pkg.name}</h4>
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">{pkg.speed}</p>
                   <div className="text-slt-blue dark:text-slt-accent font-black text-xl mb-6">{pkg.price}</div>
                   <div className="w-full py-4 rounded-2xl bg-slt-blue/10 text-slt-blue dark:text-slt-accent text-center font-black text-[10px] uppercase tracking-widest group-hover:bg-slt-blue group-hover:text-white transition-all">Details</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS ALERT */}
      {reportSuccessAlert && (
        <div className="fixed inset-0 z-[1000] bg-slt-dark/80 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-700">
           <div className="bg-white dark:bg-slate-900 rounded-[64px] shadow-[0_48px_160px_rgba(0,0,0,0.6)] p-14 max-w-sm w-full border border-slt-light dark:border-slate-800 animate-in zoom-in-95 slide-in-from-bottom-12 duration-700 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-slt-accent via-slt-blue to-slt-mid"></div>
              <div className="w-32 h-32 bg-gradient-to-br from-slt-blue via-slt-blue to-slt-mid rounded-[44px] flex items-center justify-center mx-auto mb-10 shadow-[0_20px_60px_rgba(0,88,168,0.4)] transform rotate-12 scale-110">
                 <Check className="text-white w-16 h-16" strokeWidth={3} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-5">Report Dispatched!</h3>
              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-[38px] p-8 mb-10 border border-slate-100 dark:border-slate-700/50">
                <p className="text-slate-500 dark:text-slate-400 font-bold mb-5 leading-relaxed">Support ticket <span className="text-slt-blue dark:text-slt-accent font-black">#{reportSuccessAlert.ticketId}</span> is now active for:</p>
                <div className="px-5 py-4 bg-white dark:bg-slate-900 rounded-[20px] font-black text-slate-800 dark:text-slate-200 truncate shadow-inner border border-slate-100 dark:border-slate-800">{reportSuccessAlert.email}</div>
              </div>
              <button onClick={() => setReportSuccessAlert(null)} className="w-full bg-slt-blue dark:bg-slt-accent text-white py-7 rounded-[38px] font-black uppercase tracking-[0.2em] text-xs hover:bg-slt-mid transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4 group">Back to Support <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></button>
           </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex-shrink-0 px-6 py-3 bg-white/50 dark:bg-slate-900/50 border-b border-slate-100/80 dark:border-slate-800/50 flex items-center justify-between z-20 backdrop-blur-2xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
            {isAdmin 
              ? (language === 'si' ? 'මොබිකෙයාර් බුද්ධිමය මධ්‍යය' : 'MobiCare Intelligence Core') 
              : (language === 'si' ? `ජාලය සක්‍රීයයි | නියෝජිතයා: ${agent}` : `Network Active | Agent: ${agent}`)}
          </span>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={handleReset} title="Deep Refresh" className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all group">
            <RefreshCcw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-700" />
          </button>
        </div>
      </div>

      {/* Chat Content Area (Children) */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col relative">
        {children}
      </div>

      {/* Input Module */}
      <div className="flex-shrink-0 px-6 py-6 bg-white/60 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 backdrop-blur-2xl relative z-30">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
            
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-2 px-2">
              {QUICK_ACTIONS.map((action, i) => (
                <button 
                  key={i} 
                  onClick={() => handleQuickAction(action.type)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all hover:shadow-md active:scale-95 whitespace-nowrap ${action.color}`}
                >
                  <span className="p-1 bg-white/10 rounded-md">{action.icon}</span>
                  {action.text}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
                <input type="file" ref={imageInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                <button onClick={() => imageInputRef.current?.click()} className={`p-4 rounded-2xl transition-all shadow-sm group relative overflow-hidden ${selectedImage ? 'text-slt-blue bg-slt-light dark:bg-slt-blue/10 border border-slt-accent' : 'text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                    <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {selectedImage && <div className="absolute top-1 right-1 w-2 h-2 bg-slt-accent rounded-full border border-white animate-pulse"></div>}
                </button>

                <div className="flex-1 relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-slt-blue transition-colors"><Search className="w-5 h-5" /></div>
                  <input 
                    value={inputValue} 
                    onChange={(e) => setInputValue(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)} 
                    placeholder={language === 'si' ? "සම්බන්ධතාවය පරීක්ෂා කරන්න..." : "Diagnose connection, ask about billing..."} 
                    className="w-full pl-14 pr-28 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slt-blue/5 transition-all font-bold text-sm text-slate-800 dark:text-slate-100 shadow-inner placeholder:text-slate-300 dark:placeholder:text-slate-600" 
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button 
                      onClick={toggleListening}
                      className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slt-blue'}`}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => handleSendMessage(inputValue)} 
                      disabled={(!inputValue.trim() && !selectedImage) || isLoading} 
                      className="p-3 rounded-xl bg-gradient-to-br from-slt-blue to-slt-mid text-white hover:shadow-lg disabled:opacity-30 transition-all active:scale-90 flex items-center justify-center group/btn"
                    >
                      <Send className="w-5 h-5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
                
                {isAdmin && (
                  <button onClick={() => setShowAdminPanel(true)} className="p-4 rounded-2xl transition-all text-slt-blue bg-slt-light dark:bg-slt-blue/10 border border-slt-accent/30 dark:border-slt-mid/30 hover:shadow-md active:scale-95 group">
                      <Layers className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                  </button>
                )}
            </div>
        </div>
      </div>
      
      {/* ADDED MISSING OUTAGE MODAL */}
      {showOutageForm && (
        <div className="fixed inset-0 z-[500] bg-slt-dark/40 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl w-full max-w-sm border border-white/20 p-10 relative">
            <button onClick={() => setShowOutageForm(false)} className="absolute top-8 right-8 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400"><X /></button>
            <div className="flex flex-col items-center text-center gap-4 mb-8">
              <div className="p-5 bg-slt-light dark:bg-slt-blue/20 text-slt-blue rounded-[30px]"><Navigation className="w-10 h-10" /></div>
              <h3 className="text-2xl font-black tracking-tight">Outage Map Search</h3>
              <p className="text-slate-500 text-sm font-medium">Check real-time network health in your area.</p>
            </div>
            <form onSubmit={submitOutageCheck} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Location / Area</label>
                <input required placeholder="e.g. Kandy, Colombo 03" value={outageArea} onChange={e => setOutageArea(e.target.value)} className="w-full px-7 py-5 bg-slate-50 dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700 font-bold text-center" />
              </div>
              <button type="submit" className="w-full py-6 bg-slt-blue text-white rounded-[28px] font-black uppercase tracking-[0.2em] text-xs hover:bg-slt-mid transition-all">Search Outage Database</button>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN PANEL - Placeholder implementation */}
      {showAdminPanel && isAdmin && (
        <div className="fixed inset-0 z-[600] bg-slt-dark/95 backdrop-blur-3xl p-10 md:p-20 overflow-y-auto animate-in slide-in-from-bottom-20 duration-500">
           <div className="max-w-6xl mx-auto">
             <div className="flex items-center justify-between mb-16">
               <h2 className="text-5xl font-black text-white tracking-tighter">Command Center</h2>
               <button onClick={() => setShowAdminPanel(false)} className="p-5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"><X className="w-10 h-10" /></button>
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                  <div className="bg-white/5 border border-white/10 rounded-[56px] p-12">
                    <h4 className="text-white text-2xl font-black mb-8 flex items-center gap-4"><BookOpen className="text-slt-accent" /> Knowledge Base Management</h4>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handlePdfUpload} 
                      accept="application/pdf" 
                      className="hidden" 
                    />
                    
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/10 rounded-[40px] p-12 text-center hover:border-slt-accent/50 transition-all cursor-pointer mb-8"
                    >
                      <UploadCloud className="w-12 h-12 text-white/20 mx-auto mb-4" />
                      <p className="text-white/40 font-bold">Click to upload technical PDFs to AI memory</p>
                    </div>

                    {knowledgeSources.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">Active Documents ({knowledgeSources.length})</p>
                        {knowledgeSources.map(source => (
                          <div key={source.id} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 group">
                            <div className="flex items-center gap-4">
                              <div className="p-2.5 bg-red-500/10 rounded-lg text-red-500"><FileText className="w-5 h-5" /></div>
                              <div className="flex flex-col">
                                <span className="text-white font-bold text-sm">{source.name}</span>
                                <span className="text-white/30 text-[10px]">{(source.size / 1024).toFixed(1)} KB</span>
                              </div>
                            </div>
                            <button onClick={() => removeKnowledgeSource(source.id)} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white/5 border border-white/10 rounded-[56px] p-12">
                    <h4 className="text-white text-2xl font-black mb-8 flex items-center gap-4"><Globe className="text-slt-accent" /> Active Grounding Links</h4>
                    
                    <form onSubmit={addWebResource} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10">
                      <div className="md:col-span-2">
                        <input 
                          required
                          placeholder="Link Title (e.g. Fiber Plans)" 
                          value={newLinkTitle}
                          onChange={e => setNewLinkTitle(e.target.value)}
                          className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-sm focus:outline-none focus:border-slt-accent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input 
                          required
                          type="url"
                          placeholder="URL (https://...)" 
                          value={newLinkUri}
                          onChange={e => setNewLinkUri(e.target.value)}
                          className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-sm focus:outline-none focus:border-slt-accent"
                        />
                      </div>
                      <button type="submit" className="bg-slt-blue text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slt-mid transition-all">Add Link</button>
                    </form>

                    <div className="space-y-4">
                      {webResources.map(res => (
                        <div key={res.id} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 group">
                           <div className="flex items-center gap-4">
                             <div className="p-3 bg-white/10 rounded-xl text-slt-accent"><LinkIcon className="w-5 h-5" /></div>
                             <div className="flex flex-col">
                               <span className="text-white font-bold">{res.title}</span>
                               <span className="text-white/30 text-[10px] truncate max-w-[200px]">{res.uri}</span>
                             </div>
                           </div>
                           <button onClick={() => removeWebResource(res.id)} className="p-3 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
               
               <div className="space-y-10">
                  <div className="bg-gradient-to-br from-slt-blue to-slt-mid rounded-[56px] p-12 shadow-2xl">
                    <h4 className="text-white text-2xl font-black mb-6">AI Performance Analysis</h4>
                    <p className="text-white/70 font-medium mb-10 leading-relaxed">Run a heuristic diagnostic on current support interactions to optimize model response logic.</p>
                    <button onClick={handleRunAnalysis} disabled={isAnalyzing} className="w-full py-6 bg-white text-slt-blue rounded-[32px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl">
                      {isAnalyzing ? <Loader2 className="animate-spin" /> : <><Activity className="w-4 h-4" /> Generate Report</>}
                    </button>
                  </div>
                  
                  {analysisReport && (
                    <div className="bg-white dark:bg-slate-900 rounded-[56px] p-10 animate-in fade-in slide-in-from-top-4">
                       <h5 className="text-[10px] font-black text-slt-blue uppercase tracking-[0.3em] mb-6">Executive Diagnostic</h5>
                       <div className="prose prose-sm dark:prose-invert max-w-none">
                         <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisReport}</ReactMarkdown>
                       </div>
                    </div>
                  )}
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};
