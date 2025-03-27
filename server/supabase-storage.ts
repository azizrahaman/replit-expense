import { supabase } from './supabase';
import {
  Account,
  IncomeCategory,
  ExpenseCategory,
  Transaction,
  TransactionWithDetails,
  InsertAccount,
  InsertIncomeCategory,
  InsertExpenseCategory,
  InsertTransaction,
  TimePeriod,
  DateRange,
} from '@shared/schema';
import { IStorage } from './storage';
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  subWeeks,
  parseISO,
  isAfter,
  isBefore,
} from 'date-fns';

export class SupabaseStorage implements IStorage {
  
  private getDateRangeForPeriod(period: TimePeriod, customRange?: DateRange): { start: Date, end: Date } {
    const now = new Date();
    
    switch (period) {
      case "all":
        return { start: new Date(0), end: now };
      case "this-month":
        return { start: startOfMonth(now), end: now };
      case "last-month":
        return { 
          start: startOfMonth(subMonths(now, 1)), 
          end: endOfMonth(subMonths(now, 1)) 
        };
      case "this-week":
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: now };
      case "last-week":
        return { 
          start: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), 
          end: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }) 
        };
      case "this-year":
        return { start: new Date(now.getFullYear(), 0, 1), end: now };
      case "custom":
        if (!customRange) {
          return { start: new Date(0), end: now };
        }
        
        const startDate = typeof customRange.startDate === 'string' 
          ? new Date(customRange.startDate) 
          : customRange.startDate;
          
        const endDate = customRange.endDate 
          ? (typeof customRange.endDate === 'string' ? new Date(customRange.endDate) : customRange.endDate) 
          : now;
          
        return { start: startDate, end: endDate };
      default:
        return { start: new Date(0), end: now };
    }
  }

  // Account operations
  async getAccounts(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching accounts:', error);
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }
    
    return data as Account[];
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {  // Record not found
        return undefined;
      }
      console.error(`Error fetching account ${id}:`, error);
      throw new Error(`Failed to fetch account: ${error.message}`);
    }
    
    return data as Account;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert(account)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating account:', error);
        throw new Error(error.message || 'Failed to create account');
      }
      
      if (!data) {
        throw new Error('No data returned after creating account');
      }
      
      return data as Account;
    } catch (error) {
      console.error('Error creating account:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create account: ${error.message}`);
      }
      throw new Error('Failed to create account: Unknown error');
    }
  }

  async updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('accounts')
      .update({
        ...account,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {  // Record not found
        return undefined;
      }
      console.error(`Error updating account ${id}:`, error);
      throw new Error(`Failed to update account: ${error.message}`);
    }
    
    return data as Account;
  }

  async deleteAccount(id: number): Promise<boolean> {
    // Check if the account has associated transactions
    const { count: transactionCount, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', id);
    
    if (countError) {
      console.error(`Error checking transactions for account ${id}:`, countError);
      throw new Error(`Failed to check transactions: ${countError.message}`);
    }
    
    if (transactionCount && transactionCount > 0) {
      throw new Error(`Cannot delete account with ID ${id} because it has ${transactionCount} associated transactions.`);
    }
    
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting account ${id}:`, error);
      throw new Error(`Failed to delete account: ${error.message}`);
    }
    
    return true;
  }
  
  // Income Category operations
  async getIncomeCategories(): Promise<IncomeCategory[]> {
    const { data, error } = await supabase
      .from('income_categories')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching income categories:', error);
      throw new Error(`Failed to fetch income categories: ${error.message}`);
    }
    
    return data as IncomeCategory[];
  }

  async getIncomeCategory(id: number): Promise<IncomeCategory | undefined> {
    const { data, error } = await supabase
      .from('income_categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {  // Record not found
        return undefined;
      }
      console.error(`Error fetching income category ${id}:`, error);
      throw new Error(`Failed to fetch income category: ${error.message}`);
    }
    
    return data as IncomeCategory;
  }

  async createIncomeCategory(category: InsertIncomeCategory): Promise<IncomeCategory> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('income_categories')
      .insert({
        ...category,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating income category:', error);
      throw new Error(`Failed to create income category: ${error.message}`);
    }
    
    return data as IncomeCategory;
  }

  async updateIncomeCategory(id: number, category: Partial<InsertIncomeCategory>): Promise<IncomeCategory | undefined> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('income_categories')
      .update({
        ...category,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {  // Record not found
        return undefined;
      }
      console.error(`Error updating income category ${id}:`, error);
      throw new Error(`Failed to update income category: ${error.message}`);
    }
    
    return data as IncomeCategory;
  }

  async deleteIncomeCategory(id: number): Promise<boolean> {
    // Check if the category has associated transactions
    const { count: transactionCount, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)
      .eq('type', 'income');
    
    if (countError) {
      console.error(`Error checking transactions for income category ${id}:`, countError);
      throw new Error(`Failed to check transactions: ${countError.message}`);
    }
    
    if (transactionCount && transactionCount > 0) {
      throw new Error(`Cannot delete income category with ID ${id} because it has ${transactionCount} associated transactions.`);
    }
    
    const { error } = await supabase
      .from('income_categories')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting income category ${id}:`, error);
      throw new Error(`Failed to delete income category: ${error.message}`);
    }
    
    return true;
  }
  
  // Expense Category operations
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching expense categories:', error);
      throw new Error(`Failed to fetch expense categories: ${error.message}`);
    }
    
    return data as ExpenseCategory[];
  }

  async getExpenseCategory(id: number): Promise<ExpenseCategory | undefined> {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {  // Record not found
        return undefined;
      }
      console.error(`Error fetching expense category ${id}:`, error);
      throw new Error(`Failed to fetch expense category: ${error.message}`);
    }
    
    return data as ExpenseCategory;
  }

  async createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('expense_categories')
      .insert({
        ...category,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating expense category:', error);
      throw new Error(`Failed to create expense category: ${error.message}`);
    }
    
    return data as ExpenseCategory;
  }

  async updateExpenseCategory(id: number, category: Partial<InsertExpenseCategory>): Promise<ExpenseCategory | undefined> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('expense_categories')
      .update({
        ...category,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {  // Record not found
        return undefined;
      }
      console.error(`Error updating expense category ${id}:`, error);
      throw new Error(`Failed to update expense category: ${error.message}`);
    }
    
    return data as ExpenseCategory;
  }

  async deleteExpenseCategory(id: number): Promise<boolean> {
    // Check if the category has associated transactions
    const { count: transactionCount, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)
      .eq('type', 'expense');
    
    if (countError) {
      console.error(`Error checking transactions for expense category ${id}:`, countError);
      throw new Error(`Failed to check transactions: ${countError.message}`);
    }
    
    if (transactionCount && transactionCount > 0) {
      throw new Error(`Cannot delete expense category with ID ${id} because it has ${transactionCount} associated transactions.`);
    }
    
    const { error } = await supabase
      .from('expense_categories')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting expense category ${id}:`, error);
      throw new Error(`Failed to delete expense category: ${error.message}`);
    }
    
    return true;
  }
  
  // Transaction operations
  async getTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching transactions:', error);
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
    
    return data as Transaction[];
  }

  async getTransactionsWithDetails(): Promise<TransactionWithDetails[]> {
    const transactions = await this.getTransactions();
    const accounts = await this.getAccounts();
    const incomeCategories = await this.getIncomeCategories();
    const expenseCategories = await this.getExpenseCategories();
    
    return transactions.map(transaction => {
      const account = accounts.find(a => a.id === transaction.account_id);
      
      let categoryName = 'Unknown';
      if (transaction.type === 'income') {
        const category = incomeCategories.find(c => c.id === transaction.category_id);
        if (category) categoryName = category.name;
      } else {
        const category = expenseCategories.find(c => c.id === transaction.category_id);
        if (category) categoryName = category.name;
      }
      
      return {
        ...transaction,
        accountId: transaction.account_id,
        categoryId: transaction.category_id,
        accountName: account?.name || 'Unknown Account',
        categoryName
      };
    });
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {  // Record not found
        return undefined;
      }
      console.error(`Error fetching transaction ${id}:`, error);
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }
    
    return data as Transaction;
  }

  async getTransactionWithDetails(id: number): Promise<TransactionWithDetails | undefined> {
    const transaction = await this.getTransaction(id);
    if (!transaction) return undefined;
    
    const account = await this.getAccount(transaction.account_id);
    
    let category: IncomeCategory | ExpenseCategory | undefined;
    if (transaction.type === 'income') {
      category = await this.getIncomeCategory(transaction.category_id);
    } else {
      category = await this.getExpenseCategory(transaction.category_id);
    }
    
    return {
      ...transaction,
      accountId: transaction.account_id,
      categoryId: transaction.category_id,
      accountName: account?.name || 'Unknown Account',
      categoryName: category?.name || 'Unknown Category'
    };
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...transaction,
        account_id: transaction.account_id,
        category_id: transaction.category_id,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating transaction:', error);
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
    
    // Update account balance
    const account = await this.getAccount(transaction.account_id);
    if (account) {
      const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      await this.updateAccount(account.id, {
        balance: account.balance + balanceChange
      });
    }
    
    return data as Transaction;
  }

  async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    // Get the original transaction to calculate balance changes
    const originalTransaction = await this.getTransaction(id);
    if (!originalTransaction) {
      return undefined;
    }
    
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('transactions')
      .update({
        ...transaction,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {  // Record not found
        return undefined;
      }
      console.error(`Error updating transaction ${id}:`, error);
      throw new Error(`Failed to update transaction: ${error.message}`);
    }
    
    const updatedTransaction = data as Transaction;
    
    // If amount, type, or account changed, update account balances
    if (
      transaction.amount !== undefined || 
      transaction.type !== undefined || 
      transaction.account_id !== undefined
    ) {
      // Handle account change - revert original account balance
      if (transaction.account_id !== undefined && transaction.account_id !== originalTransaction.account_id) {
        const originalAccount = await this.getAccount(originalTransaction.account_id);
        if (originalAccount) {
          const originalBalanceChange = originalTransaction.type === 'income' 
            ? -originalTransaction.amount 
            : originalTransaction.amount;
          await this.updateAccount(originalAccount.id, {
            balance: originalAccount.balance + originalBalanceChange
          });
        }
        
        // Update new account balance
        const newAccount = await this.getAccount(transaction.account_id);
        if (newAccount) {
          const newBalanceChange = (transaction.type || originalTransaction.type) === 'income' 
            ? (transaction.amount || originalTransaction.amount) 
            : -(transaction.amount || originalTransaction.amount);
          await this.updateAccount(newAccount.id, {
            balance: newAccount.balance + newBalanceChange
          });
        }
      } else {
        // Same account but amount or type changed
        const account = await this.getAccount(originalTransaction.account_id);
        if (account) {
          // Revert original transaction effect
          const originalBalanceChange = originalTransaction.type === 'income' 
            ? -originalTransaction.amount 
            : originalTransaction.amount;
          
          // Apply new transaction effect
          const newBalanceChange = (transaction.type || originalTransaction.type) === 'income' 
            ? (transaction.amount || originalTransaction.amount) 
            : -(transaction.amount || originalTransaction.amount);
          
          await this.updateAccount(account.id, {
            balance: account.balance + originalBalanceChange + newBalanceChange
          });
        }
      }
    }
    
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    // Get the transaction before deleting it
    const transaction = await this.getTransaction(id);
    if (!transaction) {
      return false;
    }
    
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting transaction ${id}:`, error);
      throw new Error(`Failed to delete transaction: ${error.message}`);
    }
    
    // Update account balance
    const account = await this.getAccount(transaction.account_id);
    if (account) {
      const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
      await this.updateAccount(account.id, {
        balance: account.balance + balanceChange
      });
    }
    
    return true;
  }
  
  // Filtered Transactions
  async getTransactionsByAccount(accountId: number): Promise<TransactionWithDetails[]> {
    const transactions = await this.getTransactionsWithDetails();
    return transactions.filter(transaction => transaction.accountId === accountId);
  }

  async getTransactionsByCategory(categoryId: number, type: 'income' | 'expense'): Promise<TransactionWithDetails[]> {
    const transactions = await this.getTransactionsWithDetails();
    return transactions.filter(
      transaction => transaction.categoryId === categoryId && transaction.type === type
    );
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<TransactionWithDetails[]> {
    const transactions = await this.getTransactionsWithDetails();
    return transactions.filter(transaction => {
      const transactionDate = parseISO(transaction.date);
      return isAfter(transactionDate, startDate) && isBefore(transactionDate, endDate);
    });
  }

  async getTransactionsByTimePeriod(period: TimePeriod, customRange?: DateRange): Promise<TransactionWithDetails[]> {
    const { start, end } = this.getDateRangeForPeriod(period, customRange);
    return this.getTransactionsByDateRange(start, end);
  }
  
  // Summary operations
  async getTotalBalance(): Promise<number> {
    const accounts = await this.getAccounts();
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  }

  async getIncomeSum(period: TimePeriod, customRange?: DateRange): Promise<number> {
    const transactions = await this.getTransactionsByTimePeriod(period, customRange);
    return transactions
      .filter(transaction => transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  }

  async getExpenseSum(period: TimePeriod, customRange?: DateRange): Promise<number> {
    const transactions = await this.getTransactionsByTimePeriod(period, customRange);
    return transactions
      .filter(transaction => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  }

  async getIncomeByCategorySum(period: TimePeriod, customRange?: DateRange): Promise<{ categoryId: number, categoryName: string, sum: number }[]> {
    const transactions = await this.getTransactionsByTimePeriod(period, customRange);
    const incomeTransactions = transactions.filter(transaction => transaction.type === 'income');
    
    const categoryMap = new Map<number, { categoryName: string, sum: number }>();
    
    incomeTransactions.forEach(transaction => {
      const current = categoryMap.get(transaction.categoryId) || { 
        categoryName: transaction.categoryName, 
        sum: 0 
      };
      categoryMap.set(transaction.categoryId, {
        categoryName: transaction.categoryName,
        sum: current.sum + transaction.amount
      });
    });
    
    return Array.from(categoryMap.entries()).map(([categoryId, { categoryName, sum }]) => ({
      categoryId,
      categoryName,
      sum
    }));
  }

  async getExpenseByCategorySum(period: TimePeriod, customRange?: DateRange): Promise<{ categoryId: number, categoryName: string, sum: number }[]> {
    const transactions = await this.getTransactionsByTimePeriod(period, customRange);
    const expenseTransactions = transactions.filter(transaction => transaction.type === 'expense');
    
    const categoryMap = new Map<number, { categoryName: string, sum: number }>();
    
    expenseTransactions.forEach(transaction => {
      const current = categoryMap.get(transaction.categoryId) || { 
        categoryName: transaction.categoryName, 
        sum: 0 
      };
      categoryMap.set(transaction.categoryId, {
        categoryName: transaction.categoryName,
        sum: current.sum + transaction.amount
      });
    });
    
    return Array.from(categoryMap.entries()).map(([categoryId, { categoryName, sum }]) => ({
      categoryId,
      categoryName,
      sum
    }));
  }

  async getMonthlyData(year: number): Promise<{ month: number, income: number, expense: number }[]> {
    const data: { month: number, income: number, expense: number }[] = [];
    
    for (let month = 0; month < 12; month++) {
      const startDate = new Date(year, month, 1);
      const endDate = endOfMonth(startDate);
      const transactions = await this.getTransactionsByDateRange(startDate, endDate);
      
      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      data.push({ month: month + 1, income, expense });
    }
    
    return data;
  }
}