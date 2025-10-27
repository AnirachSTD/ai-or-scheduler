
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Case } from '../types';
import { AnalyticsIcon } from './icons';

interface AnalyticsProps {
  cases: Case[];
}

const COLORS_PRIORITY = { 'Elective': '#3b82f6', 'Urgent': '#f59e0b', 'Emergent': '#ef4444' };
const COLORS_RISK = { 'Low': '#22c55e', 'Medium': '#f59e0b', 'High': '#ef4444' };


const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                <p className="font-bold text-gray-800 dark:text-gray-200">{label}</p>
                {payload.map((pld: any) => (
                    <p key={pld.dataKey} style={{ color: pld.fill }}>
                        {`${pld.name}: ${typeof pld.value === 'number' ? pld.value.toFixed(0) : pld.value}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export const Analytics: React.FC<AnalyticsProps> = ({ cases }) => {
  const surgeonData = useMemo(() => {
    const stats: { [key: string]: { totalDuration: number; caseCount: number } } = {};
    cases.forEach(c => {
      if (!stats[c.surgeon]) {
        stats[c.surgeon] = { totalDuration: 0, caseCount: 0 };
      }
      stats[c.surgeon].totalDuration += c.aiP50Minutes;
      stats[c.surgeon].caseCount += 1;
    });
    return Object.entries(stats).map(([surgeon, data]) => ({
      surgeon,
      'Number of Cases': data.caseCount,
      'Avg. Duration (min)': data.totalDuration / data.caseCount,
    }));
  }, [cases]);

  const roomData = useMemo(() => {
    const stats: { [key: string]: number } = {};
    cases.forEach(c => {
      const roomName = c.room.split('(')[0].trim();
      if (!stats[roomName]) {
        stats[roomName] = 0;
      }
      stats[roomName] += c.aiP50Minutes + c.turnoverMinutes;
    });
    return Object.entries(stats).map(([room, totalMinutes]) => ({
      room,
      'Total Scheduled (min)': totalMinutes,
    }));
  }, [cases]);

  const priorityData = useMemo(() => {
    const stats: { [key: string]: number } = { 'Elective': 0, 'Urgent': 0, 'Emergent': 0 };
    cases.forEach(c => {
      stats[c.priority] = (stats[c.priority] || 0) + 1;
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [cases]);
  
  const riskData = useMemo(() => {
    const stats: { [key: string]: number } = { 'Low': 0, 'Medium': 0, 'High': 0 };
    cases.forEach(c => {
      stats[c.risk] = (stats[c.risk] || 0) + 1;
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [cases]);


  if (cases.length === 0) {
    return (
        <div className="flex items-center justify-center h-full text-center">
            <div>
                <AnalyticsIcon className="w-16 h-16 mx-auto text-gray-400" />
                <h2 className="mt-4 text-2xl font-semibold text-gray-700 dark:text-gray-300">No Data for Analysis</h2>
                <p className="mt-2 text-gray-500">Add cases to the schedule to see analytics and insights.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Analytics & Insights</h1>
      
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Surgeon Caseload & Duration Analysis</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={surgeonData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="surgeon" angle={-15} textAnchor="end" height={50} interval={0} />
              <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" label={{ value: 'Number of Cases', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" label={{ value: 'Avg. Duration (min)', angle: 90, position: 'insideRight' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="Number of Cases" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="Avg. Duration (min)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Room Utilization (Total Scheduled Minutes)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roomData}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="room" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="Total Scheduled (min)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Case Distribution by Priority</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {priorityData.map((entry) => <Cell key={`cell-${entry.name}`} fill={COLORS_PRIORITY[entry.name as keyof typeof COLORS_PRIORITY]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Case Distribution by Risk Level</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                    {riskData.map((entry) => <Cell key={`cell-${entry.name}`} fill={COLORS_RISK[entry.name as keyof typeof COLORS_RISK]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
