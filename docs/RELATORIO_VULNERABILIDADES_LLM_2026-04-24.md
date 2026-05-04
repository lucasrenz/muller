# Relatório de Vulnerabilidades e Inventário Técnico (LLM)

Data da análise: 24/04/2026
Escopo: frontend React/Vite, integrações Supabase, configuração de runtime e dependências npm.

## 1) Sumário Executivo

- Foram encontrados riscos críticos e altos ligados a controle de acesso e exposição de fluxo sensível no cliente.
- O principal risco é a combinação de fluxo público de liberação de cartão com validação fraca (código de operador + CPF), atualização de status feita no frontend e exibição de senha de cartão em texto puro.
- Há também riscos operacionais: endpoint de cadastro de usuário privilegiado exposto publicamente, chaves embutidas no código, upload sem validação de MIME real e falta de hardening HTTP no nginx.
- Dependências em produção possuem alertas de segurança (npm audit): 3 altas e 3 moderadas.

## 2) Vulnerabilidades Detalhadas

## VULN-01 - Fluxo de liberação de cartão exposto em área pública (Crítica)

- Severidade: Crítica
- Impacto: acesso indevido a fluxo de contrato/senha de cartão; potencial fraude operacional.
- Evidências:
- src/pages/LoginPage.jsx:165 (modal CardReleaseFlow disponível sem autenticação)
- src/components/CardReleaseFlow/OperatorValidation.jsx:25 (validação por código de operador)
- src/components/CardReleaseFlow/ClientValidation.jsx:63 (busca por CPF via ilike)
- src/components/CardReleaseFlow.jsx:88-92 (update direto de contrato/status no cliente)
- src/components/CardReleaseFlow/PasswordDisplay.jsx:22,163 (exibição/cópia de client.senha)
- Como explorar (cenário):
- Atacante acessa página de login (pública), abre fluxo "Assinar contrato", testa códigos de operador e CPFs válidos, força avanço do processo e pode visualizar/copiar senha se registro atender critérios.
- Causa raiz:
- Regra de autorização crítica implementada no frontend em vez de backend (RLS estrito + RPC segura).
- Correção recomendada:
- Remover CardReleaseFlow de qualquer tela pública.
- Exigir sessão autenticada e perfil autorizado antes de iniciar o fluxo.
- Mover atualização de status/contrato para RPC no Supabase com SECURITY DEFINER + validação robusta de papel/permissão.
- Nunca trafegar senha de cartão em texto puro para o frontend. Substituir por token de uso único, expiração curta e trilha de auditoria.

## VULN-02 - Cadastro de usuários privilegiados exposto publicamente (Alta)

- Severidade: Alta
- Impacto: elevação de privilégio por criação de contas RH/Financeiro/Jurídico sem proteção de rota no frontend.
- Evidências:
- src/App.jsx:27 (rota /cadastro-usuario pública)
- src/pages/SignUpPage.jsx: formulário permite tipo rh/financeiro/juridico
- src/contexts/AuthContext.jsx:210 (signup), 223 (RPC criar_perfil_usuario)
- Como explorar (cenário):
- Qualquer usuário não autenticado acessa /cadastro-usuario e tenta criar conta operacional.
- Causa raiz:
- Falta de proteção da rota de cadastro e de validação forte do emissor no backend.
- Correção recomendada:
- Tornar cadastro de operador somente por painel interno protegido ou processo de convite.
- Exigir role admin (validada no backend) para criar perfis privilegiados.
- No Supabase, restringir RPC criar_perfil_usuario por role e contexto de sessão.

## VULN-03 - Senha de cartão em texto puro no cliente (Crítica)

- Severidade: Crítica
- Impacto: exposição direta de segredo sensível; risco de vazamento por screenshot, clipboard e inspeção de tráfego/estado.
- Evidências:
- src/components/CardReleaseFlow/PasswordDisplay.jsx:22 (clipboard), 90 (checagem), 163 (render da senha)
- src/components/CardReleaseFlow/ClientValidation.jsx:60-64 (select * em solicitacoes retorna dados amplos)
- Como explorar (cenário):
- Usuário malicioso com acesso ao fluxo visualiza e copia senha do cartão.
- Causa raiz:
- Segredo persistido e disponibilizado ao frontend em texto puro.
- Correção recomendada:
- Não armazenar senha reversível em tabela acessível ao cliente.
- Usar arquitetura de segredo não recuperável ou entrega por canal seguro (one-time secret + expiração).
- Reduzir seleção de campos (evitar select *) e aplicar princípio de menor privilégio.

## VULN-04 - Hardcoded de chave Supabase no código fonte (Média)

- Severidade: Média
- Impacto: facilita abuso automatizado de API pública e aumenta superfície de enumeração; dificulta rotação segura.
- Evidências:
- src/lib/customSupabaseClient.js:4
- fetch-operators.js:4
- test-insert.js:4
- test-operators.js:4
- Observação:
- Chave anon do Supabase é pública por design, mas não deve ficar duplicada em múltiplos arquivos/scripts no repositório.
- Correção recomendada:
- Centralizar em variáveis de ambiente (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
- Remover scripts de teste com credenciais no repositório ou mover para ambiente local seguro.
- Rotacionar a chave após limpeza de exposição.

## VULN-05 - Upload de anexos sem validação de tipo real (Média)

- Severidade: Média
- Impacto: upload de conteúdo indevido/malicioso; risco de distribuição de arquivos perigosos.
- Evidências:
- src/pages/DenunciaPage.jsx:6 (ALLOWED_TYPES declarado)
- src/pages/DenunciaPage.jsx:35-36 (somente valida tamanho; adiciona arquivo sem checar MIME permitido)
- src/pages/DenunciaPage.jsx:94 (upload direto)
- Causa raiz:
- Lista de tipos permitidos existe mas não é aplicada.
- Correção recomendada:
- Validar tipo MIME e extensão no cliente e no backend (Storage policies/functions).
- Rejeitar uploads fora da allowlist e aplicar verificação de assinatura de arquivo quando possível.

## VULN-06 - Consulta de denúncia sem antifraude de tentativa (Média)

- Severidade: Média
- Impacto: brute force de protocolo/código de acesso em alto volume.
- Evidências:
- src/pages/ConsultarDenunciaPage.jsx:61-63 (consulta direta por protocolo + codigo_acesso)
- Causa raiz:
- Sem limitação de taxa, sem atraso progressivo, sem captcha/challenge.
- Correção recomendada:
- Implementar rate limit por IP/dispositivo e challenge progressivo.
- Adicionar telemetria de tentativas falhas e bloqueio temporário.
- Garantir alta entropia de codigo_acesso no backend.

## VULN-07 - Hardening HTTP insuficiente no nginx (Média)

- Severidade: Média
- Impacto: maior superfície para XSS, clickjacking e MIME sniffing.
- Evidências:
- nginx.conf:17 (apenas Cache-Control explícito)
- Correção recomendada:
- Adicionar headers: Content-Security-Policy, X-Frame-Options (ou frame-ancestors na CSP), X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Strict-Transport-Security (se HTTPS).

## VULN-08 - Dependências com vulnerabilidades conhecidas (Alta/Média)

- Severidade: Alta/Média
- Evidência:
- npm audit --omit=dev retornou 6 vulnerabilidades (3 high, 3 moderate), incluindo picomatch, minimatch, glob, postcss, yaml, brace-expansion.
- Correção recomendada:
- Rodar atualização controlada: npm audit fix e revisão de lockfile.
- Atualizar versões vulneráveis diretas/transitivas e validar build/regressões.

## 3) Recomendações Prioritárias (Plano de Correção)

1. Bloquear imediatamente o fluxo CardReleaseFlow fora de área autenticada.
2. Remover exibição de senha em texto puro e redesenhar entrega de segredo (one-time token).
3. Fechar rota pública de cadastro operacional e restringir criação de perfil privilegiado no backend.
4. Mover operações sensíveis para RPC segura com auditoria e validação de role no Supabase.
5. Aplicar validação completa de anexos (tipo/extensão/assinatura) e políticas de Storage.
6. Implementar rate limiting para consulta de denúncia.
7. Adicionar headers de segurança no nginx.
8. Corrigir dependências vulneráveis e rotacionar chave pública após limpeza de scripts hardcoded.

## 4) Inventário de Arquivos e Páginas (Resumo Breve)

## Raiz

- dev_output.txt: saída de execução/log local.
- Dockerfile: build Node + runtime nginx para deploy estático.
- eslint.config.mjs: regras de lint.
- fetch-operators.js: script utilitário para consulta de operadores no Supabase.
- index.html: HTML base da aplicação React.
- nginx.conf: roteamento SPA e cache estático.
- nixpacks.toml: configuração de build/deploy Nixpacks.
- package.json: scripts e dependências do projeto.
- postcss.config.js: pipeline de CSS (PostCSS).
- README.md: documentação principal.
- tailwind.config.js: configuração do Tailwind.
- test-insert.js: script de inserção de dados de teste no Supabase.
- test-operators.js: script de inserção/listagem de operadores.
- test-respostas-corrigido.js: teste manual do utilitário de respostas.
- vite.config.js: configuração do Vite e aliases.

## docs

- docs/denuncia_setup_complete.sql: setup completo do módulo de denúncias.
- docs/denuncia.sql: SQL base do módulo de denúncias.
- docs/FLUXO_LIBERACAO_CARTAO.md: documentação do fluxo de liberação/assinatura.
- docs/FLUXO_VISUAL_UPDATE.md: documentação de ajustes visuais.
- docs/INDICE_DOCUMENTACAO.md: índice das documentações.
- docs/LEIA_ME_PRIMEIRO.md: guia inicial.
- docs/RESUMO_CORRECOES_UPDATE_CONTRATO.md: histórico de correções de contrato.
- docs/RH_SUPABASE_INTEGRATION.md: integração RH com Supabase.
- docs/SQL_TESTES_UPDATE_CONTRATO.md: testes SQL do fluxo de contrato.
- docs/SUMARIO_EXECUTIVO.md: visão executiva.
- docs/VERIFICACAO_RLS_CONTRATO.md: validações de políticas RLS.
- docs/WEBHOOK_CONFIG_SETUP.md: setup de webhooks.

## index e public

- index/index.html: variante de página estática.
- public/contrato.html: template/artefato de contrato.

## src/pages

- src/pages/HomePage.jsx: landing/home com gatilho para fluxo de cartão.
- src/pages/LoginPage.jsx: autenticação de operadores e acesso ao fluxo CardReleaseFlow.
- src/pages/SignUpPage.jsx: cadastro de usuário operacional.
- src/pages/OperatorDashboard.jsx: painel financeiro e gestão de solicitações.
- src/pages/OperatorRH.jsx: painel RH (vagas, candidatos, módulos).
- src/pages/OperatorJuridico.jsx: operação jurídica do canal de denúncias.
- src/pages/VagasPage.jsx: página pública de vagas e candidatura.
- src/pages/ImageConfigPage.jsx: configuração de imagem via Supabase.
- src/pages/WebhookConfigPage.jsx: configuração de endpoints webhook e imagem.
- src/pages/DenunciaPage.jsx: formulário público de abertura de denúncia e anexos.
- src/pages/ConsultarDenunciaPage.jsx: consulta pública de status da denúncia.

## src/contexts

- src/contexts/AuthContext.jsx: estado de autenticação, login, logout, signup e perfil.
- src/contexts/SupabaseAuthContext.jsx: alternativa/contexto simplificado de auth.

## src/lib

- src/lib/customSupabaseClient.js: instancia cliente Supabase.
- src/lib/authUtils.js: autorização de rotas por tipo de usuário.
- src/lib/contractUtils.js: geração/abertura de contrato.
- src/lib/validationUtils.js: validações de CPF/telefone/regras de negócio do formulário.
- src/lib/supabaseErrorHandler.js: parser/formatação de erros Supabase.
- src/lib/respostasUtils.js: normalização e estruturação de respostas de questionário.
- src/lib/questionarioUtils.js: construção/validação de estrutura de questionários.
- src/lib/rhService.js: serviço central de CRUD e consultas do módulo RH.
- src/lib/candidateStatusUtils.js: normalização de status e KPIs de candidatos.
- src/lib/utils.js: utilitário geral (cn para classes).

## src/components (resumo por objetivo)

- CardReleaseFlow e subcomponentes: validação operador/cliente, assinatura e exibição de senha.
- CardRequestForm: formulário principal de solicitação de cartão.
- ProtectedRoute: guarda de rotas autenticadas e por papel.
- RequestDataModal, ResponseDecisionModal, EditStatusModal, ContractLoadingOverlay, WhatsAppMessageModal: modais operacionais do dashboard.
- CandidateDrawer, CandidateFilters, CandidateList, VagaCard, VagaDetalhe, VagasModule, FormCandidatura: jornada de recrutamento.
- LojasModule, CargosModule, QuestionariosModule, QuestionarioBuilder, QuestionarioRenderer, QuestionarioPreview, QuestionarioFieldEditor, QuestionarioJSONView: administração de entidades e questionários.
- Header, RHHeader, HeroImage, WelcomeMessage, KPIGrid, ModuleCards, ScrollToTop, Modal, Card, CallToAction, AdminModuleDrawer: layout, navegação e elementos de UI.
- src/components/ui/*: primitives de interface (button, toast, toaster, hook de toast).

## plugins e tools

- plugins/*: plugins de edição visual, seleção, manipulação AST e restauração de rota em iframe no build/dev.
- tools/generate-llms.js: script auxiliar executado no build.

## 5) Inventário de Funções (mapeamento para LLM)

Observação: lista consolidada de funções/componentes principais detectados por varredura estática em src (exports e funções nomeadas relevantes).

## Funções de segurança/autorização e fluxo sensível

- src/components/ProtectedRoute.jsx: ProtectedRoute
- src/contexts/AuthContext.jsx: AuthProvider, useAuth, fetchUserProfile, carregarPerfil, login, signup, logout, refreshPerfil
- src/lib/authUtils.js: getDefaultRouteByRole, hasRoutePermission, isRH, isFinanceiro, normalizeUserType
- src/components/CardReleaseFlow.jsx: CardReleaseFlow, handleOperatorValidated, handleClientValidated, handleContractGenerated, handlePasswordShown
- src/components/CardReleaseFlow/OperatorValidation.jsx: OperatorValidation, handleValidate
- src/components/CardReleaseFlow/ClientValidation.jsx: ClientValidation, handleValidate, formatCPF
- src/components/CardReleaseFlow/PasswordDisplay.jsx: PasswordDisplay, handleShowPassword, handleCopyPassword

## Funções de denúncia

- src/pages/DenunciaPage.jsx: DenunciaPage, handleFiles, handleDrop, handleSubmit
- src/pages/ConsultarDenunciaPage.jsx: ConsultarDenunciaPage, getEtapaAtual, maskProtocolo, formatarData, handleConsultar
- src/pages/OperatorJuridico.jsx: OperatorJuridico, DenunciaDrawer, getRpcErrorMessage, formatDate, formatDateTime, fileIcon, formatBytes

## Funções de RH e candidatura

- src/lib/rhService.js: fetchInscricoes, fetchLojas, fetchCargos, fetchQuestionarios, fetchQuestionariosAdmin, fetchVagas, updateInscricaoStatus, updateBancoTalentos, fetchInscricaoById, fetchVagasPublicas, createInscricao, createLoja, updateLoja, toggleLojaAtivo, createCargo, updateCargo, toggleCargoAtivo, createQuestionario, updateQuestionario, toggleQuestionarioAtivo, createVaga, updateVaga, toggleVagaStatus, fetchQuestionarioByVagaId
- src/pages/OperatorRH.jsx: OperatorRH, applyFilters, handleFilterChange, handleClearFilters, handleViewDetails
- src/pages/VagasPage.jsx: VagasPage, filtrarVagas, handleVerVaga, handleCandidatar
- src/components/FormCandidatura.jsx: FormCandidatura, validarDadosPessoais, validarQuestionario, validarCPF, validarEmail

## Funções de formulário/cartão

- src/components/CardRequestForm.jsx: CardRequestForm, checkExistingRequest, handleSubmit
- src/lib/validationUtils.js: isValidCPF, checkPhoneUsedByOtherCPF, check30DaysRule, validateFormBeforeSubmit, cleanCPF, cleanPhone, checkCPFBlocking30Days, checkPhoneAvailability, debounce
- src/lib/contractUtils.js: generateAndOpenContract
- src/pages/OperatorDashboard.jsx: OperatorDashboard, fetchCounters, fetchSolicitacoes, handleEditStatus, handleWhatsAppClick

## Funções utilitárias de questionário e respostas

- src/lib/questionarioUtils.js: slugifyQuestionKey, ensureUniqueCampoId, createEmptyCampo, parseQuestionarioEstrutura, buildQuestionarioEstrutura, validateQuestionarioForm
- src/lib/respostasUtils.js: montarRespostasJsonEstruturado, normalizarRespostas, extrairRespostasPlanas, validarRespostasCompletas, filtrarRespostasPorTipo, formatarRespostasParaTexto
- src/lib/supabaseErrorHandler.js: parseSupabaseValidationError, createErrorToast, formatErrorToast

## 6) Riscos de Arquitetura (Dependentes de Backend/RLS)

- Muitos controles de negócio estão no frontend (status, permissões e trilha de operação). Se as políticas RLS/RPC estiverem frouxas, há risco de manipulação direta via cliente HTTP.
- Recomendação estrutural: consolidar regras críticas no banco (RLS + RPC), tratar frontend como camada de apresentação e não como fronteira de segurança.

## 7) Evidências Técnicas Coletadas

- Análise estática dos arquivos src, raiz e docs listados no workspace.
- Execução de npm audit --omit=dev com retorno de 6 vulnerabilidades em dependências de produção.

## 8) Próximo Passo Recomendado

- Fazer um hardening sprint curto (1-2 dias) focando VULN-01, VULN-02 e VULN-03 primeiro; em paralelo, preparar migração de operações sensíveis para RPC segura e revisão de políticas RLS.
