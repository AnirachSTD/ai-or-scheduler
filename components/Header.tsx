import React from 'react';

interface HeaderProps {
  selectedDate: Date;
  onDateChange: (newDate: Date) => void;
}

export const Header: React.FC<HeaderProps> = ({ selectedDate, onDateChange }) => {

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    onDateChange(newDate);
  };

  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b dark:border-gray-700 shadow-md">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 hidden sm:block">
          Schedule for:
        </h2>
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg">
           <button 
             onClick={() => changeDate(-1)} 
             className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-l-lg transition-colors"
             aria-label="Previous day"
            >
             <i className="fas fa-chevron-left"></i>
           </button>
           <span className="px-4 py-2 text-lg font-semibold text-blue-600 dark:text-blue-400 w-48 text-center">{selectedDate.toDateString()}</span>
           <button 
             onClick={() => changeDate(1)} 
             className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-r-lg transition-colors"
             aria-label="Next day"
            >
             <i className="fas fa-chevron-right"></i>
           </button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring">
          <i className="fa-regular fa-bell"></i>
        </button>
        <div className="flex items-center space-x-3">
          <img
            className="w-10 h-10 rounded-full object-cover"
            src="https://picsum.photos/100"
            alt="User avatar"
          />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Alex Hartman</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">OR Planner</p>
          </div>
        </div>
      </div>
    </header>
  );
};