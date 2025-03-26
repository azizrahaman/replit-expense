import { format } from "date-fns";
import { TransactionWithDetails } from "@shared/schema";
import { Pencil, Trash2, ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import TransactionModal from "./TransactionModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TransactionItemProps {
  transaction: TransactionWithDetails;
  isMobile?: boolean;
}

export default function TransactionItem({ transaction, isMobile = false }: TransactionItemProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/transactions/${transaction.id}`);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Transaction deleted",
        description: "The transaction has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary/balance"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error deleting transaction",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
    setIsDeleteAlertOpen(false);
  };

  if (isMobile) {
    return (
      <>
        <div className="py-3 border-b border-gray-200 last:border-b-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div 
                className={cn(
                  "rounded-full p-2 mr-3",
                  transaction.type === "income" ? "bg-green-100" : "bg-red-100"
                )}
              >
                {transaction.type === "income" ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{transaction.description}</p>
                <p className="text-xs text-gray-500">
                  {transaction.categoryName} ({format(new Date(transaction.date), "PP")})
                </p>
              </div>
            </div>
            <div 
              className={cn(
                "text-sm font-semibold",
                transaction.type === "income" ? "text-green-500" : "text-red-500"
              )}
            >
              {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Edit Transaction Modal */}
        <TransactionModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          transactionId={transaction.id}
        />

        {/* Delete Confirmation Alert */}
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete the transaction and update your account balance. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <tr>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {format(new Date(transaction.date), "MM/dd/yyyy")}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          {transaction.description}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs font-medium",
              transaction.type === "income" 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-red-100 text-red-800 border-red-200"
            )}
          >
            {transaction.categoryName}
          </Badge>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {transaction.accountName}
        </td>
        <td 
          className={cn(
            "px-6 py-4 whitespace-nowrap text-sm font-medium",
            transaction.type === "income" ? "text-green-500" : "text-red-500"
          )}
        >
          {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button 
            className="text-primary hover:text-blue-800 mr-2"
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit
          </button>
          <button 
            className="text-red-500 hover:text-red-800"
            onClick={() => setIsDeleteAlertOpen(true)}
          >
            Delete
          </button>
        </td>
      </tr>

      {/* Edit Transaction Modal */}
      <TransactionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        transactionId={transaction.id}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the transaction and update your account balance. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
