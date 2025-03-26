import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home,
  PlusCircle,
  DollarSign,
  BarChart3,
  Settings,
  X,
  Receipt
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    {
      name: "Add Transaction",
      href: "/",
      icon: PlusCircle,
      exact: true
    },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      exact: true
    },
    {
      name: "Transactions",
      href: "/transactions",
      icon: Receipt,
      exact: false
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
      exact: false
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      exact: false
    }
  ];

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "md:flex md:flex-col md:w-64 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
          isOpen 
            ? "fixed inset-y-0 left-0 z-30 w-64 flex flex-col transform translate-x-0" 
            : "fixed inset-y-0 left-0 z-30 w-64 flex flex-col transform -translate-x-full md:translate-x-0"
        )}
      >
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 flex items-center">
            <DollarSign className="h-6 w-6 mr-2 text-primary" />
            Finance Tracker
          </h1>
          <button 
            className="md:hidden rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? location === item.href 
              : location.startsWith(item.href);

            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => onClose()}
              >
                <a 
                  className={cn(
                    "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 mr-3", 
                    isActive ? "text-primary" : "text-gray-500"
                  )} />
                  {item.name}
                </a>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
