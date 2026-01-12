import React, { useState } from 'react';
import { MessageCircle, Sparkles, Wand2, Bot } from 'lucide-react';
import AIChat from '../components/AI/AIChat';
import ServiceRecommendation from '../components/AI/ServiceRecommendation';
import ServiceDescriptionGenerator from '../components/AI/ServiceDescriptionGenerator';

const AIPage = () => {
    const [activeTab, setActiveTab] = useState('chat');

    const tabs = [
        {
            id: 'chat',
            name: 'AI Chat',
            icon: MessageCircle,
            component: AIChat,
            description: 'Chat with our AI assistant'
        },
        {
            id: 'recommendations',
            name: 'Service Recommendations',
            icon: Sparkles,
            component: ServiceRecommendation,
            description: 'Get personalized service recommendations'
        },
        {
            id: 'description',
            name: 'Description Generator',
            icon: Wand2,
            component: ServiceDescriptionGenerator,
            description: 'Create compelling service descriptions'
        }
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3 py-6">
                        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">AI Services</h1>
                            <p className="text-gray-600">Powered by Google AI Technology</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {tab.name}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Tab Description */}
            <div className="bg-blue-50 border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <p className="text-sm text-blue-800">
                        {tabs.find(tab => tab.id === activeTab)?.description}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="h-full">
                    {ActiveComponent && <ActiveComponent />}
                </div>
            </div>
        </div>
    );
};

export default AIPage;
