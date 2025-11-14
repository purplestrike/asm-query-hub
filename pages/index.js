// FILE: pages/index.js

import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import FieldsForm from '../components/FieldsForm';
import EngineTabs from '../components/EngineTabs';
import Presets from '../components/Presets';
import ShareLink from '../components/ShareLink';
import { getSupportedEngines } from '../lib/converterIndex.js';
import { optimizePreset, restorePreset } from '../lib/storageUtils.js';

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const fieldsFormRef = useRef(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  const [conversionResults, setConversionResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentFields, setCurrentFields] = useState({});
  const [selectedEngines, setSelectedEngines] = useState(['shodan', 'censys', 'fofa']);
  const [supportedEngines, setSupportedEngines] = useState([]);

  // Get supported engines on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const engines = getSupportedEngines();
        setSupportedEngines(engines);
      } catch (err) {
        console.error('Error loading supported engines:', err);
        setError('Failed to load supported engines');
      }
    }
  }, []);

  // Handle form submission
  const handleConvert = async (fields) => {
    setIsLoading(true);
    setError(null);
    setConversionResults(null);
    
    try {
      // Validate fields before sending
      if (!fields || typeof fields !== 'object') {
        throw new Error('Invalid fields object');
      }
      
      // Ensure we have at least one field
      const fieldKeys = Object.keys(fields).filter(key => {
        const value = fields[key];
        return value !== null && value !== undefined && value !== '';
      });
      
      if (fieldKeys.length === 0) {
        throw new Error('No valid fields to convert');
      }
      
      setCurrentFields(fields);

      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields,
          engines: selectedEngines
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const results = await response.json();
      console.log('Conversion results:', results);
      setConversionResults(results);
    } catch (err) {
      console.error('Conversion error:', err);
      setError(err.message || 'An error occurred during conversion');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle loading preset fields
  const handleLoadPreset = (fields) => {
    try {
      // Ensure fields object is valid
      if (!fields || typeof fields !== 'object') {
        setError('Invalid preset fields');
        return;
      }
      
      setCurrentFields(fields);
      // Update the form with preset fields
      if (fieldsFormRef.current) {
        fieldsFormRef.current.loadFields(fields);
      }
      // Trigger conversion immediately with preset fields
      handleConvert(fields);
    } catch (err) {
      console.error('Error loading preset:', err);
      setError(`Failed to load preset: ${err.message}`);
    }
  };

  // Handle saving preset
  // Can be called in two ways:
  // 1. From Presets component: handleSavePreset(callback) where callback is a function
  // 2. From EngineTabs component: handleSavePreset(engineId, result) where engineId is string and result is object
  const handleSavePreset = (arg1, arg2) => {
    // Check if first argument is a function (callback from Presets)
    if (typeof arg1 === 'function') {
      // Called from Presets component - pass currentFields to the callback
      if (currentFields && Object.keys(currentFields).length > 0) {
        arg1(currentFields);
      } else {
        alert('No fields to save. Please fill in at least one field before saving.');
      }
    } else if (typeof arg1 === 'string' && arg2) {
      // Called from EngineTabs component - save directly to localStorage
      if (currentFields && Object.keys(currentFields).length > 0) {
        try {
          const presetName = prompt('Enter a name for this preset:');
          if (presetName && presetName.trim()) {
            // Load existing presets and restore from optimized format
            const saved = localStorage.getItem('asm-query-presets');
            const parsed = saved ? JSON.parse(saved) : [];
            const savedPresets = Array.isArray(parsed) 
              ? parsed.map(restorePreset)
              : [];
            
            // Create new preset
            const newPreset = {
              id: Date.now().toString(),
              name: presetName.trim(),
              fields: currentFields,
              createdAt: new Date().toISOString()
            };
            
            // Save to localStorage (optimize before storing)
            const updatedPresets = [...savedPresets, newPreset];
            const optimized = updatedPresets.map(optimizePreset);
            localStorage.setItem('asm-query-presets', JSON.stringify(optimized));
            
            // Dispatch custom event to notify Presets component to refresh
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('presetSaved'));
            }
            
            alert(`Preset "${presetName.trim()}" saved successfully! You can find it in the Presets section below.`);
          }
        } catch (error) {
          console.error('Error saving preset:', error);
          alert('Failed to save preset. Please try again.');
        }
      } else {
        alert('No fields to save. Please fill in at least one field before saving.');
      }
    }
  };


  // Handle engine selection
  const handleEngineToggle = (engineId) => {
    setSelectedEngines(prev => {
      if (prev.includes(engineId)) {
        return prev.filter(id => id !== engineId);
      } else {
        return [...prev, engineId];
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Floating Logo - Top Left Corner */}
        <div className="fixed left-0 top-0 z-10">
          <div className="relative">
            <Image 
              src="/logo.png" 
              alt="ASM Query Hub Logo" 
              width={180} 
              height={180}
              priority
              unoptimized
              className="drop-shadow-2xl hover:drop-shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all duration-300 hover:scale-105"
            />
          </div>
        </div>

        {/* Header with Title and Theme Toggle */}
        <div className="flex items-center justify-center mb-4 relative">
          <div className="flex-1 flex justify-center">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400 mb-4">
                ASM Query Hub
              </h1>
              
              {/* Description and Badges - Just Below Title */}
              <div className="flex flex-col items-center justify-center text-center">
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-4">
                  Convert form inputs to hunt queries for multiple Attack Surface Management platforms
                </p>
                <div className="flex flex-wrap justify-center items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">3 ASM Platforms</span>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">No API Keys Required</span>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium">Local Processing</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 flex-shrink-0">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Results Section - At the Top */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Conversion Results
                </h2>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                <ShareLink fields={currentFields} onLoadFields={(fields) => {
                  setCurrentFields(fields);
                  if (fieldsFormRef.current) {
                    fieldsFormRef.current.loadFields(fields);
                  }
                  handleConvert(fields);
                }} />
                {(conversionResults || Object.keys(currentFields).length > 0) && (
                  <button
                    onClick={() => {
                      // Clear all fields in the form
                      if (fieldsFormRef.current) {
                        fieldsFormRef.current.clearFields();
                      }
                      // Clear current fields
                      setCurrentFields({});
                      // Clear conversion results
                      setConversionResults(null);
                      // Clear error
                      setError(null);
                      // Reset selected engines to default
                      setSelectedEngines(['shodan', 'censys', 'fofa']);
                      // Clear URL parameters
                      const url = new URL(window.location);
                      url.searchParams.delete('s');
                      window.history.replaceState({}, '', url);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors flex items-center gap-2"
                    title="Clear all filters and results"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear
                  </button>
                )}
              </div>
            </div>
            
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                  </div>
                  <span className="mt-4 text-lg text-gray-600 font-medium">Converting queries...</span>
                  <p className="mt-2 text-sm text-gray-500">This may take a moment</p>
              </div>
            )}

            {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-800">Conversion Error</h3>
                      <p className="text-red-700 mt-1">{error}</p>
                    </div>
                </div>
              </div>
            )}

            {conversionResults && (
              <EngineTabs 
                results={conversionResults} 
                onSavePreset={handleSavePreset}
              />
            )}

            {!isLoading && !error && !conversionResults && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Ready to Convert</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Select fields and click "Convert to Queries" to see results for all your selected ASM platforms
                  </p>
                </div>
              )}
          </div>

          {/* Top Row: Query Builder and Engine Selection */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Query Builder - Takes 2/3 width on large screens */}
            <div className="xl:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Build Your Query
                  </h2>
                </div>
                <FieldsForm ref={fieldsFormRef} onSubmit={handleConvert} isLoading={isLoading} initialFields={currentFields} />
              </div>
            </div>

            {/* Engine Selection - Takes 1/3 width on large screens */}
            <div className="xl:col-span-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Select ASM Engines
                  </h2>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Choose which ASM platforms to generate queries for:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {supportedEngines && supportedEngines.length > 0 ? supportedEngines.map(engine => (
                      <label key={engine.id} className={`group relative flex items-center p-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        selectedEngines.includes(engine.id) 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}>
                        <input
                          type="checkbox"
                          checked={selectedEngines.includes(engine.id)}
                          onChange={() => handleEngineToggle(engine.id)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center mr-2 transition-all duration-200 ${
                          selectedEngines.includes(engine.id)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300 group-hover:border-gray-400'
                        }`}>
                          {selectedEngines.includes(engine.id) && (
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {engine.displayName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {engine.id}
                          </div>
                        </div>
                      </label>
                    )) : (
                      <div className="text-sm text-gray-500 p-4">Loading engines...</div>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-xs font-medium text-gray-700">
                      {selectedEngines.length} of {supportedEngines?.length || 0} selected
                    </span>
                    <div className="space-x-2">
                      <button
                        onClick={() => setSelectedEngines(supportedEngines?.map(e => e.id) || [])}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEngines([]);
                          if (fieldsFormRef.current) {
                            fieldsFormRef.current.clearFields();
                          }
                        }}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 transition-colors font-medium"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Presets Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Presets
              </h2>
            </div>
            <Presets onLoadPreset={handleLoadPreset} onSavePreset={handleSavePreset} />
          </div>


          {/* Static Tables - Full Width for Better Display */}
          <div className="space-y-8">
            {/* Table 1: Quick Recommendations by Category - Table Format */}
            <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Recommendations by Category</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600/80 text-sm bg-white dark:bg-gray-800/50">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/80">
                      <th className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Category</th>
                      <th className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Description</th>
                      <th className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Lead Platform</th>
                      <th className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Secondary Platform</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:bg-gray-800/30 transition-colors">
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-700 dark:text-gray-200 font-medium">Exposure Discovery</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-600 dark:text-gray-300">Ports, banners</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-blue-700 dark:text-blue-400 font-medium">Shodan / FOFA</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-600 dark:text-gray-300">Censys</td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-gray-700/60 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-700 dark:text-gray-200 font-medium">Certificate & TLS</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-600 dark:text-gray-300">TLS Telemetry</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-green-700 dark:text-green-400 font-medium">Censys</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-600 dark:text-gray-300">Shodan</td>
                    </tr>
                    <tr className="hover:bg-purple-50 dark:hover:bg-purple-900/30 dark:bg-gray-800/30 transition-colors">
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-700 dark:text-gray-200 font-medium">DNS / WHOIS</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-600 dark:text-gray-300">Enrichment</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-purple-700 dark:text-purple-400 font-medium">Censys</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-600 dark:text-gray-300">Shodan</td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-gray-700/60 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors">
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-700 dark:text-gray-200 font-medium">Vulnerability Triage</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-600 dark:text-gray-300">CVE detection</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-orange-700 dark:text-orange-400 font-medium">Shodan</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-600 dark:text-gray-300">Censys</td>
                    </tr>
                    <tr className="hover:bg-teal-50 dark:hover:bg-teal-900/30 dark:bg-gray-800/30 transition-colors">
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-700 dark:text-gray-200 font-medium">Historical Context</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-600 dark:text-gray-300">Trends & analytics</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-teal-700 dark:text-teal-400 font-medium">Censys</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-600 dark:text-gray-300">Shodan</td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-gray-700/60 hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-colors">
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-700 dark:text-gray-200 font-medium">Brand Monitoring</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-600 dark:text-gray-300">Domain attribution</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-pink-700 dark:text-pink-400 font-medium">FOFA</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-600 dark:text-gray-300">Censys</td>
                    </tr>
                    <tr className="hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:bg-gray-800/30 transition-colors">
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-700 dark:text-gray-200 font-medium">Research & Analytics</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-600 dark:text-gray-300">Custom analytics</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-indigo-700 dark:text-indigo-400 font-medium">Censys / FOFA</td>
                      <td className="border border-gray-300 dark:border-gray-600/80 px-4 py-3 text-gray-600 dark:text-gray-300">Shodan</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        {/* Enhanced Footer */}
        <div className="mt-16 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Private</h3>
                <p className="text-gray-600 text-sm">No external API calls or data storage</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
                <p className="text-gray-600 text-sm">Local processing for instant results</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3 ASM Platforms</h3>
                <p className="text-gray-600 text-sm">Support for all major platforms</p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-6">
              <p className="text-gray-500 text-sm">
                Built with ❤️ for the security community • No API keys required • Open source
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
