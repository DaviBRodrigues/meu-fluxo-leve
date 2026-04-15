

# Visualização Compacta para Transações

## Resumo

Adicionar um interruptor (toggle) de "Visualização Compacta" na área de filtros das transações. Quando ativado, os itens ficam menores e mais densos, permitindo ver mais transações na tela.

## Mudanças

### 1. `src/components/transactions/TransactionFilters.tsx`
- Adicionar prop `compact` e `onCompactChange`
- Renderizar um Switch com label "Compacto" ao lado dos filtros de período
- Persistir a preferência no `localStorage` (`transaction-compact-view`)

### 2. `src/components/transactions/TransactionList.tsx`
- Adicionar prop `compact` (boolean)
- Gerenciar estado `compact` internamente (lido do localStorage)
- Passar para `TransactionFilters`
- Quando compacto:
  - Ícone de tipo: `w-8 h-8` (era `w-12 h-12`), ícone interno `w-4 h-4` (era `w-6 h-6`)
  - Padding do item: `p-2` (era `p-3`), `gap-2` (era `gap-3`)
  - Valor: `text-sm font-semibold` (era `text-lg font-bold`)
  - Espaçamento entre itens: `space-y-1` (era `space-y-2`)
  - Espaçamento entre grupos: `space-y-3` (era `space-y-6`)
  - Remover `rounded-xl` → `rounded-lg`
  - Remover `shadow-sm` e `hover:shadow-md`

### 3. Páginas (sem alteração necessária)
O estado é gerido dentro do `TransactionList`, então `Expenses.tsx`, `Income.tsx` e `History.tsx` não precisam de mudanças.

## Detalhes Técnicos

- O estado compacto fica no `localStorage` com chave `transaction-compact-view`
- O Switch usa o componente `@/components/ui/switch` já existente
- A transição entre modos usa as classes condicionais via `cn()`

