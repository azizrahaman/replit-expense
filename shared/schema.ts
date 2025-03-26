import { pgTable, text, serial, integer, boolean, date, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Accounts table
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // bank, mobile wallet, cash, etc.
  balance: doublePrecision("balance").notNull().default(0),
  description: text("description"),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
});

// Income Categories table
export const incomeCategories = pgTable("income_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const insertIncomeCategorySchema = createInsertSchema(incomeCategories).omit({
  id: true,
});

// Expense Categories table
export const expenseCategories = pgTable("expense_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const insertExpenseCategorySchema = createInsertSchema(expenseCategories).omit({
  id: true,
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  amount: doublePrecision("amount").notNull(),
  description: text("description").notNull(),
  date: date("date").notNull(),
  accountId: integer("account_id").notNull(),
  type: text("type").notNull(), // "income" or "expense"
  categoryId: integer("category_id").notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
});

// Types
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type IncomeCategory = typeof incomeCategories.$inferSelect;
export type InsertIncomeCategory = z.infer<typeof insertIncomeCategorySchema>;

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = z.infer<typeof insertExpenseCategorySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// Extended schemas for queries
export const transactionWithDetailsSchema = z.object({
  id: z.number(),
  amount: z.number(),
  description: z.string(),
  date: z.date(),
  accountId: z.number(),
  type: z.string(),
  categoryId: z.number(),
  accountName: z.string(),
  categoryName: z.string(),
});

export type TransactionWithDetails = z.infer<typeof transactionWithDetailsSchema>;

// Time period for reports
export const timePeriodSchema = z.enum([
  "this_week",
  "this_month",
  "last_month",
  "this_year",
  "custom"
]);

export type TimePeriod = z.infer<typeof timePeriodSchema>;

// Custom date range for reports
export const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

export type DateRange = z.infer<typeof dateRangeSchema>;
