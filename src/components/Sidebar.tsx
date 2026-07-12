"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { 
  LayoutDashboard, Truck, Users, Map, 
  Wrench, DollarSign, BarChart3, LogOut 
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"] },
  { name: "Vehicle Registry", href: "/vehicles", icon: Truck, roles: ["FLEET_MANAGER"] },
  { name: "Drivers & Safety", href: "/drivers", icon: Users, roles: ["SAFETY_OFFICER"] },
  { name: "Trip Dispatcher", href: "/trips", icon: Map, roles: ["DISPATCHER"] },
  { name: "Maintenance", href: "/maintenance", icon: Wrench, roles: ["FLEET_MANAGER"] },
  { name: "Fuel & Expenses", href: "/finances", icon: DollarSign, roles: ["FINANCIAL_ANALYST"] },
  { name: "Reports", href: "/reports", icon: BarChart3, roles: ["FINANCIAL_ANALYST"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  // Filter navigation items based on the user's role
  const allowedNavItems = navItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  return (
    <div className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col transition-all">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-amber-500 p-1.5 rounded-md">
          <Truck className="w-6 h-6 text-slate-900" />
        </div>
        <span className="text-xl font-bold text-white tracking-wide">TransitOps</span>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1.5">
        {allowedNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.name} href={item.href}>
              <span className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm",
                isActive 
                  ? "bg-amber-500 text-slate-900 shadow-sm" 
                  : "hover:bg-slate-800 hover:text-white"
              )}>
                <item.icon className="w-5 h-5" />
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium text-white">{session?.user?.name}</p>
          <p className="text-xs text-slate-500 capitalize">{userRole?.replace("_", " ").toLowerCase()}</p>
        </div>
        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}