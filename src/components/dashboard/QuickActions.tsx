import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle, ArrowDownCircle, ArrowRightLeft } from 'lucide-react';
import { TransactionType } from '@/types/database';

interface QuickActionsProps {
  onNewIncome: () => void;
  onNewExpense: () => void;
  onTransfer: () => void;
}

export function QuickActions({ onNewIncome, onNewExpense, onTransfer }: QuickActionsProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl p-4 sm:p-6 border border-primary/20"
    >
      <h2 className="text-sm font-medium text-muted-foreground mb-4">Ações Rápidas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <motion.div variants={itemVariants}>
          <Button
            onClick={onNewIncome}
            className="w-full h-14 sm:h-16 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:shadow-emerald-500/40 hover:scale-[1.02]"
            size="lg"
          >
            <ArrowUpCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
            <span className="font-semibold">Nova Receita</span>
          </Button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            onClick={onNewExpense}
            className="w-full h-14 sm:h-16 bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25 transition-all duration-200 hover:shadow-rose-500/40 hover:scale-[1.02]"
            size="lg"
          >
            <ArrowDownCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
            <span className="font-semibold">Nova Despesa</span>
          </Button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            onClick={onTransfer}
            variant="outline"
            className="w-full h-14 sm:h-16 border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 shadow-lg transition-all duration-200 hover:scale-[1.02]"
            size="lg"
          >
            <ArrowRightLeft className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary" />
            <span className="font-semibold text-primary">Transferência</span>
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
