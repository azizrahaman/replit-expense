import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, CreditCard, PlusCircle, BarChart3, Menu } from "lucide-react";

export default function MobileNav() {
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
      href: "/categories",
      icon: Menu,
      exact: false
    }
  ];

  return (
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
