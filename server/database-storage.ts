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
  accounts,
  incomeCategories,
  expenseCategories,
  transactions
} from "@shared/schema";
import { db } from "./db";
import { eq, and, between, desc, sql } from "drizzle-orm";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
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
    return await db.select().from(accounts).orderBy(accounts.id);
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined> {
    const [updatedAccount] = await db
      .update(accounts)
      .set(account)
      .where(eq(accounts.id, id))
      .returning();
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<boolean> {
    // Check if account has transactions
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(eq(transactions.accountId, id));

    if (result.count > 0) {
      throw new Error("Cannot delete account with existing transactions");
    }

    const [deletedAccount] = await db
      .delete(accounts)
      .where(eq(accounts.id, id))
      .returning();
    
    return !!deletedAccount;
  }

  // Income Category methods
  async getIncomeCategories(): Promise<IncomeCategory[]> {
    return await db.select().from(incomeCategories).orderBy(incomeCategories.id);
  }

  async getIncomeCategory(id: number): Promise<IncomeCategory | undefined> {
    const [category] = await db
      .select()
      .from(incomeCategories)
      .where(eq(incomeCategories.id, id));
    return category;
  }

  async createIncomeCategory(category: InsertIncomeCategory): Promise<IncomeCategory> {
    // Check for duplicate name
    const [existingCategory] = await db
      .select()
      .from(incomeCategories)
      .where(sql`lower(name) = lower(${category.name})`);

    if (existingCategory) {
      throw new Error(`Income category with name "${category.name}" already exists`);
    }

    const [newCategory] = await db
      .insert(incomeCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateIncomeCategory(id: number, category: Partial<InsertIncomeCategory>): Promise<IncomeCategory | undefined> {
    if (category.name) {
      // Check for duplicate name
      const [existingCategory] = await db
        .select()
        .from(incomeCategories)
        .where(
          and(
            sql`lower(name) = lower(${category.name})`,
            sql`id <> ${id}`
          )
        );

      if (existingCategory) {
        throw new Error(`Income category with name "${category.name}" already exists`);
      }
    }

    const [updatedCategory] = await db
      .update(incomeCategories)
      .set(category)
      .where(eq(incomeCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteIncomeCategory(id: number): Promise<boolean> {
    // Check if category has transactions
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.categoryId, id),
          eq(transactions.type, "income")
        )
      );

    if (result.count > 0) {
      throw new Error("Cannot delete category with existing transactions");
    }

    const [deletedCategory] = await db
      .delete(incomeCategories)
      .where(eq(incomeCategories.id, id))
      .returning();
    
    return !!deletedCategory;
  }

  // Expense Category methods
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    return await db.select().from(expenseCategories).orderBy(expenseCategories.id);
  }

  async getExpenseCategory(id: number): Promise<ExpenseCategory | undefined> {
    const [category] = await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.id, id));
    return category;
  }

  async createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory> {
    // Check for duplicate name
    const [existingCategory] = await db
      .select()
      .from(expenseCategories)
      .where(sql`lower(name) = lower(${category.name})`);

    if (existingCategory) {
      throw new Error(`Expense category with name "${category.name}" already exists`);
    }

    const [newCategory] = await db
      .insert(expenseCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateExpenseCategory(id: number, category: Partial<InsertExpenseCategory>): Promise<ExpenseCategory | undefined> {
    if (category.name) {
      // Check for duplicate name
      const [existingCategory] = await db
        .select()
        .from(expenseCategories)
        .where(
          and(
            sql`lower(name) = lower(${category.name})`,
            sql`id <> ${id}`
          )
        );

      if (existingCategory) {
        throw new Error(`Expense category with name "${category.name}" already exists`);
      }
    }

    const [updatedCategory] = await db
      .update(expenseCategories)
      .set(category)
      .where(eq(expenseCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteExpenseCategory(id: number): Promise<boolean> {
    // Check if category has transactions
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.categoryId, id),
          eq(transactions.type, "expense")
        )
      );

    if (result.count > 0) {
      throw new Error("Cannot delete category with existing transactions");
    }

    const [deletedCategory] = await db
      .delete(expenseCategories)
      .where(eq(expenseCategories.id, id))
      .returning();
    
    return !!deletedCategory;
  }

  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    const results = await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.date));
    
    return results.map(transaction => ({
      ...transaction,
      date: new Date(transaction.date)
    }));
  }

  async getTransactionsWithDetails(): Promise<TransactionWithDetails[]> {
    const result = await db.execute<TransactionWithDetails>(sql`
      SELECT 
        t.*,
        a.name as "accountName",
        CASE 
          WHEN t.type = 'income' THEN ic.name
          ELSE ec.name
        END as "categoryName"
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      LEFT JOIN income_categories ic ON t.category_id = ic.id AND t.type = 'income'
      LEFT JOIN expense_categories ec ON t.category_id = ec.id AND t.type = 'expense'
      ORDER BY t.date DESC
    `);
    
    return result.rows.map(row => ({
      ...row,
      date: new Date(row.date)
    })) as TransactionWithDetails[];
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    
    if (!transaction) return undefined;
    
    return {
      ...transaction,
      date: new Date(transaction.date)
    };
  }

  async getTransactionWithDetails(id: number): Promise<TransactionWithDetails | undefined> {
    const result = await db.execute<TransactionWithDetails>(sql`
      SELECT 
        t.*,
        a.name as "accountName",
        CASE 
          WHEN t.type = 'income' THEN ic.name
          ELSE ec.name
        END as "categoryName"
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      LEFT JOIN income_categories ic ON t.category_id = ic.id AND t.type = 'income'
      LEFT JOIN expense_categories ec ON t.category_id = ec.id AND t.type = 'expense'
      WHERE t.id = ${id}
    `);
    
    if (result.rows.length === 0) return undefined;
    
    const row = result.rows[0];
    return {
      ...row,
      date: new Date(row.date)
    } as TransactionWithDetails;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    // Start a database transaction
    return await db.transaction(async (tx) => {
      // Convert date to string if it's a Date object
      const transactionData = {
        ...transaction,
        date: transaction.date instanceof Date 
          ? transaction.date.toISOString() 
          : transaction.date
      };

      // Insert the transaction
      const [newTransaction] = await tx
        .insert(transactions)
        .values(transactionData)
        .returning();
      
      // Update account balance
      const [account] = await tx
        .select()
        .from(accounts)
        .where(eq(accounts.id, transaction.accountId));
      
      if (account) {
        const balanceChange = transaction.type === "income" 
          ? transaction.amount 
          : -transaction.amount;
        
        await tx
          .update(accounts)
          .set({ balance: account.balance + balanceChange })
          .where(eq(accounts.id, account.id));
      }
      
      return {
        ...newTransaction,
        date: new Date(newTransaction.date)
      };
    });
  }

  async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    return await db.transaction(async (tx) => {
      // Get existing transaction
      const [existingTransaction] = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.id, id));
      
      if (!existingTransaction) {
        return undefined;
      }
      
      // If amount, type, or accountId is changing, need to update account balances
      if (
        transaction.amount !== undefined || 
        transaction.type !== undefined || 
        transaction.accountId !== undefined
      ) {
        // First, reverse the effect of the old transaction
        const [oldAccount] = await tx
          .select()
          .from(accounts)
          .where(eq(accounts.id, existingTransaction.accountId));
        
        if (oldAccount) {
          const oldBalanceChange = existingTransaction.type === "income" 
            ? -existingTransaction.amount 
            : existingTransaction.amount;
          
          await tx
            .update(accounts)
            .set({ balance: oldAccount.balance + oldBalanceChange })
            .where(eq(accounts.id, oldAccount.id));
        }
        
        // Then apply the new transaction
        const newAccountId = transaction.accountId || existingTransaction.accountId;
        const [newAccount] = await tx
          .select()
          .from(accounts)
          .where(eq(accounts.id, newAccountId));
        
        const newType = transaction.type || existingTransaction.type;
        const newAmount = transaction.amount !== undefined 
          ? transaction.amount 
          : existingTransaction.amount;
        
        if (newAccount) {
          const newBalanceChange = newType === "income" 
            ? newAmount 
            : -newAmount;
          
          await tx
            .update(accounts)
            .set({ balance: newAccount.balance + newBalanceChange })
            .where(eq(accounts.id, newAccount.id));
        }
      }
      
      // Prepare transaction data
      const transactionData: any = { ...transaction };
      if (transaction.date instanceof Date) {
        transactionData.date = transaction.date.toISOString();
      }
      
      // Update the transaction
      const [updatedTransaction] = await tx
        .update(transactions)
        .set(transactionData)
        .where(eq(transactions.id, id))
        .returning();
      
      return {
        ...updatedTransaction,
        date: new Date(updatedTransaction.date)
      };
    });
  }

  async deleteTransaction(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Get the transaction
      const [transaction] = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.id, id));
      
      if (!transaction) {
        return false;
      }
      
      // Update account balance
      const [account] = await tx
        .select()
        .from(accounts)
        .where(eq(accounts.id, transaction.accountId));
      
      if (account) {
        const balanceChange = transaction.type === "income" 
          ? -transaction.amount 
          : transaction.amount;
        
        await tx
          .update(accounts)
          .set({ balance: account.balance + balanceChange })
          .where(eq(accounts.id, account.id));
      }
      
      // Delete the transaction
      const [deletedTransaction] = await tx
        .delete(transactions)
        .where(eq(transactions.id, id))
        .returning();
      
      return !!deletedTransaction;
    });
  }

  // Filtered transaction methods
  async getTransactionsByAccount(accountId: number): Promise<TransactionWithDetails[]> {
    const result = await db.execute<TransactionWithDetails>(sql`
      SELECT 
        t.*,
        a.name as "accountName",
        CASE 
          WHEN t.type = 'income' THEN ic.name
          ELSE ec.name
        END as "categoryName"
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      LEFT JOIN income_categories ic ON t.category_id = ic.id AND t.type = 'income'
      LEFT JOIN expense_categories ec ON t.category_id = ec.id AND t.type = 'expense'
      WHERE t.account_id = ${accountId}
      ORDER BY t.date DESC
    `);
    
    return result.rows.map(row => ({
      ...row,
      date: new Date(row.date)
    })) as TransactionWithDetails[];
  }

  async getTransactionsByCategory(categoryId: number, type: 'income' | 'expense'): Promise<TransactionWithDetails[]> {
    const result = await db.execute<TransactionWithDetails>(sql`
      SELECT 
        t.*,
        a.name as "accountName",
        CASE 
          WHEN t.type = 'income' THEN ic.name
          ELSE ec.name
        END as "categoryName"
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      LEFT JOIN income_categories ic ON t.category_id = ic.id AND t.type = 'income'
      LEFT JOIN expense_categories ec ON t.category_id = ec.id AND t.type = 'expense'
      WHERE t.category_id = ${categoryId} AND t.type = ${type}
      ORDER BY t.date DESC
    `);
    
    return result.rows.map(row => ({
      ...row,
      date: new Date(row.date)
    })) as TransactionWithDetails[];
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<TransactionWithDetails[]> {
    const result = await db.execute<TransactionWithDetails>(sql`
      SELECT 
        t.*,
        a.name as "accountName",
        CASE 
          WHEN t.type = 'income' THEN ic.name
          ELSE ec.name
        END as "categoryName"
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      LEFT JOIN income_categories ic ON t.category_id = ic.id AND t.type = 'income'
      LEFT JOIN expense_categories ec ON t.category_id = ec.id AND t.type = 'expense'
      WHERE t.date >= ${startDate.toISOString()} AND t.date <= ${endDate.toISOString()}
      ORDER BY t.date DESC
    `);
    
    return result.rows.map(row => ({
      ...row,
      date: new Date(row.date)
    })) as TransactionWithDetails[];
  }

  async getTransactionsByTimePeriod(period: TimePeriod, customRange?: DateRange): Promise<TransactionWithDetails[]> {
    const { start, end } = this.getDateRangeForPeriod(period, customRange);
    return this.getTransactionsByDateRange(start, end);
  }

  // Summary methods
  async getTotalBalance(): Promise<number> {
    const [result] = await db.select({
      total: sql<number>`sum(balance)`
    }).from(accounts);
    
    return result.total || 0;
  }

  async getIncomeSum(period: TimePeriod, customRange?: DateRange): Promise<number> {
    const { start, end } = this.getDateRangeForPeriod(period, customRange);
    
    const [result] = await db.select({
      total: sql<number>`sum(amount)`
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.type, "income"),
        between(
          transactions.date,
          start.toISOString(),
          end.toISOString()
        )
      )
    );
    
    return result.total || 0;
  }

  async getExpenseSum(period: TimePeriod, customRange?: DateRange): Promise<number> {
    const { start, end } = this.getDateRangeForPeriod(period, customRange);
    
    const [result] = await db.select({
      total: sql<number>`sum(amount)`
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.type, "expense"),
        between(
          transactions.date,
          start.toISOString(),
          end.toISOString()
        )
      )
    );
    
    return result.total || 0;
  }

  async getIncomeByCategorySum(period: TimePeriod, customRange?: DateRange): Promise<{ categoryId: number, categoryName: string, sum: number }[]> {
    const { start, end } = this.getDateRangeForPeriod(period, customRange);
    
    const result = await db.execute<{ categoryId: number, categoryName: string, sum: number }>(sql`
      SELECT 
        t.category_id as "categoryId",
        ic.name as "categoryName",
        sum(t.amount) as sum
      FROM transactions t
      JOIN income_categories ic ON t.category_id = ic.id
      WHERE 
        t.type = 'income' AND 
        t.date >= ${start.toISOString()} AND 
        t.date <= ${end.toISOString()}
      GROUP BY t.category_id, ic.name
      HAVING sum(t.amount) > 0
      ORDER BY sum DESC
    `);
    
    return result.rows;
  }

  async getExpenseByCategorySum(period: TimePeriod, customRange?: DateRange): Promise<{ categoryId: number, categoryName: string, sum: number }[]> {
    const { start, end } = this.getDateRangeForPeriod(period, customRange);
    
    const result = await db.execute<{ categoryId: number, categoryName: string, sum: number }>(sql`
      SELECT 
        t.category_id as "categoryId",
        ec.name as "categoryName",
        sum(t.amount) as sum
      FROM transactions t
      JOIN expense_categories ec ON t.category_id = ec.id
      WHERE 
        t.type = 'expense' AND 
        t.date >= ${start.toISOString()} AND 
        t.date <= ${end.toISOString()}
      GROUP BY t.category_id, ec.name
      HAVING sum(t.amount) > 0
      ORDER BY sum DESC
    `);
    
    return result.rows;
  }

  async getMonthlyData(year: number): Promise<{ month: number, income: number, expense: number }[]> {
    const result = await db.execute<{ month: number, income: number, expense: number }>(sql`
      WITH months AS (
        SELECT generate_series(1, 12) AS month
      ),
      income_data AS (
        SELECT 
          EXTRACT(MONTH FROM date::timestamp) as month,
          SUM(amount) as income
        FROM transactions
        WHERE 
          type = 'income' AND 
          EXTRACT(YEAR FROM date::timestamp) = ${year}
        GROUP BY EXTRACT(MONTH FROM date::timestamp)
      ),
      expense_data AS (
        SELECT 
          EXTRACT(MONTH FROM date::timestamp) as month,
          SUM(amount) as expense
        FROM transactions
        WHERE 
          type = 'expense' AND 
          EXTRACT(YEAR FROM date::timestamp) = ${year}
        GROUP BY EXTRACT(MONTH FROM date::timestamp)
      )
      SELECT 
        m.month,
        COALESCE(i.income, 0) as income,
        COALESCE(e.expense, 0) as expense
      FROM months m
      LEFT JOIN income_data i ON m.month = i.month
      LEFT JOIN expense_data e ON m.month = e.month
      ORDER BY m.month
    `);
    
    return result.rows;
  }
}