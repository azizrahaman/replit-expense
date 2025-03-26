import { cn } from "@/lib/utils";
import { Account } from "@shared/schema";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AccountModal from "./AccountModal";
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

interface AccountCardProps {
  account: Account;
  className?: string;
}

export default function AccountCard({ account, className }: AccountCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/accounts/${account.id}`);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: `${account.name} has been deleted successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary/balance"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error deleting account",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
    setIsDeleteAlertOpen(false);
  };

  return (
    <>
      <div className={cn("py-3 border-b border-gray-200 last:border-b-0", className)}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-800">{account.name}</p>
            <p className="text-xs text-gray-500">{account.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm font-semibold text-gray-900">
              ${account.balance.toFixed(2)}
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-1 text-gray-400 hover:text-primary rounded"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsDeleteAlertOpen(true)}
                className="p-1 text-gray-400 hover:text-red-500 rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Account Modal */}
      <AccountModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        account={account}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the account "{account.name}". This action cannot be undone if there are no transactions associated with this account.
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
