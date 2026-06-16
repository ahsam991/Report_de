"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  History, 
  FileCode2, 
  Info,
  ChevronRight,
  Database
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/generate", label: "Generate Reports", icon: FileText },
  { href: "/templates", label: "Templates", icon: FileCode2 },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/about", label: "About", icon: Info },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={`glass-panel border-r border-white/5 flex flex-col transition-all duration-300 relative z-30 h-screen sticky top-0 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-primary/20 p-2.5 rounded-xl border border-primary/30 text-primary animate-pulse">
            <Database className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col select-none">
              <span className="font-bold text-white text-base leading-tight tracking-wider">Report De</span>
              <span className="text-[10px] text-muted-foreground font-semibold">V2 TECHNOLOGIES</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-white" : "text-muted-foreground group-hover:text-primary"}`} />
              {!collapsed && (
                <span className="font-medium text-sm transition-opacity duration-300">
                  {item.label}
                </span>
              )}
              {isActive && !collapsed && (
                <ChevronRight className="w-4 h-4 ml-auto text-white/80 animate-ping absolute right-3" />
              )}
              {collapsed && (
                <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-black border border-white/10 rounded-lg text-xs font-semibold text-white opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 shadow-xl z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Collapse Trigger */}
      <div className="p-4 border-t border-white/5 flex items-center justify-center">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full py-2.5 rounded-xl border border-white/5 text-muted-foreground hover:text-white hover:bg-white/5 transition-all text-xs font-medium"
        >
          {collapsed ? "→" : "Collapse Sidebar"}
        </button>
      </div>
    </aside>
  );
}
