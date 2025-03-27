import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertAccountSchema,
  insertIncomeCategorySchema,
  insertExpenseCategorySchema,
  insertTransactionSchema,
  timePeriodSchema,
  dateRangeSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const apiRouter = express.Router();

  // Error handler helper function
  const handleError = (res: Response, error: unknown) => {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "An unexpected error occurred" });
  };

  // Accounts Routes
  apiRouter.get("/accounts", async (req: Request, res: Response) => {
    try {
      const accounts = await storage.getAccounts();
      res.json(accounts);
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.get("/accounts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.getAccount(id);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.json(account);
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.post("/accounts", async (req: Request, res: Response) => {
    try {
      const accountData = insertAccountSchema.parse(req.body);
      const newAccount = await storage.createAccount(accountData);
      res.status(201).json(newAccount);
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.patch("/accounts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const accountData = insertAccountSchema.partial().parse(req.body);
      
      const updatedAccount = await storage.updateAccount(id, accountData);
      
      if (!updatedAccount) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.json(updatedAccount);
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.delete("/accounts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAccount(id);
      
      if (!success) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Income Categories Routes
  apiRouter.get("/income-categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getIncomeCategories();
      res.json(categories);
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.get("/income-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getIncomeCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Income category not found" });
      }
      
      res.json(category);
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.post("/income-categories", async (req: Request, res: Response) => {
    try {
      const categoryData = insertIncomeCategorySchema.parse(req.body);
      const newCategory = await storage.createIncomeCategory(categoryData);
      res.status(201).json(newCategory);
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.patch("/income-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertIncomeCategorySchema.partial().parse(req.body);
      
      const updatedCategory = await storage.updateIncomeCategory(id, categoryData);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Income category not found" });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.delete("/income-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteIncomeCategory(id);
      
      if (!success) {
        return res.status(404).json({ message: "Income category not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Expense Categories Routes
  apiRouter.get("/expense-categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getExpenseCategories();
      res.json(categories);
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.get("/expense-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getExpenseCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Expense category not found" });
      }
      
      res.json(category);
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.post("/expense-categories", async (req: Request, res: Response) => {
    try {
      const categoryData = insertExpenseCategorySchema.parse(req.body);
      const newCategory = await storage.createExpenseCategory(categoryData);
      res.status(201).json(newCategory);
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.patch("/expense-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertExpenseCategorySchema.partial().parse(req.body);
      
      const updatedCategory = await storage.updateExpenseCategory(id, categoryData);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Expense category not found" });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.delete("/expense-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteExpenseCategory(id);
      
      if (!success) {
        return res.status(404).json({ message: "Expense category not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Transactions Routes
  apiRouter.get("/transactions", async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getTransactionsWithDetails();
      res.json(transactions);
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.get("/transactions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getTransactionWithDetails(id);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.post("/transactions", async (req: Request, res: Response) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const newTransaction = await storage.createTransaction(transactionData);
      res.status(201).json(newTransaction);
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.patch("/transactions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const transactionData = insertTransactionSchema.partial().parse(req.body);
      
      const updatedTransaction = await storage.updateTransaction(id, transactionData);
      
      if (!updatedTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(updatedTransaction);
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.delete("/transactions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTransaction(id);
      
      if (!success) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Filtered Transaction Routes
  apiRouter.get("/transactions/account/:accountId", async (req: Request, res: Response) => {
    try {
      const accountId = parseInt(req.params.accountId);
      const transactions = await storage.getTransactionsByAccount(accountId);
      res.json(transactions);
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.get("/transactions/category/:categoryId/:type", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const type = req.params.type as 'income' | 'expense';
      
      if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ message: "Type must be 'income' or 'expense'" });
      }
      
      const transactions = await storage.getTransactionsByCategory(categoryId, type);
      res.json(transactions);
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.post("/transactions/period", async (req: Request, res: Response) => {
    try {
      const validationSchema = z.object({
        period: timePeriodSchema,
        customRange: dateRangeSchema.optional(),
      });
      
      const { period, customRange } = validationSchema.parse(req.body);
      
      if (period === "custom" && !customRange) {
        return res.status(400).json({ message: "Custom date range is required for custom period" });
      }
      
      const transactions = await storage.getTransactionsByTimePeriod(period, customRange);
      res.json(transactions);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Summary Routes
  apiRouter.get("/summary/balance", async (req: Request, res: Response) => {
    try {
      const totalBalance = await storage.getTotalBalance();
      res.json({ totalBalance });
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.post("/summary/income", async (req: Request, res: Response) => {
    try {
      const validationSchema = z.object({
        period: timePeriodSchema,
        customRange: dateRangeSchema.optional(),
      });
      
      const { period, customRange } = validationSchema.parse(req.body);
      
      if (period === "custom" && !customRange) {
        return res.status(400).json({ message: "Custom date range is required for custom period" });
      }
      
      const incomeSum = await storage.getIncomeSum(period, customRange);
      res.json({ incomeSum });
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.post("/summary/expense", async (req: Request, res: Response) => {
    try {
      const validationSchema = z.object({
        period: timePeriodSchema,
        customRange: dateRangeSchema.optional(),
      });
      
      const { period, customRange } = validationSchema.parse(req.body);
      
      if (period === "custom" && !customRange) {
        return res.status(400).json({ message: "Custom date range is required for custom period" });
      }
      
      const expenseSum = await storage.getExpenseSum(period, customRange);
      res.json({ expenseSum });
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.post("/summary/income-by-category", async (req: Request, res: Response) => {
    try {
      const validationSchema = z.object({
        period: timePeriodSchema,
        customRange: dateRangeSchema.optional(),
      });
      
      const { period, customRange } = validationSchema.parse(req.body);
      
      if (period === "custom" && !customRange) {
        return res.status(400).json({ message: "Custom date range is required for custom period" });
      }
      
      const incomeByCategorySum = await storage.getIncomeByCategorySum(period, customRange);
      res.json(incomeByCategorySum);
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.post("/summary/expense-by-category", async (req: Request, res: Response) => {
    try {
      const validationSchema = z.object({
        period: timePeriodSchema,
        customRange: dateRangeSchema.optional(),
      });
      
      const { period, customRange } = validationSchema.parse(req.body);
      
      if (period === "custom" && !customRange) {
        return res.status(400).json({ message: "Custom date range is required for custom period" });
      }
      
      const expenseByCategorySum = await storage.getExpenseByCategorySum(period, customRange);
      res.json(expenseByCategorySum);
    } catch (error) {
      handleError(res, error);
    }
  });

  apiRouter.get("/summary/monthly/:year", async (req: Request, res: Response) => {
    try {
      const year = parseInt(req.params.year);
      
      if (isNaN(year) || year < 2000 || year > 3000) {
        return res.status(400).json({ message: "Invalid year" });
      }
      
      const monthlyData = await storage.getMonthlyData(year);
      res.json(monthlyData);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Use the API router with /api prefix
  app.use("/api", apiRouter);

  return httpServer;
}
