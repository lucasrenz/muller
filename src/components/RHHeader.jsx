import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Search, RefreshCw, Plus, Sparkles, LogOut } from 'lucide-react';

const RHHeader = ({
  onSearch,
  searchValue,
  onRefresh,
  onNewVaga,
  isLoading
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-b border-slate-200/40 bg-white/95 backdrop-blur-sm sticky top-0 z-50"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-4 space-y-3">
          {/* Títulos */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 mb-2"
              >
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-orange-50/50 px-3 py-1 text-xs font-semibold text-orange-700 uppercase tracking-[0.12em]">
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  Operacional
                </span>
              </motion.div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 tracking-[-0.02em]">
                Painel RH
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Gestão de vagas, candidaturas e banco de talentos
              </p>
            </div>

            {/* Botão Nova Vaga */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNewVaga}
              className="hidden sm:flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-white font-semibold shadow-lg shadow-orange-500/30 transition-all hover:shadow-orange-500/50"
            >
              <Plus className="h-5 w-5" />
              Nova Vaga
            </motion.button>
          </div>

          {/* Barra de Busca */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, CPF, telefone ou email..."
                value={searchValue}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-500 text-sm transition-all focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-all"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
              title="Atualizar dados"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNewVaga}
              className="sm:hidden flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-white font-semibold text-sm"
            >
              <Plus className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RHHeader;
