import React, { useState, useEffect, useRef } from 'react';
import type { Video } from '../types';
import { SparklesIcon, SendIcon } from './Icons';

interface AIChatPanelProps {
    video: Video;
    onClose: () => void;
}

interface Message {
    role: 'user' | 'model';
    text: string;
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({ video, onClose }) => {
    const [chat, setChat] = useState<any | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initializeChat = async () => {
            try {
                const { GoogleGenAI } = await import('@google/genai');

                // Safely access the API key to prevent ReferenceError if `process` is not defined.
                let API_KEY: string | undefined;
                if (typeof process !== 'undefined' && process.env) {
                    API_KEY = process.env.API_KEY;
                }

                if (!API_KEY) {
                    setError("API key is not configured. Please contact the administrator.");
                    return;
                }

                const ai = new GoogleGenAI({ apiKey: API_KEY });
                const newChat = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: `You are a patient and encouraging AI tutor named 'Vidya'. Your primary role is to help students in classes 8-10 understand educational videos. Your tone should be friendly, supportive, and motivating.

                        You are assisting with this specific video:
                        - Title: "${video.title}"
                        - Class: ${video.class}
                        - Subject: ${video.subject}
                        - Description: "${video.description}"

                        Your core instructions are:
                        1.  **Be Concise and Clear:** Provide short, easy-to-understand explanations. Break down complex topics into simple, digestible points.
                        2.  **Encourage Questions:** Always make the student feel comfortable asking for more help. After an explanation, ask things like, "Does that make sense?" or "Is there any part of that you'd like me to explain differently?".
                        3.  **Stay on Topic:** Gently guide the conversation back to the video's subject if the student asks an unrelated question. Avoid answering non-educational questions.
                        4.  **Start the Conversation:** Begin by introducing yourself as Vidya and ask a friendly, open-ended question about what the student found interesting or confusing in the video.`,
                    },
                });
                setChat(newChat);
            } catch (e) {
                console.error("Failed to initialize AI Chat:", e);
                setError("Could not initialize the AI Helper.");
            }
        };

        initializeChat();
    }, [video]);

    useEffect(() => {
        // Start the conversation with the model's initial message
        const startConversation = async () => {
            if (chat && messages.length === 0) {
                setIsLoading(true);
                try {
                    const response = await chat.sendMessageStream({ message: "Hello!" });
                    let text = '';
                    setMessages([{ role: 'model', text: '' }]);
                    for await (const chunk of response) {
                        text += chunk.text;
                        setMessages([{ role: 'model', text }]);
                    }
                } catch (e) {
                    console.error("AI chat failed:", e);
                    setError("The AI Helper isn't responding right now. Please try again later.");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        startConversation();
    }, [chat]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || !chat || isLoading) return;

        const newUserMessage: Message = { role: 'user', text: userInput };
        setMessages(prev => [...prev, newUserMessage, { role: 'model', text: '' }]);
        setUserInput('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await chat.sendMessageStream({ message: userInput });
            let text = '';
            for await (const chunk of response) {
                text += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', text };
                    return newMessages;
                });
            }
        } catch (e) {
            console.error("AI chat failed:", e);
            setError("The AI Helper isn't responding right now. Please try again later.");
            setMessages(prev => prev.slice(0, -2)); // Remove user message and empty model message
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="bg-white dark:bg-slate-800 h-full flex flex-col text-slate-800 dark:text-slate-200">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-blue-500" />
                        <h3 className="font-bold text-lg">AI Helper</h3>
                    </div>
                    <button onClick={onClose} aria-label="Close AI Helper" className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 truncate" title={video.title}>
                    Asking about: <strong>{video.title}</strong>
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-xl whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 dark:bg-slate-700 rounded-bl-none'}`}>
                            {msg.text}
                            {isLoading && msg.role === 'model' && index === messages.length -1 && (
                                <span className="inline-block w-1.5 h-1.5 bg-current rounded-full ml-1 animate-pulse"></span>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
                 {error && <div className="p-3 text-center text-red-500 text-sm bg-red-100 dark:bg-red-900/50 rounded-lg">{error}</div>}
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-slate-700">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={isLoading ? "AI is thinking..." : "Ask a question..."}
                        disabled={isLoading || !!error}
                        className="flex-1 w-full px-4 py-2 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition disabled:opacity-50"
                    />
                    <button type="submit" disabled={isLoading || !userInput.trim() || !!error} className="p-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition">
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIChatPanel;