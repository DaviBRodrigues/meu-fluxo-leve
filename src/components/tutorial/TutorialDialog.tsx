import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Target,
  BarChart3,
  PiggyBank,
  TrendingUp,
  History,
  CreditCard,
  ArrowLeftRight,
  Bell,
  Palette,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: Sparkles,
    title: 'Bem-vindo ao Equilibra! 🎉',
    description: 'Seu sistema financeiro pessoal. Vamos te mostrar tudo que você pode fazer aqui em poucos passos.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Sua visão geral. Veja seu saldo total, receitas, despesas e economia do mês. Navegue entre meses e acompanhe tudo num só lugar.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: ArrowUpCircle,
    title: 'Receitas',
    description: 'Registre todo dinheiro que entra: salário, freelance, vendas etc. Organize por categorias e veja o total mensal.',
    color: 'text-income',
    bgColor: 'bg-income/10',
  },
  {
    icon: ArrowDownCircle,
    title: 'Despesas',
    description: 'Registre seus gastos. Você pode criar despesas normais ou parceladas (ex: 12x). O sistema divide automaticamente!',
    color: 'text-expense',
    bgColor: 'bg-expense/10',
  },
  {
    icon: CreditCard,
    title: 'Parcelamentos',
    description: 'Ao criar uma despesa parcelada, acompanhe o progresso no Dashboard. Use o botão ✅ para registrar parcelas e 🗑️ para excluir todo o parcelamento.',
    color: 'text-expense',
    bgColor: 'bg-expense/10',
  },
  {
    icon: Wallet,
    title: 'Contas e Carteiras',
    description: 'Crie várias contas: conta corrente, poupança, carteira, etc. Cada uma tem seu saldo independente.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: ArrowLeftRight,
    title: 'Transferências',
    description: 'Mova dinheiro entre suas contas sem afetar seus totais de receita e despesa. Tudo fica organizado.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: TrendingUp,
    title: 'Investimentos',
    description: 'Acompanhe seus investimentos separadamente. Registre aportes, retiradas e rendimentos.',
    color: 'text-income',
    bgColor: 'bg-income/10',
  },
  {
    icon: PiggyBank,
    title: 'Orçamentos',
    description: 'Defina limites de gastos por categoria. As barras mudam de cor quando você está se aproximando do limite.',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    icon: Target,
    title: 'Metas de Economia',
    description: 'Defina metas financeiras (viagem, emergência, compra) e acompanhe quanto já juntou.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Bell,
    title: 'Lembretes',
    description: 'Configure lembretes para despesas fixas mensais (aluguel, internet, etc). O sistema avisa quando está na hora de registrar.',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    icon: BarChart3,
    title: 'Relatórios',
    description: 'Veja gráficos de como seu dinheiro está distribuído por categorias e como evoluiu ao longo dos meses.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: History,
    title: 'Histórico',
    description: 'Tudo que você faz fica registrado aqui: criações, edições e exclusões. Nada se perde.',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
  },
  {
    icon: Palette,
    title: 'Personalização',
    description: 'Nas Configurações, mude as cores, o estilo do layout e o tema (claro/escuro). Deixe do seu jeito!',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: CheckCircle2,
    title: 'Tudo pronto! 🚀',
    description: 'Agora é só começar. Crie sua primeira conta, registre uma receita e veja a mágica acontecer. Você pode rever este tutorial a qualquer momento nas Configurações.',
    color: 'text-income',
    bgColor: 'bg-income/10',
  },
];

export default function TutorialDialog({ isOpen, onClose }: TutorialDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleClose = () => {
    setCurrentStep(0);
    localStorage.setItem('tutorial-completed', 'true');
    onClose();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="relative">
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-6 sm:p-8"
            >
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className={cn('w-20 h-20 rounded-2xl flex items-center justify-center', step.bgColor)}>
                  <Icon className={cn('w-10 h-10', step.color)} />
                </div>
              </div>

              {/* Content */}
              <div className="text-center space-y-3">
                <h2 className="text-xl font-bold">{step.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>

              {/* Step counter */}
              <div className="flex justify-center gap-1.5 mt-6">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all',
                      i === currentStep ? 'bg-primary w-6' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    )}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={isFirst}
              className={cn(isFirst && 'invisible')}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>

            {!isFirst && !isLast && (
              <Button variant="ghost" size="sm" onClick={handleClose} className="text-muted-foreground">
                Pular
              </Button>
            )}

            <Button size="sm" onClick={handleNext}>
              {isLast ? 'Começar!' : isFirst ? 'Vamos lá!' : 'Próximo'}
              {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
