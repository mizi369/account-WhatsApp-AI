
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, ServerOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center p-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-[#1E1E1E] border border-white/10 rounded-2xl p-8 shadow-2xl"
          >
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Ops! Sesuatu tidak kena.</h1>
            <p className="text-slate-400 text-sm mb-6">
              Sistem mengalami ralat teknikal. Jangan risau, data anda selamat. Sila cuba muat semula halaman.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all"
            >
              <RefreshCw size={18} />
              Muat Semula Halaman
            </button>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-black/30 rounded-lg text-left text-[10px] font-mono text-red-400 overflow-auto max-h-40">
                {this.state.error?.toString()}
              </div>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Memuatkan Sistem Neural MNF..." }) => {
  const [showReset, setShowReset] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowReset(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  const handleReset = () => {
    if (window.confirm('Padam cache data sistem? Ini tidak akan memadam data di server (jika ada).')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#121212] z-[9999] flex flex-col items-center justify-center">
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 360]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-24 h-24 border-4 border-t-primary border-r-secondary border-b-primary/30 border-l-secondary/30 rounded-full mb-8 relative"
      >
          <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
          </div>
      </motion.div>
      <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
      >
          <h2 className="text-white font-black tracking-[0.2em] uppercase text-sm mb-2">{message}</h2>
          <div className="flex gap-1 justify-center mb-6">
              <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
              <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 bg-secondary rounded-full" />
              <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
          </div>

          {showReset && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <button 
                onClick={handleReset}
                className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all"
              >
                Reset App Data (Recover)
              </button>
            </motion.div>
          )}
      </motion.div>
    </div>
  );
};

export const ServerOfflineAlert: React.FC = () => (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-4 right-4 z-[100] bg-orange-500/10 border border-orange-500/20 backdrop-blur-md px-4 py-2 rounded-lg flex items-center gap-3 text-orange-400 shadow-xl"
    >
      <ServerOff size={16} />
      <span className="text-[11px] font-bold uppercase tracking-wider">Server Offline (Safe Mode Aktif)</span>
    </motion.div>
);
