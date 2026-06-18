/**
 * Tema compartilhado entre todos os sistemas.
 * Centraliza cores, gradientes e padrões visuais.
 */
export const cores = {
  cartao: {
    primaria:    'from-orange-400 to-orange-600',
    hover:       'from-orange-500 to-orange-700',
    ring:        'focus:ring-orange-400',
    btn:         'bg-gradient-to-r from-orange-400 to-orange-600',
    label:       'Sistema de Cartão',
  },
  denuncias: {
    primaria:    'from-violet-500 to-purple-700',
    hover:       'from-violet-600 to-purple-800',
    ring:        'focus:ring-violet-500',
    btn:         'bg-gradient-to-r from-violet-500 to-purple-700',
    label:       'Sistema de Denúncias',
  },
  vagas: {
    primaria:    'from-emerald-500 to-teal-700',
    hover:       'from-emerald-600 to-teal-800',
    ring:        'focus:ring-emerald-500',
    btn:         'bg-gradient-to-r from-emerald-500 to-teal-700',
    label:       'Sistema de Vagas',
  },
  principal: {
    primaria:    'from-slate-600 to-slate-900',
    hover:       'from-slate-700 to-black',
    ring:        'focus:ring-slate-600',
    btn:         'bg-gradient-to-r from-slate-600 to-slate-900',
    label:       'Painel do Operador',
  },
};

export const rotas = {
  cartao:    { login: '/cartao/login',    painel: '/cartao/painel',    publico: '/cartao' },
  denuncias: { login: '/denuncias/login', painel: '/denuncias/painel', publico: '/denuncias' },
  vagas:     { login: '/vagas/login',     painel: '/vagas/painel',     publico: '/vagas' },
  principal: { login: '/principal/login', painel: '/',                 publico: '/principal' },
};
