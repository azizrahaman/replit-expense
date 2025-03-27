import { db } from "../server/db";
import { transactions } from "../shared/schema";
import dotenv from "dotenv";

dotenv.config();

async function clearTransactions() {
  try {
    console.log("Starting transaction clearing process...");
    
    // Delete all transactions
    const result = await db.delete(transactions);
    
    console.log("Transaction data has been cleared successfully!");
  } catch (error) {
    console.error("Error clearing transactions:", error);
  }
}

clearTransactions()
  .then(() => {
    console.log("Transaction clearing completed");
    process.exit(0);
  })
  .catch(error => {
    console.error("Transaction clearing failed:", error);
    process.exit(1);
  });