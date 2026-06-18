import React from 'react';
import { motion } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';

const CandidateFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  lojas,
  cargos,
  statusOptions,
  origemOptions,
  selectedKPI, // Novo prop para saber se há KPI ativo
}) => {
  const hasActiveFilters = Object.values(filters).some(
    v => v !== null && v !== undefined && v !== '' && v !== false
  ) || selectedKPI;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3"
    >
      <div className="space-y-2.5">
        {/* Títtulo */}
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-[0.12em]">
            Filtros
          </h3>
          {hasActiveFilters && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClearFilters}
              className="text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
            >
              Limpar filtros
            </motion.button>
          )}
        </div>

        {/* Grid de filtros */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Status */}
          <div className="relative">
            <label className="text-xs font-medium text-slate-600 block mb-1.5">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => onFilterChange('status', e.target.value || null)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-all focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none hover:border-slate-300"
            >
              <option value="">Todos</option>
              {statusOptions?.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-[1.9rem] h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Loja */}
          <div className="relative">
            <label className="text-xs font-medium text-slate-600 block mb-1.5">
              Loja
            </label>
            <select
              value={filters.loja_id || ''}
              onChange={(e) => onFilterChange('loja_id', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-all focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none hover:border-slate-300"
            >
              <option value="">Todas</option>
              {lojas?.map(loja => (
                <option key={loja.id} value={loja.id}>
                  {loja.nome}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-[1.9rem] h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Cargo */}
          <div className="relative">
            <label className="text-xs font-medium text-slate-600 block mb-1.5">
              Cargo
            </label>
            <select
              value={filters.cargo_id || ''}
              onChange={(e) => onFilterChange('cargo_id', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-all focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none hover:border-slate-300"
            >
              <option value="">Todos</option>
              {cargos?.map(cargo => (
                <option key={cargo.id} value={cargo.id}>
                  {cargo.nome}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-[1.9rem] h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Origem */}
          <div className="relative">
            <label className="text-xs font-medium text-slate-600 block mb-1.5">
              Origem
            </label>
            <select
              value={filters.como_conheceu || ''}
              onChange={(e) => onFilterChange('como_conheceu', e.target.value || null)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-all focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none hover:border-slate-300"
            >
              <option value="">Todas</option>
              {origemOptions?.map(origem => (
                <option key={origem} value={origem}>
                  {origem.charAt(0).toUpperCase() + origem.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-[1.9rem] h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Período */}
          <div className="relative">
            <label className="text-xs font-medium text-slate-600 block mb-1.5">
              Período
            </label>
            <select
              value={filters.periodo || ''}
              onChange={(e) => onFilterChange('periodo', e.target.value || null)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-all focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none hover:border-slate-300"
            >
              <option value="">Todos</option>
              <option value="7days">Últimos 7 dias</option>
              <option value="30days">Últimos 30 dias</option>
              <option value="90days">Últimos 90 dias</option>
            </select>
            <ChevronDown className="absolute right-3 top-[1.9rem] h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Banco de Talentos */}
          <div className="flex items-end">
            <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
              selectedKPI === 'banco_talentos'
                ? 'border-purple-200 bg-purple-50/50 cursor-not-allowed opacity-60'
                : 'border-transparent hover:border-slate-200 cursor-pointer'
            }`}>
              <input
                type="checkbox"
                checked={filters.banco_talentos === true}
                onChange={(e) => selectedKPI !== 'banco_talentos' && onFilterChange('banco_talentos', e.target.checked ? true : null)}
                disabled={selectedKPI === 'banco_talentos'}
                className="w-4 h-4 rounded border-slate-300 text-orange-600 cursor-pointer focus:ring-orange-500/20 disabled:cursor-not-allowed"
              />
              <span className={`text-sm font-medium ${selectedKPI === 'banco_talentos' ? 'text-slate-500' : 'text-slate-700'}`}>
                Banco de Talentos
              </span>
            </label>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CandidateFilters;
