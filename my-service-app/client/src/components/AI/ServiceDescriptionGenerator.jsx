import React, { useState } from 'react';
import { FileText, Wand2, Loader2, Copy, Check } from 'lucide-react';
import aiService from '../../services/aiService';
import toast from 'react-hot-toast';

const ServiceDescriptionGenerator = () => {
    const [serviceName, setServiceName] = useState('');
    const [category, setCategory] = useState('');
    const [features, setFeatures] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const categories = [
        'Home Services',
        'Professional Services',
        'Creative Services',
        'Technical Services',
        'Educational Services',
        'Health & Wellness',
        'Business Services',
        'Personal Services',
        'Other'
    ];

    const handleGenerateDescription = async (e) => {
        e.preventDefault();

        if (!serviceName || !category) {
            toast.error('Please fill in service name and category');
            return;
        }

        setIsLoading(true);

        try {
            const featuresArray = features
                .split(',')
                .map(f => f.trim())
                .filter(f => f.length > 0);

            const response = await aiService.generateServiceDescription(
                serviceName,
                category,
                featuresArray
            );

            if (response.success) {
                setDescription(response.data.description);
            } else {
                toast.error('Failed to generate description');
            }
        } catch (error) {
            console.error('Description generation error:', error);
            toast.error(error.message || 'Failed to generate description');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(description);
            setCopied(true);
            toast.success('Description copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error('Failed to copy to clipboard');
        }
    };

    const handleReset = () => {
        setServiceName('');
        setCategory('');
        setFeatures('');
        setDescription('');
        setCopied(false);
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg">
                {/* Header */}
                <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-full">
                            <Wand2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">AI Description Generator</h2>
                            <p className="text-gray-600">Create compelling service descriptions with AI</p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {/* Form */}
                    <form onSubmit={handleGenerateDescription} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Service Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Service Name
                                </label>
                                <input
                                    type="text"
                                    value={serviceName}
                                    onChange={(e) => setServiceName(e.target.value)}
                                    placeholder="e.g., Premium Home Cleaning"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Features */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Key Features (Optional)
                            </label>
                            <textarea
                                value={features}
                                onChange={(e) => setFeatures(e.target.value)}
                                placeholder="Enter features separated by commas (e.g., Eco-friendly products, Insured professionals, 24/7 support)"
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Separate multiple features with commas
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating Description...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5" />
                                        Generate Description
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

                    {/* Generated Description */}
                    {description && (
                        <div className="mt-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-green-500" />
                                    Generated Description
                                </h3>
                                <button
                                    onClick={handleCopyToClipboard}
                                    className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 text-green-500" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                                <div className="prose prose-green max-w-none">
                                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                                        {description}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-4 flex gap-3">
                                <button
                                    onClick={handleCopyToClipboard}
                                    className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Copy className="w-4 h-4" />
                                    Use This Description
                                </button>
                                <button
                                    onClick={handleGenerateDescription}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Regenerate
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServiceDescriptionGenerator;
