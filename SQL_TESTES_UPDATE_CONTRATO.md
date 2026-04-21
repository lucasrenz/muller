# SQL Scripts - Testar Update de "contrato"

## 📋 Instruções

1. Abra o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Cole e execute cada script abaixo
4. Analise os resultados

---

## 1️⃣ Verificar Estrutura da Tabela

```sql
-- Ver todas as colunas da tabela solicitacoes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'solicitacoes'
ORDER BY ordinal_position;
```

**Esperado:**
- Coluna `id` com tipo `uuid`
- Coluna `contrato` com tipo `character varying` ou `text`
- Coluna `status` com tipo `character varying` ou `text`

---

## 2️⃣ Listar Todas as Policies de RLS

```sql
-- Ver todas as policies da tabela solicitacoes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'solicitacoes'
ORDER BY policyname;
```

**Esperado:**
- Mínimo 1 policy de SELECT
- Pelo menos 1 policy de UPDATE

---

## 3️⃣ Encontrar um Registro para Testar

```sql
-- Encontrar um cliente aprovado com contrato pendente
SELECT id, cpf, nome_completo, status, contrato
FROM public.solicitacoes
WHERE status ILIKE 'aprovado'
LIMIT 5;
```

**Copie o ID de um registro**

---

## 4️⃣ Testar UPDATE Manual (Importante!)

```sql
-- ⚠️ SUBSTITUA 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' pelo ID de um registro real
UPDATE public.solicitacoes
SET contrato = 'assinado'
WHERE id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  AND status ILIKE 'aprovado'
RETURNING id, cpf, nome_completo, status, contrato, created_at, updated_at;
```

**Possíveis resultados:**

✅ **Se funcionou:**
```
 id                   | cpf          | nome_completo | status    | contrato   
 xxxxxxxx-xxxx...     | 123.456...   | João Silva    | Aprovado  | assinado
```

❌ **Se retornar erro "permission denied":**
→ Falta policy de UPDATE (ver script 5 abaixo)

❌ **Se retornar "0 rows":**
→ ID não existe ou status não é "Aprovado"

---

## 5️⃣ Se não existir Policy, CRIAR

```sql
-- Verificar se policy já existe
SELECT 1 FROM pg_policies 
WHERE tablename = 'solicitacoes' 
AND policyname ILIKE '%contrato%';

-- Se retornar vazio, criar policy:
CREATE POLICY "Allow operators to update contrato field"
ON public.solicitacoes
FOR UPDATE
TO authenticated
USING (status::text ILIKE 'aprovado')
WITH CHECK (true);

-- Confirmar criação
SELECT policyname FROM pg_policies 
WHERE tablename = 'solicitacoes' 
AND policyname ILIKE '%contrato%';
```

---

## 6️⃣ Se Precisar DELETAR Policy (Cuidado!)

```sql
-- ⚠️ Apenas se precisar corrigir uma policy ruim
DROP POLICY IF EXISTS "Allow operators to update contrato field" ON public.solicitacoes;
```

---

## 7️⃣ Verificar se RLS está ATIVADO

```sql
-- Ver status de RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'solicitacoes';
```

**Esperado:**
```
 tablename     | rowsecurity
 solicitacoes  | true
```

Se `rowsecurity = false`, ativar:

```sql
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;
```

---

## 8️⃣ Testando Update via Frontend

Após executar os scripts acima e confirmar que o UPDATE funciona:

1. **Abra o app**
2. **F12 > Console**
3. **Acesse o popup "Liberar Cartão"**
4. **Digite CPF do cliente aprovado**
5. **Confirme assinatura do contrato**
6. **Observe logs no Console:**

```
Buscando cliente com CPF: 12345678901
Cliente encontrado: { id: "xxx", contrato: "pendente", ... }
Iniciando update do contrato para cliente ID: xxx
Update realizado com sucesso: { clientId: "xxx", updateData: [...] }
```

---

## 📊 Checklist de RLS

- [ ] `rowsecurity = true` na tabela `solicitacoes`
- [ ] Existe policy de SELECT
- [ ] Existe policy de UPDATE
- [ ] UPDATE funciona manualmente (script 4)
- [ ] Frontend mostra logs de sucesso (script 8)
- [ ] Campo `contrato` foi atualizado para "assinado"

---

## 🆘 Troubleshooting

| Erro | Causa | Solução |
|------|-------|---------|
| `permission denied` | Falta policy de UPDATE | Execute script 5 |
| `0 rows updated` | ID/status inválido | Verifique script 3 |
| `column contrato not found` | Campo não existe | Verifique script 1 |
| `table solicitacoes not found` | Tabela deletada/renomeada | Verifique nome correto |

---

## ✅ Resultado Esperado

Após todas essas verificações:

1. RLS está ativado ✓
2. Policies de UPDATE existem ✓
3. UPDATE manual funciona ✓
4. Frontend atualiza sem erros ✓
5. Coluna `contrato` = "assinado" ✓

🎉 **Sistema funcionando corretamente!**
