import React, { useMemo, useState } from 'react';
import type { Case } from '../types';
import { rooms } from '../data/mockData';
import { AISuggestionsPanel } from './AISuggestionsPanel';
import { CaseCard } from './CaseCard';
import { InputScheduleModal } from './InputScheduleModal';
import { enrichCaseDetails, optimizeSchedule, type CaseInput } from '../services/geminiService';
import * as db from '../services/databaseService';

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

interface ScheduleViewProps {
    cases: Case[];
    onDataChange: () => void;
    onCaseSelect: (c: Case | null) => void;
    selectedCase: Case | null;
    selectedDate: Date;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ cases, onDataChange, onCaseSelect, selectedCase, selectedDate }) => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [draggedOverRoom, setDraggedOverRoom] = useState<string | null>(null);


  const START_HOUR = 7;
  const END_HOUR = 18;
  const PIXELS_PER_MINUTE = 1.5;
  const totalMinutes = (END_HOUR - START_HOUR) * 60;
  const totalHeight = totalMinutes * PIXELS_PER_MINUTE;

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleAddCase = async (caseInput: CaseInput) => {
    try {
        const newCase = await enrichCaseDetails(caseInput);
        await db.addCase(newCase);
        onDataChange();
    } catch (error) {
        console.error("Failed to add case:", error);
        // Re-throw to be caught by the modal for UI feedback
        throw error;
    }
  };

  const handleOptimizeSchedule = async () => {
    setIsOptimizing(true);
    try {
      const optimizedCases = await optimizeSchedule(cases);
      await db.updateCases(optimizedCases);
      onDataChange();
    } catch (error) {
      console.error("Failed to optimize schedule:", error);
      // You could add a user-facing error message here
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, roomName: string) => {
    e.preventDefault();
    setDraggedOverRoom(null);
    const caseId = e.dataTransfer.getData('caseId');
    if (!caseId) return;
    
    const droppedCase = cases.find(c => c.id === caseId);
    if (!droppedCase) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const minutesFromScheduleStart = Math.round(offsetY / PIXELS_PER_MINUTE);
    const newStartTime = minutesToTime(START_HOUR * 60 + minutesFromScheduleStart);
    
    const updatedCase: Case = {
      ...droppedCase,
      room: roomName,
      startTime: newStartTime,
    };
    
    await db.updateCase(updatedCase);
    onDataChange();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, roomName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedOverRoom !== roomName) {
        setDraggedOverRoom(roomName);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedOverRoom(null);
  };


  const timeSlots = Array.from({ length: (END_HOUR - START_HOUR) * 2 + 1 }, (_, i) => {
      const minutes = i * 30;
      return { 
          time: minutesToTime(START_HOUR * 60 + minutes), 
          minutes,
          isHour: i % 2 === 0,
      };
  });

  const casesByRoom = useMemo(() => {
    const grouped: { [key: string]: Case[] } = {};
    for (const room of rooms) {
      grouped[room.name] = [];
    }
    for (const c of cases) {
      // Find a matching room name, even if it's a substring (e.g., "OR 1" matches "OR 1 (Gen)")
      const roomKey = Object.keys(grouped).find(r => c.room.startsWith(r.split(' ')[0] + ' ' + r.split(' ')[1]) || r.startsWith(c.room.split(' ')[0] + ' ' + c.room.split(' ')[1]));
      if (roomKey) {
        grouped[roomKey].push(c);
      } else if (grouped[c.room]) {
        grouped[c.room].push(c);
      }
    }
    return grouped;
  }, [cases]);

  return (
    <>
    <div className="flex h-full gap-4">
      <div className="flex-grow bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-lg flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">OR Schedule</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleOptimizeSchedule}
              disabled={isOptimizing || cases.length === 0}
              className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm hover:shadow-md disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed"
              aria-label="Optimize schedule with AI"
            >
              {isOptimizing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Optimizing...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-wand-magic-sparkles"></i>
                  <span>Optimize with AI</span>
                </>
              )}
            </button>
            <button 
              onClick={handleOpenModal}
              className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
              aria-label="Add a new case"
            >
              <i className="fas fa-plus"></i>
              <span>Add Case</span>
            </button>
          </div>
        </div>
        
        <div className="flex flex-col flex-grow">
            {/* Header */}
            <div className="flex border-b-2 border-gray-200 dark:border-gray-700 pb-2 text-sm font-semibold text-gray-500 dark:text-gray-400 flex-shrink-0">
                <div className="w-16 flex-shrink-0"></div> {/* Time Column Spacer */}
                <div className="grid grid-cols-4 flex-grow">
                    {rooms.map((room) => (
                    <div key={room.id} className="w-full text-center px-1">{room.name}</div>
                    ))}
                </div>
            </div>

            {/* Schedule Grid */}
            <div className="flex-grow relative overflow-y-auto">
                <div className="absolute top-0 left-0 w-full flex" style={{ height: `${totalHeight}px` }}>
                    {/* Time Column */}
                    <div className="w-16 flex-shrink-0 h-full relative">
                        {timeSlots.map(({time, minutes, isHour}) => (
                           isHour && (
                             <div key={time} className="absolute w-full" style={{ top: `${minutes * PIXELS_PER_MINUTE}px`, left: '0' }}>
                                <span className={`text-xs absolute -translate-y-1/2 right-2 font-semibold text-gray-500 dark:text-gray-400`}>{time}</span>
                            </div>
                           )
                        ))}
                    </div>
                    {/* Room Columns */}
                    <div className="flex-grow grid grid-cols-4 h-full">
                        {rooms.map((room) => (
                            <div 
                                key={room.id} 
                                className={`relative h-full border-l border-gray-200 dark:border-gray-700 transition-colors ${draggedOverRoom === room.name ? 'bg-blue-50 dark:bg-blue-900/40' : ''}`}
                                onDrop={(e) => handleDrop(e, room.name)}
                                onDragOver={(e) => handleDragOver(e, room.name)}
                                onDragLeave={handleDragLeave}
                            >
                                {/* Background lines */}
                                {timeSlots.map(({time, minutes, isHour}) => (
                                    <div key={time} className={`absolute w-full border-t ${isHour ? 'border-gray-200 dark:border-gray-700/50' : 'border-dashed border-gray-100 dark:border-gray-800'}`} style={{ top: `${minutes * PIXELS_PER_MINUTE}px` }}></div>
                                ))}
                                {/* Cases for this room */}
                                {(casesByRoom[room.name] || []).map(c => (
                                    <CaseCard 
                                        key={c.id} 
                                        caseData={c} 
                                        onSelect={onCaseSelect}
                                        isSelected={selectedCase?.id === c.id}
                                        scheduleStartMinutes={START_HOUR * 60}
                                        pixelsPerMinute={PIXELS_PER_MINUTE}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
      <AISuggestionsPanel selectedCase={selectedCase} onClose={() => onCaseSelect(null)} cases={cases} />
    </div>
    <InputScheduleModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddCase={handleAddCase}
    />
    </>
  );
};
