import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertTransactionSchema } from "@shared/schema";
import { useLocation } from "wouter";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const formSchema = insertTransactionSchema.extend({
  date: z.date()
});

type FormValues = z.infer<typeof formSchema>;

export default function AddTransaction() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense");

  // Fetch accounts and categories
  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/accounts"],
  });

  const { data: incomeCategories = [] } = useQuery({
    queryKey: ["/api/income-categories"],
  });

  const { data: expenseCategories = [] } = useQuery({
    queryKey: ["/api/expense-categories"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      description: "",
      date: new Date(),
      accountId: 1,
      type: "expense",
      categoryId: 1,
    },
  });

  // Update categoryId and accountId when selections change
  useEffect(() => {
    if (selectedAccountId) {
      form.setValue("accountId", selectedAccountId);
    }
  }, [selectedAccountId, form]);

  useEffect(() => {
    if (selectedCategoryId) {
      form.setValue("categoryId", selectedCategoryId);
    }
  }, [selectedCategoryId, form]);

  // Update form transaction type when it changes
  useEffect(() => {
    form.setValue("type", transactionType);
    
    // Reset category selection when type changes
    setSelectedCategoryId(null);
    
    // Set first category of the new type as default
    if (transactionType === "income" && incomeCategories.length > 0) {
      setSelectedCategoryId(incomeCategories[0].id);
      form.setValue("categoryId", incomeCategories[0].id);
    } else if (transactionType === "expense" && expenseCategories.length > 0) {
      setSelectedCategoryId(expenseCategories[0].id);
      form.setValue("categoryId", expenseCategories[0].id);
    }
  }, [transactionType, form, incomeCategories, expenseCategories]);

  // Initialize default selections
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
      form.setValue("accountId", accounts[0].id);
    }
    
    if (expenseCategories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(expenseCategories[0].id);
      form.setValue("categoryId", expenseCategories[0].id);
    }
  }, [accounts, expenseCategories, form, selectedAccountId, selectedCategoryId]);

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/transactions", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transaction created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary/balance"] });
      
      // Redirect to dashboard after successful creation
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create transaction",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: FormValues) {
    createMutation.mutate(values);
  }

  return (
    <div className="py-2 px-3 sm:px-4">
      {/* Page header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold text-gray-800">Add Transaction</h2>
        </div>
        <Button 
          type="submit" 
          form="transaction-form"
          size="sm"
        >
          Save
        </Button>
      </div>

      <Form {...form}>
        <form id="transaction-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          {/* Transaction Type Selection */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Transaction Type</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant={transactionType === "income" ? "default" : "outline"}
                      className={cn(
                        "h-14 font-semibold",
                        transactionType === "income" && "bg-green-500 hover:bg-green-600"
                      )}
                      onClick={() => setTransactionType("income")}
                    >
                      Income
                    </Button>
                    <Button
                      type="button"
                      variant={transactionType === "expense" ? "default" : "outline"}
                      className={cn(
                        "h-14 font-semibold",
                        transactionType === "expense" && "bg-red-500 hover:bg-red-600"
                      )}
                      onClick={() => setTransactionType("expense")}
                    >
                      Expense
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Amount Field */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      $
                    </span>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      className="pl-7 text-xl h-14"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Account Selection */}
          <div className="space-y-2">
            <FormLabel>Account</FormLabel>
            <div className="grid grid-cols-3 gap-2">
              {accounts.map((account) => (
                <Card 
                  key={account.id} 
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedAccountId === account.id 
                      ? "border-2 border-primary" 
                      : "hover:border-gray-300"
                  )}
                  onClick={() => setSelectedAccountId(account.id)}
                >
                  <CardContent className="p-2 text-center">
                    <p className="font-medium text-sm">{account.name}</p>
                    <p className="text-xs text-gray-500">${account.balance.toFixed(2)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {accounts.length === 0 && (
              <p className="text-center py-2 text-sm text-gray-500">
                No accounts found. Please add an account first.
              </p>
            )}
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <FormLabel>Category</FormLabel>
            <div className="grid grid-cols-3 gap-2">
              {(transactionType === "income" ? incomeCategories : expenseCategories).map((category) => (
                <Card 
                  key={category.id} 
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedCategoryId === category.id 
                      ? "border-2 border-primary" 
                      : "hover:border-gray-300"
                  )}
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  <CardContent className="p-2 text-center">
                    <p className="font-medium text-sm">{category.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {((transactionType === "income" ? incomeCategories : expenseCategories).length === 0) && (
              <p className="text-center py-2 text-sm text-gray-500">
                No categories found. Please add a category first.
              </p>
            )}
          </div>

          {/* Description Field */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input {...field} className="h-14" placeholder="What's this transaction for?" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date Field */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal h-14",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-5 w-5 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-semibold"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Saving..." : "Save Transaction"}
          </Button>
        </form>
      </Form>
    </div>
  );
}