import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import TransactionItem from "@/components/TransactionItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Account } from "@shared/schema";

export default function AccountTransactions() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/account-transactions/:accountId");
  const accountId = params?.accountId ? parseInt(params.accountId) : null;
  
  // Fetch account details
  const accountQuery = useQuery({
    queryKey: ["/api/accounts", accountId],
    queryFn: async () => {
      if (!accountId) return null;
      const res = await fetch(`/api/accounts/${accountId}`);
      if (!res.ok) throw new Error("Failed to fetch account");
      return res.json();
    },
    enabled: !!accountId
  });
  
  // Fetch account transactions
  const transactionsQuery = useQuery({
    queryKey: ["/api/transactions/account", accountId],
    queryFn: async () => {
      if (!accountId) return [];
      const res = await fetch(`/api/transactions/account/${accountId}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    enabled: !!accountId
  });

  // Store previous location to handle back navigation
  const [previousLocation, setPreviousLocation] = useState<string>("/account-summary");
  
  // Get the previous location from sessionStorage if possible
  useEffect(() => {
    const storedPrevLocation = sessionStorage.getItem("prevLocation");
    if (storedPrevLocation) {
      setPreviousLocation(storedPrevLocation);
      // Clear it after retrieving
      sessionStorage.removeItem("prevLocation");
    }
  }, []);
  
  // Handle back button
  const handleBack = () => {
    // Navigate to the remembered location or default to account summary
    setLocation(previousLocation || "/account-summary");
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      {/* Page header with back button */}
      <div className="flex items-center mb-6 gap-2">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold text-gray-800">
          {accountQuery.isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            accountQuery.data?.name
          )} Transactions
        </h2>
      </div>

      {/* Account summary card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {accountQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-40" />
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Current Balance</h3>
              <p className="text-3xl font-bold">${accountQuery.data?.balance.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-2">Account Type: {accountQuery.data?.type}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions list */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Transaction History</h3>
        
        {transactionsQuery.isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
        ) : transactionsQuery.data?.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No transactions found for this account.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactionsQuery.data?.map((transaction: any) => (
              <TransactionItem 
                key={transaction.id} 
                transaction={transaction} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}