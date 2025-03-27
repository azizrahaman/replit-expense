import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials are not set in environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY.');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

async function seedDatabase() {
  try {
    // Seed accounts
    console.log('Seeding accounts...');
    const accounts = [
      { name: 'Personal Checking', type: 'bank', balance: 5000, description: 'Main checking account' },
      { name: 'Cash Wallet', type: 'cash', balance: 500, description: 'Physical cash' },
      { name: 'Digital Wallet', type: 'mobile', balance: 1000, description: 'Mobile payment app' }
    ];

    for (const account of accounts) {
      const { error } = await supabase
        .from('accounts')
        .upsert([{ 
          ...account, 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }], { 
          onConflict: 'name' 
        });
      if (error) {
        console.error(`Error creating account ${account.name}:`, error);
      }
    }

    // Get income categories for reference
    const { data: incomeCategories, error: incomeError } = await supabase
      .from('income_categories')
      .select('*');
    
    if (incomeError) {
      console.error('Error retrieving income categories:', incomeError);
      return;
    }

    // Get expense categories for reference
    const { data: expenseCategories, error: expenseError } = await supabase
      .from('expense_categories')
      .select('*');
    
    if (expenseError) {
      console.error('Error retrieving expense categories:', expenseError);
      return;
    }

    // Get accounts for reference
    const { data: accountsData, error: accountsError } = await supabase
      .from('accounts')
      .select('*');
    
    if (accountsError) {
      console.error('Error retrieving accounts:', accountsError);
      return;
    }

    // Seed transactions
    console.log('Seeding transactions...');
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Generate transactions for the past 3 months
    const transactions = [];
    
    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const month = currentMonth - monthOffset;
      const year = month < 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = month < 0 ? month + 12 : month;
      
      // Days in the month
      const daysInMonth = new Date(year, adjustedMonth + 1, 0).getDate();
      
      // Income transactions (usually at beginning or end of month)
      if (incomeCategories && incomeCategories.length > 0 && accountsData && accountsData.length > 0) {
        // Salary - end of month
        transactions.push({
          account_id: accountsData[0].id,
          category_id: incomeCategories.find(c => c.name === 'Salary')?.id || incomeCategories[0].id,
          type: 'income',
          amount: 5000,
          date: new Date(year, adjustedMonth, 25).toISOString().split('T')[0],
          description: 'Monthly salary',
          notes: 'Regular monthly salary payment'
        });
        
        // TA Bill - mid month
        transactions.push({
          account_id: accountsData[0].id,
          category_id: incomeCategories.find(c => c.name === 'TA Bill')?.id || incomeCategories[0].id,
          type: 'income',
          amount: 300,
          date: new Date(year, adjustedMonth, 15).toISOString().split('T')[0],
          description: 'TA bill reimbursement',
          notes: 'Travel allowance reimbursement'
        });
        
        // Random incentive (only in some months)
        if (monthOffset === 1) {
          transactions.push({
            account_id: accountsData[0].id,
            category_id: incomeCategories.find(c => c.name === 'Incentive')?.id || incomeCategories[0].id,
            type: 'income',
            amount: 200,
            date: new Date(year, adjustedMonth, 20).toISOString().split('T')[0],
            description: 'Performance incentive',
            notes: 'Quarterly performance bonus'
          });
        }
      }
      
      // Expense transactions throughout the month
      if (expenseCategories && expenseCategories.length > 0 && accountsData && accountsData.length > 0) {
        // Rent - beginning of month
        transactions.push({
          account_id: accountsData[0].id,
          category_id: expenseCategories.find(c => c.name === 'Rent')?.id || expenseCategories[0].id,
          type: 'expense',
          amount: 1200,
          date: new Date(year, adjustedMonth, 5).toISOString().split('T')[0],
          description: 'Monthly rent',
          notes: 'Apartment rent payment'
        });
        
        // Food expenses - multiple times throughout month
        for (let i = 0; i < 8; i++) {
          const day = Math.floor(Math.random() * daysInMonth) + 1;
          const amount = Math.floor(Math.random() * 50) + 20;
          
          transactions.push({
            account_id: accountsData[Math.floor(Math.random() * accountsData.length)].id,
            category_id: expenseCategories.find(c => c.name === 'Food')?.id || expenseCategories[0].id,
            type: 'expense',
            amount: amount,
            date: new Date(year, adjustedMonth, day).toISOString().split('T')[0],
            description: `Groceries ${i+1}`,
            notes: 'Food and household items'
          });
        }
        
        // Money for parents - once a month
        transactions.push({
          account_id: accountsData[0].id,
          category_id: expenseCategories.find(c => c.name === 'Parents')?.id || expenseCategories[0].id,
          type: 'expense',
          amount: 300,
          date: new Date(year, adjustedMonth, 10).toISOString().split('T')[0],
          description: 'Support for parents',
          notes: 'Monthly allowance sent to parents'
        });
        
        // Wife expenses - a few times a month
        for (let i = 0; i < 3; i++) {
          const day = Math.floor(Math.random() * daysInMonth) + 1;
          const amount = Math.floor(Math.random() * 100) + 50;
          
          transactions.push({
            account_id: accountsData[Math.floor(Math.random() * accountsData.length)].id,
            category_id: expenseCategories.find(c => c.name === 'Wife')?.id || expenseCategories[0].id,
            type: 'expense',
            amount: amount,
            date: new Date(year, adjustedMonth, day).toISOString().split('T')[0],
            description: `Wife expense ${i+1}`,
            notes: 'Expenses for spouse'
          });
        }
        
        // Entertainment expenses
        for (let i = 0; i < 2; i++) {
          const day = Math.floor(Math.random() * daysInMonth) + 1;
          const amount = Math.floor(Math.random() * 70) + 30;
          
          transactions.push({
            account_id: accountsData[Math.floor(Math.random() * accountsData.length)].id,
            category_id: expenseCategories.find(c => c.name === 'Entertainment')?.id || expenseCategories[0].id,
            type: 'expense',
            amount: amount,
            date: new Date(year, adjustedMonth, day).toISOString().split('T')[0],
            description: `Entertainment ${i+1}`,
            notes: 'Movies, subscriptions, or other entertainment'
          });
        }
        
        // Utilities - mid month
        transactions.push({
          account_id: accountsData[0].id,
          category_id: expenseCategories.find(c => c.name === 'Utilities')?.id || expenseCategories[0].id,
          type: 'expense',
          amount: 150,
          date: new Date(year, adjustedMonth, 15).toISOString().split('T')[0],
          description: 'Utility bills',
          notes: 'Electricity, water, internet bills'
        });
      }
    }
    
    // Insert transactions in batches to avoid overwhelming the database
    const batchSize = 20;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      const { error } = await supabase
        .from('transactions')
        .insert(batch);
      
      if (error) {
        console.error(`Error inserting transaction batch ${i / batchSize + 1}:`, error);
      } else {
        console.log(`Inserted transaction batch ${i / batchSize + 1} of ${Math.ceil(transactions.length / batchSize)}`);
      }
    }

    console.log(`Seeded ${transactions.length} transactions.`);
    console.log('Database seed completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error in seed script:', error);
    process.exit(1);
  });