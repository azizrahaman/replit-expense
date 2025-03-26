import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Plus } from "lucide-react";
import TransactionItem from "@/components/TransactionItem";
import TransactionModal from "@/components/TransactionModal";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Transactions() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [accountFilter, setAccountFilter] = useState("all");
  const [categoryFilter, setcategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch transactions
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ["/api/transactions"],
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

  // Filter transactions based on selected filters
  const filteredTransactions = transactions?.filter((transaction) => {
    let matchesAccount = accountFilter === "all" || transaction.accountId.toString() === accountFilter;
    let matchesCategory = categoryFilter === "all" || transaction.categoryId.toString() === categoryFilter;
    return matchesAccount && matchesCategory;
  }) || [];

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
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button onClick={() => setIsAddTransactionModalOpen(true)}>
            <Plus className="mr-2 h-5 w-5" />
            Add Transaction
          </Button>
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
                    {accounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setcategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="income" disabled className="font-bold">Income</SelectItem>
                    {incomeCategories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="expense" disabled className="font-bold">Expense</SelectItem>
                    {expenseCategories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            paginatedTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                isMobile={true}
              />
            ))
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
                  {paginatedTransactions.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))}
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
