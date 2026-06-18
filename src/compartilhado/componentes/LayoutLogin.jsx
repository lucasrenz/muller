import React from 'react';
import { motion } from 'framer-motion';

/**
 * Layout padrão compartilhado entre todas as telas de login dos sistemas.
 * Mantém identidade visual uniforme.
 *
 * Props:
 *  - titulo: título exibido no topo do card (ex.: "Sistema de Cartão")
 *  - subtitulo: texto menor abaixo do título
 *  - icone: elemento JSX com o ícone do sistema (Lucide ou SVG)
 *  - children: formulário de login
 *  - corPrimaria: classe Tailwind de cor de fundo do ícone/badge (ex.: "from-orange-400 to-orange-600")
 */
const LayoutLogin = ({
  titulo = 'Fazer Login',
  subtitulo = '',
  icone = null,
  children,
  corPrimaria = 'from-orange-400 to-orange-600',
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-100"
      >
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          {icone && (
            <div
              className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${corPrimaria} text-white mb-4 shadow-lg`}
            >
              {icone}
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-900">{titulo}</h1>
          {subtitulo && (
            <p className="text-sm text-slate-500 mt-1">{subtitulo}</p>
          )}
        </div>

        {/* Conteúdo (formulário) */}
        {children}
      </motion.div>
    </div>
  );
};

export default LayoutLogin;
