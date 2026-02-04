import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, Building2, FileCheck, BarChart3, 
  Settings, LogOut, Menu, X, Shield, ChevronDown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Records', icon: Building2, page: 'Records' },
  { name: 'Assessment', icon: FileCheck, page: 'Assessment' },
  { name: 'Reports', icon: BarChart3, page: 'Reports' },
];

const bottomNavPages = ['Dashboard', 'Records', 'Reports', 'Settings'];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [organisation, setOrganisation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser.org_id) {
          const orgs = await base44.entities.Organisation.filter({ id: currentUser.org_id });
          if (orgs.length > 0) {
            setOrganisation(orgs[0]);
          }
        }
      }
    } catch (e) {
      // Not authenticated
    } finally {
      setLoading(false);
    }
  };

  // Don't show layout for public pages
  if (currentPageName === 'Landing' || currentPageName === 'Onboarding') {
    return children;
  }

  // Show minimal layout while loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  // If not authenticated and not on public page, just render children (they'll handle redirect)
  if (!user) {
    return children;
  }

  const showBottomNav = bottomNavPages.includes(currentPageName);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 overscroll-none">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile when bottom nav is shown */}
      <aside className={cn(
        "fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-50 transform transition-transform lg:translate-x-0",
        showBottomNav ? "hidden lg:block" : "",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b dark:border-slate-700">
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3 select-none">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-900 dark:text-slate-100">KYC Confidence</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Singapore Edition</p>
              </div>
            </Link>
          </div>

          {/* Organisation */}
          {organisation && (
            <div className="px-4 py-3 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Organisation</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{organisation.name}</p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors select-none",
                    isActive 
                      ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" 
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
                  )} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t dark:border-slate-700">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none">
                  <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                      {user?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('Settings')} className="flex items-center gap-2 select-none">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => base44.auth.logout()}
                  className="text-red-600 dark:text-red-400 select-none"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn("lg:ml-64", showBottomNav && "pb-20")}>
        {/* Mobile header - shown when bottom nav is displayed */}
        <header className={cn(
          "lg:hidden sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-30 pt-[env(safe-area-inset-top)]",
          showBottomNav ? "block" : "hidden"
        )}>
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 select-none"
            >
              <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">KYC Confidence</span>
            </div>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </header>

        {/* Mobile header - shown for pages without bottom nav (like Assessment) */}
        <header className={cn(
          "lg:hidden sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-30 pt-[env(safe-area-inset-top)]",
          showBottomNav ? "hidden" : "block"
        )}>
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 select-none"
            >
              <svg className="w-6 h-6 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">KYC Confidence</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="overscroll-none">
          {children}
        </main>

        {/* Bottom Tab Bar - Mobile Only */}
        {showBottomNav && (
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 pb-[env(safe-area-inset-bottom)] z-40">
            <div className="grid grid-cols-4 h-16">
              {navigation.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.page)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 select-none transition-colors",
                      isActive 
                        ? "text-emerald-600 dark:text-emerald-400" 
                        : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}