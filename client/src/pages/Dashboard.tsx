import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import TransactionModal from "@/components/TransactionModal";
import AccountCard from "@/components/AccountCard";
import TransactionItem from "@/components/TransactionItem";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const { toast } = useToast();
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("this_month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Fetch total balance
  const balanceQuery = useQuery({
    queryKey: ["/api/summary/balance"],
  });

  // Fetch accounts
  const accountsQuery = useQuery({
    queryKey: ["/api/accounts"],
  });

  // Fetch recent transactions
  const transactionsQuery = useQuery({
    queryKey: ["/api/transactions"],
  });

  // Fetch income and expense summary for the selected period
  const incomeSummaryQuery = useQuery({
    queryKey: ["/api/summary/income", selectedPeriod],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/summary/income", { 
        period: selectedPeriod,
        customRange: dateRange
      });
      return res.json();
    },
    enabled: selectedPeriod !== "custom" || !!dateRange
  });

  const expenseSummaryQuery = useQuery({
    queryKey: ["/api/summary/expense", selectedPeriod],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/summary/expense", { 
        period: selectedPeriod,
        customRange: dateRange
      });
      return res.json();
    },
    enabled: selectedPeriod !== "custom" || !!dateRange
  });

  // Fetch monthly data for charts
  const currentYear = new Date().getFullYear();
  const monthlyDataQuery = useQuery({
    queryKey: ["/api/summary/monthly", currentYear],
    queryFn: async () => {
      const res = await fetch(`/api/summary/monthly/${currentYear}`);
      if (!res.ok) throw new Error("Failed to fetch monthly data");
      return res.json();
    },
  });

  // Fetch expense by category for pie chart
  const expenseByCategoryQuery = useQuery({
    queryKey: ["/api/summary/expense-by-category", selectedPeriod],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/summary/expense-by-category", { 
        period: selectedPeriod,
        customRange: dateRange
      });
      return res.json();
    },
    enabled: selectedPeriod !== "custom" || !!dateRange
  });

  // Handle period change
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
  };

  // Format monthly data for charts
  const formatMonthlyData = () => {
    if (!monthlyDataQuery.data) return [];
    
    return monthlyDataQuery.data.map((item: any) => ({
      month: format(new Date(currentYear, item.month - 1, 1), "MMM"),
      income: item.income,
      expense: item.expense
    }));
  };

  // Colors for the pie chart
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280'];

  // Format categories for pie chart
  const formatCategoryData = () => {
    if (!expenseByCategoryQuery.data) return [];
    
    return expenseByCategoryQuery.data.map((item: any) => ({
      name: item.categoryName,
      value: item.sum
    }));
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button onClick={() => setIsTransactionModalOpen(true)}>
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Date range filter */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Financial Overview</h3>
            <p className="text-sm text-gray-500 mt-1">Track your finances across all accounts</p>
          </div>
          <div className="mt-3 sm:mt-0">
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Account summary */}
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Balance Card */}
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Balance</dt>
                    <dd>
                      {balanceQuery.isLoading ? (
                        <Skeleton className="h-7 w-32" />
                      ) : (
                        <div className="text-lg font-semibold text-gray-900">
                          ${balanceQuery.data?.totalBalance.toFixed(2)}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Income Card */}
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Income (This Period)</dt>
                    <dd>
                      {incomeSummaryQuery.isLoading ? (
                        <Skeleton className="h-7 w-32" />
                      ) : (
                        <div className="text-lg font-semibold text-gray-900">
                          ${incomeSummaryQuery.data?.incomeSum.toFixed(2) || "0.00"}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Card */}
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Expenses (This Period)</dt>
                    <dd>
                      {expenseSummaryQuery.isLoading ? (
                        <Skeleton className="h-7 w-32" />
                      ) : (
                        <div className="text-lg font-semibold text-gray-900">
                          ${expenseSummaryQuery.data?.expenseSum.toFixed(2) || "0.00"}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and accounts section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Income vs Expenses Chart */}
          <Card>
            <CardContent className="p-0">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Income vs Expenses</h3>
                {monthlyDataQuery.isLoading ? (
                  <div className="h-72 flex items-center justify-center">
                    <Skeleton className="h-4/5 w-full" />
                  </div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={formatMonthlyData()}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                        <Legend />
                        <Bar dataKey="income" fill="#10B981" name="Income" />
                        <Bar dataKey="expense" fill="#EF4444" name="Expenses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expense by Category Chart */}
          <Card>
            <CardContent className="p-0">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Expenses by Category</h3>
                {expenseByCategoryQuery.isLoading ? (
                  <div className="h-72 flex items-center justify-center">
                    <Skeleton className="h-4/5 w-full" />
                  </div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={formatCategoryData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {formatCategoryData().map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Accounts & Recent Transactions */}
        <div className="space-y-6">
          {/* Accounts */}
          <Card>
            <CardContent className="p-0">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Your Accounts</h3>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={() => {
                      toast({
                        title: "Coming soon!",
                        description: "Visit the Accounts page to add a new account.",
                      });
                    }}
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </Button>
                </div>
                
                {/* Account list */}
                {accountsQuery.isLoading ? (
                  <>
                    <Skeleton className="h-16 w-full mb-3" />
                    <Skeleton className="h-16 w-full mb-3" />
                    <Skeleton className="h-16 w-full" />
                  </>
                ) : accountsQuery.data?.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No accounts added yet</p>
                ) : (
                  accountsQuery.data?.map((account) => (
                    <AccountCard key={account.id} account={account} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardContent className="p-0">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
                  <Button variant="link" asChild>
                    <a href="/transactions">View all</a>
                  </Button>
                </div>
                
                {/* Transaction list */}
                {transactionsQuery.isLoading ? (
                  <>
                    <Skeleton className="h-16 w-full mb-3" />
                    <Skeleton className="h-16 w-full mb-3" />
                    <Skeleton className="h-16 w-full" />
                  </>
                ) : transactionsQuery.data?.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No transactions added yet</p>
                ) : (
                  transactionsQuery.data?.slice(0, 4).map((transaction) => (
                    <TransactionItem 
                      key={transaction.id} 
                      transaction={transaction} 
                      isMobile={true} 
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
      />
    </div>
  );
}
