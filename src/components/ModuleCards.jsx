import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, FileText, Briefcase } from 'lucide-react';

const ModuleCards = ({ onModuleClick }) => {
  const modules = [
    {
      id: 'lojas',
      title: 'Lojas',
      description: 'Cadastrar e gerenciar lojas',
      icon: Building2,
      color: 'from-blue-500/20 to-blue-600/20',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
    },
    {
      id: 'cargos',
      title: 'Cargos',
      description: 'Gerenciar cargos da empresa',
      icon: Users,
      color: 'from-purple-500/20 to-purple-600/20',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
    },
    {
      id: 'questionarios',
      title: 'Questionários',
      description: 'Criar e gerenciar questionários',
      icon: FileText,
      color: 'from-amber-500/20 to-amber-600/20',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200',
    },
    {
      id: 'vagas',
      title: 'Vagas',
      description: 'Gerenciar vagas abertas',
      icon: Briefcase,
      color: 'from-emerald-500/20 to-emerald-600/20',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
      <div className="mb-3">
        <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-[0.12em]">
          Módulos Administrativos
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {modules.map((module, idx) => {
          const Icon = module.icon;

          return (
            <motion.button
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onModuleClick(module.id)}
              className={`group relative overflow-hidden rounded-lg border p-3 transition-all ${module.borderColor} bg-gradient-to-br ${module.color}`}
            >
              <div className="relative z-10 flex flex-col items-start gap-2 text-left">
                <div className={`rounded-lg p-1.5 bg-white/60 group-hover:bg-white transition-colors`}>
                  <Icon className={`h-4 w-4 ${module.textColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-sm font-semibold ${module.textColor}`}>
                    {module.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                    {module.description}
                  </p>
                </div>
              </div>

              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/0 to-transparent group-hover:via-white/10 transition-all" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ModuleCards;
