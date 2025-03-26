import { useState } from "react";
import { format, subMonths } from "date-fns";
import { DateRange } from "react-day-picker";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Reports() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("income-expense");
  const [timePeriod, setTimePeriod] = useState("this_month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });

  // Get current year for monthly data
  const currentYear = new Date().getFullYear();

  // Fetch monthly data for bar chart
  const monthlyDataQuery = useQuery({
    queryKey: ["/api/summary/monthly", currentYear],
    queryFn: async () => {
      const res = await fetch(`/api/summary/monthly/${currentYear}`);
      if (!res.ok) throw new Error("Failed to fetch monthly data");
      return res.json();
    },
  });

  // Fetch income by category data
  const incomeByCategoryQuery = useQuery({
    queryKey: ["/api/summary/income-by-category", timePeriod, dateRange],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/summary/income-by-category", { 
        period: timePeriod,
        customRange: timePeriod === "custom" ? {
          startDate: dateRange?.from,
          endDate: dateRange?.to,
        } : undefined
      });
      return res.json();
    },
    enabled: timePeriod !== "custom" || (!!dateRange?.from && !!dateRange?.to)
  });

  // Fetch expense by category data
  const expenseByCategoryQuery = useQuery({
    queryKey: ["/api/summary/expense-by-category", timePeriod, dateRange],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/summary/expense-by-category", { 
        period: timePeriod,
        customRange: timePeriod === "custom" ? {
          startDate: dateRange?.from,
          endDate: dateRange?.to,
        } : undefined
      });
      return res.json();
    },
    enabled: timePeriod !== "custom" || (!!dateRange?.from && !!dateRange?.to)
  });

  // Fetch income sum
  const incomeSumQuery = useQuery({
    queryKey: ["/api/summary/income", timePeriod, dateRange],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/summary/income", { 
        period: timePeriod,
        customRange: timePeriod === "custom" ? {
          startDate: dateRange?.from,
          endDate: dateRange?.to,
        } : undefined
      });
      return res.json();
    },
    enabled: timePeriod !== "custom" || (!!dateRange?.from && !!dateRange?.to)
  });

  // Fetch expense sum
  const expenseSumQuery = useQuery({
    queryKey: ["/api/summary/expense", timePeriod, dateRange],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/summary/expense", { 
        period: timePeriod,
        customRange: timePeriod === "custom" ? {
          startDate: dateRange?.from,
          endDate: dateRange?.to,
        } : undefined
      });
      return res.json();
    },
    enabled: timePeriod !== "custom" || (!!dateRange?.from && !!dateRange?.to)
  });

  // Format monthly data for bar chart
  const formatMonthlyData = () => {
    if (!monthlyDataQuery.data) return [];
    
    return monthlyDataQuery.data.map((item: any) => ({
      month: format(new Date(currentYear, item.month - 1, 1), "MMM"),
      income: item.income,
      expense: item.expense,
      savings: item.income - item.expense
    }));
  };

  // Format category data for pie charts
  const formatCategoryData = (data: any[]) => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      name: item.categoryName,
      value: item.sum
    }));
  };

  // Colors for pie charts
  const INCOME_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#3B82F6'];
  const EXPENSE_COLORS = ['#EF4444', '#F59E0B', '#EC4899', '#6B7280', '#8B5CF6'];

  // Handle period change
  const handlePeriodChange = (value: string) => {
    setTimePeriod(value);
  };

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-800">Financial Reports</h2>
        </div>
      </div>

      {/* Date range selector */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Report Period</h3>
              <p className="text-sm text-gray-500 mt-1">Select a time period for your financial reports</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={timePeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
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
              
              {timePeriod === "custom" && (
                <DateRangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {/* Income Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
            {incomeSumQuery.isLoading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-green-500">${incomeSumQuery.data?.incomeSum.toFixed(2) || "0.00"}</p>
            )}
          </CardContent>
        </Card>

        {/* Expense Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
            {expenseSumQuery.isLoading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-red-500">${expenseSumQuery.data?.expenseSum.toFixed(2) || "0.00"}</p>
            )}
          </CardContent>
        </Card>

        {/* Savings Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Net Savings</h3>
            {incomeSumQuery.isLoading || expenseSumQuery.isLoading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <p className={`text-2xl font-bold ${(incomeSumQuery.data?.incomeSum - expenseSumQuery.data?.expenseSum) >= 0 ? 'text-primary' : 'text-red-500'}`}>
                ${(incomeSumQuery.data?.incomeSum - expenseSumQuery.data?.expenseSum).toFixed(2) || "0.00"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report tabs */}
      <Tabs 
        defaultValue="income-expense" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="mb-6"
      >
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="income-expense">Income vs Expenses</TabsTrigger>
          <TabsTrigger value="income-categories">Income Breakdown</TabsTrigger>
          <TabsTrigger value="expense-categories">Expense Breakdown</TabsTrigger>
        </TabsList>
        
        <TabsContent value="income-expense">
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses (Monthly)</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyDataQuery.isLoading ? (
                <div className="h-72 flex items-center justify-center">
                  <Skeleton className="h-4/5 w-full" />
                </div>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={formatMonthlyData()}
                      margin={{
                        top: 20,
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
                      <Bar dataKey="income" name="Income" fill="#10B981" />
                      <Bar dataKey="expense" name="Expenses" fill="#EF4444" />
                      <Bar dataKey="savings" name="Savings" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="income-categories">
          <Card>
            <CardHeader>
              <CardTitle>Income by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {incomeByCategoryQuery.isLoading ? (
                <div className="h-72 flex items-center justify-center">
                  <Skeleton className="h-4/5 w-full" />
                </div>
              ) : incomeByCategoryQuery.data?.length === 0 ? (
                <div className="text-center py-10">
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No income data</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    There is no income data for the selected period.
                  </p>
                </div>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formatCategoryData(incomeByCategoryQuery.data)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {formatCategoryData(incomeByCategoryQuery.data).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expense-categories">
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {expenseByCategoryQuery.isLoading ? (
                <div className="h-72 flex items-center justify-center">
                  <Skeleton className="h-4/5 w-full" />
                </div>
              ) : expenseByCategoryQuery.data?.length === 0 ? (
                <div className="text-center py-10">
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No expense data</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    There is no expense data for the selected period.
                  </p>
                </div>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formatCategoryData(expenseByCategoryQuery.data)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {formatCategoryData(expenseByCategoryQuery.data).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
