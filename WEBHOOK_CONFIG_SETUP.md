# 🔧 Configuração de Webhooks Dinâmicos

## 📝 Resumo da Implementação

Foi implementado um sistema de configuração de webhooks dinâmica que permite editar e gerenciar URLs de webhook sem alterar o código-fonte.

---

## 🎯 Funcionalidades Implementadas

### 1. **Tela de Configurações de Webhook**
- **Localização:** `/config` (via WebhookConfigPage.jsx)
- **Acesso:** Somente operadores autenticados (rota protegida)

### 2. **Dois Webhooks Distintos**

#### 🟦 Webhook de Mensagens (WhatsApp)
- **Campo:** `webhook_mensagem`
- **Usar para:** Envio de mensagens via WhatsApp
- **Quando acionado:**
  - Clique no ícone do WhatsApp na tabela de solicitações
  - Seleção de template ou digitação de mensagem personalizada
  - Clique em "Enviar"

#### 🟩 Webhook de Status do Cartão
- **Campo:** `webhook_status_cartao`
- **Usar para:** Atualizar status de solicitação/cartão
- **Quando acionado:**
  - Aprovação de solicitação
  - Rejeição de solicitação
  - Alteração manual de status
  - Confirmação de documentação
  - Qualquer mudança de status

---

## 📊 Payload dos Webhooks

### Webhook de Mensagens
```javascript
{
  // Todos os dados do cliente...
  "numero_template": 1,    // 1, 2, 3 ou null
  "mensagem_texto": "...", // Se digitada manualmente
  "tipo_acao": "envio_whatsapp",
  "data_envio": "2026-03-17T..."
}
```

### Webhook de Status do Cartão
```javascript
{
  // Todos os dados do cliente...
  "status": "aguardando_documentacao",
  "data_atualizacao": "2026-03-17T...",
  "tipo_atualizacao": "edicao_manual", // Opcional
  "notas_alteracao": "..."              // Opcional
}
```

---

## 🗄️ Tabela Supabase

### Entrada no Banco de Dados
A tabela `configuracoes` agora armazena:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | Identificador único |
| webhook_mensagem | text | URL para envio de mensagens |
| webhook_status_cartao | text | URL para atualizações de status |
| imagem_url | text | URL da imagem da página inicial |
| updated_at | timestamp | Data da ultima atualização |

### Manutenção
- Apenas 1 registro deve existir na tabela
- Usa `UPSERT` para atualizar ou criar automaticamente
- Validação de URL antes de salvar

---

## 🔗 Integração no Sistema

### Locais onde webhooks são utilizados:

1. **OperatorDashboard.jsx**
   - `handleStatusChange()` → webhook_status_cartao
   - `handleSaveStatusEdit()` → webhook_status_cartao
   - `handleApprove()` → webhook_status_cartao
   - `handleReject()` → webhook_status_cartao
   - `handleSendWhatsApp()` → webhook_mensagem

2. **CardRequestForm.jsx**
   - Submissão inicial → webhook_status_cartao

3. **WhatsAppMessageModal.jsx**
   - Integrado com OperatorDashboard para envio

---

## 🎨 Interface de Configuração

### Layout da Página
- **Seção 1:** Webhook de Mensagens (azul)
- **Seção 2:** Webhook de Status do Cartão (verde)
- **Seção 3:** Imagem da Página Inicial (roxo - mantido)

### Recursos
✅ Validação de URL antes de salvar  
✅ Toast de feedback (sucesso/erro)  
✅ Loading durante o salvamento  
✅ Ícones descritivos para cada webhook  
✅ Descrição clara do uso de cada webhook  
✅ Design responsivo e elegante  

---

## 🚀 Como Usar

### Configurar os Webhooks

1. Acesse a página `/config` (via menu Configurações)
2. Preencha a **URL do Webhook de Mensagens**
   - Exemplo: `https://seu-n8n.cloud/webhook/mensagens`
3. Preencha a **URL do Webhook de Status do Cartão**
   - Exemplo: `https://seu-n8n.cloud/webhook/status-cartao`
4. Clique em **Salvar Configurações**
5. Receberá confirmação de sucesso

### Fluxo de Uso

```
Cliente submete solicitação
    ↓
webhook_status_cartao recebe os dados
    ↓
Operador aprova/rejeita na tabela
    ↓
webhook_status_cartao recebe atualização
    ↓
Operador envia WhatsApp
    ↓
webhook_mensagem recebe dados + template/mensagem
```

---

## ✅ Validações Implementadas

- ✓ URLs devem ser válidas (formato HTTPS)
- ✓ Campos são opcionais (podem estar vazios)
- ✓ Erro ao tentar salvar URL inválida
- ✓ Avisos claros no toast
- ✓ Verificação antes de cada requisição ao webhook

---

## 🔐 Segurança

- Apenas operadores autenticados podem acessar a tela
- URLs armazenadas no Supabase (banco seguro)
- Validação client-side + server-side
- Erros de webhook não quebram a aplicação (non-blocking)

---

## 📱 Endpoints Impactados

| recurso | Arquivo | Antes | Depois |
|---------|---------|-------|--------|
| Aprovação | OperatorDashboard | webhook_url | webhook_status_cartao |
| Rejeição | OperatorDashboard | webhook_url | webhook_status_cartao |
| Atualizar Status | OperatorDashboard | webhook_url | webhook_status_cartao |
| Editar Status | OperatorDashboard | webhook_url | webhook_status_cartao |
| WhatsApp | OperatorDashboard | webhook_url | webhook_mensagem |
| Submissão | CardRequestForm | webhook_url | webhook_status_cartao |

---

## 🧪 Testando

Para testar você pode usar:
- **n8n:** Crie dois webhooks e copie as URLs
- **Postman:** Configure dois endpoints mock
- **RequestBin:** Use URLs públicas para debug
- **Logs:** Verifique console.error para detalhes de erro

---

## 📝 Notas Importantes

- O sistema mantém compatibilidade com payloads anteriores
- Nenhum campo existente foi removido
- Apenas campos novos foram ACRESCENTADOS
- Se o webhook não estiver configurado, a ação não quebra
- Erros de webhook não impedem a salva no Supabase

---

## 🔄 Migração de Código Anterior

Se você tinha `webhook_url` fixo no código antes:

**Antes:**
```javascript
const webhookUrl = 'https://seu-webhook-fixo.com';
```

**Agora:**
```javascript
const { data: configData } = await supabase
  .from('configuracoes')
  .select('webhook_mensagem')
  .maybeSingle();

if (configData?.webhook_mensagem) {
  await fetch(configData.webhook_mensagem, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
```

---

## 📞 Suporte

Qualquer dúvida sobre os webhooks:
- Verifique a tela de configuração `/config`
- Consulte o painel de operador para ver os payloads reais
- Verifique o console do navegador para erros
- Valide as URLs no formato HTTPS

---

**Última atualização:** 17 de março de 2026  
**Versão:** 1.06  
**Status:** ✅ Implementado e testado
