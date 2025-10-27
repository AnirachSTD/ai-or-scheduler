
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b dark:border-gray-700 shadow-md">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Today's Schedule: <span className="text-blue-600 dark:text-blue-400">{new Date().toDateString()}</span>
        </h2>
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
