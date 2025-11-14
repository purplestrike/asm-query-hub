// FILE: components/EngineTabs.js

import { useState } from 'react';
import Image from 'next/image';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { getSearchUrl } from '../lib/searchUrls.js';

/**
 * Tabbed interface for displaying engine results
 * Shows syntax-highlighted queries with copy functionality
 */
export default function EngineTabs({ results, onSavePreset }) {
  const [activeTab, setActiveTab] = useState(Object.keys(results)[0] || '');

  // Get platform icon and colors
  const getPlatformIcon = (engineId) => {
    const icons = {
      shodan: {
        icon: (
          <Image 
            src="/shodan-logo.png" 
            alt="Shodan" 
            width={20} 
            height={20} 
            className="object-contain"
          />
        ),
        gradient: 'from-orange-500 to-red-600',
        borderColor: 'border-orange-500',
        useImage: true
      },
      censys: {
        icon: (
          <Image 
            src="/censys-logo.png" 
            alt="Censys" 
            width={20} 
            height={20} 
            className="object-contain"
          />
        ),
        gradient: 'from-blue-500 to-cyan-600',
        borderColor: 'border-blue-500',
        useImage: true
      },
      fofa: {
        icon: (
          <Image 
            src="/fofa-logo.png" 
            alt="FOFA" 
            width={20} 
            height={20} 
            className="object-contain"
          />
        ),
        gradient: 'from-green-500 to-emerald-600',
        borderColor: 'border-green-500',
        useImage: true
      }
    };
    return icons[engineId] || { icon: null, gradient: 'from-gray-500 to-gray-600', borderColor: 'border-gray-500', useImage: false };
  };

  if (!results || Object.keys(results).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No conversion results to display
      </div>
    );
  }

  const engines = Object.keys(results);

  return (
    <div className="w-full">
      {/* Enhanced Tab Navigation */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-2 mb-6">
        <nav className="flex space-x-2 overflow-x-auto">
          {engines.map(engineId => {
            const platform = getPlatformIcon(engineId);
            return (
              <button
                key={engineId}
                onClick={() => setActiveTab(engineId)}
                className={`group relative flex items-center px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                  activeTab === engineId
                    ? `bg-white shadow-md border-2 ${platform.borderColor}`
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center mr-2 transition-all duration-200 ${
                  activeTab === engineId 
                    ? platform.useImage ? 'bg-white p-0.5' : `bg-gradient-to-r ${platform.gradient} text-white`
                    : `bg-gray-300 group-hover:bg-gray-400 ${platform.useImage ? '' : 'text-white'}`
                }`}>
                  {platform.useImage ? (
                    <Image 
                      src={engineId === 'shodan' ? "/shodan-logo.png" : engineId === 'censys' ? "/censys-logo.png" : engineId === 'fofa' ? "/fofa-logo.png" : ""}
                      alt={engineId.charAt(0).toUpperCase() + engineId.slice(1)} 
                      width={20} 
                      height={20} 
                      className="object-contain"
                    />
                  ) : (
                    platform.icon
                  )}
                </div>
                {engineId.charAt(0).toUpperCase() + engineId.slice(1)}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {engines.map(engineId => {
          const result = results[engineId];
          const isActive = activeTab === engineId;

          if (!isActive) return null;

          return (
            <div key={engineId} className="space-y-6 animate-fadeIn">
              {/* Query Display */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {(() => {
                      const platform = getPlatformIcon(engineId);
                      return (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 shadow-md ${
                          platform.useImage 
                            ? 'bg-white p-1' 
                            : `bg-gradient-to-r ${platform.gradient}`
                        }`}>
                          {platform.useImage ? (
                            <Image 
                              src={engineId === 'shodan' ? "/shodan-logo.png" : engineId === 'censys' ? "/censys-logo.png" : engineId === 'fofa' ? "/fofa-logo.png" : ""}
                              alt={engineId.charAt(0).toUpperCase() + engineId.slice(1)} 
                              width={32} 
                              height={32} 
                              className="object-contain"
                            />
                          ) : (
                            <div className="text-white">
                              {platform.icon}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <h3 className="text-xl font-bold text-gray-900">
                      {engineId.charAt(0).toUpperCase() + engineId.slice(1)} Query
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => navigator.clipboard.writeText(result.query)}
                      className="group flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Query
                    </button>
                    <button
                      onClick={() => {
                        try {
                          const searchUrl = getSearchUrl(engineId, result.query);
                          if (searchUrl) {
                            window.open(searchUrl, '_blank', 'noopener,noreferrer');
                          } else {
                            alert('Unable to generate search URL for this platform.');
                          }
                        } catch (error) {
                          console.error('Error generating search URL:', error);
                          alert('Unable to generate search URL for this platform.');
                        }
                      }}
                      className="group flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm rounded-lg hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Search in {engineId.charAt(0).toUpperCase() + engineId.slice(1)}
                    </button>
                    <button
                      onClick={() => onSavePreset && onSavePreset(engineId, result)}
                      className="group flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      Save Preset
                    </button>
                  </div>
                </div>

                {/* Syntax Highlighted Query */}
                <div className="bg-gray-900 rounded-lg overflow-hidden">
                  {result.query ? (
                    <SyntaxHighlighter
                      language="text"
                      style={tomorrow}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      {result.query}
                    </SyntaxHighlighter>
                  ) : (
                    <div className="p-4 text-gray-300">
                      No query generated
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {result.notes && result.notes.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Notes:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {result.notes.map((note, index) => (
                      <li key={index}>• {note}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Fallback Query */}
              {result.fallback && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Fallback Query:</h4>
                  <div className="bg-gray-900 rounded p-2">
                    <code className="text-sm text-gray-100 break-all">
                      {result.fallback}
                    </code>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}
