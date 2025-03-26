import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  insertIncomeCategorySchema, 
  insertExpenseCategorySchema, 
  IncomeCategory, 
  ExpenseCategory 
} from "@shared/schema";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'income' | 'expense';
  category?: IncomeCategory | ExpenseCategory;
}

// Use the same schema for both types as they have the same structure
const formSchema = insertIncomeCategorySchema.extend({});

type FormValues = z.infer<typeof formSchema>;

export default function CategoryModal({ isOpen, onClose, type, category }: CategoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Update form values when editing an existing category
  useEffect(() => {
    if (category) {
      setIsEditing(true);
      form.reset({
        name: category.name,
        description: category.description || "",
      });
    } else {
      setIsEditing(false);
      form.reset({
        name: "",
        description: "",
      });
    }
  }, [category, form]);

  // Create/Update category mutations
  const createIncomeCategoryMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/income-categories", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Income category created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/income-categories"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create income category",
        variant: "destructive",
      });
    },
  });

  const updateIncomeCategoryMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!category) return null;
      const res = await apiRequest("PATCH", `/api/income-categories/${category.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Income category updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/income-categories"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update income category",
        variant: "destructive",
      });
    },
  });

  const createExpenseCategoryMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/expense-categories", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense category created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expense-categories"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create expense category",
        variant: "destructive",
      });
    },
  });

  const updateExpenseCategoryMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!category) return null;
      const res = await apiRequest("PATCH", `/api/expense-categories/${category.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense category updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expense-categories"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update expense category",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: FormValues) {
    if (type === 'income') {
      if (isEditing) {
        updateIncomeCategoryMutation.mutate(values);
      } else {
        createIncomeCategoryMutation.mutate(values);
      }
    } else {
      if (isEditing) {
        updateExpenseCategoryMutation.mutate(values);
      } else {
        createExpenseCategoryMutation.mutate(values);
      }
    }
  }

  const isPending = 
    createIncomeCategoryMutation.isPending || 
    updateIncomeCategoryMutation.isPending || 
    createExpenseCategoryMutation.isPending || 
    updateExpenseCategoryMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit ${type === 'income' ? 'Income' : 'Expense'} Category` : `Add New ${type === 'income' ? 'Income' : 'Expense'} Category`}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
