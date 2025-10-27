
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { KPI } from '../types';
import { kpiData } from '../data/mockData';
import { IncreaseIcon, DecreaseIcon } from './icons';

const KpiCard: React.FC<{ kpi: KPI }> = ({ kpi }) => {
  const isIncrease = kpi.deltaType === 'increase';
  const deltaColor = isIncrease ? 'text-green-500' : 'text-red-500';

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{kpi.name}</h3>
        <div className={`flex items-center text-sm font-bold ${deltaColor}`}>
            {isIncrease ? <IncreaseIcon className="w-5 h-5 mr-1" /> : <DecreaseIcon className="w-5 h-5 mr-1" />}
            <span>{kpi.delta}%</span>
        </div>
      </div>
      <div className="mt-2 flex items-baseline space-x-2">
        <p className="text-4xl font-bold text-gray-800 dark:text-white">{kpi.value}</p>
        <span className="text-sm text-gray-400 dark:text-gray-500">Target: {kpi.target}</span>
      </div>
      <div className="mt-4 h-24">
         <ResponsiveContainer width="100%" height="100%">
          <LineChart data={kpi.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <Line type="monotone" dataKey="current" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
            <Line type="monotone" dataKey="baseline" stroke="#9ca3af" strokeWidth={2} strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(5px)',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Performance Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpiData.map((kpi) => (
          <KpiCard key={kpi.name} kpi={kpi} />
        ))}
      </div>
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Weekly Performance Comparison</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={kpiData[1].data}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(5px)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
              <Bar dataKey="baseline" fill="#9ca3af" name="Baseline Utilization %" radius={[4, 4, 0, 0]}/>
              <Bar dataKey="current" fill="#3b82f6" name="AI-Assisted Utilization %" radius={[4, 4, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
