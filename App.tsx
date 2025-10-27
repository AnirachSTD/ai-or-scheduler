
import React, { useState, useEffect, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { ScheduleView } from './components/ScheduleView';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Chatbot } from './components/Chatbot';
import { Analytics } from './components/Analytics';
import type { View, Case } from './types';
import * as db from './services/databaseService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      await db.initDb();
      const fetchedCases = await db.getCases();
      setCases(fetchedCases.sort((a, b) => a.startTime.localeCompare(b.startTime)));
      setError(null);
    } catch (e) {
      console.error("Failed to load data from storage:", e);
      setError("Failed to load schedule data. Please try refreshing the page.");
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadData();
  }, [loadData]);


  const handleCaseSelect = useCallback((caseData: Case | null) => {
    setSelectedCase(caseData);
  }, []);

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    // In a real application, you would fetch the cases for the newDate.
    // For this demo, we'll continue to use the same persisted data.
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xl text-gray-600 dark:text-gray-300">Loading Schedule...</span>
        </div>
      );
    }

    if (error) {
       return (
        <div className="flex items-center justify-center h-full text-center text-red-500">
          <p className="text-xl">{error}</p>
        </div>
      );
    }

    switch (currentView) {
      case 'schedule':
        return <ScheduleView 
                  cases={cases}
                  onDataChange={loadData}
                  onCaseSelect={handleCaseSelect} 
                  selectedCase={selectedCase}
                  selectedDate={selectedDate}
                />;
      case 'analytics':
        return <Analytics cases={cases} />;
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
          {renderContent()}
        </main>
      </div>
      <Chatbot cases={cases} />
    </div>
  );
};

export default App;
