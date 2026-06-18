import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, MapPin, Building2, Loader2, Briefcase } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';
import VagaCard from '../components/VagaCard';
import VagaDetalhe from '../components/VagaDetalhe';
import FormCandidatura from '../components/FormCandidatura';
import { fetchVagasPublicas, fetchLojas } from '../lib/rhService';

const VagasPage = () => {
  const { toast } = useToast();
  const [vagas, setVagas] = useState([]);
  const [vagasFiltradas, setVagasFiltradas] = useState([]);
  const [lojas, setLojas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de busca
  const [busca, setBusca] = useState('');
  const [cidadeSelecionada, setCidadeSelecionada] = useState('');

  // Estados dos modais
  const [vagaSelecionada, setVagaSelecionada] = useState(null);
  const [modalDetalheAberto, setModalDetalheAberto] = useState(false);
  const [modalCandidaturaAberto, setModalCandidaturaAberto] = useState(false);

  // Carregar dados
  useEffect(() => {
    carregarDados();
  }, []);

  // Filtrar vagas
  useEffect(() => {
    filtrarVagas();
  }, [vagas, busca, cidadeSelecionada]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [vagasResult, lojasResult] = await Promise.all([
        fetchVagasPublicas(),
        fetchLojas()
      ]);

      console.log('RESULTADO VAGAS:', vagasResult);
      console.log('RESULTADO LOJAS:', lojasResult);

      if (vagasResult.error) throw vagasResult.error;
      if (lojasResult.error) throw lojasResult.error;

      setVagas(vagasResult.data || []);
      setLojas(lojasResult.data || []);

      console.log('VAGAS SETADAS:', vagasResult.data);
      console.log('LOJAS SETADAS:', lojasResult.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as vagas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filtrarVagas = () => {
    let filtradas = vagas;

    // Filtro por busca (nome do cargo)
    if (busca.trim()) {
      filtradas = filtradas.filter(vaga =>
        vaga.cargos?.nome?.toLowerCase().includes(busca.toLowerCase())
      );
    }

    // Filtro por cidade
    if (cidadeSelecionada) {
      filtradas = filtradas.filter(vaga =>
        vaga.lojas?.cidade === cidadeSelecionada
      );
    }

    setVagasFiltradas(filtradas);
  };

  const handleVerVaga = (vaga) => {
    setVagaSelecionada(vaga);
    setModalDetalheAberto(true);
  };

  const handleFecharDetalhe = () => {
    setModalDetalheAberto(false);
    setVagaSelecionada(null);
  };

  const handleCandidatar = (vaga) => {
    setVagaSelecionada(vaga);
    setModalDetalheAberto(false);
    setModalCandidaturaAberto(true);
  };

  const handleFecharCandidatura = () => {
    setModalCandidaturaAberto(false);
    setVagaSelecionada(null);
  };

  const handleCandidaturaSucesso = () => {
    toast({
      title: 'Sucesso!',
      description: 'Sua candidatura foi enviada com sucesso. Entraremos em contato em breve!',
    });
  };

  // Obter cidades únicas das lojas
  const cidadesUnicas = [...new Set(lojas.map(loja => loja.cidade).filter(Boolean))].sort();

  return (
    <>
      <Helmet>
        <title>Vagas - Grupo Müller</title>
        <meta name="description" content="Encontre oportunidades de emprego no Grupo Müller. Vagas abertas em diversas lojas." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      <div
        className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100"
        style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
      >
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3 md:py-5">
              {/* Logo */}
              <a 
                href="/" 
                className="flex-shrink-0 hover:opacity-75 transition-opacity duration-200"
                title="Voltar para home"
              >
                <img 
                  src="https://i.ibb.co/cXwpq4sq/Logo-Grupo-Muller.png" 
                  alt="Logo Grupo Müller" 
                  className="h-12 md:h-16 w-auto"
                />
              </a>

              {/* Navegação */}
              <nav className="hidden md:flex items-center gap-8">
                <a 
                  href="/" 
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Início
                </a>
                <a 
                  href="/vagas" 
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
                >
                  Vagas
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Oportunidades que fazem a diferença
              </h1>
              <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
                Junte-se ao Grupo Müller e faça parte de uma equipe que valoriza o seu potencial.
              </p>
            </motion.div>

            {/* Barra de busca */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="bg-white rounded-2xl p-6 shadow-2xl max-w-2xl mx-auto"
            >
              <div className="grid md:grid-cols-3 gap-4">
                {/* Busca por cargo */}
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por cargo..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-colors"
                  />
                </div>

                {/* Filtro por cidade */}
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <select
                    value={cidadeSelecionada}
                    onChange={(e) => setCidadeSelecionada(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-colors appearance-none"
                  >
                    <option value="">Todas as cidades</option>
                    {cidadesUnicas.map(cidade => (
                      <option key={cidade} value={cidade}>{cidade}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Lista de vagas */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-orange-600 mb-4" />
              <p className="text-slate-600">Carregando vagas...</p>
            </div>
          ) : vagasFiltradas.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Building2 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {vagas.length === 0 ? 'Nenhuma vaga disponível' : 'Nenhuma vaga encontrada'}
              </h3>
              <p className="text-slate-600 mb-6">
                {vagas.length === 0
                  ? 'No momento não há vagas abertas. Volte em breve!'
                  : 'Tente ajustar os filtros de busca.'
                }
              </p>
              {(busca || cidadeSelecionada) && (
                <button
                  onClick={() => {
                    setBusca('');
                    setCidadeSelecionada('');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </motion.div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Vagas disponíveis
                  </h2>
                  <p className="text-slate-600 mt-1">
                    {vagasFiltradas.length} {vagasFiltradas.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vagasFiltradas.map((vaga) => (
                  <VagaCard
                    key={vaga.id}
                    vaga={vaga}
                    onVerVaga={handleVerVaga}
                  />
                ))}
              </div>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-slate-900 text-white py-14 md:py-16 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
              {/* Bloco de Marca */}
              <div className="flex flex-col items-center md:items-start">
                <a 
                  href="/" 
                  className="hover:opacity-75 transition-opacity duration-200 mb-5"
                  title="Voltar para home"
                >
                  <img 
                    src="https://i.ibb.co/cXwpq4sq/Logo-Grupo-Muller.png" 
                    alt="Logo Grupo Müller" 
                    className="h-14 md:h-16 w-auto"
                  />
                </a>
                <p className="text-slate-300 text-sm leading-relaxed text-center md:text-left max-w-xs">
                  Transformar a nossa casa no seu segundo lar
                </p>
              </div>

              {/* Links Úteis */}
              <div className="flex flex-col items-center md:items-start">
                <h3 className="font-semibold mb-5 text-base">Links úteis</h3>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li>
                    <a href="/" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                      Início
                    </a>
                  </li>
                  <li>
                    <a href="/vagas" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                      Vagas
                    </a>
                  </li>
                </ul>
              </div>

              {/* Contato */}
              <div className="flex flex-col items-center md:items-start">
                <h3 className="font-semibold mb-5 text-base">Contato</h3>
                <div className="text-sm text-slate-300 space-y-3 text-center md:text-left">
                  <p className="flex items-center justify-center md:justify-start gap-2">
                    <span>📧</span> contato@redemuller.com.br
                  </p>
                  <p className="flex items-center justify-center md:justify-start gap-2">
                    <span>📞</span> (51) 99119-8639
                  </p>
                  <p className="flex items-center justify-center md:justify-start gap-2">
                    <span>📍</span> Taquara, RS
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
              <p>&copy; 2026 Grupo Müller. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>

        {/* Modais */}
        <VagaDetalhe
          vaga={vagaSelecionada}
          isOpen={modalDetalheAberto}
          onClose={handleFecharDetalhe}
          onCandidatar={handleCandidatar}
        />

        <FormCandidatura
          vaga={vagaSelecionada}
          isOpen={modalCandidaturaAberto}
          onClose={handleFecharCandidatura}
          onSuccess={handleCandidaturaSucesso}
        />
      </div>
    </>
  );
};

export default VagasPage;
