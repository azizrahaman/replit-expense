import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AccountCard from "@/components/AccountCard";
import AccountModal from "@/components/AccountModal";
import { Plus } from "lucide-react";

interface AccountsProps {
  hideHeader?: boolean;
}

export default function Accounts({ hideHeader = false }: AccountsProps) {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch accounts
  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ["/api/accounts"],
    queryFn: async () => {
      const response = await fetch("/api/accounts");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch accounts");
      }
      return response.json();
    }
  });

  // Fetch total balance
  const { data: balanceData } = useQuery({
    queryKey: ["/api/summary/balance"],
    queryFn: async () => {
      const response = await fetch("/api/summary/balance");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch balance");
      }
      return response.json();
    }
  });

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);


  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading accounts",
        description: "There was an error loading your accounts. Please try again.",
      });
    }
  }, [error, toast]);

  return (
    <div className={hideHeader ? "" : "py-6 px-4 sm:px-6 lg:px-8"}>
      {/* Page header */}
      {!hideHeader && (
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-800">Accounts</h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button onClick={handleOpenModal}>
              <Plus className="mr-2 h-5 w-5" />
              Add Account
            </Button>
          </div>
        </div>
      )}

      {/* Balance Summary */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Total Balance</h3>
              {balanceData ? (
                <p className="text-3xl font-bold text-primary">${balanceData.totalBalance.toFixed(2)}</p>
              ) : (
                <Skeleton className="h-10 w-32" />
              )}
              <p className="text-sm text-gray-500 mt-1">Total across all accounts</p>
            </div>
            {hideHeader && (
              <Button onClick={handleOpenModal}>
                <Plus className="mr-2 h-5 w-5" />
                Add Account
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Accounts list */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Accounts</h3>

          {isLoading ? (
            <>
              <Skeleton className="h-16 w-full mb-3" />
              <Skeleton className="h-16 w-full mb-3" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : accounts?.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No accounts</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new account.
              </p>
              <div className="mt-4">
                <Button onClick={handleOpenModal}>
                  <Plus className="mr-2 h-5 w-5" />
                  Add Account
                </Button>
              </div>
            </div>
          ) : (
            accounts?.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Add Account Modal */}
      <AccountModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}