import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Accounts from "@/pages/Accounts";
import Transactions from "@/pages/Transactions";
import Reports from "@/pages/Reports";
import Categories from "@/pages/Categories";
import Settings from "@/pages/Settings";
import AddTransaction from "@/pages/AddTransaction";
import AccountTransactions from "@/pages/AccountTransactions";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { useState } from "react";

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar (desktop only) */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none pb-16 md:pb-0">
          <Switch>
            <Route path="/" component={AddTransaction} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/accounts">
              {(params) => <Accounts />}
            </Route>
            <Route path="/transactions" component={Transactions} />
            <Route path="/reports" component={Reports} />
            <Route path="/categories">
              {(params) => <Categories />}
            </Route>
            <Route path="/settings" component={Settings} />
            <Route path="/account-transactions/:accountId" component={AccountTransactions} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav toggleSidebar={toggleSidebar} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
