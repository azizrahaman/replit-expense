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

const createTables = async () => {
  try {
    console.log('Creating accounts table...');
    await supabase.rpc('create_accounts_table', {});
    
    console.log('Creating income_categories table...');
    await supabase.rpc('create_income_categories_table', {});
    
    console.log('Creating expense_categories table...');
    await supabase.rpc('create_expense_categories_table', {});
    
    console.log('Creating transactions table...');
    await supabase.rpc('create_transactions_table', {});
    
    console.log('All tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    
    // Fallback to direct SQL if stored procedures don't exist
    console.log('Trying direct SQL approach...');
    try {
      // Create accounts table
      await supabase.from('accounts').select('*', { count: 'exact', head: true }).catch(async () => {
        console.log('Creating accounts table via direct SQL...');
        const { error: createError } = await supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS accounts (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              type TEXT NOT NULL,
              balance DOUBLE PRECISION NOT NULL DEFAULT 0,
              description TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `
        });
        if (createError) throw createError;
      });

      // Create income_categories table
      await supabase.from('income_categories').select('*', { count: 'exact', head: true }).catch(async () => {
        console.log('Creating income_categories table via direct SQL...');
        const { error: createError } = await supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS income_categories (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL UNIQUE,
              description TEXT,
              icon TEXT,
              color TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `
        });
        if (createError) throw createError;
      });

      // Create expense_categories table
      await supabase.from('expense_categories').select('*', { count: 'exact', head: true }).catch(async () => {
        console.log('Creating expense_categories table via direct SQL...');
        const { error: createError } = await supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS expense_categories (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL UNIQUE,
              description TEXT,
              icon TEXT,
              color TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `
        });
        if (createError) throw createError;
      });

      // Create transactions table
      await supabase.from('transactions').select('*', { count: 'exact', head: true }).catch(async () => {
        console.log('Creating transactions table via direct SQL...');
        const { error: createError } = await supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS transactions (
              id SERIAL PRIMARY KEY,
              account_id INTEGER NOT NULL,
              category_id INTEGER NOT NULL,
              type TEXT NOT NULL,
              amount DOUBLE PRECISION NOT NULL,
              date DATE NOT NULL,
              description TEXT,
              notes TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `
        });
        if (createError) throw createError;
      });

      console.log('All tables created successfully via direct SQL!');

      // Create default categories
      console.log('Creating default income categories...');
      const incomeCategories = [
        { name: 'Salary', description: 'Regular employment income' },
        { name: 'Bonus', description: 'Performance or holiday bonuses' },
        { name: 'TA Bill', description: 'Travel allowance payments' },
        { name: 'Investigation Bill', description: 'Investigation-related payments' },
        { name: 'Incentive', description: 'Work incentives and rewards' },
        { name: 'Rewards', description: 'Other rewards and recognition' }
      ];

      for (const category of incomeCategories) {
        const { error } = await supabase
          .from('income_categories')
          .upsert([{ 
            ...category, 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }], { 
            onConflict: 'name' 
          });
        if (error && error.code !== '23505') {
          console.error(`Error creating income category ${category.name}:`, error);
        }
      }

      console.log('Creating default expense categories...');
      const expenseCategories = [
        { name: 'Rent', description: 'Housing rent payments' },
        { name: 'Food', description: 'Groceries and eating out' },
        { name: 'Parents', description: 'Money sent to parents' },
        { name: 'Wife', description: 'Expenses for spouse' },
        { name: 'Transportation', description: 'Public transport and fuel costs' },
        { name: 'Utilities', description: 'Electricity, water, internet bills' },
        { name: 'Health', description: 'Medical expenses and medications' },
        { name: 'Entertainment', description: 'Movies, subscriptions, hobbies' }
      ];

      for (const category of expenseCategories) {
        const { error } = await supabase
          .from('expense_categories')
          .upsert([{ 
            ...category, 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }], { 
            onConflict: 'name' 
          });
        if (error && error.code !== '23505') {
          console.error(`Error creating expense category ${category.name}:`, error);
        }
      }

      console.log('Default categories created!');
    } catch (sqlError) {
      console.error('Error with direct SQL approach:', sqlError);
      throw sqlError;
    }
  }
};

createTables()
  .then(() => {
    console.log('Database initialization completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });