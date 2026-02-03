import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from '@/components/layout/AppLayout';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency } from '@/lib/format';
import {
  History as HistoryIcon,
  Search,
  Trash2,
  Plus,
  Pencil,
  Trash,
  Filter,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export default function History() {
  const { logs, isLoading, clearLogs } = useActivityLogs();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <Plus className="h-4 w-4 text-emerald-500" />;
      case 'update':
        return <Pencil className="h-4 w-4 text-amber-500" />;
      case 'delete':
        return <Trash className="h-4 w-4 text-rose-500" />;
      default:
        return <HistoryIcon className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create':
        return 'Criação';
      case 'update':
        return 'Edição';
      case 'delete':
        return 'Exclusão';
      default:
        return action;
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'create':
        return 'default' as const;
      case 'update':
        return 'secondary' as const;
      case 'delete':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const getEntityLabel = (entity: string) => {
    const labels: Record<string, string> = {
      transaction: 'Transação',
      account: 'Conta',
      investment: 'Investimento',
      goal: 'Meta',
      budget: 'Orçamento',
      transfer: 'Transferência',
    };
    return labels[entity] || entity;
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.entity_description.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || log.entity_type === filterType;
    const matchesAction = filterAction === 'all' || log.action_type === filterAction;
    return matchesSearch && matchesType && matchesAction;
  });

  const entityTypes = [...new Set(logs.map((log) => log.entity_type))];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <SkeletonCard variant="list" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HistoryIcon className="h-7 w-7 text-primary" />
              Histórico de Atividades
            </h1>
            <p className="text-muted-foreground mt-1">
              Registro completo de todas as movimentações do sistema
            </p>
          </div>
          {logs.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsClearDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Histórico
            </Button>
          )}
        </div>

        {logs.length === 0 ? (
          <EmptyState
            icon={HistoryIcon}
            title="Nenhuma atividade registrada"
            description="Quando você criar, editar ou excluir itens, eles aparecerão aqui."
          />
        ) : (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por descrição..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {entityTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {getEntityLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Ação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as ações</SelectItem>
                      <SelectItem value="create">Criação</SelectItem>
                      <SelectItem value="update">Edição</SelectItem>
                      <SelectItem value="delete">Exclusão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Data/Hora</TableHead>
                      <TableHead className="w-[100px]">Ação</TableHead>
                      <TableHead className="w-[120px]">Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right w-[120px]">Valor</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <motion.tbody
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="contents"
                    >
                      {filteredLogs.map((log) => (
                        <motion.tr
                          key={log.id}
                          variants={itemVariants}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <TableCell className="font-mono text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", {
                                locale: ptBR,
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getActionBadgeVariant(log.action_type)}>
                              <span className="flex items-center gap-1">
                                {getActionIcon(log.action_type)}
                                {getActionLabel(log.action_type)}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {getEntityLabel(log.entity_type)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={log.is_deleted ? 'line-through text-muted-foreground' : ''}>
                              {log.entity_description}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {log.amount != null && formatCurrency(Number(log.amount))}
                          </TableCell>
                          <TableCell>
                            {log.is_deleted && (
                              <Badge variant="outline" className="text-rose-500 border-rose-500/50">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Excluído
                              </Badge>
                            )}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </motion.tbody>
                  </TableBody>
                </Table>
              </div>

              {filteredLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum resultado encontrado para os filtros selecionados.
                </div>
              )}

              {/* Summary */}
              <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  Exibindo {filteredLogs.length} de {logs.length} registros
                </span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1">
                    <Plus className="h-3 w-3 text-emerald-500" />
                    {logs.filter((l) => l.action_type === 'create').length} criações
                  </span>
                  <span className="flex items-center gap-1">
                    <Pencil className="h-3 w-3 text-amber-500" />
                    {logs.filter((l) => l.action_type === 'update').length} edições
                  </span>
                  <span className="flex items-center gap-1">
                    <Trash className="h-3 w-3 text-rose-500" />
                    {logs.filter((l) => l.action_type === 'delete').length} exclusões
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clear Dialog */}
        <DeleteConfirmDialog
          isOpen={isClearDialogOpen}
          onClose={() => setIsClearDialogOpen(false)}
          onConfirm={() => clearLogs.mutate()}
          title="Limpar todo o histórico"
          description="Esta ação removerá permanentemente todos os registros de atividade. Esta ação não pode ser desfeita."
          affectsBalance={false}
          isLoading={clearLogs.isPending}
        />
      </motion.div>
    </AppLayout>
  );
}
