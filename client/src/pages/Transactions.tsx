import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  subMonths, 
  subWeeks,
  isAfter,
  isBefore,
  parseISO 
} from "date-fns";
import { Calendar as CalendarIcon, Plus, Filter } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateRange } from "@shared/schema";
import TransactionItem from "@/components/TransactionItem";
import TransactionModal from "@/components/TransactionModal";

export default function Transactions() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [accountFilter, setAccountFilter] = useState("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const itemsPerPage = 10;
  const [totalAmount, setTotalAmount] = useState<number>(0);
  
  // Time period utility functions
  const getDateRange = () => {
    const now = new Date();
    
    switch (dateFilter) {
      case "this-week":
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: now
        };
      case "last-week":
        return {
          start: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
          end: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
        };
      case "this-month":
        return {
          start: startOfMonth(now),
          end: now
        };
      case "last-month":
        return {
          start: startOfMonth(subMonths(now, 1)),
          end: endOfMonth(subMonths(now, 1))
        };
      case "custom":
        return customDateRange ? {
          start: customDateRange.startDate,
          end: customDateRange.endDate
        } : { start: new Date(0), end: now };
      default:
        return { start: new Date(0), end: now };
    }
  };

  // Fetch transactions
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const res = await fetch("/api/transactions");
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    }
  });

  // Fetch accounts for filter
  const { data: accounts } = useQuery({
    queryKey: ["/api/accounts"],
  });

  // Fetch categories for filter
  const { data: incomeCategories } = useQuery({
    queryKey: ["/api/income-categories"],
  });

  const { data: expenseCategories } = useQuery({
    queryKey: ["/api/expense-categories"],
  });

  // Handle category selection
  const toggleCategory = (categoryId: string, categoryType: 'income' | 'expense') => {
    const uniqueId = `${categoryType}-${categoryId}`;
    setSelectedCategories(prev => {
      if (prev.includes(uniqueId)) {
        return prev.filter(id => id !== uniqueId);
      } else {
        return [...prev, uniqueId];
      }
    });
    
    // Reset pagination when filter changes
    setCurrentPage(1);
  };

  // Clear all selected categories
  const clearCategoryFilters = () => {
    setSelectedCategories([]);
    setCurrentPage(1);
  };

  // Filter transactions based on selected filters
  const filteredTransactions = transactions?.filter((transaction: any) => {
    // Check if transaction matches the account filter
    let matchesAccount = accountFilter === "all" || 
      (transaction.account_id && transaction.account_id.toString() === accountFilter);
    
    // Check if transaction matches any of the selected categories
    let matchesCategory = selectedCategories.length === 0;
    
    if (!matchesCategory && transaction.category_id && transaction.type) {
      // For income transactions, check if category matches any selected income category
      if (transaction.type === 'income') {
        matchesCategory = selectedCategories.includes(`income-${transaction.category_id}`);
      } 
      // For expense transactions, check if category matches any selected expense category
      else if (transaction.type === 'expense') {
        matchesCategory = selectedCategories.includes(`expense-${transaction.category_id}`);
      }
    }
    
    // Check if transaction matches the date filter
    let matchesDate = dateFilter === "all";
    
    if (!matchesDate && transaction.date) {
      const transactionDate = parseISO(transaction.date);
      const { start, end } = getDateRange();
      matchesDate = isAfter(transactionDate, start) && isBefore(transactionDate, end);
    }
    
    return matchesAccount && matchesCategory && matchesDate;
  }) || [];

  // Calculate total amount whenever filtered transactions change
  useEffect(() => {
    // Calculate the sum of all filtered transactions
    const sum = filteredTransactions.reduce((total: number, transaction: any) => {
      // For expenses, we keep the amount negative; for income, it's positive
      const amount = transaction.type === 'expense' 
        ? -Math.abs(transaction.amount) 
        : Math.abs(transaction.amount);
      return total + amount;
    }, 0);
    
    setTotalAmount(sum);
  }, [filteredTransactions]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  if (error) {
    toast({
      variant: "destructive",
      title: "Error loading transactions",
      description: "There was an error loading your transactions. Please try again.",
    });
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-800">Transactions</h2>
        </div>
      </div>

      {/* Transaction Table */}
      <Card>
        <CardContent className="p-6">
          <div className="sm:flex sm:items-center sm:justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
            <div className="mt-3 sm:mt-0 sm:ml-4">
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <Select value={accountFilter} onValueChange={setAccountFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Accounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {accounts?.map((account: any) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Date filter */}
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="last-week">Last Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Custom date range picker - show only when "custom" is selected */}
                {dateFilter === "custom" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full sm:w-[240px] justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateRange?.startDate ? (
                          customDateRange.endDate ? (
                            <>
                              {format(customDateRange.startDate, "LLL dd, y")} -{" "}
                              {format(customDateRange.endDate, "LLL dd, y")}
                            </>
                          ) : (
                            format(customDateRange.startDate, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={customDateRange?.startDate}
                        selected={{
                          from: customDateRange?.startDate,
                          to: customDateRange?.endDate,
                        }}
                        onSelect={(range: any) => {
                          if (range?.from && range?.to) {
                            setCustomDateRange({
                              startDate: range.from,
                              endDate: range.to,
                            });
                          }
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                )}
                
                {/* Multi-select Categories Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      {selectedCategories.length === 0 
                        ? "All Categories" 
                        : `${selectedCategories.length} Selected`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Filter by Categories</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {selectedCategories.length > 0 && (
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-sm mb-2"
                        onClick={clearCategoryFilters}
                      >
                        Clear all filters
                      </Button>
                    )}
                    
                    <div className="max-h-[250px] overflow-y-auto px-1">
                      <div className="mb-2">
                        <DropdownMenuLabel className="text-xs font-bold text-primary py-1">
                          Income Categories
                        </DropdownMenuLabel>
                        {incomeCategories?.map((category: any) => (
                          <div key={`income-${category.id}`} className="flex items-center space-x-2 py-1 px-2">
                            <Checkbox 
                              id={`income-category-${category.id}`}
                              checked={selectedCategories.includes(`income-${category.id}`)}
                              onCheckedChange={() => toggleCategory(category.id.toString(), 'income')}
                            />
                            <Label 
                              htmlFor={`income-category-${category.id}`}
                              className="text-sm cursor-pointer flex-grow"
                            >
                              {category.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                      
                      <div>
                        <DropdownMenuLabel className="text-xs font-bold text-destructive py-1">
                          Expense Categories
                        </DropdownMenuLabel>
                        {expenseCategories?.map((category: any) => (
                          <div key={`expense-${category.id}`} className="flex items-center space-x-2 py-1 px-2">
                            <Checkbox 
                              id={`expense-category-${category.id}`}
                              checked={selectedCategories.includes(`expense-${category.id}`)}
                              onCheckedChange={() => toggleCategory(category.id.toString(), 'expense')}
                            />
                            <Label 
                              htmlFor={`expense-category-${category.id}`}
                              className="text-sm cursor-pointer flex-grow"
                            >
                              {category.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {isLoading ? (
            <>
              <Skeleton className="h-16 w-full mb-3" />
              <Skeleton className="h-16 w-full mb-3" />
              <Skeleton className="h-16 w-full mb-3" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-10">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
              <p className="mt-1 text-sm text-gray-500">
                {transactions?.length === 0 
                  ? "Get started by creating a new transaction." 
                  : "No transactions match your current filters."}
              </p>
              <div className="mt-6">
                <Button onClick={() => setIsAddTransactionModalOpen(true)}>
                  <Plus className="mr-2 h-5 w-5" />
                  Add Transaction
                </Button>
              </div>
            </div>
          ) : isMobile ? (
            // Mobile view - list of transaction items
            <>
              {paginatedTransactions.map((transaction: any) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  isMobile={true}
                />
              ))}
              
              {/* Mobile summary row */}
              {filteredTransactions.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-gray-700">
                      Summary of {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}:
                    </div>
                    <div className={`font-bold text-lg ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalAmount >= 0 ? '+' : ''}{totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Desktop view - transactions table
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTransactions.map((transaction: any) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))}
                  
                  {/* Summary row */}
                  {filteredTransactions.length > 0 && (
                    <tr className="border-t-2 border-gray-300 font-medium">
                      <td colSpan={3} className="px-6 py-4 text-right text-sm text-gray-700">
                        Summary of {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}:
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {/* This cell is empty, aligns with Account column */}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <span className={`${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {totalAmount >= 0 ? '+' : ''}{totalAmount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {/* This cell is empty, aligns with Actions column */}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredTransactions.length > 0 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }} 
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                      if (i === 4) return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                      if (i === 0) return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    } else {
                      if (i === 0) return (
                        <PaginationItem key={i}>
                          <PaginationLink 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(1);
                            }}
                          >
                            1
                          </PaginationLink>
                        </PaginationItem>
                      );
                      if (i === 1) return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                      if (i === 3) return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                      if (i === 4) return (
                        <PaginationItem key={i}>
                          <PaginationLink 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(totalPages);
                            }}
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      );
                      
                      pageNumber = currentPage + i - 2;
                    }
                    
                    return (
                      <PaginationItem key={i}>
                        <PaginationLink 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(pageNumber);
                          }}
                          isActive={currentPage === pageNumber}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }} 
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Modal */}
      <TransactionModal
        isOpen={isAddTransactionModalOpen}
        onClose={() => setIsAddTransactionModalOpen(false)}
      />
    </div>
  );
}