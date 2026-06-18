import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ icon, title, description, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="group cursor-pointer rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-lg shadow-slate-300/20 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-300/30"
      onClick={onClick}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-orange-100 p-3 text-orange-600 transition-colors group-hover:bg-orange-200">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Card;