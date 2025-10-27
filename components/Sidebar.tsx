
import React from 'react';
import type { View } from '../types';
import { DashboardIcon, ScheduleIcon, AnalyticsIcon, AuditIcon } from './icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex items-center p-3 my-1 rounded-lg text-gray-700 dark:text-gray-300 transition-colors duration-200 ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg'
          : 'hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {icon}
      <span className="mx-4 font-medium">{label}</span>
    </a>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  return (
    <aside className="flex flex-col w-64 h-screen px-4 py-8 bg-white dark:bg-gray-900 border-r dark:border-gray-700 shadow-xl">
       <a href="#" className="mx-auto">
         <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Orchestrate<span className="text-gray-700 dark:text-gray-300">AI</span></h1>
      </a>

      <div className="flex flex-col justify-between flex-1 mt-10">
        <nav>
            <NavItem 
                icon={<DashboardIcon className="w-6 h-6" />}
                label="Dashboard"
                isActive={currentView === 'dashboard'}
                onClick={() => setCurrentView('dashboard')}
            />
             <NavItem 
                icon={<ScheduleIcon className="w-6 h-6" />}
                label="Schedule"
                isActive={currentView === 'schedule'}
                onClick={() => setCurrentView('schedule')}
            />
            <NavItem 
                icon={<AnalyticsIcon className="w-6 h-6" />}
                label="Analytics"
                isActive={currentView === 'analytics'}
                onClick={() => setCurrentView('analytics')}
            />
            <NavItem 
                icon={<AuditIcon className="w-6 h-6" />}
                label="Audit Trail"
                isActive={currentView === 'audit'}
                onClick={() => setCurrentView('audit')}
            />
        </nav>
      </div>
    </aside>
  );
};
