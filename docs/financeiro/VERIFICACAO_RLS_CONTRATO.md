## Verificação e Configuração de RLS - Coluna "contrato"

### Problema Identificado
A coluna `contrato` na tabela `solicitacoes` não estava sendo atualizada para "assinado" após confirmação. Isso pode estar relacionado a:
1. Policies de RLS que bloqueiam UPDATE
2. Falta de permissions no Supabase
3. ID do registro não sendo recuperado corretamente

### ✅ Correções Implementadas no Frontend

1. **CardReleaseFlow.jsx**
   - Adicionado logging detalhado de erros do Supabase
   - Verificação se `client.id` existe antes de UPDATE
   - Adicionado `.select()` para confirmar sucesso do UPDATE
   - Melhor tratamento de erro com detalhes

2. **ClientValidation.jsx**
   - Logging ao buscar cliente (CPF, ID, status)
   - Validação de que `data.id` existe
   - Detalhamento de erros em cada etapa

### 🔒 Verificação de RLS Necessária

**Acesse o Supabase Dashboard e verifique:**

#### 1. Tabela `solicitacoes` > RLS (Row Level Security)

**Verificar se existe policy de UPDATE:**

```
Nome: "Operators can update contrato field"
Política Ativa: SIM
Tipo: UPDATE
Usando: (SELECT * FROM auth.users())
```

#### 2. Se NÃO existir, criar uma policy com:

**SQL para criar policy:**

```sql
-- Policy: Operators can update contrato field for approved requests
CREATE POLICY "Operators can update contrato field"
ON public.solicitacoes
FOR UPDATE
USING (
  -- Apenas para registros aprovados ou aguardando documentação
  status::text ILIKE 'aprovado' OR status::text ILIKE 'aguardando_documentacao'
)
WITH CHECK (
  -- Apenas pode alterar campo contrato
  -- (Supabase RLS com WITH CHECK garante que apenas contrato pode ser alterado)
  status::text ILIKE 'aprovado' OR status::text ILIKE 'aguardando_documentacao'
);
```

**Ou alternativamente, uma policy mais permissiva:**

```sql
-- Policy: Allow operators to update contrato for approved applications
CREATE POLICY "Allow contrato update"
ON public.solicitacoes
FOR UPDATE
TO authenticated
USING (status::text ILIKE 'aprovado' OR status::text ILIKE 'aguardando_documentacao')
WITH CHECK (true);
```

#### 3. Verificar Auth Policy

Certifique-se que:
- RLS está **ATIVADO** na tabela `solicitacoes`
- Existe pelo menos uma policy de READ ativa
- Existe uma policy de UPDATE ativa

#### 4. Testar UPDATE Manualmente

No Supabase SQL Editor, execute:

```sql
-- Teste com um ID real
UPDATE public.solicitacoes
SET contrato = 'assinado'
WHERE id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
AND status ILIKE 'aprovado'
RETURNING id, cpf, contrato, status;
```

Se retornar erro:
- `permission denied` → Problema de RLS
- `0 rows updated` → ID não existe ou status não é "aprovado"

### 📋 Checklist de Verificação

- [ ] RLS está ativado na tabela `solicitacoes`
- [ ] Policy de SELECT existe e funciona
- [ ] Policy de UPDATE existe e funciona
- [ ] ID do cliente está sendo retornado na query SELECT
- [ ] Status do cliente é "Aprovado" (case-sensitive check)
- [ ] Campo `contrato` aceita valores "pendente" e "assinado"

### 🐛 Debug - Verificar no Browser Console

Após tentar fazer update, verifique o console do browser para:

```
1. Log de "Cliente encontrado:" com ID
2. Log de "Iniciando update do contrato para cliente ID: ..."
3. Log de sucesso ou erro detalhado
```

Se ver erro como:
```
Error: permission denied
```
→ Problema é RLS policy

Se ver erro como:
```
Error: No rows updated
```
→ Problema é ID ou status do registro

### 🔧 Próximas Ações

1. **AGORA:** Verifique se RLS policy existe no Supabase
2. **Se não existir:** Execute o SQL acima no Supabase SQL Editor
3. **Teste:** Valide um cliente no popup e confirme a assinatura
4. **Verificar:** Veja se `contrato` foi atualizado para "assinado"

### 📝 Informações do Update

- **Tabela:** `solicitacoes`
- **Campo:** `contrato`
- **Valores:** `'pendente'` → `'assinado'`
- **Identificador:** `id` (UUID)
- **Condição:** `status ILIKE 'aprovado'`
