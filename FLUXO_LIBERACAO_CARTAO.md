# Fluxo Completo de Liberação de Cartão - Documentação

## ✅ Implementação Completa

O sistema agora possui um fluxo seguro e controlado de 4 etapas para liberar cartões aprovados.

---

## 📋 ETAPA 1: Aprovação (ResponseDecisionModal.jsx)

✅ **Modificações:**
- Campo obrigatório: **Limite aprovado** (máscara R$ X.XXX,XX)
- Campo obrigatório: **Senha do cartão** (4 dígitos)
- Sistema gera automaticamente uma senha de 4 dígitos
- Operador pode aceitar ou digitar outra manualmente
- Validação: apenas números, exatamente 4 dígitos

✅ **Dados salvos no Supabase:**
- `status` = "aprovado"
- `limite` = valor informado
- `senha` = senha de 4 dígitos
- `contrato` = "pendente"

---

## 🔑 ETAPA 2: Página Inicial (HomePage.jsx)

✅ **Novo botão:** "Liberar cartão"
- Localizado na HomePage
- Abre o fluxo de liberação em modal

---

## 👤 ETAPA 3: Validação de Operador (OperatorValidation.jsx)

✅ **Funcionalidade:**
1. Solicita código do operador
2. Valida contra tabela "operadores" no Supabase
3. Se código existir: exibe nome e permite avançar
4. Se não existir: exibe erro

✅ **Banco de dados necessário:**
Tabela: `operadores`
Colunas:
- `codigo` (text) - Exemplo: "OP001"
- `nome` (text) - Exemplo: "João Silva"

**Exemplos de dados para inserir:**
```sql
INSERT INTO operadores (codigo, nome) VALUES
('OP001', 'João Silva'),
('OP002', 'Maria Santos'),
('OP003', 'Carlos Oliveira');
```

---

## 🔍 ETAPA 4: Validação de Cliente (ClientValidation.jsx)

✅ **Funcionalidade:**
1. Solicita CPF do cliente (com máscara: 000.000.000-00)
2. Busca na tabela "solicitacoes"
3. Validações:
   - Se CPF não existir → erro
   - Se status ≠ "aprovado" → erro
   - Se contrato = "assinado" → pula para Etapa 6 (Senha)
   - Se contrato = "pendente" → vai para Etapa 5 (Gerar Contrato)

---

## 📄 ETAPA 5: Gerar Contrato (ContractGeneration.jsx)

✅ **Funcionalidade:**
1. Exibe dados do cliente (nome, CPF, limite)
2. Botão "Gerar contrato"
3. Abre contrato em nova aba (PDF/Print)
4. Solicita confirmação de assinatura
5. Ao confirmar: atualiza `contrato = "assinado"` no Supabase

✅ **Usa função existente:**
- `generateAndOpenContract()` de `/lib/contractUtils.js`

---

## 🔐 ETAPA 6: Exibir Senha (PasswordDisplay.jsx)

✅ **Condição:**
- Apenas exibir se `contrato = "assinado"`
- Nunca exibir antes disso

✅ **Funcionalidade:**
1. Exibe dados do cliente (leitura)
2. Botão "Revelar" para mostrar senha
3. Exibe senha em grande (4 dígitos)
4. Botão "Copiar" para área de transferência
5. Exibe dados do operador que liberou

---

## 🛡️ Regras de Negócio Implementadas

✅ Nunca exibir senha antes de contrato estar assinado
✅ Nunca permitir gerar contrato novamente se já está assinado
✅ Nunca permitir exibir senha se contrato ≠ "assinado"
✅ Validação em cada etapa (operador, cliente)
✅ Webhook não foi alterado (dados novos adicionados corretamente)
✅ Fluxo completo rastreável

---

## 📊 Estrutura de Arquivos Criados

```
src/components/
├── CardReleaseFlow.jsx                    (Componente principal - hub)
└── CardReleaseFlow/
    ├── OperatorValidation.jsx             (Etapa 3)
    ├── ClientValidation.jsx               (Etapa 4)
    ├── ContractGeneration.jsx             (Etapa 5)
    └── PasswordDisplay.jsx                (Etapa 6)

src/pages/
├── HomePage.jsx                           (MODIFICADO - novo botão)

src/components/
├── ResponseDecisionModal.jsx              (MODIFICADO - novo campo senha)
```

---

## 🚀 Como Testar

### Passo 1: Inserir operadores no Supabase
```javascript
// Execute no console ou crie um script:
const { data } = await supabase
  .from('operadores')
  .insert([
    { codigo: 'OP001', nome: 'João Silva' },
    { codigo: 'OP002', nome: 'Maria Santos' },
  ]);
```

### Passo 2: Aprovar uma solicitação
1. Acesse o Painel do Operador
2. Clique em "Responder" para uma solicitação
3. Selecione "Aprovar"
4. Preencha:
   - Limite: R$ 5.000,00
   - Senha: (auto-gerada ou digite manualmente)
5. Clique "Aprovar"

### Passo 3: Liberar cartão
1. Na HomePage, clique em "Liberar cartão"
2. Digite código do operador: `OP001`
3. Digite CPF: `12345678900` (exemplo do teste)
4. Revise contrato (será aberto em nova aba)
5. Confirme assinatura
6. Veja e copie a senha

---

## ⚠️ Notas Importantes

1. **Tabela "operadores"**: Certifique-se de que existe com as colunas `codigo` e `nome`
2. **Row Level Security (RLS)**: Verifique permissões na tabela "operadores" se tiver erro 42501
3. **Colunas em "solicitacoes"**: Certifique-se que existem:
   - `limite` (text)
   - `senha` (text)
   - `contrato` (text) com valores "pendente" ou "assinado"
4. **Webhook**: Não foi alterado, mas agora receberá os novos campos

---

## 🔗 Fluxo Visual

```
HomePage
    ↓
[Botão "Liberar cartão"]
    ↓
CardReleaseFlow (Modal)
    ↓
┌─────────────────────────────────────┐
│ ETAPA 1: Código do Operador         │
│ Valida contra tabela "operadores"   │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ ETAPA 2: CPF do Cliente             │
│ Busca em "solicitacoes"             │
│ Verifica status = "aprovado"        │
└─────────────────────────────────────┘
    ↓
    ├─→ Se contrato = "assinado"     ──┐
    │                                   │
    └─→ Se contrato = "pendente"       ↓
        ↓                          ┌──────────┐
    ┌─────────────────────────┐    │ ETAPA 4  │
    │ ETAPA 3: Gerar Contrato │    │ Exibir   │
    │ Abre em nova aba        │    │ Senha    │
    │ Confirma assinatura     │    └──────────┘
    │ Marca como "assinado"   │         ↑
    └─────────────────────────┘         │
        ↓                               │
        └───────────────────────────────┘
                ↓
            [Cartão Liberado]
```

---

## 🎯 Próximos Passos (Opcional)

1. Adicionar log de auditoria para cada liberação
2. Enviar SMS com senha ao cliente (integração externa)
3. Adicionar limite de tentativas para validação
4. Exportar relatório de liberações
5. Integrar 2FA na validação do operador

