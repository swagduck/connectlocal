import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import aiService from '../../services/aiService';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const AIChat = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!inputMessage.trim()) return;

        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);
        setIsTyping(true);

        try {
            const conversationHistory = messages.map(msg => ({
                role: msg.role,
                message: msg.content
            }));

            const response = await aiService.chatWithAI(inputMessage, conversationHistory);

            if (response.success) {
                const aiMessage = {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: response.data.response,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, aiMessage]);
            } else {
                toast.error('Failed to get AI response');
            }
        } catch (error) {
            console.error('Chat error:', error);
            toast.error(error.message || 'Failed to send message');
        } finally {
            setIsLoading(false);
            setIsTyping(false);
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full">
                    <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                    <p className="text-sm text-gray-600">Ask me anything about services</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center py-8">
                        <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">
                            Welcome to AI Assistant
                        </h4>
                        <p className="text-gray-600 max-w-md mx-auto">
                            I'm here to help you with service recommendations, descriptions, and any questions about our platform.
                        </p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                                }`}
                        >
                            {message.role === 'assistant' && (
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full flex-shrink-0">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                            )}

                            <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 ${message.role === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                    }`}
                            >
                                {message.role === 'assistant' ? (
                                    <div className="prose prose-sm max-w-none">
                                        <ReactMarkdown
                                            components={{
                                                p: ({ node, children, ...props }) => {
                                                    const text = children?.toString() || '';

                                                    // Check if this is a service card
                                                    if (text.includes('📂') && text.includes('💰') && text.includes('⭐')) {
                                                        return (
                                                            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition-shadow">
                                                                {children}
                                                            </div>
                                                        );
                                                    }

                                                    return <p className="mb-3" {...props}>{children}</p>;
                                                },
                                                strong: ({ node, children, ...props }) => {
                                                    const text = children?.toString() || '';

                                                    // Check if this is a service title link
                                                    if (text.includes('**[') && text.includes('](/services/')) {
                                                        return (
                                                            <a
                                                                href={text.match(/\[([^\]]+)\]\(([^)]+)\)/)?.[2] || '#'}
                                                                className="text-lg font-bold text-blue-600 hover:text-blue-800 hover:underline block mb-3"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    const href = text.match(/\[([^\]]+)\]\(([^)]+)\)/)?.[2];
                                                                    if (href) window.location.href = href;
                                                                }}
                                                            >
                                                                {text.replace(/\[([^\]]+)\]\([^)]+\)/, '$1')}
                                                            </a>
                                                        );
                                                    }

                                                    return <strong className="font-semibold" {...props}>{children}</strong>;
                                                },
                                                a: ({ node, children, ...props }) => (
                                                    <a
                                                        href={props.href}
                                                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (props.href) window.location.href = props.href;
                                                        }}
                                                        {...props}
                                                    />
                                                ),
                                                hr: ({ node, ...props }) => (
                                                    <hr className="border-gray-200 my-4" {...props} />
                                                )
                                            }}
                                        >
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                )}
                                <p
                                    className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                                        }`}
                                >
                                    {formatTime(message.timestamp)}
                                </p>
                            </div>

                            {message.role === 'user' && (
                                <div className="flex items-center justify-center w-8 h-8 bg-gray-500 rounded-full flex-shrink-0">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                            )}
                        </div>
                    ))
                )}

                {isTyping && (
                    <div className="flex gap-3 justify-start">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full flex-shrink-0">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="bg-gray-100 rounded-lg px-4 py-2">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !inputMessage.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AIChat;
