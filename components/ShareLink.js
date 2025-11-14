// FILE: components/ShareLink.js

import { useState, useEffect } from 'react';
import { encodeFields, decodeFields } from '../lib/storageUtils.js';

/**
 * ShareLink component for generating and handling shareable URLs
 * Encodes/decodes query parameters in base64 JSON format
 */
export default function ShareLink({ fields, onLoadFields }) {
  const [shareUrl, setShareUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Generate share URL when fields change
  useEffect(() => {
    if (fields && Object.keys(fields).length > 0) {
      try {
        const encoded = encodeFields(fields);
        const url = `${window.location.origin}${window.location.pathname}?s=${encoded}`;
        setShareUrl(url);
      } catch (error) {
        console.error('Error encoding fields:', error);
        setShareUrl('');
      }
    } else {
      setShareUrl('');
    }
  }, [fields]);

  // Load fields from URL on component mount (only once)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedFields = urlParams.get('s');
    
    if (encodedFields) {
      try {
        const decoded = decodeFields(encodedFields);
        onLoadFields(decoded);
      } catch (error) {
        console.error('Error decoding fields from URL:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Copy URL to clipboard
  const handleCopyUrl = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (error) {
        console.error('Error copying URL:', error);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    }
  };

  // Clear URL parameters
  const handleClearUrl = () => {
    const url = new URL(window.location);
    url.searchParams.delete('s');
    window.history.replaceState({}, '', url);
    setShareUrl('');
  };

  if (!shareUrl) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <input
        type="text"
        value={shareUrl}
        readOnly
        className="w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs font-mono"
      />
      <button
        onClick={handleCopyUrl}
        className={`px-3 py-2 rounded-md text-xs font-medium ${
          isCopied
            ? 'bg-green-600 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        {isCopied ? 'Copied!' : 'Copy URL'}
      </button>
      <button
        onClick={handleClearUrl}
        className="px-2 py-2 text-red-600 hover:text-red-800 text-xs"
        title="Clear URL"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
