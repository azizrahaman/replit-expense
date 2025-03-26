import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Tag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import Accounts from "./Accounts";
import Categories from "./Categories";

export default function Settings() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("accounts");

  return (
    <div className="space-y-4 py-4 px-2 sm:px-4">
      {/* Page header */}
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2"
          onClick={() => setLocation("/dashboard")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
      </div>

      <Tabs
        defaultValue="accounts"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <span>Categories</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="accounts" className="mt-0">
          <Accounts hideHeader={true} />
        </TabsContent>
        
        <TabsContent value="categories" className="mt-0">
          <Categories hideHeader={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}