import React, { useState, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { ScheduleView } from './components/ScheduleView';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Chatbot } from './components/Chatbot';
import type { View, Case } from './types';
import { cases as mockCases } from './data/mockData';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [cases, setCases] = useState<Case[]>(mockCases);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleCaseSelect = useCallback((caseData: Case | null) => {
    setSelectedCase(caseData);
  }, []);

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    // In a real application, you would fetch the cases for the newDate.
    // For this demo, we'll continue to use the mock data.
  };

  const renderView = () => {
    switch (currentView) {
      case 'schedule':
        return <ScheduleView 
                  cases={cases}
                  setCases={setCases}
                  onCaseSelect={handleCaseSelect} 
                  selectedCase={selectedCase}
                  selectedDate={selectedDate}
                />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800 font-sans text-gray-900 dark:text-gray-200">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header selectedDate={selectedDate} onDateChange={handleDateChange} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-800 p-4 sm:p-6">
          {renderView()}
        </main>
      </div>
      <Chatbot />
    </div>
  );
};

export default App;