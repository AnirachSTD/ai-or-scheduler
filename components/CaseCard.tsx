import React, { useMemo } from 'react';
import type { Case } from '../types';

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

interface ConflictIcon {
    key: string;
    className: string;
    title: string;
}

const getConflictIcons = (conflicts: string[]): ConflictIcon[] => {
    const icons: ConflictIcon[] = [];
    const keywords = {
        pacu: { className: 'fas fa-bed-pulse text-red-500', title: 'PACU Capacity Concern' },
        special: { className: 'fas fa-cogs text-yellow-600', title: 'Special Resource Required' },
    };

    let hasPacu = false;
    let hasSpecial = false;

    if (!conflicts || conflicts.length === 0) return [];
    
    conflicts.forEach(conflict => {
        const lowerConflict = conflict.toLowerCase();
        if (!hasPacu && lowerConflict.includes('pacu')) {
            icons.push({ key: 'pacu', ...keywords.pacu, title: conflict });
            hasPacu = true;
        }
        if (!hasSpecial && (lowerConflict.includes('special') || lowerConflict.includes('mri') || lowerConflict.includes('perfusionist') || lowerConflict.includes('tech') || lowerConflict.includes('equipment'))) {
             icons.push({ key: 'special', ...keywords.special, title: conflict });
            hasSpecial = true;
        }
    });

    return icons;
};

interface CaseCardProps {
  caseData: Case;
  onSelect: (caseData: Case) => void;
  isSelected: boolean;
  scheduleStartMinutes: number;
  pixelsPerMinute: number;
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseData, onSelect, isSelected, scheduleStartMinutes, pixelsPerMinute }) => {
  const { procedure, surgeon, startTime, aiP50Minutes, turnoverMinutes, patientId, conflicts, priority, risk } = caseData;

  const startMinutes = timeToMinutes(startTime) - scheduleStartMinutes;
  const caseHeight = aiP50Minutes * pixelsPerMinute;
  const turnoverHeight = turnoverMinutes * pixelsPerMinute;
  const topPosition = startMinutes * pixelsPerMinute;

  const priorityColor = {
    'Elective': 'border-blue-500',
    'Urgent': 'border-yellow-500',
    'Emergent': 'border-red-500',
  };

  const specialStyling = useMemo(() => {
    if (priority === 'Emergent') {
        return {
            bgColor: 'bg-red-50 dark:bg-red-900/60',
            ring: 'ring-1 ring-red-500/75',
        };
    }
    if (risk === 'High') {
        return {
            bgColor: 'bg-yellow-50 dark:bg-yellow-900/50',
            ring: '',
        };
    }
    return {
        bgColor: 'bg-white dark:bg-gray-800',
        ring: '',
    };
  }, [priority, risk]);

  const conflictIcons = useMemo(() => getConflictIcons(conflicts), [conflicts]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('caseId', caseData.id);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
  };

  return (
    <div
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`absolute left-1 right-1 flex flex-col cursor-grab transition-all duration-200 group ${isSelected ? 'z-10' : 'z-0'}`}
      style={{ top: `${topPosition}px`, height: `${caseHeight + turnoverHeight}px` }}
      onClick={() => onSelect(caseData)}
    >
        <div className={`relative h-full w-full flex flex-col rounded-lg shadow-md group-hover:shadow-xl border-l-4 ${priorityColor[caseData.priority]} ${isSelected ? 'ring-2 ring-indigo-500' : specialStyling.ring}`}>
            <div 
                className={`${specialStyling.bgColor} p-2 flex-grow overflow-hidden rounded-t-lg relative`}
                style={{ height: `${caseHeight}px` }}
            >
                <p className="font-bold text-sm text-gray-800 dark:text-gray-100 leading-tight pr-8">{procedure}</p>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{patientId}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{surgeon}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{startTime} ({aiP50Minutes}m)</p>

                <div className="absolute top-2 right-2 flex flex-col space-y-2">
                     {risk === 'High' && !conflictIcons.some(icon => icon.key === 'pacu') && (
                        <i className="fas fa-triangle-exclamation text-base text-red-500" title="High Risk Case"></i>
                    )}
                    {conflictIcons.map(icon => (
                        <i key={icon.key} className={`${icon.className} text-base`} title={icon.title}></i>
                    ))}
                </div>
            </div>
            {turnoverMinutes > 0 && (
                <div 
                    className="flex-shrink-0 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 text-xs font-mono rounded-b-lg" 
                    style={{ height: `${turnoverHeight}px` }}
                >
                    {turnoverMinutes}m turnover
                </div>
            )}
        </div>
    </div>
  );
};
