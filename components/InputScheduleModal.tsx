import React, { useState, useEffect } from 'react';
import type { CaseInput } from '../services/geminiService';
import { surgeons, rooms } from '../data/mockData';

interface InputScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCase: (caseData: CaseInput) => Promise<void>;
}

const initialFormData: CaseInput = {
    patientId: '',
    procedure: '',
    surgeon: surgeons[0]?.name || '',
    room: rooms[0]?.name || '',
    startTime: '07:30',
    surgeonEstimateMinutes: 90,
    conflicts: [],
};

export const InputScheduleModal: React.FC<InputScheduleModalProps> = ({ isOpen, onClose, onAddCase }) => {
  const [formData, setFormData] = useState<CaseInput>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
        // Reset form when modal opens
        setFormData(initialFormData);
        setError(null);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: name === 'surgeonEstimateMinutes' ? parseInt(value, 10) : value,
    }));
  };

  const handleConflictsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    // Split by comma and trim whitespace
    const conflicts = value.split(',').map(c => c.trim()).filter(Boolean);
    setFormData(prev => ({
        ...prev,
        conflicts,
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await onAddCase(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 sm:p-8 border border-gray-200 dark:border-gray-700 transform transition-all animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Add New Case</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-3xl leading-none">&times;</button>
        </div>
        
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient ID</label>
                    <input type="text" name="patientId" id="patientId" value={formData.patientId} onChange={handleChange} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., P009" />
                </div>
                <div>
                    <label htmlFor="procedure" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Procedure</label>
                    <input type="text" name="procedure" id="procedure" value={formData.procedure} onChange={handleChange} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., Hernia Repair" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="surgeon" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Surgeon</label>
                    <select name="surgeon" id="surgeon" value={formData.surgeon} onChange={handleChange} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        {surgeons.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="room" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room</label>
                    <select name="room" id="room" value={formData.room} onChange={handleChange} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        {rooms.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                    <input type="time" name="startTime" id="startTime" value={formData.startTime} onChange={handleChange} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="surgeonEstimateMinutes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Est. Duration (mins)</label>
                    <input type="number" name="surgeonEstimateMinutes" id="surgeonEstimateMinutes" value={formData.surgeonEstimateMinutes} onChange={handleChange} className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
            </div>

             <div>
                <label htmlFor="conflicts" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conflicts / Requirements (comma-separated)</label>
                <textarea 
                    name="conflicts" 
                    id="conflicts" 
                    rows={2}
                    value={formData.conflicts.join(', ')} 
                    onChange={handleConflictsChange}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="e.g., PACU capacity tight, Requires specialized equipment" 
                />
            </div>
        </div>

        {error && (
            <div className="mt-4 text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">
                <strong>Error:</strong> {error}
            </div>
        )}

        <div className="mt-8 flex justify-end space-x-3">
          <button
            onClick={onClose}
            type="button"
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2 px-5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            type="submit"
            disabled={isLoading || !formData.procedure || !formData.patientId}
            className="bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            ) : (
             'Add Case with AI'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};