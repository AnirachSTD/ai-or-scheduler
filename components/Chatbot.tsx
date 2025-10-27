
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessage, startChat } from '../services/geminiService';
import type { GenerateContentResponse } from '@google/genai';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    startChat();
    setMessages([
      {
        sender: 'bot',
        text: "Hello! I'm OrchestrateAI. How can I assist you with the OR schedule today?",
      },
    ]);
  }, []);

  const handleSend = useCallback(async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const stream = await sendMessage(input);
      let botResponse = '';
      setMessages((prev) => [...prev, { sender: 'bot', text: '' }]);

      for await (const chunk of stream) {
        const chunkText = (chunk as GenerateContentResponse).text;
        botResponse += chunkText;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = botResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  return (
    <>
      <div
        className={`fixed bottom-5 right-5 z-50 transition-all duration-300 ease-in-out ${
          isOpen ? 'w-96 h-[32rem] opacity-100' : 'w-16 h-16 opacity-100'
        }`}
      >
        <div className="relative w-full h-full">
          {/* Chat Window */}
          <div
            className={`absolute bottom-0 right-0 w-full h-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col transition-opacity duration-300 ${
              isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-between p-4 bg-blue-600 text-white rounded-t-2xl">
              <h3 className="text-lg font-bold">OrchestrateAI Assistant</h3>
              <button onClick={() => setIsOpen(false)} className="text-2xl">&times;</button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex flex-col space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex items-end ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && messages[messages.length-1]?.sender === 'user' && (
                  <div className="flex justify-start">
                    <div className="px-4 py-2 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none">
                      <div className="flex items-center space-x-1">
                        <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask a question..."
                  className="w-full bg-transparent p-3 focus:outline-none text-gray-800 dark:text-gray-200"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  className="p-3 text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                  disabled={isLoading}
                >
                    <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>

          {/* FAB */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`absolute bottom-0 right-0 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl transition-all duration-300 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 ${isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}
          >
            <i className="far fa-comments"></i>
          </button>
        </div>
      </div>
    </>
  );
};
