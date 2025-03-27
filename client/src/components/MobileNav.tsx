import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, PlusCircle, BarChart3, Settings, Menu, CreditCard } from "lucide-react";

interface MobileNavProps {
  toggleSidebar: () => void;
}

export default function MobileNav({ toggleSidebar }: MobileNavProps) {
  const [location, setLocation] = useLocation();

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      exact: true
    },
    {
      name: "Accounts",
      href: "/account-summary",
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
      name: "Settings",
      href: "/settings",
      icon: Settings,
      exact: false
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center p-2 z-50">
      {/* Hamburger menu on the left */}
      <button 
        className="flex flex-col items-center py-1 text-gray-500"
        onClick={toggleSidebar}
      >
        <Menu className="h-6 w-6" />
        <span className="text-xs">Menu</span>
      </button>

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
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs">{item.name}</span>
            </a>
          </Link>
        );
      })}

      {/* Add Transaction button in the middle */}
      <Link href="/">
        <a 
          className={cn(
            "flex flex-col items-center py-1",
            location === "/" ? "text-primary" : "text-primary"
          )}
        >
          <div className="bg-primary text-white rounded-full p-3 -mt-5 shadow-lg">
            <PlusCircle className="h-6 w-6" />
          </div>
          <span className="text-xs mt-1">Add</span>
        </a>
      </Link>
    </div>
  );
}
