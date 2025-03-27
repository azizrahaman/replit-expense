import {
  accounts,
  incomeCategories,
  expenseCategories,
  transactions,
  type InsertAccount,
  type InsertIncomeCategory,
  type InsertExpenseCategory,
  type InsertTransaction
} from "@shared/schema";
import { db } from "../server/db";
import dotenv from "dotenv";

dotenv.config();

async function seedDatabase() {
  try {
    console.log("Starting database seed...");
    
    // Seed accounts
    console.log("Seeding accounts...");
    const defaultAccounts: InsertAccount[] = [
      { name: "Personal Checking", type: "bank", balance: 5000, description: "Main checking account" },
      { name: "Cash Wallet", type: "cash", balance: 500, description: "Physical cash" },
      { name: "Digital Wallet", type: "mobile", balance: 1000, description: "Mobile payment app" }
    ];
    
    // Fetch existing accounts
    const existingAccounts = await db.select().from(accounts);
    const insertedAccounts = [...existingAccounts];
    
    for (const account of defaultAccounts) {
      // Check if account already exists
      const existingAccount = existingAccounts.find(
        a => a.name.toLowerCase() === account.name.toLowerCase()
      );
      
      if (existingAccount) {
        console.log(`Account already exists: ${account.name}`);
      } else {
        try {
          const [insertedAccount] = await db.insert(accounts).values(account).returning();
          insertedAccounts.push(insertedAccount);
          console.log(`Created account: ${account.name}`);
        } catch (error) {
          console.error(`Error inserting account ${account.name}:`, error);
        }
      }
    }
    
    // Seed income categories
    console.log("Seeding income categories...");
    const defaultIncomeCategories: InsertIncomeCategory[] = [
      { name: "Salary", description: "Regular employment income" },
      { name: "Bonus", description: "Performance or holiday bonuses" },
      { name: "TA Bill", description: "Travel allowance payments" },
      { name: "Investigation Bill", description: "Investigation-related payments" },
      { name: "Incentive", description: "Work incentives and rewards" },
      { name: "Rewards", description: "Other rewards and recognition" }
    ];
    
    // Fetch existing income categories
    const existingIncomeCategories = await db.select().from(incomeCategories);
    const insertedIncomeCategories = [...existingIncomeCategories];
    
    for (const category of defaultIncomeCategories) {
      // Check if category already exists
      const existingCategory = existingIncomeCategories.find(
        c => c.name.toLowerCase() === category.name.toLowerCase()
      );
      
      if (existingCategory) {
        console.log(`Income category already exists: ${category.name}`);
      } else {
        try {
          const [insertedCategory] = await db.insert(incomeCategories).values(category).returning();
          insertedIncomeCategories.push(insertedCategory);
          console.log(`Created income category: ${category.name}`);
        } catch (error) {
          console.error(`Error inserting income category ${category.name}:`, error);
        }
      }
    }
    
    // Seed expense categories
    console.log("Seeding expense categories...");
    const defaultExpenseCategories: InsertExpenseCategory[] = [
      { name: "Rent", description: "Housing rent payments" },
      { name: "Food", description: "Groceries and eating out" },
      { name: "Parents", description: "Money sent to parents" },
      { name: "Wife", description: "Expenses for spouse" },
      { name: "Transportation", description: "Public transport and fuel costs" },
      { name: "Utilities", description: "Electricity, water, internet bills" },
      { name: "Health", description: "Medical expenses and medications" },
      { name: "Entertainment", description: "Movies, subscriptions, hobbies" }
    ];
    
    // Fetch existing expense categories
    const existingExpenseCategories = await db.select().from(expenseCategories);
    const insertedExpenseCategories = [...existingExpenseCategories];
    
    for (const category of defaultExpenseCategories) {
      // Check if category already exists
      const existingCategory = existingExpenseCategories.find(
        c => c.name.toLowerCase() === category.name.toLowerCase()
      );
      
      if (existingCategory) {
        console.log(`Expense category already exists: ${category.name}`);
      } else {
        try {
          const [insertedCategory] = await db.insert(expenseCategories).values(category).returning();
          insertedExpenseCategories.push(insertedCategory);
          console.log(`Created expense category: ${category.name}`);
        } catch (error) {
          console.error(`Error inserting expense category ${category.name}:`, error);
        }
      }
    }
    
    // Check if we've successfully inserted accounts and categories
    if (insertedAccounts.length === 0 || 
        insertedIncomeCategories.length === 0 ||
        insertedExpenseCategories.length === 0) {
      console.error("Failed to insert necessary accounts or categories. Aborting transaction seeding.");
      return;
    }
    
    // Seed transactions
    console.log("Seeding transactions...");
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Generate some sample transactions for the past 3 months
    const sampleTransactions = [];
    
    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const month = currentMonth - monthOffset;
      const year = month < 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = month < 0 ? month + 12 : month;
      
      // Fixed transactions for each month
      // Salary - end of month
      sampleTransactions.push({
        accountId: insertedAccounts[0].id,
        categoryId: insertedIncomeCategories.find(c => c.name === "Salary")?.id || insertedIncomeCategories[0].id,
        type: "income",
        amount: 5000,
        date: new Date(year, adjustedMonth, 25).toISOString().split('T')[0],
        description: "Monthly salary"
      });
      
      // TA Bill - mid month
      sampleTransactions.push({
        accountId: insertedAccounts[0].id,
        categoryId: insertedIncomeCategories.find(c => c.name === "TA Bill")?.id || insertedIncomeCategories[0].id,
        type: "income",
        amount: 300,
        date: new Date(year, adjustedMonth, 15).toISOString().split('T')[0],
        description: "TA bill reimbursement"
      });
      
      // Random incentive (only in some months)
      if (monthOffset === 1) {
        sampleTransactions.push({
          accountId: insertedAccounts[0].id,
          categoryId: insertedIncomeCategories.find(c => c.name === "Incentive")?.id || insertedIncomeCategories[0].id,
          type: "income",
          amount: 200,
          date: new Date(year, adjustedMonth, 20).toISOString().split('T')[0],
          description: "Performance incentive"
        });
      }
      
      // Rent - beginning of month
      sampleTransactions.push({
        accountId: insertedAccounts[0].id,
        categoryId: insertedExpenseCategories.find(c => c.name === "Rent")?.id || insertedExpenseCategories[0].id,
        type: "expense",
        amount: 1200,
        date: new Date(year, adjustedMonth, 5).toISOString().split('T')[0],
        description: "Monthly rent"
      });
      
      // Money for parents - once a month
      sampleTransactions.push({
        accountId: insertedAccounts[0].id,
        categoryId: insertedExpenseCategories.find(c => c.name === "Parents")?.id || insertedExpenseCategories[0].id,
        type: "expense",
        amount: 300,
        date: new Date(year, adjustedMonth, 10).toISOString().split('T')[0],
        description: "Support for parents"
      });
      
      // Utilities - mid month
      sampleTransactions.push({
        accountId: insertedAccounts[0].id,
        categoryId: insertedExpenseCategories.find(c => c.name === "Utilities")?.id || insertedExpenseCategories[0].id,
        type: "expense",
        amount: 150,
        date: new Date(year, adjustedMonth, 15).toISOString().split('T')[0],
        description: "Utility bills"
      });
      
      // Variable transactions for each month
      // Food expenses - multiple times throughout month
      const daysInMonth = new Date(year, adjustedMonth + 1, 0).getDate();
      for (let i = 0; i < 8; i++) {
        const day = Math.floor(Math.random() * daysInMonth) + 1;
        const amount = Math.floor(Math.random() * 50) + 20;
        
        sampleTransactions.push({
          accountId: insertedAccounts[Math.floor(Math.random() * insertedAccounts.length)].id,
          categoryId: insertedExpenseCategories.find(c => c.name === "Food")?.id || insertedExpenseCategories[0].id,
          type: "expense",
          amount: amount,
          date: new Date(year, adjustedMonth, day).toISOString().split('T')[0],
          description: `Groceries ${i+1}`
        });
      }
      
      // Wife expenses - a few times a month
      for (let i = 0; i < 3; i++) {
        const day = Math.floor(Math.random() * daysInMonth) + 1;
        const amount = Math.floor(Math.random() * 100) + 50;
        
        sampleTransactions.push({
          accountId: insertedAccounts[Math.floor(Math.random() * insertedAccounts.length)].id,
          categoryId: insertedExpenseCategories.find(c => c.name === "Wife")?.id || insertedExpenseCategories[0].id,
          type: "expense",
          amount: amount,
          date: new Date(year, adjustedMonth, day).toISOString().split('T')[0],
          description: `Wife expense ${i+1}`
        });
      }
      
      // Entertainment expenses
      for (let i = 0; i < 2; i++) {
        const day = Math.floor(Math.random() * daysInMonth) + 1;
        const amount = Math.floor(Math.random() * 70) + 30;
        
        sampleTransactions.push({
          accountId: insertedAccounts[Math.floor(Math.random() * insertedAccounts.length)].id,
          categoryId: insertedExpenseCategories.find(c => c.name === "Entertainment")?.id || insertedExpenseCategories[0].id,
          type: "expense",
          amount: amount,
          date: new Date(year, adjustedMonth, day).toISOString().split('T')[0],
          description: `Entertainment ${i+1}`
        });
      }
    }
    
    // Insert transactions in batches
    const batchSize = 20;
    let successCount = 0;
    
    for (let i = 0; i < sampleTransactions.length; i += batchSize) {
      const batch = sampleTransactions.slice(i, i + batchSize);
      try {
        const insertedTransactions = await db.insert(transactions).values(batch).returning();
        successCount += insertedTransactions.length;
        console.log(`Inserted transaction batch ${i / batchSize + 1} of ${Math.ceil(sampleTransactions.length / batchSize)}`);
      } catch (error) {
        console.error(`Error inserting transaction batch ${i / batchSize + 1}:`, error);
      }
    }
    
    console.log(`Successfully seeded ${successCount} of ${sampleTransactions.length} transactions`);
    console.log("Database seed completed!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seedDatabase()
  .then(() => {
    console.log("Seed script completed");
    process.exit(0);
  })
  .catch(error => {
    console.error("Seed script failed:", error);
    process.exit(1);
  });