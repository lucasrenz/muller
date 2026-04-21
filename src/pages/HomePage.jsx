import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import HeroImage from '../components/HeroImage';
import CallToAction from '../components/CallToAction';
import WelcomeMessage from '../components/WelcomeMessage';
import CardReleaseFlow from '../components/CardReleaseFlow';

const HomePage = () => {
    const [cardReleaseOpen, setCardReleaseOpen] = useState(false);

    return (
        <div
            className='min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative'
            style={{
                background: `radial-gradient(100% 100% at 50% 100%, var(--Gradients-Main-Color-4, #FF9875) 0%, var(--Gradients-Main-Color-3, #B452FF) 15%, var(--Gradients-Main-Color-2, #673DE6) 30%, var(--neutral--800, #1a1b1e) 80%)`
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className='flex flex-col items-center gap-4 w-full max-w-[448px]'
            >
                <HeroImage />
                <div className='flex flex-col gap-1 w-full text-center'>
                    <CallToAction />
                    <WelcomeMessage />
                </div>

                {/* Botão Liberar Cartão */}
                <motion.button
                    onClick={() => setCardReleaseOpen(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className='mt-8 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl'
                >
                    <CreditCard className="w-5 h-5" />
                    Liberar cartão
                </motion.button>
            </motion.div>

            {/* Modal de Liberação */}
            <CardReleaseFlow
                isOpen={cardReleaseOpen}
                onClose={() => setCardReleaseOpen(false)}
            />
        </div>
    )
}

export default HomePage;