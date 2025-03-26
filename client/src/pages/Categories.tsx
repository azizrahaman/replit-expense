import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Plus } from "lucide-react";
import CategoryModal from "@/components/CategoryModal";
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

interface CategoriesProps {
  hideHeader?: boolean;
}

export default function Categories({ hideHeader = false }: CategoriesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("income");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // Fetch categories
  const incomeQuery = useQuery({
    queryKey: ["/api/income-categories"],
  });

  const expenseQuery = useQuery({
    queryKey: ["/api/expense-categories"],
  });

  // Delete mutations
  const deleteIncomeCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/income-categories/${id}`);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Category deleted",
        description: "The income category has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/income-categories"] });
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error deleting category",
        description: error instanceof Error 
          ? error.message 
          : "There was an error deleting the category. It may be in use by transactions.",
      });
    },
  });

  const deleteExpenseCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/expense-categories/${id}`);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Category deleted",
        description: "The expense category has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expense-categories"] });
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error deleting category",
        description: error instanceof Error 
          ? error.message 
          : "There was an error deleting the category. It may be in use by transactions.",
      });
    },
  });

  // Handle delete action
  const handleDelete = () => {
    if (!selectedCategory) return;
    
    if (activeTab === "income") {
      deleteIncomeCategoryMutation.mutate(selectedCategory.id);
    } else {
      deleteExpenseCategoryMutation.mutate(selectedCategory.id);
    }
  };

  // Handle edit action
  const handleEdit = (category: any) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (category: any) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  // Handle add new category
  const handleAddNewCategory = () => {
    setIsAddModalOpen(true);
  };

  // Render category list
  const renderCategoryList = (categories: any[], isLoading: boolean) => {
    if (isLoading) {
      return (
        <>
          <Skeleton className="h-14 w-full mb-3" />
          <Skeleton className="h-14 w-full mb-3" />
          <Skeleton className="h-14 w-full" />
        </>
      );
    }

    if (!categories || categories.length === 0) {
      return (
        <div className="text-center py-6">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new category.
          </p>
          <div className="mt-4">
            <Button onClick={handleAddNewCategory}>
              <Plus className="mr-2 h-5 w-5" />
              Add Category
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-200">
        {categories.map((category) => (
          <div key={category.id} className="py-3 flex justify-between items-center">
            <div>
              <h4 className="text-base font-medium text-gray-900">{category.name}</h4>
              {category.description && (
                <p className="text-sm text-gray-500">{category.description}</p>
              )}
            </div>
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleEdit(category)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleDeleteConfirm(category)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={hideHeader ? "" : "py-6 px-4 sm:px-6 lg:px-8"}>
      {/* Page header */}
      {!hideHeader && (
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-800">Categories</h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button onClick={handleAddNewCategory}>
              <Plus className="mr-2 h-5 w-5" />
              Add Category
            </Button>
          </div>
        </div>
      )}

      {/* Tabs for Income and Expense Categories */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="income" className="text-sm">Income Categories</TabsTrigger>
          <TabsTrigger value="expense" className="text-sm">Expense Categories</TabsTrigger>
        </TabsList>
        
        <div className="flex justify-end mb-2">
          {hideHeader && (
            <Button onClick={handleAddNewCategory} size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add Category
            </Button>
          )}
        </div>
        
        <TabsContent value="income">
          <Card>
            <CardContent className="p-4">
              {renderCategoryList(incomeQuery.data || [], incomeQuery.isLoading)}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expense">
          <Card>
            <CardContent className="p-4">
              {renderCategoryList(expenseQuery.data || [], expenseQuery.isLoading)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Category Modal */}
      <CategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        type={activeTab as 'income' | 'expense'}
      />

      {/* Edit Category Modal */}
      <CategoryModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCategory(null);
        }}
        type={activeTab as 'income' | 'expense'}
        category={selectedCategory}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the category "{selectedCategory?.name}". This action cannot be undone if there are no transactions associated with this category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCategory(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
