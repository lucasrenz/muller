import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const AdminModuleDrawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
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
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: 600, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 600, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 z-50 h-screen w-full max-w-4xl overflow-y-auto bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-slate-200/60 bg-white/95 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4 p-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-sm text-slate-600">
                      {subtitle}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AdminModuleDrawer;