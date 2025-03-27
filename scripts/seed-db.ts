import { db } from "../server/db";
import { accounts, incomeCategories, expenseCategories, transactions } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedDatabase() {
  try {
    console.log("Seeding database...");
    
    // Check if we already have accounts, if yes, skip seeding
    const existingAccounts = await db.select().from(accounts);
    if (existingAccounts.length > 0) {
      console.log("Database already has data, skipping seed.");
      return;
    }

    console.log("Creating default accounts...");
    const seedAccounts = [
      { name: "Cash", type: "cash", description: "Physical cash", balance: 1000 },
      { name: "Bank", type: "bank", description: "Checking account", balance: 5000 },
      { name: "Mobile Wallet", type: "mobileWallet", description: "Digital wallet", balance: 500 }
    ];

    const createdAccounts = await db.insert(accounts).values(seedAccounts).returning();
    console.log(`Created ${createdAccounts.length} accounts`);

    console.log("Creating income categories...");
    const seedIncomeCategories = [
      { name: "Salary", description: "Monthly salary" },
      { name: "Bonus", description: "Work bonuses" },
      { name: "TA Bill", description: "Travel allowance" },
      { name: "Investigation Bill", description: "Investigation allowance" },
      { name: "Incentive", description: "Performance incentives" },
      { name: "Rewards", description: "Other rewards" }
    ];

    const createdIncomeCategories = await db.insert(incomeCategories).values(seedIncomeCategories).returning();
    console.log(`Created ${createdIncomeCategories.length} income categories`);

    console.log("Creating expense categories...");
    const seedExpenseCategories = [
      { name: "Rent", description: "House rent" },
      { name: "Food", description: "Groceries and dining" },
      { name: "Parents", description: "Parents support" },
      { name: "Wife's Expenses", description: "Spouse expenses" },
      { name: "Transport", description: "Transportation costs" },
      { name: "Utilities", description: "Bills and utilities" },
      { name: "Entertainment", description: "Recreation and entertainment" },
      { name: "Healthcare", description: "Medical expenses" }
    ];

    const createdExpenseCategories = await db.insert(expenseCategories).values(seedExpenseCategories).returning();
    console.log(`Created ${createdExpenseCategories.length} expense categories`);

    console.log("Creating sample transactions...");
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const seedTransactions = [
      {
        amount: 2500,
        description: "Monthly salary",
        date: today.toISOString(),
        accountId: createdAccounts[1].id, // Bank account
        type: "income",
        categoryId: createdIncomeCategories[0].id // Salary
      },
      {
        amount: 75,
        description: "Groceries",
        date: yesterday.toISOString(),
        accountId: createdAccounts[0].id, // Cash
        type: "expense",
        categoryId: createdExpenseCategories[1].id // Food
      },
      {
        amount: 500,
        description: "Rent payment",
        date: lastWeek.toISOString(),
        accountId: createdAccounts[1].id, // Bank account
        type: "expense",
        categoryId: createdExpenseCategories[0].id // Rent
      },
      {
        amount: 200,
        description: "Parents monthly support",
        date: yesterday.toISOString(),
        accountId: createdAccounts[1].id, // Bank account
        type: "expense",
        categoryId: createdExpenseCategories[2].id // Parents
      },
      {
        amount: 150,
        description: "Wife's shopping",
        date: lastWeek.toISOString(),
        accountId: createdAccounts[2].id, // Mobile wallet
        type: "expense",
        categoryId: createdExpenseCategories[3].id // Wife's Expenses
      }
    ];

    // Process transactions and update account balances
    for (const transaction of seedTransactions) {
      await db.transaction(async (tx) => {
        // Insert transaction
        const [insertedTransaction] = await tx.insert(transactions).values(transaction).returning();
        console.log(`Created transaction: ${insertedTransaction.description}`);
        
        // Update account balance
        const [account] = await tx.select().from(accounts).where(eq(accounts.id, transaction.accountId));
        
        if (account) {
          const balanceChange = transaction.type === "income" ? transaction.amount : -transaction.amount;
          await tx
            .update(accounts)
            .set({ balance: account.balance + balanceChange })
            .where(eq(accounts.id, account.id));
          
          console.log(`Updated account ${account.name} balance: ${account.balance} -> ${account.balance + balanceChange}`);
        }
      });
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase().then(() => {
  console.log("Seed script completed, exiting...");
  process.exit(0);
});