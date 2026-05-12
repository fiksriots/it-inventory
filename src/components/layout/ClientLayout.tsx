"use client";

import * as React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import type { User } from "@supabase/supabase-js";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { Breadcrumbs } from "./Breadcrumbs";

export function ClientLayout({ children, user, userProfile, lowStockCount = 0, lowStockItems = [], maintenanceCount = 0, maintenanceAlerts = [] }: { 
  children: React.ReactNode; 
  user?: User | null, 
  userProfile?: any,
  lowStockCount?: number,
  lowStockItems?: any[],
  maintenanceCount?: number,
  maintenanceAlerts?: any[]
}) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false); // Default closed for desktop as requested
  const [isHovered, setIsHovered] = React.useState(false);

  // Auto-close when clicking outside on mobile or when not hovering on desktop if toggled
  const isOpen = isSidebarOpen || isHovered;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background flex">
        
        {/* Edge Sensor for Hover (Desktop) */}
        <div 
          className="fixed left-0 top-0 bottom-0 w-4 z-[60] hidden lg:block"
          onMouseEnter={() => setIsHovered(true)}
        />

        {/* Sidebar Wrapper */}
        <div 
          className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          } w-64 shadow-2xl`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </div>

        {/* Backdrop for Sidebar (Mobile & Desktop Floating) */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden"
            onClick={() => {
              setIsSidebarOpen(false);
              setIsHovered(false);
            }}
          />
        )}

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 w-full`}>
          <Navbar 
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            user={user} 
            userProfile={userProfile}
            lowStockCount={lowStockCount} 
            lowStockItems={lowStockItems}
            maintenanceCount={maintenanceCount}
            maintenanceAlerts={maintenanceAlerts}
            isSidebarOpen={isOpen}
          />
          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            <Breadcrumbs />
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
