
import { cases as mockCases, surgeons as mockSurgeons, rooms as mockRooms } from '../data/mockData';
import type { Case, Surgeon, Room } from '../types';

const CASES_KEY = 'orchestrate_ai_cases';
const SURGEONS_KEY = 'orchestrate_ai_surgeons';
const ROOMS_KEY = 'orchestrate_ai_rooms';

// Simulate async operations to mimic a real database
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const initDb = async (): Promise<void> => {
    await simulateDelay(100);
    if (!localStorage.getItem(CASES_KEY)) {
        localStorage.setItem(CASES_KEY, JSON.stringify(mockCases));
    }
    if (!localStorage.getItem(SURGEONS_KEY)) {
        localStorage.setItem(SURGEONS_KEY, JSON.stringify(mockSurgeons));
    }
    if (!localStorage.getItem(ROOMS_KEY)) {
        localStorage.setItem(ROOMS_KEY, JSON.stringify(mockRooms));
    }
};

export const getCases = async (): Promise<Case[]> => {
    await simulateDelay(150);
    const casesJson = localStorage.getItem(CASES_KEY);
    if (!casesJson) return [];
    return JSON.parse(casesJson);
};

export const getSurgeons = async (): Promise<Surgeon[]> => {
    const surgeonsJson = localStorage.getItem(SURGEONS_KEY);
    if (!surgeonsJson) return [];
    return JSON.parse(surgeonsJson);
};

export const getRooms = async (): Promise<Room[]> => {
    const roomsJson = localStorage.getItem(ROOMS_KEY);
    if (!roomsJson) return [];
    return JSON.parse(roomsJson);
};

export const addCase = async (newCase: Case): Promise<void> => {
    await simulateDelay(200);
    const currentCases = await getCases();
    const updatedCases = [...currentCases, newCase];
    localStorage.setItem(CASES_KEY, JSON.stringify(updatedCases));
};

export const updateCases = async (casesToUpdate: Case[]): Promise<void> => {
    await simulateDelay(100);
    localStorage.setItem(CASES_KEY, JSON.stringify(casesToUpdate));
};
