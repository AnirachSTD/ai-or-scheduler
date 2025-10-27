
import { GoogleGenAI, Chat, Type } from "@google/genai";
import type { Case } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_key environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chat: Chat | null = null;

export const startChat = () => {
  chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are a helpful assistant for an Operating Room scheduler. Your name is OrchestrateAI. 
      You will be given the current day's OR schedule as JSON context with each prompt. 
      Your primary role is to answer questions based *only* on this provided schedule data.
      - Be concise and professional.
      - When asked about a case, refer to it by the patientId (e.g., P001). 
      - **CRITICAL:** Do not, under any circumstances, invent, assume, or mention any confidential patient information like names, specific diagnoses, or medical history. You are an operational assistant, not a clinical one.
      - If asked a question you cannot answer from the schedule, state that the information is not available in the schedule.`,
    },
  });
};

export const sendMessage = (message: string, cases: Case[]) => {
  if (!chat) {
    startChat();
  }

  const scheduleContext = `
    Current OR Schedule:
    \`\`\`json
    ${JSON.stringify(cases, null, 2)}
    \`\`\`
  `;

  const fullMessage = `${scheduleContext}\n\nBased on the schedule above, please answer the user's question: "${message}"`;

  if (chat) {
    return chat.sendMessageStream({ message: fullMessage });
  }
  throw new Error("Chat not initialized");
};

export const getDailySummary = async (cases: Case[]): Promise<string> => {
  if (cases.length === 0) {
    return "The schedule is currently empty. Ready for new cases to be added.";
  }
  const model = 'gemini-2.5-flash';

  const caseSummary = cases.map(c => 
    `- Room ${c.room}: ${c.procedure} (${c.surgeon}) at ${c.startTime} for ${c.aiP50Minutes}min. Priority: ${c.priority}, Risk: ${c.risk}. Conflicts: ${c.conflicts.join(', ') || 'None'}`
  ).join('\n');

  const prompt = `
    As an expert OR scheduler analyst, review the following daily surgical schedule and provide a concise summary of the day's operations. 
    
    Today's Schedule:
    ${caseSummary}

    Your analysis should highlight:
    1.  **Overall Status:** A brief, high-level overview (e.g., "A busy day with several complex cases.").
    2.  **Potential Risks & Bottlenecks:** Identify specific areas of concern. Look for back-to-back long cases, tight turnovers, high-risk procedures, or potential resource conflicts mentioned. For example, mention if a room seems overloaded.
    3.  **Efficiency Opportunities:** Suggest any potential improvements if you see any obvious gaps or inefficiencies.

    Keep the summary professional, concise, and easy for an OR planner to read. Focus on actionable insights.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert AI assistant for Operating Room scheduling analysis. Your name is OrchestrateAI.',
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error generating daily summary:", error);
    return "An error occurred while analyzing the schedule. Please check the logs.";
  }
};


export const parseScheduleText = async (text: string): Promise<Case[]> => {
    const model = 'gemini-2.5-flash';

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING, description: "A unique identifier for the case, e.g., 'case-ISO_timestamp'." },
                procedure: { type: Type.STRING },
                surgeon: { type: Type.STRING },
                room: { type: Type.STRING },
                startTime: { type: Type.STRING, description: "Time in HH:mm format." },
                surgeonEstimateMinutes: { type: Type.NUMBER },
                aiP50Minutes: { type: Type.NUMBER, description: "Set this to be the same as surgeonEstimateMinutes." },
                aiP90Minutes: { type: Type.NUMBER, description: "Set this to be 1.2 times surgeonEstimateMinutes, rounded to the nearest integer." },
                turnoverMinutes: { type: Type.NUMBER, description: "A sensible default, e.g., 25 for simple cases, 40 for complex ones." },
                priority: { type: Type.STRING, description: "Must be one of: 'Elective', 'Urgent', 'Emergent'. Infer from context." },
                risk: { type: Type.STRING, description: "Infer a risk level: 'Low', 'Medium', or 'High'." },
                conflicts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List any potential conflicts mentioned." },
            },
            required: ["id", "procedure", "surgeon", "room", "startTime", "surgeonEstimateMinutes", "aiP50Minutes", "aiP90Minutes", "turnoverMinutes", "priority", "risk", "conflicts"]
        }
    };

    const prompt = `
        Parse the following raw text schedule into a structured JSON array of surgical cases. 
        Generate a unique ID for each case using 'case-' followed by a timestamp.
        Infer reasonable values for fields like turnover, risk, and priority if not explicitly mentioned.
        
        Raw Text:
        ---
        ${text}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
                systemInstruction: "You are an expert data extraction AI. Your task is to convert unstructured schedule information into a precise JSON format according to the provided schema. Do not omit any fields."
            }
        });

        const jsonText = response.text.trim();
        const parsedCases = JSON.parse(jsonText) as Omit<Case, 'patientId'>[];
        
        // Add patientId and ensure all fields are present
        return parsedCases.map((c, index) => ({
            ...c,
            patientId: `P${String(index + 1).padStart(3, '0')}`,
            conflicts: c.conflicts || [],
            id: `case-${Date.now()}-${index}` // Ensure unique ID
        }));

    } catch (error) {
        console.error("Error parsing schedule text with Gemini:", error);
        throw new Error("The AI failed to parse the schedule. Please check the format or try again.");
    }
};

export type CaseInput = Omit<Case, 'id' | 'aiP50Minutes' | 'aiP90Minutes' | 'turnoverMinutes' | 'priority' | 'risk'>;

export const enrichCaseDetails = async (caseInput: CaseInput): Promise<Case> => {
    const model = 'gemini-2.5-flash';

    const schema = {
        type: Type.OBJECT,
        properties: {
            aiP50Minutes: { type: Type.NUMBER, description: "AI's 50th percentile prediction for case duration in minutes. Should be reasonably close to the surgeon's estimate but adjusted for procedure complexity." },
            aiP90Minutes: { type: Type.NUMBER, description: "AI's 90th percentile prediction for case duration in minutes. Should be roughly 1.2-1.4x the P50 value." },
            turnoverMinutes: { type: Type.NUMBER, description: "Predicted turnover time in minutes following this case (e.g., 25 for simple, 40 for complex)." },
            priority: { type: Type.STRING, description: "Infer the priority from the procedure name. Must be one of: 'Elective', 'Urgent', 'Emergent'." },
            risk: { type: Type.STRING, description: "Predicted risk level based on procedure complexity. Must be one of: 'Low', 'Medium', or 'High'." },
            conflicts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List any potential resource or scheduling conflicts based on the procedure name (e.g., 'Requires specialized equipment')." },
        },
        required: ["aiP50Minutes", "aiP90Minutes", "turnoverMinutes", "priority", "risk", "conflicts"]
    };

    const prompt = `
        Given the following surgical case details, provide AI-driven predictions for the missing fields according to the schema.
        Procedure: ${caseInput.procedure}
        Surgeon: ${caseInput.surgeon}
        Surgeon's Estimated Time: ${caseInput.surgeonEstimateMinutes} minutes
        User-provided requirements/conflicts: ${caseInput.conflicts?.join(', ') || 'None'}
        
        Base your predictions on typical patterns for such a procedure. For example, a complex, long procedure like a 'Craniotomy' should have a 'High' risk, longer turnover, and the AI duration might be slightly different from the surgeon's estimate. An 'Appendectomy' is likely 'Emergent'. A 'Total Knee Arthroplasty' is 'Elective' and 'Medium' risk.

        Enrich the user-provided conflicts with any other typical requirements (e.g., 'Requires specialized equipment'). Return a complete list of all conflicts.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
                systemInstruction: "You are an expert OR scheduling AI. Your task is to enrich case data by predicting operational details based on the provided information. Adhere strictly to the JSON schema."
            }
        });

        const jsonText = response.text.trim();
        const aiData = JSON.parse(jsonText);

        // Merge user conflicts with AI conflicts, avoiding duplicates
        const allConflicts = [...new Set([...(caseInput.conflicts || []), ...aiData.conflicts])];

        return {
            ...caseInput,
            ...aiData,
            conflicts: allConflicts,
            id: `case-${Date.now()}-${Math.random()}`,
        };
    } catch (error) {
        console.error("Error enriching case details with Gemini:", error);
        throw new Error("The AI failed to generate case details. Please check the input or try again.");
    }
};


export const optimizeSchedule = async (cases: Case[]): Promise<Case[]> => {
    const model = 'gemini-2.5-flash';

    const caseSchema = {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING },
            patientId: { type: Type.STRING },
            procedure: { type: Type.STRING },
            surgeon: { type: Type.STRING },
            room: { type: Type.STRING },
            startTime: { type: Type.STRING, description: "The new, optimized start time in HH:mm format." },
            surgeonEstimateMinutes: { type: Type.NUMBER },
            aiP50Minutes: { type: Type.NUMBER },
            aiP90Minutes: { type: Type.NUMBER },
            turnoverMinutes: { type: Type.NUMBER },
            priority: { type: Type.STRING },
            risk: { type: Type.STRING },
            conflicts: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["id", "patientId", "procedure", "surgeon", "room", "startTime", "surgeonEstimateMinutes", "aiP50Minutes", "aiP90Minutes", "turnoverMinutes", "priority", "risk", "conflicts"]
    };

    const fullSchema = {
        type: Type.ARRAY,
        items: caseSchema
    };

    const prompt = `
        You are an expert OR scheduler AI. Your task is to optimize the following surgical schedule for a single day to improve efficiency.
        The goal is to minimize idle time (gaps) between cases.

        Instructions:
        1.  Re-sequence the cases within their assigned rooms to create the most compact schedule possible.
        2.  DO NOT change any case data (id, procedure, surgeon, room, durations, risk, etc.) except for the 'startTime'.
        3.  You MUST calculate and update the 'startTime' for each case based on the new sequence.
        4.  The first case in each room should start at or after 07:30.
        5.  For subsequent cases in a room, the 'startTime' should be the end time of the previous case plus the previous case's 'turnoverMinutes'. (EndTime = startTime + aiP50Minutes).
        6.  The final output must be a complete JSON array containing ALL of the original cases, sorted by their new start times, adhering strictly to the provided JSON schema.

        Current Unoptimized Schedule:
        ---
        ${JSON.stringify(cases, null, 2)}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: fullSchema,
                systemInstruction: "You are an expert data transformation AI. Your task is to re-sequence and re-calculate start times for a surgical schedule to optimize it, returning the full, valid JSON array of cases."
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as Case[];
    } catch (error) {
        console.error("Error optimizing schedule with Gemini:", error);
        throw new Error("The AI failed to optimize the schedule. Please try again.");
    }
};
