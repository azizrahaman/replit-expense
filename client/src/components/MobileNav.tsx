import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, CreditCard, PlusCircle, BarChart3, Menu } from "lucide-react";
import { useState } from "react";
import TransactionModal from "./TransactionModal";

export default function MobileNav() {
  const [location] = useLocation();
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
      exact: true
    },
    {
      name: "Accounts",
      href: "/accounts",
      icon: CreditCard,
      exact: false
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
      exact: false
    },
    {
      name: "More",
      href: "#",
      icon: Menu,
      exact: false,
      action: () => {}
    }
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center p-2 z-50">
        {navItems.map((item, index) => {
          const isActive = item.exact 
            ? location === item.href 
            : (item.href !== "#" && location.startsWith(item.href));

          return (
            <Link key={index} href={item.href}>
              <a 
                className={cn(
                  "flex flex-col items-center py-1", 
                  isActive ? "text-primary" : "text-gray-500"
                )}
                onClick={item.action}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs">{item.name}</span>
              </a>
            </Link>
          );
        })}

        {/* Add button in the middle */}
        <button 
          className="flex flex-col items-center py-1 text-primary"
          onClick={() => setIsTransactionModalOpen(true)}
        >
          <PlusCircle className="h-6 w-6" />
          <span className="text-xs">Add</span>
        </button>
      </div>

      <TransactionModal 
        isOpen={isTransactionModalOpen} 
        onClose={() => setIsTransactionModalOpen(false)} 
      />
    </>
  );
}
