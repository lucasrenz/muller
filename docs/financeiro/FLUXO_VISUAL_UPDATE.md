# Fluxo Visual - Update "contrato" no Popup

## 📊 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    POPUP "LIBERAR CARTÃO"                   │
│                   (CardReleaseFlow.jsx)                     │
└─────────────────────────────────────────────────────────────┘

PASSO 1: Validar Operador
┌──────────────────────────────────────┐
│ Código do Operador: [____________]   │
│  ► Buscar em: "operadores" table     │
│  ► ClientValidation não usada aqui   │
│  ► Avançar para PASSO 2              │
└──────────────────────────────────────┘
        ↓
        
PASSO 2: Validar CPF do Cliente
┌──────────────────────────────────────┐
│ CPF do Cliente: [123.456.789-01]    │
│                                      │
│ CONSOLE LOG:                         │
│ "Buscando cliente com CPF: 123..."  │
│                                      │
│ ► Executa: supabase                 │
│   .select('*')                      │
│   .ilike('cpf', pattern)            │
│   .maybeSingle()                    │
│                                      │
│ ✅ Se encontrado:                   │
│ CONSOLE LOG:                         │
│ "Cliente encontrado: {               │
│   id: 'xxx-xxx-xxx',                │
│   cpf: '123.456.789-01',            │
│   nome: 'João Silva',               │
│   status: 'Aprovado',               │
│   contrato: 'pendente'              │
│ }"                                   │
│                                      │
│ Armazena em state: client = { ... }  │
│ Armazena em state: client.id = uuid  │
│ Avançar para PASSO 3                 │
└──────────────────────────────────────┘
        ↓

PASSO 3: Gerar Contrato (ContractGeneration.jsx)
┌──────────────────────────────────────┐
│ ► Clicar em "Gerar Contrato"         │
│ ► Abre PDF para impressão            │
│ ► Operador imprime e faz assinar     │
│ ► Clicar em "Confirmar Assinatura"   │
│                                      │
│ AQUI OCORRE O UPDATE! ⚡            │
│                                      │
│ Executa: handleContractGenerated()   │
│                                      │
│ 1️⃣ Validação:                       │
│   if (!client.id) {                 │
│     console.error(...)              │
│     toast error & return             │
│   }                                  │
│                                      │
│ 2️⃣ Logging:                         │
│   console.log(                       │
│     "Iniciando update..."           │
│   )                                  │
│                                      │
│ 3️⃣ UPDATE no Supabase:              │
│   supabase                          │
│   .from('solicitacoes')             │
│   .update({ contrato: 'assinado' }) │
│   .eq('id', client.id)              │
│   .select()                          │
│                                      │
│ ✅ SE SUCESSO:                      │
│   CONSOLE LOG:                       │
│   "Update realizado com sucesso: {   │
│     clientId: 'xxx-xxx-xxx',        │
│     updateData: [{ ... }]           │
│   }"                                 │
│                                      │
│   Atualiza state:                   │
│   setClient({                       │
│     ...client,                      │
│     contrato: 'assinado'            │
│   })                                │
│                                      │
│   Toast: "✓ Contrato assinado"      │
│   Avançar para PASSO 4               │
│                                      │
│ ❌ SE ERRO:                         │
│   CONSOLE LOG:                       │
│   "Erro ao atualizar contrato: {     │
│     message: 'permission denied',   │
│     details: '...',                 │
│     hint: '...',                    │
│     clientId: 'xxx'                 │
│   }"                                 │
│                                      │
│   Toast error: "Erro ao registrar"  │
│   Permanecer em PASSO 3              │
└──────────────────────────────────────┘
        ↓ (se sucesso)
        
PASSO 4: Exibir Senha (PasswordDisplay.jsx)
┌──────────────────────────────────────┐
│ Título: "Senha do Cartão"            │
│                                      │
│ Informações do Cliente:              │
│ • Nome: João Silva                   │
│ • CPF: 123.456.789-01                │
│ • Limite: R$ 5.000,00                │
│                                      │
│ ► Clique em "Revelar" para ver       │
│   a senha (campo: client.senha)      │
│                                      │
│ ► Operador fornece ao cliente       │
│ ► Clique em "Copiar" ou "Voltar"     │
│                                      │
│ Toast: "Cartão liberado"             │
│ Fluxo concluído ✅                  │
└──────────────────────────────────────┘
```

---

## 🔄 Estados e Transições

```
Estado: 'operator' → Validar operador
    ↓ Sucesso
Estado: 'client' → Validar cliente (recupera ID)
    ↓ Sucesso
Estado: 'contract' → Gerar contrato (UPDATE aqui!)
    ↓ Sucesso no UPDATE
Estado: 'password' → Exibir senha
    ↓ Conclusão
    ✅ Fechar popup
```

---

## 💾 Dados Armazenados

```javascript
// State no CardReleaseFlow.jsx:

const [client, setClient] = useState(null);

// Estrutura completa retornada do Supabase:
client = {
  id: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",  // ← UUID IMPORTANTE
  cpf: "123.456.789-01",
  nome_completo: "João Silva",
  status: "Aprovado",
  contrato: "pendente",  // ← Será "assinado" após UPDATE
  senha: "123456",
  limite: "R$ 5.000,00",
  created_at: "2026-02-19T10:00:00Z",
  // ... outros campos
}
```

---

## 🔒 RLS Policy Necessária

```
TABELA: solicitacoes
TIPO: UPDATE
CONDIÇÃO: status = 'aprovado'
CAMPO: contrato

SQL:
CREATE POLICY "Allow operators to update contrato"
ON public.solicitacoes
FOR UPDATE
TO authenticated
USING (status::text ILIKE 'aprovado')
WITH CHECK (true);
```

---

## 📡 Update SQL Executado

```sql
-- Executado quando "Confirmar Assinatura" é clicado:

UPDATE public.solicitacoes
SET contrato = 'assinado'
WHERE id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
RETURNING *;

-- Resultado esperado:
-- 1 row affected
-- id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
-- contrato: 'assinado' ✅
```

---

## 📊 Sequência de Eventos

```
TEMPO   EVENTO                      CONSOLE LOG
────────────────────────────────────────────────────────────

T0      Cliente digita CPF
        
T0+100  Busca no Supabase           "Buscando cliente com CPF: 123..."
        
T0+200  Cliente encontrado          "Cliente encontrado: { id: '...', ... }"
        
T0+300  ClientValidation.jsx        State: client = {...}
        chama onValidated()
        
T0+400  CardReleaseFlow vai para    step = 'contract'
        step 'contract'
        
T1      Operador clica              ---
        "Gerar Contrato"
        
T1+100  Abre PDF                    ---
        
T1+500  Operador clica              "Iniciando update do contrato..."
        "Confirmar Assinatura"       
        
T1+600  Executa UPDATE no           ---
        Supabase                    
        
T1+700  ✅ UPDATE sucesso           "Update realizado com sucesso: {...}"
        
T1+800  Atualiza state local        State: client.contrato = 'assinado'
        
T1+900  Toast aparece               "✓ Contrato assinado"
        
T2      Avança para senha           step = 'password'
        
T2+100  PasswordDisplay renderiza   ---
```

---

## 🐛 Possíveis Erros e Logs

### Erro 1: Sem ID
```
CONSOLE:
"Erro: ID do cliente não disponível"
"Erro ao buscar cliente: ID não disponível"

MOTIVO: Query não retornou ID
SOLUÇÃO: Adicionar 'id' ao .select()
```

### Erro 2: Permission Denied
```
CONSOLE:
"Erro ao atualizar contrato no Supabase: {
  message: 'permission denied',
  hint: 'The row policy (...) rejects this query'
}"

MOTIVO: RLS Policy não existe ou está bloqueando
SOLUÇÃO: Criar RLS Policy (ver VERIFICACAO_RLS_CONTRATO.md)
```

### Erro 3: Nenhuma Linha Atualizada
```
CONSOLE:
"Update realizado mas updateData é vazio []"

MOTIVO: ID não existe ou status ≠ 'aprovado'
SOLUÇÃO: Verificar se cliente é aprovado
```

---

## ✨ Resultado Final

Após conclusão bem-sucedida:

```
Supabase (solicitacoes table):
┌─────┬────────────────┬─────────┬──────────────┬──────────────┐
│ id  │ cpf            │ status  │ contrato     │ senha        │
├─────┼────────────────┼─────────┼──────────────┼──────────────┤
│ xxx │ 123.456.789-01 │ Aprovado│ assinado ✅  │ 123456       │
└─────┴────────────────┴─────────┴──────────────┴──────────────┘

Frontend UI:
✅ Botão "Gerar Contrato" desaparecido
✅ Exibindo "Contrato já foi assinado!"
✅ Botão "Exibir Senha" disponível
✅ Operador vê a senha
```

---

## 🎯 Checklist de Sucesso

- [ ] Console mostra "Cliente encontrado: { id: '...'" 
- [ ] Console mostra "Iniciando update do contrato para cliente ID: ..."
- [ ] Console mostra "Update realizado com sucesso: { ... }"
- [ ] Toast mostra "✓ Contrato assinado"
- [ ] UI avança para "Exibir Senha"
- [ ] Supabase mostra contrato = "assinado"
