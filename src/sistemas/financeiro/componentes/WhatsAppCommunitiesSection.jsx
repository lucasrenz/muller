import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Flame } from 'lucide-react';

const WhatsAppCommunitiesSection = () => {
  const communities = [
    {
      name: 'Rede Müller',
      description: 'Participe da comunidade da Rede Müller e receba ofertas especiais direto no WhatsApp.',
      link: 'https://chat.whatsapp.com/JjaVc0efgaW4fmEx0VXVRT',
      color: 'blue',
      accentColor: 'bg-blue-500',
    },
    {
      name: 'Certo Atacado',
      description: 'Entre na comunidade do Certo Atacado e fique por dentro das promoções e novidades.',
      link: 'https://chat.whatsapp.com/Lr0TxKQtTaf61qdeba3nxq',
      color: 'orange',
      accentColor: 'bg-orange-500',
    },
  ];

  const handleJoinCommunity = (link) => {
    window.open(link, '_blank');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-center mb-8"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
          🔥 Entre nas comunidades e receba ofertas exclusivas
        </h2>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Promoções todos os dias direto no seu WhatsApp
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {communities.map((community, index) => (
            <motion.div
              key={community.name}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.2 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-200 relative overflow-hidden"
            >
              {/* Barrinha lateral com cor da marca */}
              <div className={`absolute top-0 left-0 w-1 h-full ${community.accentColor}`}></div>

              {/* Selo de ofertas ativas */}
              <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Flame className="w-3 h-3" />
                Ofertas ativas
              </div>

              {/* Ícone e nome da marca */}
              <div className="flex items-center mb-6 mt-8">
                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{community.name}</h3>
              </div>

              <p className="text-slate-600 mb-8 leading-relaxed text-lg">
                {community.description}
              </p>

              <motion.button
                onClick={() => handleJoinCommunity(community.link)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-5 h-5" />
                Entrar agora no Comunidade
              </motion.button>
            </motion.div>
          ))}
        </div>
    </div>
  );
};

export default WhatsAppCommunitiesSection;