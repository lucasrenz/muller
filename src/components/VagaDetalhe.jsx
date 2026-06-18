import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Users, Calendar, Building2, ChevronLeft } from 'lucide-react';

const VagaDetalhe = ({ vaga, isOpen, onClose, onCandidatar }) => {
  if (!vaga) return null;

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-white rounded-3xl shadow-2xl z-50 flex flex-col max-h-[90vh] md:max-h-[85vh]"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span className="text-sm font-medium">Voltar</span>
                </button>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {vaga.cargos?.nome || 'Cargo não informado'}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{vaga.lojas?.nome || 'Loja não informada'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{vaga.lojas?.cidade || 'Cidade não informada'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{vaga.quantidade || 1} vaga{vaga.quantidade !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
              <div className="max-w-4xl mx-auto">
                {/* Informações da vaga */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Sobre a vaga</h3>
                      <div className="space-y-3 text-sm text-slate-600">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className="font-medium text-green-600">Ativa</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Data de abertura:</span>
                          <span className="font-medium">{formatarData(vaga.data_abertura)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quantidade:</span>
                          <span className="font-medium">{vaga.quantidade || 1}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Localização</h3>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p className="font-medium text-slate-900">{vaga.lojas?.nome}</p>
                        <p>{vaga.lojas?.endereco}</p>
                        <p>{vaga.lojas?.cidade}</p>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Descrição do cargo */}
                {vaga.cargos?.descricao && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Descrição da função</h3>
                    <div className="prose prose-sm max-w-none text-slate-600 whitespace-pre-line">
                      <p>{vaga.cargos.descricao}</p>
                    </div>
                  </div>
                )}

                {/* Benefícios ou informações adicionais */}
                <div className="bg-slate-50 rounded-2xl p-6 mb-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Benefícios por trabalhar conosco!</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-600">
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Ambiente de trabalho acolhedor</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Enxoval baby para recém-nascido</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Oportunidades de crescimento</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Convênio para compras no mercado</span>
                      </li>
                    </ul>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Plano de saúde Unimed</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Plano odontológico Bradesco</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Prêmio assiduidade</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Convênio educacional Faccat.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Espaçamento extra para o footer */}
                <div className="h-6"></div>
              </div>
            </div>

            {/* Footer com botão */}
            <div className="flex-shrink-0 border-t border-slate-200 px-6 py-4 bg-white shadow-lg">
              <div className="max-w-4xl mx-auto flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onCandidatar(vaga)}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300"
                >
                  Quero me candidatar
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VagaDetalhe;