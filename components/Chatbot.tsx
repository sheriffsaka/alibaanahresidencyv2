import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useTranslation } from '../hooks/useTranslation';
import { ChatMessage } from '../types';
import { IconChat, IconClose, IconSend } from './Icon';

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [ai, setAi] = useState<GoogleGenAI | null>(null);
    const t = useTranslation();
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // The API key is securely provided via environment variables.
        const apiKey = process.env.API_KEY; 
        if (apiKey) {
            setAi(new GoogleGenAI({ apiKey }));
        } else {
            console.warn("Chatbot disabled: API_KEY environment variable is not configured.");
        }
    }, []);

    // Initialize with a welcome message when the chatbot is opened for the first time
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{ role: 'model', text: t.chatbotWelcome }]);
        }
    }, [isOpen, messages.length, t]);
    
    // Auto-scroll to the latest message
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !ai) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const context = `
                Q: ${t.faqQ1} A: ${t.faqA1}
                Q: ${t.faqQ2} A: ${t.faqA2}
                Q: ${t.faqQ3} A: ${t.faqA3}
                Q: ${t.faqQ4} A: ${t.faqA4}
            `;

            const systemInstruction = `You are a friendly and helpful AI assistant for the Al-Ibaanah Student Residency. Your role is to answer questions from prospective students based ONLY on the information provided in the following Frequently Asked Questions context. Do not invent information. If a question is outside this scope, politely state that you can only answer questions about the residency's services, booking, and amenities. Keep your answers concise and helpful. Context: ${context}`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: input,
                config: { systemInstruction },
            });

            const modelMessage: ChatMessage = { role: 'model', text: response.text ?? "Sorry, I couldn't process that." };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Gemini API error:", error);
            const errorMessage: ChatMessage = { role: 'model', text: "Sorry, I'm having trouble connecting. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    // If the AI client isn't configured, don't render the chatbot at all.
    if (!ai) {
        return null;
    }
    
    return (
        <>
            <div className={`fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-40 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Open chat"
                >
                    <IconChat className="w-8 h-8" />
                </button>
            </div>
            
            <div className={`fixed bottom-0 right-0 sm:bottom-8 sm:right-8 w-full h-full sm:w-96 sm:h-[550px] z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col transition-all duration-300 ease-in-out origin-bottom-right ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.chatbotTitle}</h3>
                    <button onClick={() => setIsOpen(false)} className="p-2 rounded-full text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500" aria-label="Close chat">
                        <IconClose className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Messages */}
                <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                                <p className="text-sm">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-end gap-2 justify-start">
                            <div className="max-w-xs md:max-w-sm px-4 py-2 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none">
                                <div className="flex items-center space-x-1">
                                    <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Input Form */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={t.chatbotPlaceholder}
                            className="flex-1 block w-full px-4 py-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-600 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !input.trim()} className="p-3 bg-blue-600 text-white rounded-full disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            <IconSend className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Chatbot;