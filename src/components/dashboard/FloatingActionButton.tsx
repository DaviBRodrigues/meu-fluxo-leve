import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onNewIncome: () => void;
  onNewExpense: () => void;
  onTransfer: () => void;
}

export function FloatingActionButton({
  onNewIncome,
  onNewExpense,
  onTransfer,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: 'Receita',
      icon: ArrowUpCircle,
      onClick: onNewIncome,
      className: 'bg-income text-income-foreground hover:bg-income/90',
    },
    {
      label: 'Despesa',
      icon: ArrowDownCircle,
      onClick: onNewExpense,
      className: 'bg-expense text-expense-foreground hover:bg-expense/90',
    },
    {
      label: 'Transferência',
      icon: ArrowRightLeft,
      onClick: onTransfer,
      className: 'bg-primary text-primary-foreground hover:bg-primary/90',
    },
  ];

  const handleActionClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 lg:hidden">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            {/* Action buttons */}
            <motion.div className="absolute bottom-16 right-0 flex flex-col-reverse gap-3 items-end">
              {actions.map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="bg-card px-3 py-1.5 rounded-lg shadow-lg text-sm font-medium">
                    {action.label}
                  </span>
                  <Button
                    size="icon"
                    className={cn('w-12 h-12 rounded-full shadow-lg', action.className)}
                    onClick={() => handleActionClick(action.onClick)}
                  >
                    <action.icon className="w-6 h-6" />
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          size="icon"
          className="w-14 h-14 rounded-full shadow-xl bg-primary hover:bg-primary/90"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Plus className="w-6 h-6" />
          )}
        </Button>
      </motion.div>
    </div>
  );
}
