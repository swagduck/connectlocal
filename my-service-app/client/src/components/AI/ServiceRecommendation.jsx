import React, { useState } from 'react';
import { MapPin, Search, Loader2, Sparkles, Clock, DollarSign, Star } from 'lucide-react';
import aiService from '../../services/aiService';
import toast from 'react-hot-toast';

const ServiceRecommendation = () => {
    const [serviceType, setServiceType] = useState('');
    const [location, setLocation] = useState('');
    const [preferences, setPreferences] = useState({
        budget: '',
        urgency: '',
        quality: ''
    });
    const [recommendations, setRecommendations] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const serviceTypes = [
        'Home Cleaning',
        'Plumbing',
        'Electrical',
        'Carpentry',
        'Painting',
        'Landscaping',
        'Moving',
        'Tutoring',
        'Personal Training',
        'Photography',
        'Web Development',
        'Graphic Design',
        'Consulting',
        'Other'
    ];

    const handleGetRecommendations = async (e) => {
        e.preventDefault();

        if (!serviceType || !location) {
            toast.error('Please fill in service type and location');
            return;
        }

        setIsLoading(true);

        try {
            const response = await aiService.getServiceRecommendations(
                serviceType,
                location,
                preferences
            );

            if (response.success) {
                setRecommendations(response.data.recommendations);
            } else {
                toast.error('Failed to get recommendations');
            }
        } catch (error) {
            console.error('Recommendation error:', error);
            toast.error(error.message || 'Failed to get recommendations');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setServiceType('');
        setLocation('');
        setPreferences({ budget: '', urgency: '', quality: '' });
        setRecommendations('');
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg">
                {/* Header */}
                <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 bg-purple-500 rounded-full">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">AI Service Recommendations</h2>
                            <p className="text-gray-600">Get personalized service recommendations powered by AI</p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {/* Form */}
                    <form onSubmit={handleGetRecommendations} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Service Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Service Type
                                </label>
                                <select
                                    value={serviceType}
                                    onChange={(e) => setServiceType(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select a service type</option>
                                    {serviceTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <MapPin className="w-4 h-4 inline mr-1" />
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g., New York, NY"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        {/* Preferences */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Preferences (Optional)</h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                {/* Budget */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <DollarSign className="w-4 h-4 inline mr-1" />
                                        Budget Range
                                    </label>
                                    <select
                                        value={preferences.budget}
                                        onChange={(e) => setPreferences(prev => ({ ...prev, budget: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="">No preference</option>
                                        <option value="low">Budget-friendly ($)</option>
                                        <option value="medium">Mid-range ($$)</option>
                                        <option value="high">Premium ($$$)</option>
                                    </select>
                                </div>

                                {/* Urgency */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        Urgency
                                    </label>
                                    <select
                                        value={preferences.urgency}
                                        onChange={(e) => setPreferences(prev => ({ ...prev, urgency: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="">No preference</option>
                                        <option value="immediate">Immediate (ASAP)</option>
                                        <option value="this-week">This week</option>
                                        <option value="this-month">This month</option>
                                        <option value="flexible">Flexible</option>
                                    </select>
                                </div>

                                {/* Quality */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Star className="w-4 h-4 inline mr-1" />
                                        Quality Priority
                                    </label>
                                    <select
                                        value={preferences.quality}
                                        onChange={(e) => setPreferences(prev => ({ ...prev, quality: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="">No preference</option>
                                        <option value="basic">Basic/Functional</option>
                                        <option value="good">Good Quality</option>
                                        <option value="premium">Premium/Best</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 bg-purple-500 text-white py-3 px-6 rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Getting Recommendations...
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        Get Recommendations
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </form>

                    {/* Recommendations */}
                    {recommendations && (
                        <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-500" />
                                AI Recommendations
                            </h3>
                            <div className="prose prose-purple max-w-none">
                                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                                    {recommendations}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServiceRecommendation;
