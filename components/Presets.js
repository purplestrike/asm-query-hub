// FILE: components/Presets.js

import { useState, useEffect } from 'react';
import presetsData from '../examples/presets.json';
import { optimizePreset, restorePreset } from '../lib/storageUtils.js';

/**
 * Presets component for loading and managing query presets
 * Provides built-in presets and localStorage management
 */
export default function Presets({ onLoadPreset, onSavePreset }) {
  const [savedPresets, setSavedPresets] = useState([]);

  // Function to load saved presets from localStorage
  const loadSavedPresets = () => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('asm-query-presets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Restore presets from optimized format
        const restored = Array.isArray(parsed) 
          ? parsed.map(restorePreset)
          : [];
        setSavedPresets(restored);
      } catch (error) {
        console.error('Error loading saved presets:', error);
      }
    } else {
      setSavedPresets([]);
    }
  };

  // Load saved presets from localStorage on mount
  useEffect(() => {
    loadSavedPresets();
    
    // Listen for storage events (when preset is saved from another component)
    const handleStorageChange = (e) => {
      if (e.key === 'asm-query-presets') {
        loadSavedPresets();
      }
    };
    
    // Listen for custom event (when preset is saved from EngineTabs)
    const handlePresetSaved = () => {
      loadSavedPresets();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('presetSaved', handlePresetSaved);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('presetSaved', handlePresetSaved);
    };
  }, []);

  // Handle loading a preset
  const handleLoadPreset = (preset) => {
    onLoadPreset(preset.fields);
  };

  // Handle deleting a saved preset
  const handleDeletePreset = (presetId) => {
    const updatedPresets = savedPresets.filter(p => p.id !== presetId);
    setSavedPresets(updatedPresets);
    // Optimize presets before storing
    const optimized = updatedPresets.map(optimizePreset);
    localStorage.setItem('asm-query-presets', JSON.stringify(optimized));
  };

  return (
    <div className="space-y-6">
      {/* Built-in Presets */}
      <div>
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Built-in Presets
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presetsData.map(preset => (
            <div key={preset.id} className="border-2 border-blue-200 bg-blue-50/50 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
              <h4 className="font-medium text-gray-900 mb-1">{preset.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{preset.description}</p>
              <button
                onClick={() => handleLoadPreset(preset)}
                className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm rounded hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Load Preset
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Saved Presets */}
      <div>
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Saved Presets
          </h3>
        </div>
        {savedPresets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedPresets.map(preset => (
              <div key={preset.id} className="border-2 border-green-200 bg-green-50/50 rounded-lg p-4 hover:border-green-300 hover:bg-green-50 transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{preset.name}</h4>
                  <button
                    onClick={() => handleDeletePreset(preset.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Created: {new Date(preset.createdAt).toLocaleDateString()}
                </p>
                <button
                  onClick={() => handleLoadPreset(preset)}
                  className="px-3 py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm rounded hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Load Preset
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-green-200 bg-green-50/30 rounded-lg p-6 text-center">
            <p className="text-gray-700 mb-2 font-medium">No saved presets yet.</p>
            <p className="text-sm text-gray-600">
              Click "Save Preset" in the query results above to save your current query as a preset.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
