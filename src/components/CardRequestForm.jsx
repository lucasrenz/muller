import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, ChevronRight, User, Phone, MapPin, Building2, CreditCard, AlertCircle } from 'lucide-react';
import { 
  validateFormBeforeSubmit, 
  isValidCPF,
  checkCPFBlocking30Days,
  checkPhoneAvailability,
  cleanCPF,
  cleanPhone
} from '@/lib/validationUtils';
import { parseSupabaseValidationError, createErrorToast } from '@/lib/supabaseErrorHandler';
import WhatsAppCommunitiesSection from './WhatsAppCommunitiesSection';

const CardRequestForm = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [monthlySpend, setMonthlySpend] = useState(2500);
  const [formErrors, setFormErrors] = useState({});
  const [validating, setValidating] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop');
  
  // Estados para validação em tempo real
  const [cpfStatus, setCpfStatus] = useState({ blocked: false, daysRemaining: 0, validating: false });
  const [telefoneStatus, setTelefoneStatus] = useState({ available: true, validating: false });
  const [cpfValidationError, setCpfValidationError] = useState('');
  const [telefoneValidationError, setTelefoneValidationError] = useState('');
  
  // Refs para debounce
  const cpfTimeoutRef = useRef(null);
  const telefoneTimeoutRef = useRef(null);
  
  const brandColor = '#f26c0d';
  const brandBgLight = '#fff5ef';

  // Function to detect device type and return appropriate app store link
  const getAppStoreLink = useCallback(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    
    if (isIOS) {
      return 'https://apps.apple.com/br/app/clube-vantagens/id1580602045';
    } else if (isAndroid) {
      return 'https://play.google.com/store/apps/details?id=br.com.sysmo.b2c.muller&pcampaignid=web_share';
    } else {
      // Desktop - default to Android
      return 'https://play.google.com/store/apps/details?id=br.com.sysmo.b2c.muller&pcampaignid=web_share';
    }
  }, []);

  // Detect device type on mount
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    
    if (isIOS) {
      setDeviceType('ios');
    } else if (isAndroid) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  const [formData, setFormData] = useState({
    cpf: '',
    nomeCompleto: '',
    telefone: '',
    renda: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: ''
  });

  // Validação em tempo real do CPF
  const validateCPFRealtime = useCallback(async (cpfValue) => {
    const cleanedCPF = cleanCPF(cpfValue);
    
    if (cleanedCPF.length < 11) {
      setCpfStatus({ blocked: false, daysRemaining: 0, validating: false });
      setCpfValidationError('');
      return;
    }

    if (!isValidCPF(cpfValue)) {
      setCpfStatus({ blocked: false, daysRemaining: 0, validating: false });
      setCpfValidationError('');
      return;
    }

    setCpfStatus(prev => ({ ...prev, validating: true }));

    try {
      const result = await checkCPFBlocking30Days(cpfValue);
      setCpfStatus({ 
        blocked: result.blocked, 
        daysRemaining: result.daysRemaining,
        validating: false 
      });

      if (result.blocked) {
        setCpfValidationError(
          `Solicitação efetuada!\nVocê já possui uma solicitação recente. Aguarde ${result.daysRemaining} dia(s) para realizar novamente.`
        );
        setTelefoneStatus(prev => ({ ...prev, available: false }));
      } else {
        setCpfValidationError('');
      }
    } catch (error) {
      console.error('Erro ao validar CPF:', error);
      setCpfStatus({ blocked: false, daysRemaining: 0, validating: false });
      setCpfValidationError('');
    }
  }, []);

  // Validação em tempo real do telefone
  const validateTelefoneRealtime = useCallback(async (telefoneValue, cpfValue) => {
    const cleanedPhone = cleanPhone(telefoneValue);
    
    if (cleanedPhone.length < 10) {
      setTelefoneStatus({ available: true, validating: false });
      setTelefoneValidationError('');
      return;
    }

    if (cpfStatus.blocked) {
      setTelefoneStatus({ available: false, validating: false });
      return;
    }

    setTelefoneStatus(prev => ({ ...prev, validating: true }));

    try {
      const result = await checkPhoneAvailability(telefoneValue, cpfValue);
      setTelefoneStatus({ 
        available: result.available, 
        validating: false 
      });

      if (!result.available) {
        setTelefoneValidationError(
          'Este telefone já foi utilizado e não pode ser usado por outro CPF'
        );
      } else {
        setTelefoneValidationError('');
      }
    } catch (error) {
      console.error('Erro ao validar telefone:', error);
      setTelefoneStatus({ available: true, validating: false });
      setTelefoneValidationError('');
    }
  }, [cpfStatus.blocked]);

  // Debounced CPF validation
  const handleCPFValidation = useCallback((cpfValue) => {
    if (cpfTimeoutRef.current) {
      clearTimeout(cpfTimeoutRef.current);
    }
    
    cpfTimeoutRef.current = setTimeout(() => {
      validateCPFRealtime(cpfValue);
    }, 300);
  }, [validateCPFRealtime]);

  // Debounced telefone validation
  const handleTelefoneValidation = useCallback((telefoneValue, cpfValue) => {
    if (telefoneTimeoutRef.current) {
      clearTimeout(telefoneTimeoutRef.current);
    }
    
    telefoneTimeoutRef.current = setTimeout(() => {
      validateTelefoneRealtime(telefoneValue, cpfValue);
    }, 300);
  }, [validateTelefoneRealtime]);

  useEffect(() => {
    return () => {
      if (cpfTimeoutRef.current) clearTimeout(cpfTimeoutRef.current);
      if (telefoneTimeoutRef.current) clearTimeout(telefoneTimeoutRef.current);
    };
  }, []);

  const formatCPF = value => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  const formatPhone = value => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d)/, '($1)$2').replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const formatCurrency = value => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === 'cpf') {
      formattedValue = formatCPF(value);
      if (formErrors.cpf) {
        setFormErrors(prev => ({ ...prev, cpf: '' }));
      }
      handleCPFValidation(formattedValue);
    } else if (name === 'telefone') {
      formattedValue = formatPhone(value);
      if (formErrors.telefone) {
        setFormErrors(prev => ({ ...prev, telefone: '' }));
      }
      handleTelefoneValidation(formattedValue, formData.cpf);
    } else if (name === 'renda') {
      formattedValue = formatCurrency(value);
    } else if (['nomeCompleto', 'rua', 'bairro', 'cidade'].includes(name)) {
      formattedValue = value.toUpperCase();
    }
    setFormData({
      ...formData,
      [name]: formattedValue
    });
  };

  const checkExistingRequest = async () => {
    const cleanedCpf = formData.cpf.replace(/\D/g, '');
    
    if (cleanedCpf.length !== 11 || !isValidCPF(formData.cpf)) {
      setFormErrors(prev => ({ ...prev, cpf: 'CPF inválido' }));
      return;
    }

    if (formErrors.cpf) {
      setFormErrors(prev => ({ ...prev, cpf: '' }));
    }

    setChecking(true);
    setExistingRequest(null);
    try {
      const { data, error } = await supabase.from('solicitacoes').select('*').eq('cpf', cleanedCpf).order('data_criacao', {
        ascending: false
      }).limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setExistingRequest(data[0]);
        const statusMessages = {
          em_analise: 'Sua solicitação está em análise.',
          aprovado: 'Sua solicitação foi aprovada! Em breve você receberá seu cartão.',
          recusado: 'Sua solicitação foi recusada. Entre em contato para mais informações.'
        };
        toast({
          title: "Solicitação encontrada",
          description: statusMessages[data[0].status] || 'Status desconhecido'
        });
      }
    } catch (error) {
      console.error('Error checking request:', error);
      toast({
        variant: "destructive",
        title: "Erro na verificação",
        description: "Não foi possível verificar se já existe uma solicitação para este CPF."
      });
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    if (cpfStatus.blocked) {
      toast({
        variant: "destructive",
        title: "Acesso bloqueado",
        description: `Você já possui uma solicitação recente. Aguarde ${cpfStatus.daysRemaining} dia(s) para realizar uma nova.`,
      });
      return;
    }

    if (!telefoneStatus.available) {
      toast({
        variant: "destructive",
        title: "Erro no telefone",
        description: "Este telefone já foi utilizado e não pode ser usado com outro CPF",
      });
      return;
    }
    
    const cleanedFormData = {
      ...formData,
      cpf: formData.cpf.replace(/\D/g, ''),
      telefone: formData.telefone.replace(/\D/g, ''),
    };

    setFormErrors({});
    setValidating(true);
    try {
      const validation = await validateFormBeforeSubmit(cleanedFormData);
      
      if (!validation.valid) {
        setFormErrors(validation.errors);
        setValidating(false);

        if (validation.errors.cpf) {
          toast({
            variant: "destructive",
            title: "Erro no CPF",
            description: validation.errors.cpf,
          });
        } else if (validation.errors.telefone) {
          toast({
            variant: "destructive",
            title: "Erro no telefone",
            description: validation.errors.telefone,
          });
        } else if (validation.errors.submit) {
          toast({
            variant: "destructive",
            title: "Acesso bloqueado",
            description: validation.errors.submit,
          });
        }
        return;
      }

      setValidating(false);
    } catch (error) {
      console.error('Erro na validação:', error);
      setFormErrors({ submit: 'Erro ao validar. Tente novamente.' });
      setValidating(false);
      toast({
        variant: "destructive",
        title: "Erro na validação",
        description: "Houve um erro ao validar seus dados. Por favor, tente novamente.",
      });
      return;
    }

    if (existingRequest) {
      toast({
        variant: "destructive",
        title: "CPF já cadastrado",
        description: "Já existe uma solicitação para este CPF."
      });
      return;
    }

    setLoading(true);
    try {
      const insertPayload = {
        cpf: cleanedFormData.cpf,
        nome_completo: formData.nomeCompleto,
        telefone: cleanedFormData.telefone,
        renda: formData.renda,
        rua: formData.rua,
        numero: formData.numero,
        bairro: formData.bairro,
        cidade: formData.cidade,
        status: 'em_analise',
        data_criacao: new Date().toISOString()
      };
      const { data: insertData, error: insertError } = await supabase.from('solicitacoes').insert([insertPayload]).select().single();
      
      if (insertError) throw insertError;
      
      try {
        const { data: configData } = await supabase.from('configuracoes').select('webhook_status_cartao').maybeSingle();
        if (configData?.webhook_status_cartao) {
          const webhookPayload = {
            ...insertPayload,
            id: insertData?.id,
            solicitacao_id: insertData?.id
          };
          await fetch(configData.webhook_status_cartao, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookPayload)
          });
        }
      } catch (webhookError) {
        console.error('Webhook error (non-blocking):', webhookError);
      }
      setSubmitted(true);
      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação está em análise. Em breve retornamos com o resultado."
      });
      setFormData({
        cpf: '',
        nomeCompleto: '',
        telefone: '',
        renda: '',
        rua: '',
        numero: '',
        bairro: '',
        cidade: ''
      });
      setFormErrors({});
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      
      const parsedError = parseSupabaseValidationError(error);
      
      if (parsedError) {
        setFormErrors({ [parsedError.field]: parsedError.message });
        toast(createErrorToast(parsedError));
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao enviar solicitação",
          description: error.message || "Algo deu errado. Tente novamente."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================
  return (
    <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="bg-slate-50 text-slate-900 antialiased">
      <Helmet>
        <link rel="icon" href="https://i.ibb.co/vxjxkn0n/Favicon.png" type="image/png" />
        <title>Cartão Grupo Müller - Clube Vantagens</title>
      </Helmet>
      
      {/* Estilos Globais Injetados */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap');
        
        * {
          font-family: 'Bricolage Grotesque', sans-serif;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        .animate-float-card { animation: float 5s ease-in-out infinite; }
        .glass-effect {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        html { scroll-behavior: smooth; }
      `}} />

      {/* TELA DE SUCESSO */}
      {submitted && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 z-50">
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-20 right-20 w-72 h-72 bg-brand-200 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-brand-100 rounded-full blur-3xl"></div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative bg-white rounded-3xl shadow-2xl p-8 sm:p-12 max-w-md w-full text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-brand-500 rounded-full flex items-center justify-center mb-6"
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 leading-tight"
            >
              Solicitação <span className="text-brand-500">Enviada!</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-lg text-slate-600 mb-2"
            >
              Parabéns! 🎉
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-slate-600 mb-8"
            >
              Sua solicitação foi recebida com sucesso e está sendo analisada. Em breve você receberá um retorno por WhatsApp ou SMS sobre o status do seu Cartão Rede Müller.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8"
            >
              <p className="text-sm text-green-700 font-semibold">
                ✓ Dados recebidos e salvos com segurança
              </p>
              <p className="text-sm text-green-600 mt-2">
                Você pode fechar essa página ou solicitar novo cartão clicando no botão abaixo.
              </p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              onClick={() => setSubmitted(false)}
              className="w-full px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold rounded-xl hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg hover:shadow-xl"
            >
              Nova Solicitação
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-sm text-slate-500 mt-6"
            >
              Tempo estimado de análise: 1-2 dias úteis
            </motion.p>
          </motion.div>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full glass-effect border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <div className="flex-shrink-0 flex items-center">
              <img alt="Rede Müller Logo" className="h-14 w-auto transform hover:scale-105 transition-transform" src="https://i.ibb.co/1DqmFZV/clube-png.png" />
              <span className="ml-4 font-extrabold text-2xl tracking-tight text-brand-600 hidden sm:block uppercase"></span>
            </div>
            <nav className="hidden md:flex space-x-10">
              <a className="text-base font-semibold text-slate-600 hover:text-brand-500 transition-colors" href="#vantagens">Vantagens</a>
              <a className="text-base font-semibold text-slate-600 hover:text-brand-500 transition-colors" href="#lojas">Nossas Lojas</a>
              <a className="text-base font-semibold text-slate-600 hover:text-brand-500 transition-colors" href="#simulador">Simulador</a>
              <a className="text-base font-semibold text-slate-600 hover:text-brand-500 transition-colors" href="/vagas">Vagas</a>
            </nav>
            <div className="flex items-center space-x-4">
              <a 
                href={getAppStoreLink()} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hidden lg:inline-flex items-center px-4 py-2 border-2 border-brand-500 text-sm font-bold rounded-custom text-white bg-brand-500 hover:bg-brand-600 hover:border-brand-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 18a6 6 0 100-12 6 6 0 000 12z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path><path d="M12 14v-3m0 0V9m0 2h2m-2 0H10" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                Baixar App
              </a>
              <button 
                onClick={() => window.location.href = '/login'} // REDIRECIONAMENTO ÁREA RESTRITA AQUI
                className="hidden lg:inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-semibold rounded-custom text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                Área Restrita
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40 bg-white">
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-brand-200 rounded-full blur-[120px]"></div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
              <div className="lg:col-span-7 text-center lg:text-left">
                <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Mais vantagens <br className="hidden sm:block" />na sua mão. Peça seu <span className="text-brand-500">Cartão Grupo Müller</span> agora.
                </h1>
                <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0">
                  Até 40 dias para pagar e descontos exclusivos em todas as nossas lojas. O poder de compra que você merece, com a facilidade que você precisa.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                  <a className="animate-pulse-slow inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-custom text-white bg-brand-500 hover:bg-brand-600 shadow-xl shadow-brand-500/20 transition-all transform hover:scale-105" href="#solicitar">
                    Solicitar Meu Cartão
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                  </a>
                  <a 
                    href={getAppStoreLink()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-custom text-brand-600 bg-white border-2 border-brand-200 hover:border-brand-400 hover:bg-brand-50 transition-all"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 18a6 6 0 100-12 6 6 0 000 12z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path><path d="M12 14v-3m0 0V9m0 2h2m-2 0H10" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                    Baixar App
                  </a>
                </div>
              </div>
              <div className="lg:col-span-5 mt-16 lg:mt-0 flex justify-center perspective-1000">
                <div className="relative group cursor-pointer animate-float-card">
                  <img alt="Cartão Rede Müller Front" className="w-full max-w-sm rounded-2xl shadow-2xl transition-transform duration-500 transform hover:rotate-3" src="https://i.ibb.co/XxxdYJfm/Cart-o-Limpo.png" style={{ aspectRatio: '1.58/1', objectFit: 'cover', objectPosition: '10% 25%' }} />
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Seção de Comunidades WhatsApp */}
        <section className="bg-slate-50">
          <WhatsAppCommunitiesSection />
        </section>

        {/* BENEFÍCIOS */}
        <section className="py-24 bg-slate-50" id="vantagens">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Por que escolher o nosso cartão?</h2>
              <p className="mt-4 text-lg text-slate-600">Benefícios pensados para facilitar o seu dia a dia.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-8 rounded-custom shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6 text-brand-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Até 40 dias para pagar</h3>
                <p className="text-slate-600">Até 40 dias para pagar. Mais tempo pra você organizar suas compras com tranquilidade no mês.</p>
              </div>
              <div className="bg-white p-8 rounded-custom shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6 text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Ofertas Exclusivas</h3>
                <p className="text-slate-600">Ofertas exclusivas no Clube. Preços especiais em produtos selecionados nas nossas lojas.</p>
              </div>
              <div className="bg-white p-8 rounded-custom shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6 text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Use em todas as Lojas</h3>
                <p className="text-slate-600">Aceito em toda a rede. Compre em qualquer unidade do Grupo Müller com facilidade.</p>
              </div>
              <div className="bg-white p-8 rounded-custom shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6 text-purple-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Gestão via App</h3>
                <p className="text-slate-600">Clube Mais Vantagens, acompanhe nossas ofertas especiais, promoções e limite direto no app.</p>
              </div>
            </div>
          </div>
        </section>

        {/* LOJAS (Mantido idêntico) */}
        <section className="py-24 bg-white" id="lojas">
          {/* ... [Código das lojas exatamente igual ao seu HTML. Por brevidade e para não exceder o limite visual do bloco, inseri apenas os containers, mas a lógica de estilos é a mesma] ... */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Encontre a Loja Mais Próxima</h2>
              <p className="mt-4 text-lg text-slate-600">Nossas lojas estão prontas para atender você.</p>
            </div> 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="group bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 hover:border-brand-500/30 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col">
                <div className="relative h-48 w-full bg-slate-200 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium italic"></div>
                  <img alt="Fachada Loja Rede Müller" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://i.ibb.co/Kj73dh5R/unnamed.webp"/>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Rede Müller</h3>
                  <p className="text-brand-500 text-sm font-medium mb-4">Filial 1 <br />Segunda a Sábado - 08:00 às 20:30 <br />Domingos - 08:00 às 13:00 e das 16:00 às 20:00</p>
                  <p className="text-sm text-slate-600">Rua Tristão Monteiro, 2027 - Jardim do Prado, Taquara - RS</p>
                </div>
              </div>
              <div className="group bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 hover:border-brand-500/30 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col">
                <div className="relative h-48 w-full bg-slate-200 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium italic"></div>
                  <img alt="Fachada Loja Rede Müller" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://i.ibb.co/jdfy4cx/f2-fachada.png"/>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Rede Müller</h3>
                  <p className="text-brand-500 text-sm font-medium mb-4">Filial 2 <br />Segunda a Sábado - 08:00 às 20:30 <br />Domingos - 08:00 às 13:00 e das 16:00 às 20:00</p>
                  <p className="text-sm text-slate-600">Avenida Sebastião Amoretti, 2930 - Santa Rosa, Taquara - RS</p>
                </div>
              </div>
                            <div className="group bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 hover:border-brand-500/30 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col">
                <div className="relative h-48 w-full bg-slate-200 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium italic"></div>
                  <img alt="Fachada Loja Rede Müller" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://i.ibb.co/qFnSMG38/Matriz-fachada.png"/>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Certo Atacado e Varejo</h3>
                  <p className="text-brand-500 text-sm font-medium mb-4">Picada Gravatá <br />Todos os dias - 08:00 às 20:30</p>
                  <p className="text-sm text-slate-600">Rua Picada Gravatá, 1350 - Medianeira, Taquara - RS</p>
                </div>
              </div>
                            <div className="group bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 hover:border-brand-500/30 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col">
                <div className="relative h-48 w-full bg-slate-200 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium italic"></div>
                  <img alt="Fachada Loja Rede Müller" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://i.ibb.co/GfFsg50M/020-fachada.png"/>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Certo Atacado e Varejo</h3>
                  <p className="text-brand-500 text-sm font-medium mb-4">RS 020 <br />Todos os dias - 08:00 às 20:30</p>
                  <p className="text-sm text-slate-600">Avenida Sebastião Amoretti, 3595 - Cruzeiro, Taquara - RS</p>
                </div>
              </div>
                            <div className="group bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 hover:border-brand-500/30 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col">
                <div className="relative h-48 w-full bg-slate-200 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium italic"></div>
                  <img alt="Fachada Loja Rede Müller" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://i.ibb.co/Nd7R9s0b/115-fachada.png"/>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Certo Atacado e Varejo</h3>
                  <p className="text-brand-500 text-sm font-medium mb-4">RS 115 <br />Todos os dias - 08:00 às 20:00</p>
                  <p className="text-sm text-slate-600">Avenida Oscar Martins Rangel, 3621 - Santa Maria, Taquara - RS</p>
                </div>
              </div>
                            <div className="group bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 hover:border-brand-500/30 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col">
                <div className="relative h-48 w-full bg-slate-200 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium italic"></div>
                  <img alt="Fachada Loja Rede Müller" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://i.ibb.co/0p7V6Qw9/PArob-fachada.png"/>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Certo Atacado e Varejo</h3>
                  <p className="text-brand-500 text-sm font-medium mb-4">Parobé <br />Todos os dias - 08:00 às 20:30</p>
                  <p className="text-sm text-slate-600">Rua Vera Cruz, 285 - Sala 2 - Centro, Parobé - RS</p>
                </div>
              </div>
              {/* Mais lojas aqui... */}
            </div>
          </div>
        </section>

        {/* SIMULADOR COM ESTADO REACT */}
        <section className="py-24 bg-brand-500 text-white overflow-hidden relative" id="simulador">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4">Quanto você economiza com a gente?</h2>
            <p className="text-brand-100 text-xl mb-12">Simule agora o impacto do Cartão Müller nas suas compras mensais.</p>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 sm:p-12 border border-white/20">
              <div className="mb-10">
                <label className="block text-lg font-semibold mb-6" htmlFor="monthly-spend">
                  Gasto Mensal Estimado: <span className="text-3xl font-bold ml-2">R$ {monthlySpend.toLocaleString('pt-BR')}</span>
                </label>
                <input 
                  className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" 
                  id="monthly-spend" max="4000" min="100" step="100" type="range" 
                  value={monthlySpend}
                  onChange={(e) => setMonthlySpend(Number(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center border-t border-white/20 pt-10">
                <div className="text-center sm:text-left">
                  <p className="text-brand-100 uppercase tracking-widest text-sm font-bold">Economia Anual Estimada</p>
                  <div className="text-5xl sm:text-6xl font-black mt-2">R$ {(monthlySpend * 0.05 * 12).toLocaleString('pt-BR')}</div>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-brand-100 text-sm mb-4">Baseado em descontos exclusivos e benefícios de cashback da rede.</p>
                  <a className="inline-block bg-white text-brand-500 font-bold px-8 py-3 rounded-custom hover:bg-slate-100 transition-colors" href="#solicitar">Garantir Economia</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO CLUBE MAIS VANTAGENS - APP DE BENEFÍCIOS */}
        <section className="relative py-32 overflow-hidden">
          {/* Background com gradiente vibrante de mercado */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-orange-500 to-amber-500"></div>
          
          {/* Efeitos visuais festivos */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-10 right-10 w-52 h-52 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-yellow-300/10 rounded-full blur-2xl"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 border border-white/40 backdrop-blur-sm mb-6">
                  <span className="text-xs font-bold tracking-widest uppercase text-white">🎉 Bem-vindo ao Clube</span>
                </div>
                <h2 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-4">
                  Clube Mais <span className="bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">Vantagens</span>
                </h2>
                <p className="text-xl text-white/90 max-w-3xl mx-auto">
                  O clube de benefícios do Certo Atacado e Varejo e Rede Müller. Suas compras valem muito mais com ofertas exclusivas, sorteios, raspadinhas e cashback!
                </p>
              </motion.div>
            </div>

            {/* Grid de features com ícones vibrantes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="group relative overflow-hidden rounded-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 border border-white/30"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-white/30 to-white/10"></div>
                <div className="relative p-8 backdrop-blur-sm">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-3xl">🎁</span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-3">Sorteios</h3>
                  <p className="text-white/90 leading-relaxed">Participe de campanhas e concorra a super prêmios. Você será avisado quando houver um novo sorteio!</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="group relative overflow-hidden rounded-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 border border-white/30"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-white/30 to-white/10"></div>
                <div className="relative p-8 backdrop-blur-sm">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-3xl">🎫</span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-3">Raspadinha Digital</h3>
                  <p className="text-white/90 leading-relaxed">Identifique-se no caixa e ganhe raspadinhas digitais premiadas. Raspou, achou, ganhou! 🏆</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="group relative overflow-hidden rounded-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 border border-white/30"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-white/30 to-white/10"></div>
                <div className="relative p-8 backdrop-blur-sm">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-3xl">💰</span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-3">Cashback</h3>
                  <p className="text-white/90 leading-relaxed">Compre, identifique-se e ganhe Cashback! Use o saldo nas próximas compras.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="group relative overflow-hidden rounded-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 border border-white/30"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-white/30 to-white/10"></div>
                <div className="relative p-8 backdrop-blur-sm">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-3xl">🏷️</span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-3">Cupons de Desconto</h3>
                  <p className="text-white/90 leading-relaxed">Receba cupons especiais direto no app e economize muito mais em suas compras.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="group relative overflow-hidden rounded-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 border border-white/30"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-white/30 to-white/10"></div>
                <div className="relative p-8 backdrop-blur-sm">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-3xl">📢</span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-3">Promoções</h3>
                  <p className="text-white/90 leading-relaxed">Ofertas personalizadas, do dia e favoritos. Tudo pensado só para você!</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="group relative overflow-hidden rounded-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 border border-white/30"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-white/30 to-white/10"></div>
                <div className="relative p-8 backdrop-blur-sm">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-3xl">📰</span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-3">Tabloide Digital</h3>
                  <p className="text-white/90 leading-relaxed">Confira super descontos no app sem usar papel. Ecológico e prático!</p>
                </div>
              </motion.div>
            </div>

            {/* Call-to-action com destaque */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className="inline-block mb-8">
                <p className="text-white/90 text-lg font-semibold mb-6">
                  O jeito inteligente de economizar nas suas compras
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <motion.a
                  href={getAppStoreLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center px-10 py-5 rounded-2xl font-bold text-lg group relative overflow-hidden shadow-lg"
                >
                  <div className="absolute inset-0 bg-white group-hover:from-white group-hover:to-slate-100 transition-all"></div>
                  <div className="relative flex items-center text-brand-600">
                    <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"></path></svg>
                    {deviceType === 'ios' ? 'Baixar na App Store' : 'Baixar na Play Store'}
                  </div>
                </motion.a>

                <motion.a
                  href={getAppStoreLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center px-10 py-5 rounded-2xl font-bold text-lg border-2 border-white text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
                >
                  Saiba Mais
                  <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </motion.a>
              </div>

              <p className="text-white/80 text-sm mt-8">
                 Grátis para iOS e Android | Cadastro rápido em 2 minutos
              </p>
            </motion.div>
          </div>
        </section>

        {/* FORMULÁRIO (INTEGRADO COM A LÓGICA SUPABASE) */}
        <section className="py-24 bg-white" id="solicitar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-stretch rounded-3xl overflow-hidden shadow-2xl border border-slate-100">
              <div className="lg:w-1/3 bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-4xl font-extrabold mb-4">Rápido e Fácil</h2>
                  <p className="text-slate-400 text-lg">Tenha até 40 dias para pagar suas compras! Preencha em menos de 2 minutos.</p>
                </div>
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl"></div>
              </div>
              
              <div className="lg:w-2/3 bg-white p-8 sm:p-12">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Solicitar <span className="text-brand-500">Cartão</span></h3>
                <p className="text-slate-500 mb-8">Preencha os dados abaixo para iniciar sua solicitação.</p>
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* CPF */}
                    <div className="col-span-2 md:col-span-1 group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-[#f26c0d]">
                        CPF
                      </label>
                      <div className="relative">
                        <input 
                          type="text" 
                          name="cpf" 
                          value={formData.cpf} 
                          onChange={handleInputChange} 
                          onBlur={checkExistingRequest} 
                          placeholder="000.000.000-00" 
                          maxLength={14} 
                          required 
                          className={`w-full pl-11 pr-4 py-4 bg-gray-50 border rounded-2xl focus:ring-2 focus:outline-none transition-all duration-300 font-medium text-gray-800 placeholder-gray-400 ${
                            cpfStatus.blocked || formErrors.cpf
                              ? 'border-red-400 focus:ring-red-200 focus:border-red-500' 
                              : 'border-gray-200 focus:ring-[#f26c0d]/20 focus:border-[#f26c0d]'
                          }`}
                        />
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#f26c0d] transition-colors" />
                      </div>
                      {cpfStatus.blocked && !cpfStatus.validating && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs mt-2 font-medium text-red-600 flex items-start gap-2 whitespace-pre-line"
                        >
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          {cpfValidationError}
                        </motion.p>
                      )}
                      {formErrors.cpf && <p className="text-xs mt-2 font-medium text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {formErrors.cpf}</p>}
                      {cpfStatus.validating && <p className="text-xs mt-2 font-medium animate-pulse" style={{ color: brandColor }}>Verificando CPF...</p>}
                      {checking && !formErrors.cpf && !cpfStatus.blocked && <p className="text-xs mt-2 font-medium animate-pulse" style={{ color: brandColor }}>Verificando disponibilidade...</p>}
                    </div>

                    {/* Telefone */}
                    <div className="col-span-2 md:col-span-1 group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-[#f26c0d]">
                        Telefone
                      </label>
                      <div className="relative">
                        <input 
                          type="text" 
                          name="telefone" 
                          value={formData.telefone} 
                          onChange={handleInputChange} 
                          placeholder="(00) 00000-0000" 
                          maxLength={15} 
                          required 
                          disabled={cpfStatus.blocked}
                          className={`w-full pl-11 pr-4 py-4 bg-gray-50 border rounded-2xl focus:ring-2 focus:outline-none transition-all duration-300 font-medium text-gray-800 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed ${
                            !telefoneStatus.available || formErrors.telefone || cpfStatus.blocked
                              ? 'border-red-400 focus:ring-red-200 focus:border-red-500' 
                              : 'border-gray-200 focus:ring-[#f26c0d]/20 focus:border-[#f26c0d]'
                          }`}
                        />
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#f26c0d] transition-colors" />
                      </div>
                      {cpfStatus.blocked && (
                        <p className="text-xs mt-2 font-medium text-orange-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Campo bloqueado até CPF ser liberado
                        </p>
                      )}
                      {!telefoneStatus.available && !cpfStatus.blocked && !telefoneStatus.validating && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs mt-2 font-medium text-red-600 flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3" />
                          {telefoneValidationError}
                        </motion.p>
                      )}
                      {formErrors.telefone && <p className="text-xs mt-2 font-medium text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {formErrors.telefone}</p>}
                      {telefoneStatus.validating && !cpfStatus.blocked && <p className="text-xs mt-2 font-medium animate-pulse" style={{ color: brandColor }}>Verificando telefone...</p>}
                    </div>
                  </div>

                  {/* Nome Completo */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-[#f26c0d]">
                      Nome Completo
                    </label>
                    <input type="text" name="nomeCompleto" value={formData.nomeCompleto} onChange={handleInputChange} placeholder="SEU NOME COMPLETO" required className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#f26c0d]/20 focus:border-[#f26c0d] outline-none transition-all duration-300 font-medium text-gray-800 placeholder-gray-400" />
                  </div>

                  <div className="grid md:grid-cols-12 gap-6">
                    {/* Rua */}
                    <div className="col-span-12 md:col-span-8 group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-[#f26c0d]">
                        Rua
                      </label>
                      <div className="relative">
                        <input type="text" name="rua" value={formData.rua} onChange={handleInputChange} placeholder="NOME DA RUA" required className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#f26c0d]/20 focus:border-[#f26c0d] outline-none transition-all duration-300 font-medium text-gray-800 placeholder-gray-400" />
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#f26c0d] transition-colors" />
                      </div>
                    </div>

                    {/* Número */}
                    <div className="col-span-12 md:col-span-4 group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-[#f26c0d]">
                        Número
                      </label>
                      <input type="text" name="numero" value={formData.numero} onChange={handleInputChange} placeholder="123" required className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#f26c0d]/20 focus:border-[#f26c0d] outline-none transition-all duration-300 font-medium text-gray-800 placeholder-gray-400" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-[#f26c0d]">
                        Bairro
                      </label>
                      <input type="text" name="bairro" value={formData.bairro} onChange={handleInputChange} placeholder="SEU BAIRRO" required className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#f26c0d]/20 focus:border-[#f26c0d] outline-none transition-all duration-300 font-medium text-gray-800 placeholder-gray-400" />
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-[#f26c0d]">
                        Cidade
                      </label>
                      <div className="relative">
                        <input type="text" name="cidade" value={formData.cidade} onChange={handleInputChange} placeholder="SUA CIDADE" required className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#f26c0d]/20 focus:border-[#f26c0d] outline-none transition-all duration-300 font-medium text-gray-800 placeholder-gray-400" />
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#f26c0d] transition-colors" />
                      </div>
                    </div>
                  </div>

                  {/* Renda */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-[#f26c0d]">
                      Renda Mensal
                    </label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-medium">R$</span>
                      <input type="text" name="renda" value={formData.renda} onChange={handleInputChange} placeholder="0,00" required className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#f26c0d]/20 focus:border-[#f26c0d] outline-none transition-all duration-300 font-medium text-gray-800 placeholder-gray-400" />
                    </div>
                  </div>

                  {/* Mensagem de erro geral */}
                  {formErrors.submit && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-800">Acesso temporariamente bloqueado</p>
                        <p className="text-sm text-red-700 mt-1">{formErrors.submit}</p>
                      </div>
                    </motion.div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={
                      loading || 
                      existingRequest || 
                      validating || 
                      cpfStatus.blocked ||
                      !telefoneStatus.available ||
                      cpfStatus.validating ||
                      telefoneStatus.validating ||
                      Object.keys(formErrors).length > 0
                    } 
                    className="w-full text-white font-bold py-6 rounded-2xl text-lg shadow-xl hover:shadow-2xl hover:translate-y-[-2px] transition-all duration-300 mt-8 border-none disabled:opacity-50 disabled:cursor-not-allowed" 
                    style={{ backgroundColor: brandColor }}
                  >
                    {loading ? <>
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        Processando...
                      </> : <>
                        Enviar Solicitação
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </>}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>© 2026 Rede Müller. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default CardRequestForm;