import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import RHHeader from '../components/RHHeader';
import KPIGrid from '../components/KPIGrid';
import ModuleCards from '../components/ModuleCards';
import CandidateFilters from '../components/CandidateFilters';
import CandidateList from '../components/CandidateList';
import CandidateDrawer from '../components/CandidateDrawer';
import AdminModuleDrawer from '../components/AdminModuleDrawer';
import LojasModule from '../components/LojasModule';
import CargosModule from '../components/CargosModule';
import QuestionariosModule from '../components/QuestionariosModule';
import VagasModule from '../components/VagasModule';
import { KPI_FILTERS, getNormalizedCandidateStatus } from '../lib/candidateStatusUtils';
import {
  fetchInscricoes,
  fetchLojas,
  fetchCargos,
  fetchQuestionarios,
  fetchVagas,
  updateInscricaoStatus,
  updateBancoTalentos,
} from '../lib/rhService';

const OperatorRH = () => {
  const navigate = useNavigate();

  // Estados de dados
  const [inscricoes, setInscricoes] = useState([]);
  const [candidatosFiltrados, setCandidatosFiltrados] = useState([]);
  const [lojas, setLojas] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [questionarios, setQuestionarios] = useState([]);
  const [vagas, setVagas] = useState([]);

  // Estados de UI
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Estados de módulos administrativos
  const [adminModule, setAdminModule] = useState(null); // 'lojas', 'cargos', 'questionarios', 'vagas'
  const [adminDrawerOpen, setAdminDrawerOpen] = useState(false);

  // Estados de filtros
  const [filters, setFilters] = useState({
    status: null,
    loja_id: null,
    cargo_id: null,
    como_conheceu: null,
    periodo: null,
    banco_talentos: null,
  });

  // Opções para select
  const [statusOptions, setStatusOptions] = useState([]);
  const [origemOptions, setOrigemOptions] = useState([]);

  const fetchCandidates = async () => {
    const { data, error } = await fetchInscricoes();
    if (error) throw error;
    setInscricoes(data || []);
    return data || [];
  };

  const fetchReferenceData = async () => {
    const [lojasRes, cargosRes, questionariosRes, vagasRes] = await Promise.all([
      fetchLojas(),
      fetchCargos(),
      fetchQuestionarios(),
      fetchVagas(),
    ]);

    if (lojasRes.error) throw lojasRes.error;
    if (cargosRes.error) throw cargosRes.error;
    if (questionariosRes.error) throw questionariosRes.error;
    if (vagasRes.error) throw vagasRes.error;

    setLojas(lojasRes.data || []);
    setCargos(cargosRes.data || []);
    setQuestionarios(questionariosRes.data || []);
    setVagas(vagasRes.data || []);
  };

  const refreshOperatorRhData = async () => {
    try {
      setIsLoading(true);
      const inscricoesData = await fetchCandidates();
      await fetchReferenceData();

      const statuses = [...new Set(inscricoesData.map(i => i.status))].filter(Boolean);
      const origens = [...new Set(inscricoesData.map(i => i.como_conheceu))].filter(Boolean);

      setStatusOptions(statuses);
      setOrigemOptions(origens);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados. Verifique o console.');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregamento inicial
  useEffect(() => {
    refreshOperatorRhData();
  }, []);

  // Aplicar filtros quando dados ou filtros mudam
  useEffect(() => {
    applyFilters();
  }, [inscricoes, filters, searchValue, selectedKPI]);

  const applyFilters = () => {
    let filtered = [...inscricoes];

    // Filtro por KPI selecionado (prioridade alta)
    if (selectedKPI && KPI_FILTERS[selectedKPI]) {
      filtered = filtered.filter(KPI_FILTERS[selectedKPI]);
    }

    // Filtros adicionais (aplicados após KPI, exceto quando KPI é banco_talentos)
    if (selectedKPI !== 'banco_talentos') {
      // Filtro por status (apenas se não houver KPI ativo ou se for compatível)
      if (filters.status) {
        // IMPORTANTE: Ao filtrar por um status específico, excluir todos do banco de talentos
        // porque banco tem prioridade máxima
        filtered = filtered.filter(i => {
          // Se estiver no banco de talentos, não pode ser mostrado em nenhuma outra categoria
          if (i.banco_talentos === true) {
            return false;
          }
          // Senão, filtrar pelo status
          return i.status === filters.status;
        });
      }

      // Filtro por loja
      if (filters.loja_id) {
        filtered = filtered.filter(i => i.loja_id === filters.loja_id);
      }

      // Filtro por cargo
      if (filters.cargo_id) {
        filtered = filtered.filter(i => i.cargo_id === filters.cargo_id);
      }

      // Filtro por origem
      if (filters.como_conheceu) {
        filtered = filtered.filter(i => i.como_conheceu === filters.como_conheceu);
      }

      // Filtro por período
      if (filters.periodo) {
        const agora = new Date();
        let dataLimite;

        switch (filters.periodo) {
          case '7days':
            dataLimite = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30days':
            dataLimite = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90days':
            dataLimite = new Date(agora.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            dataLimite = null;
        }

        if (dataLimite) {
          filtered = filtered.filter(i => new Date(i.created_at) >= dataLimite);
        }
      }

      // Filtro por banco de talentos (checkbox separado)
      if (filters.banco_talentos === true) {
        filtered = filtered.filter(i => i.banco_talentos === true);
      }
    }

    // Filtro por busca (nome, CPF, email, telefone)
    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase();
      filtered = filtered.filter(i =>
        i.nome_completo?.toLowerCase().includes(searchLower) ||
        i.cpf?.includes(searchValue) ||
        i.email?.toLowerCase().includes(searchLower) ||
        i.telefone_1?.includes(searchValue) ||
        i.telefone_2?.includes(searchValue)
      );
    }

    setCandidatosFiltrados(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: null,
      loja_id: null,
      cargo_id: null,
      como_conheceu: null,
      periodo: null,
      banco_talentos: null,
    });
    setSelectedKPI(null);
    setSearchValue('');
  };

  const handleViewDetails = (candidatoId) => {
    const candidato = inscricoes.find(i => i.id === candidatoId);
    setSelectedCandidate(candidato);
    setDrawerOpen(true);
  };

  const handleChangeStatus = async (candidatoId, novoStatus) => {
    try {
      const { data, error } = await updateInscricaoStatus(candidatoId, novoStatus);

      if (error) throw error;

      // Atualizar localmente apenas o item modificado
      const updated = inscricoes.map(i => {
        if (i.id === candidatoId) {
          const newCandidate = {
            ...i,
            status: novoStatus,
            banco_talentos: novoStatus === 'banco' ? true : i.banco_talentos,
          };

          if (novoStatus !== 'banco' && i.banco_talentos === true) {
            newCandidate.banco_talentos = false;
          }

          return newCandidate;
        }
        return i;
      });
      setInscricoes(updated);

      // Se o drawer está aberto, atualizar candidato selecionado
      if (selectedCandidate?.id === candidatoId) {
        const updatedCandidate = {
          ...selectedCandidate,
          status: novoStatus,
          banco_talentos: novoStatus === 'banco' ? true : selectedCandidate.banco_talentos,
        };

        if (novoStatus !== 'banco' && selectedCandidate.banco_talentos === true) {
          updatedCandidate.banco_talentos = false;
        }

        setSelectedCandidate(updatedCandidate);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
    }
  };

  // Função unificada para atualizar status
  const updateStatus = async (candidatoId, novoStatus) => {
    return handleChangeStatus(candidatoId, novoStatus);
  };

  const handleToggleTalentBank = async (candidatoId, isInTalentBank) => {
    try {
      // Quando adicionar ao banco de talentos, também atualizar status para "banco"
      if (isInTalentBank) {
        const statusUpdate = await updateInscricaoStatus(candidatoId, 'banco');
        if (statusUpdate.error) throw statusUpdate.error;
      }

      const { data, error } = await updateBancoTalentos(candidatoId, isInTalentBank);

      if (error) throw error;

      // Atualizar localmente com ambos os campos
      const updated = inscricoes.map(i => {
        if (i.id === candidatoId) {
          const newCandidate = { ...i, banco_talentos: isInTalentBank };
          // Se adicionando ao banco, garantir status = "banco"
          if (isInTalentBank) {
            newCandidate.status = 'banco';
          }
          return newCandidate;
        }
        return i;
      });
      setInscricoes(updated);

      // Se o drawer está aberto, atualizar
      if (selectedCandidate?.id === candidatoId) {
        const updated = { ...selectedCandidate, banco_talentos: isInTalentBank };
        if (isInTalentBank) {
          updated.status = 'banco';
        }
        setSelectedCandidate(updated);
      }
    } catch (error) {
      console.error('Erro ao atualizar banco de talentos:', error);
      alert('Erro ao atualizar');
    }
  };

  const handleWhatsApp = (phone) => {
    if (!phone) {
      alert('Telefone não disponível');
      return;
    }
    const phoneClean = phone.replace(/\D/g, '');
    const url = `https://wa.me/55${phoneClean}`;
    window.open(url, '_blank');
  };

  const handleNewVaga = () => {
    handleModuleClick('vagas');
  };

  const handleModuleClick = (module) => {
    setAdminModule(module);
    setAdminDrawerOpen(true);
  };

  const handleCloseAdminModule = () => {
    setAdminDrawerOpen(false);
    setAdminModule(null);
  };

  return (
    <>
      <Helmet>
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
        <RHHeader
          onSearch={setSearchValue}
          searchValue={searchValue}
          onRefresh={refreshOperatorRhData}
          onNewVaga={handleNewVaga}
          isLoading={isLoading}
        />

        {/* KPI Grid */}
        <KPIGrid
          inscricoes={inscricoes}
          selectedFilter={selectedKPI}
          onFilterChange={setSelectedKPI}
        />

        {/* Module Cards */}
        <ModuleCards onModuleClick={handleModuleClick} />

        {/* Separador */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        </div>

        {/* Candidate Filters */}
        <CandidateFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          lojas={lojas}
          cargos={cargos}
          statusOptions={statusOptions}
          origemOptions={origemOptions}
          selectedKPI={selectedKPI}
        />

        {/* Candidate List */}
        <CandidateList
          candidatos={candidatosFiltrados}
          isLoading={isLoading}
          onViewDetails={handleViewDetails}
          onWhatsApp={handleWhatsApp}
          onChangeStatus={updateStatus}
          onToggleTalentBank={handleToggleTalentBank}
          onReject={(id) => updateStatus(id, 'reprovado')}
        />

        {/* Candidate Drawer */}
        <CandidateDrawer
          isOpen={drawerOpen}
          candidato={selectedCandidate}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedCandidate(null);
          }}
          onToggleTalentBank={handleToggleTalentBank}
          onChangeStatus={updateStatus}
          onWhatsApp={handleWhatsApp}
        />

        {/* Admin Module Drawer */}
        <AdminModuleDrawer
          isOpen={adminDrawerOpen}
          onClose={handleCloseAdminModule}
          title={
            adminModule === 'lojas' ? 'Gerenciar Lojas' :
            adminModule === 'cargos' ? 'Gerenciar Cargos' :
            adminModule === 'questionarios' ? 'Gerenciar Questionários' :
            adminModule === 'vagas' ? 'Gerenciar Vagas' : ''
          }
          subtitle={
            adminModule === 'lojas' ? 'Cadastrar e gerenciar lojas da empresa' :
            adminModule === 'cargos' ? 'Cadastrar e gerenciar cargos disponíveis' :
            adminModule === 'questionarios' ? 'Criar e gerenciar questionários para vagas' :
            adminModule === 'vagas' ? 'Cadastrar e gerenciar vagas abertas' : ''
          }
        >
          {adminModule === 'lojas' && (
            <LojasModule isOpen={adminDrawerOpen} onClose={handleCloseAdminModule} />
          )}
          {adminModule === 'cargos' && (
            <CargosModule isOpen={adminDrawerOpen} onClose={handleCloseAdminModule} />
          )}
          {adminModule === 'questionarios' && (
            <QuestionariosModule isOpen={adminDrawerOpen} onClose={handleCloseAdminModule} />
          )}
          {adminModule === 'vagas' && (
            <VagasModule isOpen={adminDrawerOpen} onClose={handleCloseAdminModule} />
          )}
        </AdminModuleDrawer>
      </div>
    </>
  );
};

export default OperatorRH;