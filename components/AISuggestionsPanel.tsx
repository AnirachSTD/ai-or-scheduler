import React, { useState, useEffect } from 'react';
import type { Case } from '../types';
import { getDailySummary } from '../services/geminiService';
import { rooms } from '../data/mockData';

interface AISuggestionsPanelProps {
  selectedCase: Case | null;
  onClose: () => void;
  cases: Case[];
}

const InfoPill: React.FC<{ label: string, value: string, icon: string, colorClass: string }> = ({ label, value, icon, colorClass }) => (
    <div className={`flex items-center p-3 rounded-lg bg-opacity-10 ${colorClass}`}>
        <i className={`${icon} ${colorClass.replace('bg-', 'text-')} text-xl w-6 text-center`}></i>
        <div className="ml-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="font-semibold text-gray-800 dark:text-white">{value}</p>
        </div>
    </div>
);

const AiSummaryDisplay: React.FC<{ summary: string }> = ({ summary }) => {
    // Split by newline characters to process each line. Filter out empty lines.
    const lines = summary.split('\n').filter(line => line.trim() !== '');

    const renderLine = (text: string, key: number) => {
        // This regex will split the text by the bold markers (**), keeping the markers.
        // e.g., "Text with **bold content** and more" becomes ["Text with ", "**bold content**", " and more"]
        const parts = text.split(/(\*\*.*?\*\*)/g);

        return (
            <p key={key}>
                {parts.map((part, index) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        // It's a bold part
                        return <strong key={index} className="text-gray-800 dark:text-gray-200">{part.slice(2, -2)}</strong>;
                    }
                    // It's a regular text part
                    return part;
                })}
            </p>
        );
    };

    return (
        <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg space-y-2">
            {lines.map((line, index) => renderLine(line, index))}
        </div>
    );
};


const DailyAnalysisView: React.FC<{ cases: Case[] }> = ({ cases }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            setIsLoading(true);
            try {
                const result = await getDailySummary(cases);
                setSummary(result);
            } catch (e) {
                console.error(e);
                setSummary("Could not load AI summary.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSummary();
    }, [cases]);

    const totalCases = cases.length;
    const totalMinutes = cases.reduce((acc, c) => acc + c.aiP50Minutes + c.turnoverMinutes, 0);
    const availableMinutes = rooms.length * (18 - 7) * 60; // From 7am to 6pm
    const utilization = availableMinutes > 0 ? Math.round((totalMinutes / availableMinutes) * 100) : 0;

    return (
        <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Daily AI Analysis</h3>
            </div>
            <div className="p-4 flex-grow overflow-y-auto">
                <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-4">Today's Overview</h4>
                
                <div className="grid grid-cols-2 gap-3">
                    <InfoPill label="Total Cases" value={`${totalCases}`} icon="fas fa-list-ol" colorClass="bg-purple-500" />
                    <InfoPill label="Predicted Utilization" value={`${utilization}%`} icon="fas fa-chart-pie" colorClass="bg-green-500" />
                </div>

                <div className="my-6">
                    <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">AI Summary & Recommendations</h5>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-24">
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></span>
                                <span className="ml-2">Analyzing schedule...</span>
                            </div>
                        </div>
                    ) : (
                        <AiSummaryDisplay summary={summary} />
                    )}
                </div>
            </div>
        </>
    );
};


export const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({ selectedCase, onClose, cases }) => {
  return (
    <aside className="flex-shrink-0 w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
        {selectedCase ? (
            <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Case Analysis</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-4 flex-grow overflow-y-auto">
                <h4 className="font-semibold text-blue-600 dark:text-blue-400">{selectedCase.procedure}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{selectedCase.surgeon}</p>
                
                <div className="space-y-3">
                    <InfoPill label="Case Priority" value={selectedCase.priority} icon="fas fa-notes-medical" colorClass="bg-blue-500" />
                    <InfoPill label="Risk Level" value={selectedCase.risk} icon="fas fa-triangle-exclamation" colorClass={selectedCase.risk === 'High' ? 'bg-red-500' : selectedCase.risk === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'} />
                </div>

                <div className="my-6">
                    <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Duration Predictions</h5>
                    <div className="relative pt-1">
                        <div className="overflow-hidden h-4 text-xs flex rounded-full bg-gray-200 dark:bg-gray-700">
                            <div style={{ width: `${(selectedCase.aiP50Minutes / selectedCase.aiP90Minutes) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                        </div>
                        <div className="flex justify-between text-xs mt-1 text-gray-500 dark:text-gray-400">
                           <span>P50: {selectedCase.aiP50Minutes}m</span>
                           <span>P90: {selectedCase.aiP90Minutes}m</span>
                        </div>
                         <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">Surgeon Estimate: {selectedCase.surgeonEstimateMinutes}m</p>
                    </div>
                </div>

                <div className="my-6">
                    <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Conflicts & Flags</h5>
                    {selectedCase.conflicts.length > 0 ? (
                        <ul className="space-y-2">
                           {selectedCase.conflicts.map((conflict, index) => (
                                <li key={index} className="flex items-start text-sm p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-md text-yellow-800 dark:text-yellow-300">
                                    <i className="fas fa-flag mt-1 mr-2"></i>
                                    <span>{conflict}</span>
                                </li>
                           ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500">No conflicts detected.</p>
                    )}
                </div>

                <div className="my-6">
                    <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">AI Summary</h5>
                     <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                        This is an elective, low-risk procedure. The AI duration model is closely aligned with the surgeon's estimate. Recommend standard turnover protocol. No significant resource conflicts or PACU congestion expected.
                    </p>
                </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex space-x-2">
                <button className="flex-1 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">Accept Suggestion</button>
                <button className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Manual Override</button>
            </div>
            </>
        ) : (
            <DailyAnalysisView cases={cases} />
        )}
    </aside>
  );
};