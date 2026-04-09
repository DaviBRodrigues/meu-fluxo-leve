

# Análise Inteligente com IA

## O que será construído

Um painel de **Análise Inteligente** na página de Relatórios que usa IA (Lovable AI) para gerar insights personalizados sobre as finanças do usuário. O sistema analisa transações, orçamentos, metas e padrões de gastos, e retorna dicas e alertas em linguagem simples.

## Funcionalidades

1. **Botão "Análise Inteligente"** na página de Relatórios que, ao clicar, envia os dados financeiros do usuário para a IA
2. **Insights gerados**: tendências de gastos, categorias problemáticas, comparação mês a mês, dicas de economia, alertas de risco
3. **Resultado visual**: cards com ícones e cores indicando tipo de insight (alerta, dica, elogio)
4. **Cache local**: salva a última análise no localStorage para não precisar gerar toda vez

## Arquitetura

```text
[Relatórios] → clica "Analisar" → monta resumo financeiro (client-side)
    ↓
[Edge Function: ai-financial-analysis] → Lovable AI Gateway
    ↓
Retorna insights estruturados (tool calling / JSON)
    ↓
[UI] → Renderiza cards de insights com ícones e cores
```

## Implementação técnica

### 1. Edge Function `ai-financial-analysis`
- Recebe resumo financeiro (totais por categoria, mês a mês, metas, orçamentos)
- Envia para Lovable AI com system prompt financeiro em português
- Usa tool calling para retornar JSON estruturado com array de insights (tipo, título, descrição, severidade)
- Modelo: `google/gemini-3-flash-preview`

### 2. Componente `SmartAnalysis.tsx`
- Botão com ícone de cérebro/lâmpada
- Estado de loading com skeleton animado
- Renderiza insights em cards coloridos por tipo:
  - Verde = elogio/positivo
  - Amarelo = atenção/dica  
  - Vermelho = alerta/risco
- Salva resultado + timestamp no localStorage

### 3. Integração na página de Relatórios
- Adicionado como seção no topo ou após os cards de resumo
- Disponível para o ano selecionado

### Dados enviados para a IA (sem dados sensíveis pessoais)
- Receitas e despesas por mês
- Gastos por categoria
- Orçamentos definidos vs gastos reais
- Progresso das metas de economia
- Saldo atual das contas

## Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `supabase/functions/ai-financial-analysis/index.ts` |
| Criar | `src/components/reports/SmartAnalysis.tsx` |
| Editar | `src/pages/Reports.tsx` |

