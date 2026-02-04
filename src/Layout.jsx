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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-slate-200 z-50 transform transition-transform lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b">
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-900">KYC Confidence</h1>
                <p className="text-xs text-slate-500">Singapore Edition</p>
              </div>
            </Link>
          </div>

          {/* Organisation */}
          {organisation && (
            <div className="px-4 py-3 border-b bg-slate-50">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Organisation</p>
              <p className="text-sm font-medium text-slate-700 truncate">{organisation.name}</p>
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-emerald-50 text-emerald-700" 
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-emerald-600" : "text-slate-400"
                  )} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-emerald-700">
                      {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {user?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('Settings')} className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => base44.auth.logout()}
                  className="text-red-600"
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
      <div className="lg:ml-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 bg-white border-b border-slate-200 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900">KYC Confidence</span>
            </div>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </header>

        {/* Page content */}
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}