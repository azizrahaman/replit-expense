import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subMonths } from "date-fns";

export default function AccountSummary() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [timePeriod, setTimePeriod] = useState("this_month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });

  // Fetch accounts for the account summary
  const accountsQuery = useQuery({
    queryKey: ["/api/accounts"],
    queryFn: async () => {
      const res = await fetch("/api/accounts");
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return res.json();
    }
  });
  
  // Navigate to account transactions page
  const navigateToAccountTransactions = (accountId: number) => {
    // Store the current location before navigating
    sessionStorage.setItem("prevLocation", "/account-summary");
    setLocation(`/account-transactions/${accountId}`);
  };

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
          <h2 className="text-2xl font-bold text-gray-800">Account Summary</h2>
        </div>
      </div>

      {/* Date range selector */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Report Period</h3>
              <p className="text-sm text-gray-500 mt-1">Select a time period for your account summary</p>
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

      {/* Account Summary Content */}
      <Card>
        <CardHeader>
          <CardTitle>Account Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {accountsQuery.isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </div>
          ) : accountsQuery.data?.length === 0 ? (
            <div className="text-center py-10">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No accounts found</h3>
              <p className="mt-1 text-sm text-gray-500">
                You need to add accounts to see account summaries.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Income</TableHead>
                    <TableHead>Expenses</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountsQuery.data?.map((account: any) => (
                    <TableRow 
                      key={account.id} 
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell className="capitalize">{account.type}</TableCell>
                      <TableCell className="text-green-600">
                        ${(account.income || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-red-500">
                        ${(account.expense || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${account.balance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateToAccountTransactions(account.id)}
                        >
                          View <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}