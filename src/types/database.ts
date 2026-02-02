export type TransactionType = 'income' | 'expense';
export type RecurrenceType = 'fixed' | 'variable';
export type InvestmentTransactionType = 'deposit' | 'withdrawal' | 'yield';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  type: TransactionType;
  color: string;
  icon: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  recurrence: RecurrenceType;
  is_recurring: boolean;
  recurring_day: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category;
  account?: Account;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  color: string;
  icon: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpendingAlert {
  id: string;
  user_id: string;
  category_id: string | null;
  threshold_amount: number;
  threshold_percentage: number | null;
  is_active: boolean;
  created_at: string;
  // Joined fields
  category?: Category;
}

export interface RecurringReminder {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category_id: string;
  account_id: string;
  day_of_month: number;
  is_active: boolean;
  last_reminded_at: string | null;
  created_at: string;
  // Joined fields
  category?: Category;
  account?: Account;
}

export interface InvestmentCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  category_id: string | null;
  current_amount: number;
  initial_amount: number;
  target_amount: number | null;
  color: string;
  icon: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: InvestmentCategory;
}

export interface InvestmentTransaction {
  id: string;
  user_id: string;
  investment_id: string;
  account_id: string;
  type: InvestmentTransactionType;
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
  // Joined fields
  investment?: Investment;
  account?: Account;
}
