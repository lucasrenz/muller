import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ContractLoadingOverlay = ({ isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="text-center"
          >
            {/* Spinner */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 border-4 border-transparent border-t-white border-r-white rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-2 border-4 border-transparent border-b-white border-l-white rounded-full"
              />
            </div>

            {/* Text */}
            <motion.p
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-white text-lg font-medium"
            >
              Gerando contrato...
            </motion.p>
            <p className="text-white/60 text-sm mt-2">
              Isso pode levar alguns momentos
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContractLoadingOverlay;
