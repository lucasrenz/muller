import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Loader2, 
  RefreshCw, 
  Eye, 
  Phone,
  Calendar,
  Edit2,
  FileText,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  FileSignature,
  MessageCircle,
  LogOut
} from 'lucide-react';
import RequestDataModal from '@/components/RequestDataModal';
import ResponseDecisionModal from '@/components/ResponseDecisionModal';
import EditStatusModal from '@/components/EditStatusModal';
import ContractLoadingOverlay from '@/components/ContractLoadingOverlay';
import WhatsAppMessageModal from '@/components/WhatsAppMessageModal';
import { generateAndOpenContract } from '@/lib/contractUtils';

// Skeleton Loader para infinite scroll
const SkeletonRow = () => (
  <tr className="border-b border-gray-100 hover:bg-gray-50">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gray-200 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
    </td>
    <td className="px-6 py-4">
      <div className="h-8 w-40 bg-gray-200 rounded-full animate-pulse" />
    </td>
    <td className="px-6 py-4">
      <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
    </td>
  </tr>
);

// Visual: StatusBadge component (UI only)
const StatusBadge = ({ status, contrato }) => {
  const s = (status || '').toLowerCase().trim();
  const contratoLower = (contrato || '').toLowerCase().trim();
  const effective = contratoLower === 'assinado' ? 'assinado' : s;

  const map = {
    em_analise: { bg: 'bg-amber-50', text: 'text-amber-700', icon: '⏳' },
    recusado: { bg: 'bg-red-50', text: 'text-red-700', icon: '✖' },
    reprovado: { bg: 'bg-red-50', text: 'text-red-700', icon: '✖' },
    aprovado: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '✔' },
    aguardando_documentacao: { bg: 'bg-amber-100', text: 'text-amber-700', icon: '📁' },
    aguardando_assinatura: { bg: 'bg-purple-50', text: 'text-purple-700', icon: '🖋️' },
    assinado: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '📄' },
  };

  const info = map[effective] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '●' };

  const labels = {
    em_analise: 'Em análise',
    aprovado: 'Aprovado',
    recusado: 'Reprovado',
    reprovado: 'Reprovado',
    aguardando_documentacao: 'Aguardando Documentação',
    aguardando_assinatura: 'Aguardando Assinatura',
    assinado: 'Assinado',
  };

  return (
    <span
      className={`inline-flex items-center h-9 min-w-[140px] px-3 rounded-full ${info.bg} ${info.text} text-sm font-semibold transition-all duration-150 whitespace-nowrap`}
      style={{ gap: 8 }}
    >
      <span className="text-xs opacity-90">{info.icon}</span>
      <span>{labels[effective] || status || contrato || '-'}</span>
    </span>
  );
};

// Action button styles (UI only)
const actionBase = 'inline-flex items-center h-9 px-3 rounded-[12px] text-sm font-semibold gap-2 transition-all duration-150 whitespace-nowrap';
const actionPrimary = `${actionBase} bg-purple-600 text-white hover:shadow-md hover:brightness-95`;
const actionSecondary = `${actionBase} bg-white border border-gray-200 text-gray-700 hover:bg-gray-50`;
const actionIcon = 'inline-flex items-center justify-center h-9 w-9 rounded-[10px] text-gray-600 hover:bg-gray-50 transition-all';

const normalizeStatus = (status) => {
  const statusMap = {
    reprovado: 'recusado',
    aprovado: 'aprovado',
    assinado: 'assinado',
    aguardando_documentacao: 'aguardando_documentacao',
    aguardando_assinatura: 'aguardando_assinatura',
    em_analise: 'em_analise',
  };
  return statusMap[status] || status;
};

const OperatorDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [responseModalOpen, setResponseModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  const [requestToRespond, setRequestToRespond] = useState(null);
  const [editStatusModalOpen, setEditStatusModalOpen] = useState(false);
  const [requestToEditStatus, setRequestToEditStatus] = useState(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [requestForWhatsapp, setRequestForWhatsapp] = useState(null);
  const [activeFilter, setActiveFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Paginação e infinite scroll
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const abortControllerRef = useRef(null);

  // Contadores separados
  const [counters, setCounters] = useState({
    total: 0,
    em_analise: 0,
    recusado: 0,
    aguardando_documentacao: 0,
    aguardando_assinatura: 0,
    assinados: 0,
    ultimos_7_dias: 0,
  });

  const observerTargetRef = useRef(null);

  // Função para buscar contadores gerais
  const fetchCounters = useCallback(async () => {
    try {
      const { count: totalCount } = await supabase
        .from('solicitacoes')
        .select('id', { count: 'exact', head: true });

      const statuses = [
        'em_analise',
        'recusado',
        'aguardando_documentacao',
        'aguardando_assinatura',
        'aprovado',
      ];

      const countersData = { total: totalCount || 0 };

      for (const status of statuses) {
        let query = supabase.from('solicitacoes').select('id', { count: 'exact', head: true });

        if (status === 'recusado') {
          query = query.or('status.eq.recusado');
        } else {
          query = query.eq('status', status);
        }

        const { count } = await query;
        countersData[status] = count || 0;
      }

      const { count: signedCount } = await supabase
        .from('solicitacoes')
        .select('id', { count: 'exact', head: true })
        .eq('contrato', 'assinado');

      countersData.assinados = signedCount || 0;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoISO = sevenDaysAgo.toISOString();

      const { count: last7DaysCount } = await supabase
        .from('solicitacoes')
        .select('id', { count: 'exact', head: true })
        .gte('data_criacao', sevenDaysAgoISO);

      countersData.ultimos_7_dias = last7DaysCount || 0;

      setCounters(countersData);
    } catch (error) {
      console.error('Erro ao buscar contadores:', error);
    }
  }, []);

  // Nova função centralizada para buscar solicitações
  const fetchSolicitacoes = async ({ statusFilter, offset, limit, searchTerm }) => {
    let query = supabase
      .from('solicitacoes')
      .select('*')
      .order('data_criacao', { ascending: false })
      .range(offset, offset + limit - 1);

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    if (searchTerm) {
      const cpfLimpo = searchTerm.replace(/\D/g, '');
      query = query.or(
        `nome_completo.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`
      );

      if (cpfLimpo.length >= 3) {
        query = query.or(
          `nome_completo.ilike.%${searchTerm}%,cpf.ilike.%${cpfLimpo}%`
        );
      }
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data,
      hasMore: count > offset + limit,
    };
  };

  // Função para buscar registros com paginação
  const fetchRequestsPage = useCallback(
    async (filterType = activeFilter, pageOffset = 0) => {
      // Cancelar requisição anterior se ainda estiver em andamento
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const from = pageOffset;
      const to = pageOffset + 49; // 50 registros por página

      try {
        let query = supabase
          .from('solicitacoes')
          .select('*')
          .order('data_criacao', { ascending: false })
          .range(from, to);

        // Aplicar filtros (preferível aplicar no Supabase para performance)
        if (filterType !== 'todos') {
          if (filterType === 'recusado') {
            query = query.or('status.eq.recusado,status.eq.reprovado');
          } else if (filterType === 'assinados') {
            query = query.or('status.eq.assinado,contrato.eq.assinado');
          } else if (filterType === 'aguardando_assinatura') {
            query = query.eq('status', filterType);
          } else if (filterType === 'aprovado') {
            // Comparação case-insensitive: usar ILIKE para garantir correspondência como 'APROVADO', 'Aprovado', etc.
            query = query.ilike('status', 'aprovado');
          } else {
            query = query.eq('status', filterType);
          }
        }

        const { data, error } = await query;

        if (error) throw error;

        // Verificar se há mais registros
        const hasMoreRecords = (data?.length || 0) === 50;

        if (pageOffset === 0) {
          // Primeira página: substituir
          setRequests(data || []);
        } else {
          // Próximas páginas: append
          setRequests((prev) => [...prev, ...(data || [])]);
        }

        setHasMore(hasMoreRecords);
        setOffset(to + 1);

        return data;
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Erro ao buscar solicitações:', error);
          toast({
            variant: 'destructive',
            title: 'Erro ao carregar solicitações',
            description:
              error.message || 'Não foi possível carregar a lista de solicitações.',
          });
        }
        return [];
      }
    },
    [activeFilter, toast]
  );

  // Função para carregar mais registros
  const loadMoreRequests = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    try {
      const { data, hasMore: newHasMore } = await fetchSolicitacoes({
        statusFilter: activeFilter,
        offset: requests.length,
        limit: 50,
        searchTerm: debouncedSearchTerm,
      });

      setRequests((prev) => [...prev, ...data]);
      setHasMore(newHasMore);
    } catch (error) {
      console.error('Erro ao carregar mais solicitações:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Computar contadores de forma otimizada (usando estado de contadores)
  const dashboardCounts = useMemo(() => {
    return {
      total: counters.total,
      em_analise: counters.em_analise,
      recusado: counters.recusado,
      aguardando_documentacao: counters.aguardando_documentacao,
      aguardando_assinatura: counters.aguardando_assinatura,
      assinados: counters.assinados,
      ultimos_7_dias: counters.ultimos_7_dias,
    };
  }, [counters]);

  // Filtrar lista baseado no filtro ativo (apenas filtra dados em memória)
  const filteredRequests = useMemo(() => {
    let base = requests;

    if (debouncedSearchTerm) {
      const termo = debouncedSearchTerm.toLowerCase().trim();
      const cpfBusca = termo.replace(/\D/g, '');

      base = base.filter((r) => {
        const nome = (r.nome_completo || '').toLowerCase();
        const cpfSemMascara = (r.cpf || '').replace(/\D/g, '');

        const matchNome = nome.includes(termo);
        const matchCpf = cpfBusca.length >= 3 ? cpfSemMascara.includes(cpfBusca) : false;

        return matchNome || matchCpf;
      });
    }

    if (activeFilter === 'todos') return base;
    if (activeFilter === 'em_analise') return base.filter(r => (r.status || '').toLowerCase() === 'em_analise');
    if (activeFilter === 'aprovado') return base.filter(r => (r.status || '').toLowerCase() === 'aprovado');
    if (activeFilter === 'recusado') return base.filter(r => {
      const s = (r.status || '').toLowerCase();
      return s === 'recusado' || s === 'reprovado';
    });
    if (activeFilter === 'aguardando_documentacao') return base.filter(r => (r.status || '').toLowerCase() === 'aguardando_documentacao');
    if (activeFilter === 'aguardando_assinatura') return base.filter(r => (r.status || '').toLowerCase() === 'aguardando_assinatura');
    if (activeFilter === 'assinados') return base.filter(r => {
      const contrato = (r.contrato || '').toLowerCase();
      const status = (r.status || '').toLowerCase();
      return contrato === 'assinado' || status === 'assinado';
    });

    return base;
  }, [requests, activeFilter, debouncedSearchTerm]);

  // Efeito: Carregar dados iniciais
  useEffect(() => {
    const initLoad = async () => {
      setLoading(true);
      await fetchCounters();
      await fetchRequestsPage('todos', 0);
      setLoading(false);
    };
    initLoad();
  }, []);

  // Efeito: Resetar paginação ao trocar de filtro
  useEffect(() => {
    const resetAndFetch = async () => {
      setOffset(0);
      setHasMore(true);
      setRequests([]);
      await fetchRequestsPage(activeFilter, 0);
    };
    resetAndFetch();
  }, [activeFilter, fetchRequestsPage]);

  // Efeito: Configurar IntersectionObserver para infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isLoadingMore &&
          hasMore &&
          !loading
        ) {
          loadMoreRequests();
        }
      },
      { threshold: 0.1 }
    );

    const target = observerTargetRef.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [isLoadingMore, hasMore, loadMoreRequests, loading]);

  const handleStatusChange = async (id, newStatus) => {
    setUpdating(id);

    try {
      const { error: updateError } = await supabase
        .from('solicitacoes')
        .update({
          status: newStatus,
          data_atualizacao: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      try {
        const { data: configData } = await supabase
          .from('configuracoes')
          .select('webhook_status_cartao')
          .maybeSingle();

        const updatedRequest = requests.find(r => r.id === id);
        
        if (configData?.webhook_status_cartao && updatedRequest) {
          await fetch(configData.webhook_status_cartao, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...updatedRequest,
              status: newStatus,
              data_atualizacao: new Date().toISOString(),
            }),
          });
        }
      } catch (webhookError) {
        console.error('Webhook error (non-blocking):', webhookError);
      }

      // Atualizar o registro localmente
      setRequests(prev => 
        prev.map(r => r.id === id ? { ...r, status: newStatus, data_atualizacao: new Date().toISOString() } : r)
      );

      // Atualizar contadores
      await fetchCounters();

      const statusLabels = {
        em_analise: 'Em análise',
        aprovado: 'Aprovado',
        recusado: 'Recusado',
        aguardando_documentacao: 'Aguardando Documentação',
        aguardando_assinatura: 'Aguardando Assinatura',
        assinado: 'Assinado',
      };

      toast({
        title: "Status atualizado",
        description: `Status alterado para ${statusLabels[newStatus] || newStatus}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar status",
        description: error.message || "Não foi possível atualizar o status da solicitação.",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleEditStatus = (request) => {
    setRequestToEditStatus(request);
    setEditStatusModalOpen(true);
  };

  const handleSaveStatusEdit = async (newStatus, notes) => {
    if (!requestToEditStatus) return;
    setUpdating(requestToEditStatus.id);

    try {
      const updateData = {
        status: newStatus,
        data_atualizacao: new Date().toISOString(),
      };

      if (notes) {
        updateData.notas_alteracao = notes;
      }

      const { error: updateError } = await supabase
        .from('solicitacoes')
        .update(updateData)
        .eq('id', requestToEditStatus.id);

      if (updateError) throw updateError;

      try {
        const { data: configData } = await supabase
          .from('configuracoes')
          .select('webhook_status_cartao')
          .maybeSingle();

        if (configData?.webhook_status_cartao && requestToEditStatus) {
          await fetch(configData.webhook_status_cartao, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...requestToEditStatus,
              status: newStatus,
              data_atualizacao: new Date().toISOString(),
              tipo_atualizacao: 'edicao_manual',
              notas_alteracao: notes,
            }),
          });
        }
      } catch (webhookError) {
        console.error('Webhook error (non-blocking):', webhookError);
      }

      // Atualizar o registro localmente
      setRequests(prev =>
        prev.map(r => 
          r.id === requestToEditStatus.id 
            ? { ...r, status: newStatus, data_atualizacao: new Date().toISOString(), notas_alteracao: notes || r.notas_alteracao }
            : r
        )
      );

      // Atualizar contadores
      await fetchCounters();
      setEditStatusModalOpen(false);

      const statusLabels = {
        em_analise: 'Em análise',
        aprovado: 'Aprovado',
        recusado: 'Recusado',
      };

      toast({
        title: "Status atualizado",
        description: `Status alterado para ${statusLabels[newStatus]}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar status",
        description: error.message || "Não foi possível atualizar o status.",
      });
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status, contrato) => {
    const s = (status || '').toLowerCase().trim();
    const contratoLower = (contrato || '').toLowerCase().trim();

    // Prioritize showing 'Assinado' if contrato indicates signed
    const effective = contratoLower === 'assinado' ? 'assinado' : s;

    const styles = {
      em_analise: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      aprovado: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      recusado: 'bg-red-50 text-red-700 ring-1 ring-red-200',
      reprovado: 'bg-red-50 text-red-700 ring-1 ring-red-200',
      aguardando_documentacao: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      aguardando_assinatura: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
      assinado: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    };

    const labels = {
      em_analise: 'Em análise',
      aprovado: 'Aprovado',
      recusado: 'Recusado',
      reprovado: 'Reprovado',
      aguardando_documentacao: 'Aguardando Documentação',
      aguardando_assinatura: 'Aguardando Assinatura',
      assinado: 'Assinado',
    };

    const dotClass = effective === 'aprovado' ? 'bg-emerald-500'
      : effective === 'recusado' || effective === 'reprovado' ? 'bg-red-500'
      : effective === 'aguardando_assinatura' ? 'bg-purple-500'
      : effective === 'assinado' ? 'bg-blue-500'
      : 'bg-amber-500';

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[effective] || 'bg-gray-100 text-gray-800'}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotClass}`} />
        {labels[effective] || (status || contrato || '-')}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${day} ${month} • ${time}`;
  };

  const handleViewData = (request) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };

  const handleRespond = (request) => {
    setRequestToRespond(request);
    setResponseModalOpen(true);
  };

  const handleApprove = async (limite, senha) => {
    // Suporta chamada tanto com (limite, senha) quanto com um objeto atualizado
    if (!requestToRespond) return;

    const isObject = typeof limite === 'object' && limite !== null && limite.id;
    const payload = isObject
      ? limite
      : { ...requestToRespond, limite, senha };

    setUpdating(requestToRespond.id);

    try {
      const { error: updateError } = await supabase
        .from('solicitacoes')
        .update({
          status: 'aguardando_documentacao',
          contrato: 'pendente',
          limite: payload.limite,
          senha: payload.senha,
          data_atualizacao: new Date().toISOString(),
        })
        .eq('id', requestToRespond.id);

      if (updateError) throw updateError;

      try {
        const { data: configData } = await supabase
          .from('configuracoes')
          .select('webhook_status_cartao')
          .maybeSingle();

        if (configData?.webhook_status_cartao && requestToRespond) {
          await fetch(configData.webhook_status_cartao, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...requestToRespond,
              status: 'aguardando_documentacao',
              limite: payload.limite,
              senha: payload.senha,
              contrato: 'pendente',
              data_atualizacao: new Date().toISOString(),
            }),
          });
        }
      } catch (webhookError) {
        console.error('Webhook error (non-blocking):', webhookError);
      }

      // Atualizar o registro localmente
      setRequests(prev =>
        prev.map(r =>
          r.id === requestToRespond.id
            ? {
              ...r,
              status: 'aguardando_documentacao',
              contrato: 'pendente',
              limite: payload.limite,
              senha: payload.senha,
              data_atualizacao: new Date().toISOString(),
            }
            : r
        )
      );

      // Atualizar contadores
      await fetchCounters();
      setResponseModalOpen(false);

      toast({
        title: "Solicitação aprovada",
        description: "A solicitação foi aprovada e está aguardando documentação",
      });
    } catch (error) {
      console.error("Error approving request:", error);
      toast({
        variant: "destructive",
        title: "Erro ao aprovar",
        description: error.message || "Não foi possível aprovar a solicitação.",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (motivo) => {
    if (!requestToRespond) return;
    setUpdating(requestToRespond.id);

    try {
      const { error: updateError } = await supabase
        .from('solicitacoes')
        .update({
          status: 'recusado',
          recusa_motivo: motivo,
          data_atualizacao: new Date().toISOString(),
        })
        .eq('id', requestToRespond.id);

      if (updateError) throw updateError;

      try {
        const { data: configData } = await supabase
          .from('configuracoes')
          .select('webhook_status_cartao')
          .maybeSingle();

        if (configData?.webhook_status_cartao && requestToRespond) {
          await fetch(configData.webhook_status_cartao, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...requestToRespond,
              status: 'recusado',
              recusa_motivo: motivo,
              data_atualizacao: new Date().toISOString(),
            }),
          });
        }
      } catch (webhookError) {
        console.error('Webhook error (non-blocking):', webhookError);
      }

      // Atualizar o registro localmente
      setRequests(prev =>
        prev.map(r =>
          r.id === requestToRespond.id
            ? {
              ...r,
              status: 'recusado',
              recusa_motivo: motivo,
              data_atualizacao: new Date().toISOString(),
            }
            : r
        )
      );

      // Atualizar contadores
      await fetchCounters();
      setResponseModalOpen(false);

      toast({
        title: "Solicitação recusada",
        description: "A solicitação foi recusada",
      });
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({
        variant: "destructive",
        title: "Erro ao recusar",
        description: error.message || "Não foi possível recusar a solicitação.",
      });
    } finally {
      setUpdating(null);
    }
  };

  const getClienteInfo = (request) => {
    const s = (request.status || '').toLowerCase();

    if (s === 'aprovado' || s === 'aguardando_documentacao' || s === 'aguardando_assinatura') {
      return {
        label: request.nome_completo || 'Não informado',
        detail: `Limite: ${request.limite || '-'}`,
      };
    }

    if (s === 'recusado') {
      return {
        label: request.nome_completo || 'Não informado',
        detail: `Recusado por: ${request.recusa_motivo || '-'}`,
      };
    }

    return {
      label: request.nome_completo || 'Não informado',
      detail: null,
    };
  };

  const handleGenerateContract = async (request) => {
    setContractLoading(true);

    try {
      await generateAndOpenContract(request);

      setTimeout(() => {
        setContractLoading(false);
        toast({
          title: "Contrato gerado",
          description: "O contrato foi aberto para visualização e impressão",
        });
      }, 8000);
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      setContractLoading(false);
      toast({
        variant: "destructive",
        title: "Erro ao gerar contrato",
        description: error.message || "Não foi possível gerar o contrato",
      });
    }
  };

  const handleWhatsAppClick = (request) => {
    setRequestForWhatsapp(request);
    setWhatsappModalOpen(true);
  };

  const handleSendWhatsApp = async (templateId, customMessage) => {
    if (!requestForWhatsapp) return;

    try {
      // Buscar webhook URL de mensagens
      const { data: configData } = await supabase
        .from('configuracoes')
        .select('webhook_mensagem')
        .maybeSingle();

      if (configData?.webhook_mensagem) {
        // Padronizar numero_template: 0 para texto manual, 1/2/3 para modelos
        const numeroTemplate = customMessage ? 0 : templateId;

        const payload = {
          ...requestForWhatsapp,
          numero_template: numeroTemplate,
          mensagem_texto: customMessage,
          tipo_acao: 'envio_whatsapp',
          data_envio: new Date().toISOString(),
        };

        const response = await fetch(configData.webhook_mensagem, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Erro ao enviar mensagem via webhook');
        }
      }

      toast({
        title: "Mensagem enviada",
        description: customMessage
          ? "Mensagem personalizada enviada com sucesso via WhatsApp"
          : `Modelo ${templateId} enviado com sucesso via WhatsApp`,
      });
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar a mensagem",
      });
    }
  };

  // Adiciona debounce para o termo de busca
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms de atraso

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Helmet>
        <title>Dashboard - Grupo Muller</title>
        <meta name="description" content="Dashboard de solicitações de cartão Grupo Muller" />
      </Helmet>

      {/* Header Fixo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Grupo Muller</h1>
                <p className="text-xs text-gray-500">Painel de Solicitações</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-80">
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-10 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white shadow-sm"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              <Button
                onClick={() => {
                  setLoading(true);
                  fetchCounters().then(() => setLoading(false));
                }}
                disabled={loading}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Cards de Resumo - NOVA ORDEM: Total, Em Análise, Reprovados, Aguardando Documentação, Aguardando Assinatura, Assinado */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8"
              >
                {/* Card: Total */}
                <motion.button
                  onClick={() => setActiveFilter('todos')}
                  whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)' }}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    activeFilter === 'todos'
                      ? 'border-gray-600 bg-gray-50/50'
                      : 'border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <BarChart3 className={`w-6 h-6 ${activeFilter === 'todos' ? 'text-gray-700' : 'text-gray-600'}`} />
                    {activeFilter === 'todos' && (
                      <div className="w-2 h-2 rounded-full bg-gray-600" />
                    )}
                  </div>
                  <p className={`text-sm font-medium mb-2 ${activeFilter === 'todos' ? 'text-gray-800' : 'text-gray-600'}`}>
                    Total
                  </p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardCounts.total}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    cadastros gerais
                  </p>
                </motion.button>

                {/* Card: Em Análise */}
                <motion.button
                  onClick={() => setActiveFilter('em_analise')}
                  whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)' }}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    activeFilter === 'em_analise'
                      ? 'border-amber-500 bg-amber-50/50'
                      : 'border-gray-200 bg-white hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Clock className={`w-6 h-6 ${activeFilter === 'em_analise' ? 'text-amber-600' : 'text-amber-500'}`} />
                    {activeFilter === 'em_analise' && (
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                  <p className={`text-sm font-medium mb-2 ${activeFilter === 'em_analise' ? 'text-amber-700' : 'text-gray-600'}`}>
                    Em Análise
                  </p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardCounts.em_analise}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    pendentes de análise
                  </p>
                </motion.button>

                {/* Card: Reprovados */}
                <motion.button
                  onClick={() => setActiveFilter('recusado')}
                  whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)' }}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    activeFilter === 'recusado'
                      ? 'border-red-500 bg-red-50/50'
                      : 'border-gray-200 bg-white hover:border-red-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <XCircle className={`w-6 h-6 ${activeFilter === 'recusado' ? 'text-red-600' : 'text-red-500'}`} />
                    {activeFilter === 'recusado' && (
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    )}
                  </div>
                  <p className={`text-sm font-medium mb-2 ${activeFilter === 'recusado' ? 'text-red-700' : 'text-gray-600'}`}>
                    Reprovados
                  </p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardCounts.recusado}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    total de recusas
                  </p>
                </motion.button>

                {/* Card: Aguardando Documentação */}
                <motion.button
                  onClick={() => setActiveFilter('aguardando_documentacao')}
                  whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)' }}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    activeFilter === 'aguardando_documentacao'
                      ? 'border-amber-500 bg-amber-50/50'
                      : 'border-gray-200 bg-white hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Clock className={`w-6 h-6 ${activeFilter === 'aguardando_documentacao' ? 'text-amber-600' : 'text-amber-500'}`} />
                    {activeFilter === 'aguardando_documentacao' && (
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                  <p className={`text-sm font-medium mb-2 ${activeFilter === 'aguardando_documentacao' ? 'text-amber-700' : 'text-gray-600'}`}>
                    Aguardando Documentação
                  </p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardCounts.aguardando_documentacao}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Documentação pendente
                  </p>
                </motion.button>

                {/* Card: Aguardando Assinatura */}
                <motion.button
                  onClick={() => setActiveFilter('aguardando_assinatura')}
                  whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)' }}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    activeFilter === 'aguardando_assinatura'
                      ? 'border-purple-500 bg-purple-50/50'
                      : 'border-gray-200 bg-white hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <FileSignature className={`w-6 h-6 ${activeFilter === 'aguardando_assinatura' ? 'text-purple-600' : 'text-purple-500'}`} />
                    {activeFilter === 'aguardando_assinatura' && (
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                    )}
                  </div>
                  <p className={`text-sm font-medium mb-2 ${activeFilter === 'aguardando_assinatura' ? 'text-purple-700' : 'text-gray-600'}`}>
                    Aguardando Assinatura
                  </p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardCounts.aguardando_assinatura}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Pendentes de assinatura
                  </p>
                </motion.button>

                {/* Card: Assinado */}
                <motion.button
                  onClick={() => setActiveFilter('assinados')}
                  whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)' }}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    activeFilter === 'assinados'
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <FileText className={`w-6 h-6 ${activeFilter === 'assinados' ? 'text-blue-600' : 'text-blue-500'}`} />
                    {activeFilter === 'assinados' && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className={`text-sm font-medium mb-2 ${activeFilter === 'assinados' ? 'text-blue-700' : 'text-gray-600'}`}>
                    Assinado
                  </p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardCounts.assinados}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Contratos assinados
                  </p>
                </motion.button>
              </motion.div>

              {/* Informações Complementares */}
              {dashboardCounts.ultimos_7_dias > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100/50 rounded-lg"
                >
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-blue-700">{dashboardCounts.ultimos_7_dias} cadastros</span> realizados nos últimos 7 dias
                  </p>
                </motion.div>
              )}

              {/* Filtros de Botão */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-gray-200"
              >
                <button
                  onClick={() => setActiveFilter('todos')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeFilter === 'todos'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setActiveFilter('em_analise')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeFilter === 'em_analise'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-amber-300'
                  }`}
                >
                  Em Análise
                </button>
                <button
                  onClick={() => setActiveFilter('recusado')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeFilter === 'recusado'
                      ? 'bg-red-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-red-300'
                  }`}
                >
                  Reprovados
                </button>
                <button
                  onClick={() => setActiveFilter('aprovado')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeFilter === 'aprovado'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-300'
                  }`}
                >
                  Aprovados
                </button>
                <button
                  onClick={() => setActiveFilter('aguardando_documentacao')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeFilter === 'aguardando_documentacao'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-amber-300'
                  }`}
                >
                  Aguardando Documentação
                </button>
                <button
                  onClick={() => setActiveFilter('aguardando_assinatura')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeFilter === 'aguardando_assinatura'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-purple-300'
                  }`}
                >
                  Aguardando Assinatura
                </button>
                <button
                  onClick={() => setActiveFilter('assinados')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeFilter === 'assinados'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'
                  }`}
                >
                  Assinado
                </button>
              </motion.div>

              {/* Tabela */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {filteredRequests.length === 0 ? (
                  <div className="px-8 py-16 text-center">
                    <div className="text-gray-400 mb-3">
                      <Calendar className="w-12 h-12 mx-auto opacity-50" />
                    </div>
                    <p className="text-gray-600 font-medium">Nenhuma solicitação encontrada</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {activeFilter !== 'todos' 
                        ? 'Nenhum registro com esse filtro'
                        : 'As solicitações aparecerão aqui quando forem submetidas'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Cliente
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Contato
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Data
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <AnimatePresence>
                          {filteredRequests.map((request, index) => (
                            <motion.tr
                              key={request.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ delay: index * 0.02 }}
                              className="hover:bg-gray-50 transition-colors group"
                            >
                              {/* Cliente */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs font-semibold">
                                      {(request.nome_completo || 'N')[0].toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {getClienteInfo(request).label}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {getClienteInfo(request).detail ? (
                                        getClienteInfo(request).detail
                                      ) : (
                                        request.cpf
                                      )}
                                    </p>
                                    {getClienteInfo(request).detail && (
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        {request.cpf}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Contato */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  {request.telefone || '-'}
                                </div>
                              </td>

                              {/* Data */}
                              <td className="px-6 py-4">
                                <p className="text-sm text-gray-600">
                                  {formatDate(request.data_criacao)}
                                </p>
                              </td>

                              {/* Status */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <StatusBadge status={request.status} contrato={request.contrato} />
                                  {(request.status || '').toLowerCase() !== 'em_analise' && (
                                    <button
                                      onClick={() => handleEditStatus(request)}
                                      disabled={updating === request.id}
                                      className={`${actionIcon} text-gray-400 opacity-0 group-hover:opacity-100 disabled:opacity-50`}
                                      title="Editar status"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>

                              {/* Ações */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1">
                                  {/* Ícone Visualizar */}
                                  <button
                                    onClick={() => handleViewData(request)}
                                    className={`${actionIcon} text-gray-500 hover:bg-blue-50 hover:text-blue-600`}
                                    title="Ver detalhes"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  {/* Ícone WhatsApp */}
                                  <button
                                    onClick={() => handleWhatsAppClick(request)}
                                    className={`${actionIcon} text-gray-500 hover:bg-green-50 hover:text-green-600`}
                                    title="Enviar WhatsApp"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </button>

                                  {/* Ícone Gerar Contrato */}
                                  {(() => {
                                    const s = (request.status || '').toLowerCase();
                                    const contratoLower = (request.contrato || '').toLowerCase();
                                    if (s === 'aguardando_assinatura' && (!contratoLower || contratoLower === 'pendente')) {
                                      return (
                                        <button
                                          onClick={() => handleGenerateContract(request)}
                                          className={`${actionIcon} text-gray-500 hover:bg-amber-50 hover:text-amber-600`}
                                          title="Gerar contrato"
                                        >
                                          <FileText className="w-4 h-4" />
                                        </button>
                                      );
                                    }
                                    return null;
                                  })()}

                                  {/* Botão Responder */}
                                  {request.status && request.status.toLowerCase() === 'em_analise' && (
                                    <button
                                      onClick={() => handleRespond(request)}
                                      disabled={updating === request.id}
                                      className={actionPrimary}
                                      title="Responder solicitação"
                                    >
                                      {updating === request.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <span>Responder</span>
                                      )}
                                    </button>
                                  )}
                                  {/* Botão Confirmar Documentação (Financeiro) */}
                                  {request.status && request.status.toLowerCase() === 'aguardando_documentacao' && (
                                    <button
                                      onClick={async () => {
                                        // Confirma documentação recebida
                                        await handleStatusChange(request.id, 'aguardando_assinatura');
                                      }}
                                      disabled={updating === request.id}
                                      className={actionPrimary}
                                      title="Confirmar documentação recebida"
                                    >
                                      {updating === request.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <span>Confirmar documentação</span>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Modal de Dados */}
      <RequestDataModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        data={selectedRequest} 
      />

      {/* Modal de Resposta */}
      <ResponseDecisionModal
        isOpen={responseModalOpen}
        onClose={() => {
          setResponseModalOpen(false);
          setRequestToRespond(null);
        }}
        request={requestToRespond}
        onApprove={handleApprove}
        onReject={handleReject}
        isLoading={updating === requestToRespond?.id}
      />

      {/* Modal de Edição de Status */}
      <EditStatusModal
        isOpen={editStatusModalOpen}
        onClose={() => {
          setEditStatusModalOpen(false);
          setRequestToEditStatus(null);
        }}
        request={requestToEditStatus}
        currentStatus={requestToEditStatus?.status}
        onSave={handleSaveStatusEdit}
        isLoading={updating === requestToEditStatus?.id}
      />

      {/* Modal de WhatsApp */}
      <WhatsAppMessageModal
        isOpen={whatsappModalOpen}
        onClose={() => {
          setWhatsappModalOpen(false);
          setRequestForWhatsapp(null);
        }}
        request={requestForWhatsapp}
        onSendTemplate={(templateId) => handleSendWhatsApp(templateId, null)}
        onSendCustom={(message) => handleSendWhatsApp(null, message)}
      />

      {/* Overlay de Carregamento de Contrato */}
      <ContractLoadingOverlay isVisible={contractLoading} />
    </div>
  );
};

export default OperatorDashboard;
