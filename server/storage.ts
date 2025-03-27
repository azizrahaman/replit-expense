import {
  Account,
  InsertAccount,
  IncomeCategory,
  InsertIncomeCategory,
  ExpenseCategory,
  InsertExpenseCategory,
  Transaction,
  InsertTransaction,
  TransactionWithDetails,
  TimePeriod,
  DateRange,
} from "@shared/schema";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, isBefore, isAfter, isSameDay } from "date-fns";

export interface IStorage {
  // Account operations
  getAccounts(): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;
  
  // Income Category operations
  getIncomeCategories(): Promise<IncomeCategory[]>;
  getIncomeCategory(id: number): Promise<IncomeCategory | undefined>;
  createIncomeCategory(category: InsertIncomeCategory): Promise<IncomeCategory>;
  updateIncomeCategory(id: number, category: Partial<InsertIncomeCategory>): Promise<IncomeCategory | undefined>;
  deleteIncomeCategory(id: number): Promise<boolean>;
  
  // Expense Category operations
  getExpenseCategories(): Promise<ExpenseCategory[]>;
  getExpenseCategory(id: number): Promise<ExpenseCategory | undefined>;
  createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory>;
  updateExpenseCategory(id: number, category: Partial<InsertExpenseCategory>): Promise<ExpenseCategory | undefined>;
  deleteExpenseCategory(id: number): Promise<boolean>;
  
  // Transaction operations
  getTransactions(): Promise<Transaction[]>;
  getTransactionsWithDetails(): Promise<TransactionWithDetails[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionWithDetails(id: number): Promise<TransactionWithDetails | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  
  // Filtered Transactions
  getTransactionsByAccount(accountId: number): Promise<TransactionWithDetails[]>;
  getTransactionsByCategory(categoryId: number, type: 'income' | 'expense'): Promise<TransactionWithDetails[]>;
  getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<TransactionWithDetails[]>;
  getTransactionsByTimePeriod(period: TimePeriod, customRange?: DateRange): Promise<TransactionWithDetails[]>;
  
  // Summary operations
  getTotalBalance(): Promise<number>;
  getIncomeSum(period: TimePeriod, customRange?: DateRange): Promise<number>;
  getExpenseSum(period: TimePeriod, customRange?: DateRange): Promise<number>;
  getIncomeByCategorySum(period: TimePeriod, customRange?: DateRange): Promise<{ categoryId: number, categoryName: string, sum: number }[]>;
  getExpenseByCategorySum(period: TimePeriod, customRange?: DateRange): Promise<{ categoryId: number, categoryName: string, sum: number }[]>;
  getMonthlyData(year: number): Promise<{ month: number, income: number, expense: number }[]>;
}

export class MemStorage implements IStorage {
  private accounts: Map<number, Account>;
  private incomeCategories: Map<number, IncomeCategory>;
  private expenseCategories: Map<number, ExpenseCategory>;
  private transactions: Map<number, Transaction>;
  private accountIdCounter: number;
  private incomeCategoryIdCounter: number;
  private expenseCategoryIdCounter: number;
  private transactionIdCounter: number;

  constructor() {
    this.accounts = new Map();
    this.incomeCategories = new Map();
    this.expenseCategories = new Map();
    this.transactions = new Map();
    this.accountIdCounter = 1;
    this.incomeCategoryIdCounter = 1;
    this.expenseCategoryIdCounter = 1;
    this.transactionIdCounter = 1;
    
    // Initialize with default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Default Accounts
    const defaultAccounts: InsertAccount[] = [
      { name: "Bank of America", type: "bank", balance: 6280, description: "Checking **** 4578" },
      { name: "Chase", type: "bank", balance: 4200, description: "Savings **** 8751" },
      { name: "Cash", type: "cash", balance: 2100, description: "Physical wallet" },
    ];
    
    // Default Income Categories
    const defaultIncomeCategories: InsertIncomeCategory[] = [
      { name: "Salary", description: "Regular employment income" },
      { name: "Bonus", description: "Performance or holiday bonuses" },
      { name: "Investment", description: "Dividend or interest income" },
      { name: "Freelance", description: "Side gigs and freelance work" },
    ];
    
    // Default Expense Categories
    const defaultExpenseCategories: InsertExpenseCategory[] = [
      { name: "Food", description: "Groceries and dining out" },
      { name: "Housing", description: "Rent, mortgage, and home maintenance" },
      { name: "Transportation", description: "Car payments, gas, public transit" },
      { name: "Entertainment", description: "Movies, games, and activities" },
      { name: "Utilities", description: "Electricity, water, internet" },
    ];
    
    // Create defaults
    defaultAccounts.forEach(account => this.createAccount(account));
    defaultIncomeCategories.forEach(category => this.createIncomeCategory(category));
    defaultExpenseCategories.forEach(category => this.createExpenseCategory(category));
    
    // Add some sample transactions
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    const sampleTransactions: InsertTransaction[] = [
      {
        amount: 85.40,
        description: "Grocery Shopping",
        date: today,
        accountId: 1,
        type: "expense",
        categoryId: 1, // Food
      },
      {
        amount: 2750,
        description: "Salary Deposit",
        date: yesterday,
        accountId: 1,
        type: "income",
        categoryId: 1, // Salary
      },
      {
        amount: 1200,
        description: "Rent Payment",
        date: twoDaysAgo,
        accountId: 2,
        type: "expense",
        categoryId: 2, // Housing
      },
      {
        amount: 14.99,
        description: "Netflix Subscription",
        date: threeDaysAgo,
        accountId: 1,
        type: "expense",
        categoryId: 4, // Entertainment
      },
      {
        amount: 45,
        description: "Gas Station",
        date: fiveDaysAgo,
        accountId: 3,
        type: "expense",
        categoryId: 3, // Transportation
      },
    ];
    
    sampleTransactions.forEach(transaction => this.createTransaction(transaction));
  }

  // Helper method to get date range based on time period
  private getDateRangeForPeriod(period: TimePeriod, customRange?: DateRange): { start: Date, end: Date } {
    const now = new Date();
    
    switch (period) {
      case "this_week":
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case "this_month":
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
      case "last_month":
        const lastMonth = subMonths(now, 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth),
        };
      case "this_year":
        return {
          start: startOfYear(now),
          end: endOfYear(now),
        };
      case "custom":
        if (!customRange) {
          throw new Error("Custom date range is required for custom time period");
        }
        return {
          start: customRange.startDate,
          end: customRange.endDate,
        };
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
    }
  }

  // Account methods
  async getAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }

  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const id = this.accountIdCounter++;
    const newAccount: Account = { ...account, id };
    this.accounts.set(id, newAccount);
    return newAccount;
  }

  async updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined> {
    const existingAccount = this.accounts.get(id);
    if (!existingAccount) return undefined;
    
    const updatedAccount = { ...existingAccount, ...account };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<boolean> {
    // Check if account exists
    if (!this.accounts.has(id)) return false;
    
    // Check if any transactions use this account
    const hasTransactions = Array.from(this.transactions.values()).some(
      transaction => transaction.accountId === id
    );
    
    if (hasTransactions) {
      throw new Error("Cannot delete account with existing transactions");
    }
    
    return this.accounts.delete(id);
  }

  // Income Category methods
  async getIncomeCategories(): Promise<IncomeCategory[]> {
    return Array.from(this.incomeCategories.values());
  }

  async getIncomeCategory(id: number): Promise<IncomeCategory | undefined> {
    return this.incomeCategories.get(id);
  }

  async createIncomeCategory(category: InsertIncomeCategory): Promise<IncomeCategory> {
    // Check for duplicate name
    const existingWithName = Array.from(this.incomeCategories.values()).find(
      cat => cat.name.toLowerCase() === category.name.toLowerCase()
    );
    
    if (existingWithName) {
      throw new Error(`Income category with name "${category.name}" already exists`);
    }
    
    const id = this.incomeCategoryIdCounter++;
    const newCategory: IncomeCategory = { ...category, id };
    this.incomeCategories.set(id, newCategory);
    return newCategory;
  }

  async updateIncomeCategory(id: number, category: Partial<InsertIncomeCategory>): Promise<IncomeCategory | undefined> {
    const existingCategory = this.incomeCategories.get(id);
    if (!existingCategory) return undefined;
    
    // Check for duplicate name if name is being updated
    if (category.name && category.name !== existingCategory.name) {
      const existingWithName = Array.from(this.incomeCategories.values()).find(
        cat => cat.name.toLowerCase() === category.name!.toLowerCase() && cat.id !== id
      );
      
      if (existingWithName) {
        throw new Error(`Income category with name "${category.name}" already exists`);
      }
    }
    
    const updatedCategory = { ...existingCategory, ...category };
    this.incomeCategories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteIncomeCategory(id: number): Promise<boolean> {
    // Check if category exists
    if (!this.incomeCategories.has(id)) return false;
    
    // Check if any transactions use this category
    const hasTransactions = Array.from(this.transactions.values()).some(
      transaction => transaction.type === "income" && transaction.categoryId === id
    );
    
    if (hasTransactions) {
      throw new Error("Cannot delete category with existing transactions");
    }
    
    return this.incomeCategories.delete(id);
  }

  // Expense Category methods
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    return Array.from(this.expenseCategories.values());
  }

  async getExpenseCategory(id: number): Promise<ExpenseCategory | undefined> {
    return this.expenseCategories.get(id);
  }

  async createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory> {
    // Check for duplicate name
    const existingWithName = Array.from(this.expenseCategories.values()).find(
      cat => cat.name.toLowerCase() === category.name.toLowerCase()
    );
    
    if (existingWithName) {
      throw new Error(`Expense category with name "${category.name}" already exists`);
    }
    
    const id = this.expenseCategoryIdCounter++;
    const newCategory: ExpenseCategory = { ...category, id };
    this.expenseCategories.set(id, newCategory);
    return newCategory;
  }

  async updateExpenseCategory(id: number, category: Partial<InsertExpenseCategory>): Promise<ExpenseCategory | undefined> {
    const existingCategory = this.expenseCategories.get(id);
    if (!existingCategory) return undefined;
    
    // Check for duplicate name if name is being updated
    if (category.name && category.name !== existingCategory.name) {
      const existingWithName = Array.from(this.expenseCategories.values()).find(
        cat => cat.name.toLowerCase() === category.name!.toLowerCase() && cat.id !== id
      );
      
      if (existingWithName) {
        throw new Error(`Expense category with name "${category.name}" already exists`);
      }
    }
    
    const updatedCategory = { ...existingCategory, ...category };
    this.expenseCategories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteExpenseCategory(id: number): Promise<boolean> {
    // Check if category exists
    if (!this.expenseCategories.has(id)) return false;
    
    // Check if any transactions use this category
    const hasTransactions = Array.from(this.transactions.values()).some(
      transaction => transaction.type === "expense" && transaction.categoryId === id
    );
    
    if (hasTransactions) {
      throw new Error("Cannot delete category with existing transactions");
    }
    
    return this.expenseCategories.delete(id);
  }

  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTransactionsWithDetails(): Promise<TransactionWithDetails[]> {
    const transactions = await this.getTransactions();
    
    return transactions.map(transaction => {
      const account = this.accounts.get(transaction.accountId);
      let category;
      
      if (transaction.type === "income") {
        category = this.incomeCategories.get(transaction.categoryId);
      } else {
        category = this.expenseCategories.get(transaction.categoryId);
      }
      
      return {
        ...transaction,
        accountName: account?.name || "Unknown Account",
        categoryName: category?.name || "Unknown Category",
      };
    });
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionWithDetails(id: number): Promise<TransactionWithDetails | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const account = this.accounts.get(transaction.accountId);
    let category;
    
    if (transaction.type === "income") {
      category = this.incomeCategories.get(transaction.categoryId);
    } else {
      category = this.expenseCategories.get(transaction.categoryId);
    }
    
    return {
      ...transaction,
      accountName: account?.name || "Unknown Account",
      categoryName: category?.name || "Unknown Category",
    };
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    // Validate account exists
    const account = await this.getAccount(transaction.accountId);
    if (!account) {
      throw new Error(`Account with ID ${transaction.accountId} does not exist`);
    }
    
    // Validate category exists
    if (transaction.type === "income") {
      const category = await this.getIncomeCategory(transaction.categoryId);
      if (!category) {
        throw new Error(`Income category with ID ${transaction.categoryId} does not exist`);
      }
    } else if (transaction.type === "expense") {
      const category = await this.getExpenseCategory(transaction.categoryId);
      if (!category) {
        throw new Error(`Expense category with ID ${transaction.categoryId} does not exist`);
      }
    } else {
      throw new Error(`Invalid transaction type: ${transaction.type}`);
    }
    
    const id = this.transactionIdCounter++;
    const newTransaction: Transaction = { ...transaction, id };
    this.transactions.set(id, newTransaction);
    
    // Update account balance
    const newBalance = transaction.type === "income"
      ? account.balance + transaction.amount
      : account.balance - transaction.amount;
    
    await this.updateAccount(account.id, { balance: newBalance });
    
    return newTransaction;
  }

  async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const existingTransaction = this.transactions.get(id);
    if (!existingTransaction) return undefined;
    
    // Handle account change and balance updates
    if (transaction.accountId && transaction.accountId !== existingTransaction.accountId) {
      const oldAccount = await this.getAccount(existingTransaction.accountId);
      const newAccount = await this.getAccount(transaction.accountId);
      
      if (!newAccount) {
        throw new Error(`Account with ID ${transaction.accountId} does not exist`);
      }
      
      if (oldAccount) {
        // Revert the old transaction effect on the old account
        const oldAccountNewBalance = existingTransaction.type === "income"
          ? oldAccount.balance - existingTransaction.amount
          : oldAccount.balance + existingTransaction.amount;
        
        await this.updateAccount(oldAccount.id, { balance: oldAccountNewBalance });
      }
      
      // Apply the transaction effect to the new account
      const amount = transaction.amount || existingTransaction.amount;
      const type = transaction.type || existingTransaction.type;
      
      const newAccountNewBalance = type === "income"
        ? newAccount.balance + amount
        : newAccount.balance - amount;
      
      await this.updateAccount(newAccount.id, { balance: newAccountNewBalance });
    }
    // Handle amount or type change when account stays the same
    else if ((transaction.amount && transaction.amount !== existingTransaction.amount) || 
             (transaction.type && transaction.type !== existingTransaction.type)) {
      
      const account = await this.getAccount(existingTransaction.accountId);
      
      if (account) {
        // Revert the old transaction effect
        const accountBalanceAfterRevert = existingTransaction.type === "income"
          ? account.balance - existingTransaction.amount
          : account.balance + existingTransaction.amount;
        
        // Apply the new transaction effect
        const newAmount = transaction.amount || existingTransaction.amount;
        const newType = transaction.type || existingTransaction.type;
        
        const newAccountBalance = newType === "income"
          ? accountBalanceAfterRevert + newAmount
          : accountBalanceAfterRevert - newAmount;
        
        await this.updateAccount(account.id, { balance: newAccountBalance });
      }
    }
    
    // Validate category if changed
    if (transaction.categoryId && transaction.type) {
      if (transaction.type === "income") {
        const category = await this.getIncomeCategory(transaction.categoryId);
        if (!category) {
          throw new Error(`Income category with ID ${transaction.categoryId} does not exist`);
        }
      } else if (transaction.type === "expense") {
        const category = await this.getExpenseCategory(transaction.categoryId);
        if (!category) {
          throw new Error(`Expense category with ID ${transaction.categoryId} does not exist`);
        }
      }
    } else if (transaction.categoryId) {
      // Check category based on existing transaction type
      if (existingTransaction.type === "income") {
        const category = await this.getIncomeCategory(transaction.categoryId);
        if (!category) {
          throw new Error(`Income category with ID ${transaction.categoryId} does not exist`);
        }
      } else if (existingTransaction.type === "expense") {
        const category = await this.getExpenseCategory(transaction.categoryId);
        if (!category) {
          throw new Error(`Expense category with ID ${transaction.categoryId} does not exist`);
        }
      }
    } else if (transaction.type && transaction.type !== existingTransaction.type) {
      // Type changed but not category, validate existing category with new type
      if (transaction.type === "income") {
        const category = await this.getIncomeCategory(existingTransaction.categoryId);
        if (!category) {
          throw new Error(`Income category with ID ${existingTransaction.categoryId} does not exist`);
        }
      } else if (transaction.type === "expense") {
        const category = await this.getExpenseCategory(existingTransaction.categoryId);
        if (!category) {
          throw new Error(`Expense category with ID ${existingTransaction.categoryId} does not exist`);
        }
      }
    }
    
    const updatedTransaction = { ...existingTransaction, ...transaction };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const transaction = this.transactions.get(id);
    if (!transaction) return false;
    
    // Update account balance
    const account = await this.getAccount(transaction.accountId);
    if (account) {
      const newBalance = transaction.type === "income"
        ? account.balance - transaction.amount
        : account.balance + transaction.amount;
      
      await this.updateAccount(account.id, { balance: newBalance });
    }
    
    return this.transactions.delete(id);
  }

  // Filtered Transaction methods
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
      const transactionDate = new Date(transaction.date);
      return (
        (isAfter(transactionDate, startDate) || isSameDay(transactionDate, startDate)) &&
        (isBefore(transactionDate, endDate) || isSameDay(transactionDate, endDate))
      );
    });
  }

  async getTransactionsByTimePeriod(period: TimePeriod, customRange?: DateRange): Promise<TransactionWithDetails[]> {
    const { start, end } = this.getDateRangeForPeriod(period, customRange);
    return this.getTransactionsByDateRange(start, end);
  }

  // Summary methods
  async getTotalBalance(): Promise<number> {
    const accounts = await this.getAccounts();
    return accounts.reduce((total, account) => total + account.balance, 0);
  }

  async getIncomeSum(period: TimePeriod, customRange?: DateRange): Promise<number> {
    const transactions = await this.getTransactionsByTimePeriod(period, customRange);
    return transactions
      .filter(transaction => transaction.type === "income")
      .reduce((total, transaction) => total + transaction.amount, 0);
  }

  async getExpenseSum(period: TimePeriod, customRange?: DateRange): Promise<number> {
    const transactions = await this.getTransactionsByTimePeriod(period, customRange);
    return transactions
      .filter(transaction => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0);
  }

  async getIncomeByCategorySum(period: TimePeriod, customRange?: DateRange): Promise<{ categoryId: number, categoryName: string, sum: number }[]> {
    const transactions = await this.getTransactionsByTimePeriod(period, customRange);
    const incomeTransactions = transactions.filter(transaction => transaction.type === "income");
    
    const categoryMap = new Map<number, { categoryId: number, categoryName: string, sum: number }>();
    
    for (const transaction of incomeTransactions) {
      const { categoryId, categoryName, amount } = transaction;
      
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, { categoryId, categoryName, sum: 0 });
      }
      
      const category = categoryMap.get(categoryId)!;
      category.sum += amount;
    }
    
    return Array.from(categoryMap.values());
  }

  async getExpenseByCategorySum(period: TimePeriod, customRange?: DateRange): Promise<{ categoryId: number, categoryName: string, sum: number }[]> {
    const transactions = await this.getTransactionsByTimePeriod(period, customRange);
    const expenseTransactions = transactions.filter(transaction => transaction.type === "expense");
    
    const categoryMap = new Map<number, { categoryId: number, categoryName: string, sum: number }>();
    
    for (const transaction of expenseTransactions) {
      const { categoryId, categoryName, amount } = transaction;
      
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, { categoryId, categoryName, sum: 0 });
      }
      
      const category = categoryMap.get(categoryId)!;
      category.sum += amount;
    }
    
    return Array.from(categoryMap.values());
  }

  async getMonthlyData(year: number): Promise<{ month: number, income: number, expense: number }[]> {
    const transactions = await this.getTransactionsWithDetails();
    
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0
    }));
    
    for (const transaction of transactions) {
      const transactionDate = new Date(transaction.date);
      const transactionYear = transactionDate.getFullYear();
      const transactionMonth = transactionDate.getMonth();
      
      if (transactionYear === year) {
        if (transaction.type === "income") {
          monthlyData[transactionMonth].income += transaction.amount;
        } else {
          monthlyData[transactionMonth].expense += transaction.amount;
        }
      }
    }
    
    return monthlyData;
  }
}

import { DatabaseStorage } from "./database-storage";

// For production, use the database storage
import { SupabaseStorage } from './supabase-storage';

// Use Supabase storage implementation
// Import the DatabaseStorage
import { DatabaseStorage } from "./database-storage";

// Use DatabaseStorage that works with direct PostgreSQL connection
export const storage = new DatabaseStorage();

// For development/testing, use memory storage
// export const storage = new MemStorage();
