// FILE: components/FieldsForm.js

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

/**
 * Dynamic fields form component
 * Renders form inputs based on selected field types
 * Emits normalized fields object on submit
 * Supports comma-separated multiple values
 */
const FieldsForm = forwardRef(function FieldsForm({ onSubmit, isLoading, initialFields }, ref) {
  const [selectedFields, setSelectedFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [originalFields, setOriginalFields] = useState({});

  // Helper function to convert field values to strings for form inputs
  const convertFieldsToStrings = (fields) => {
    const stringFields = {};
    Object.keys(fields).forEach(key => {
      const value = fields[key];
      // Handle null/undefined
      if (value === null || value === undefined) {
        return;
      }
      // Convert arrays to comma-separated strings
      if (Array.isArray(value)) {
        stringFields[key] = value.map(v => String(v)).join(', ');
      } 
      // Convert numbers to strings
      else if (typeof value === 'number') {
        stringFields[key] = String(value);
      }
      // Keep strings as is
      else {
        stringFields[key] = String(value);
      }
    });
    return stringFields;
  };

  // Update form when initialFields change (e.g., when preset is loaded)
  useEffect(() => {
    if (initialFields && Object.keys(initialFields).length > 0) {
      // Filter to only include fields that exist in fieldTypes, plus allow special internal fields
      const validFields = Object.keys(initialFields).filter(key => {
        const value = initialFields[key];
        // Allow null/undefined to be filtered out
        if (value === null || value === undefined) {
          return false;
        }
        // Allow fields that exist in fieldTypes OR are special internal fields (protocol, countryFull, fofaCountry)
        const isStandardField = fieldTypes.some(f => f.id === key);
        const isSpecialField = ['protocol', 'countryFull', 'fofaCountry'].includes(key);
        return isStandardField || isSpecialField;
      });
      
      if (validFields.length > 0) {
        // Store original fields to preserve types for special fields
        setOriginalFields(initialFields);
        // Only set selectedFields to standard fields that can be displayed
        const displayableFields = validFields.filter(key => fieldTypes.some(f => f.id === key));
        setSelectedFields(displayableFields);
        // Convert values to strings for form inputs (including special fields for internal use)
        const stringFields = convertFieldsToStrings(initialFields);
        setFieldValues(stringFields);
      }
    } else if (initialFields && Object.keys(initialFields).length === 0) {
      // Clear form if initialFields is empty
      setSelectedFields([]);
      setFieldValues({});
    }
  }, [initialFields]);

  // Expose clear function and loadFields function to parent
  useImperativeHandle(ref, () => ({
    clearFields: () => {
      setSelectedFields([]);
      setFieldValues({});
    },
    loadFields: (fields) => {
      // Filter out null/undefined values
      const fieldKeys = Object.keys(fields).filter(key => {
        const value = fields[key];
        if (value === null || value === undefined) {
          return false;
        }
        // Allow standard fields and special internal fields
        const isStandardField = fieldTypes.some(f => f.id === key);
        const isSpecialField = ['protocol', 'countryFull', 'fofaCountry'].includes(key);
        return isStandardField || isSpecialField;
      });
      
      if (fieldKeys.length > 0) {
        // Store original fields to preserve types for special fields
        setOriginalFields(fields);
        // Only set selectedFields to standard fields that can be displayed
        const displayableFields = fieldKeys.filter(key => fieldTypes.some(f => f.id === key));
        setSelectedFields(displayableFields);
        // Convert values to strings for form inputs (including special fields)
        const stringFields = convertFieldsToStrings(fields);
        setFieldValues(stringFields);
      } else {
        setSelectedFields([]);
        setFieldValues({});
        setOriginalFields({});
      }
    }
  }));

  // Available field types with their input configurations
  const fieldTypes = [
    { id: 'ip', label: 'IP Address', type: 'text', placeholder: '1.2.3.4' },
    { id: 'port', label: 'Port', type: 'text', placeholder: '80, 443, 8443' },
    { id: 'domain', label: 'Domain/Hostname', type: 'text', placeholder: 'example.com' },
    { id: 'country', label: 'Country', type: 'text', placeholder: 'US, DE, AE' },
    { id: 'org', label: 'Organization', type: 'text', placeholder: 'Cloudflare, Inc.' },
    { id: 'asn', label: 'ASN', type: 'text', placeholder: 'AS13335 or 13335' },
    { id: 'httpTitle', label: 'HTTP Title', type: 'text', placeholder: 'Welcome to nginx!' },
    { id: 'httpStatus', label: 'HTTP Status', type: 'text', placeholder: '200, 404, 500' },
    { id: 'serverHeader', label: 'Server Header', type: 'text', placeholder: 'nginx/1.18.0' },
    { id: 'product', label: 'Product/Service', type: 'text', placeholder: 'nginx, Apache' },
    { id: 'version', label: 'Version', type: 'text', placeholder: '1.18.0, 2.4.41' },
    { id: 'os', label: 'Operating System', type: 'text', placeholder: 'Linux, Windows' },
    { id: 'ssl', label: 'SSL Certificate', type: 'text', placeholder: '*.example.com' },
    { id: 'tlsSubject', label: 'SSL/TLS Certificate Subject', type: 'text', placeholder: 'CN=example.com, O=Organization' },
    { id: 'hostname', label: 'Hostname', type: 'text', placeholder: 'server.example.com' },
    { id: 'city', label: 'City', type: 'text', placeholder: 'New York, London' }
  ];

  // Handle field selection
  const handleFieldToggle = (fieldId) => {
    setSelectedFields(prev => {
      if (prev.includes(fieldId)) {
        // Remove field and its value
        const newValues = { ...fieldValues };
        delete newValues[fieldId];
        setFieldValues(newValues);
        return prev.filter(id => id !== fieldId);
      } else {
        return [...prev, fieldId];
      }
    });
  };

  // Handle field value changes
  const handleValueChange = (fieldId, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Handle port selection (multi-select)
  const handlePortToggle = (port) => {
    const currentValue = fieldValues.port || '';
    const ports = currentValue ? currentValue.split(',').map(p => p.trim()).filter(p => p) : [];
    
    if (ports.includes(String(port))) {
      // Remove port
      const newPorts = ports.filter(p => p !== String(port));
      setFieldValues(prev => ({
        ...prev,
        port: newPorts.join(', ')
      }));
    } else {
      // Add port
      const newPorts = [...ports, String(port)];
      setFieldValues(prev => ({
        ...prev,
        port: newPorts.join(', ')
      }));
    }
  };

  // Common ports for quick selection
  const commonPorts = [80, 443, 22, 21, 23, 25, 53, 110, 143, 993, 995, 3306, 3389, 5432, 8080, 8443, 9000];

  // Helper function to parse comma-separated values
  const parseCommaSeparated = (value, fieldId) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) return null;
    
    // If value is already an array (from preset), return it directly
    if (Array.isArray(value)) {
      return value;
    }
    
    // If value is already a number (from preset), return it directly
    if (typeof value === 'number') {
      return value;
    }
    
    // Convert to string and parse
    const strValue = String(value).trim();
    if (strValue === '') return null;
    
    // For port field, handle comma-separated numbers
    if (fieldId === 'port') {
      const ports = strValue.split(',').map(p => p.trim()).filter(p => p !== '');
      if (ports.length === 0) return null;
      if (ports.length === 1) return parseInt(ports[0], 10);
      return ports.map(p => parseInt(p, 10));
    }
    
    // For protocol and other array fields, split by comma and trim
    if (fieldId === 'protocol' || fieldId === 'countryFull' || fieldId === 'fofaCountry') {
      const values = strValue.split(',').map(v => v.trim()).filter(v => v !== '');
      if (values.length === 0) return null;
      if (values.length === 1) return values[0];
      return values;
    }
    
    // For other fields, split by comma and trim
    const values = strValue.split(',').map(v => v.trim()).filter(v => v !== '');
    if (values.length === 0) return null;
    if (values.length === 1) return values[0];
    return values;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Build normalized fields object
    const normalizedFields = {};
    
    // Process selected fields (standard fields)
    selectedFields.forEach(fieldId => {
      const value = fieldValues[fieldId];
      // Handle both string and number values
      if (value !== undefined && value !== null && value !== '') {
        // If value is already a number (from preset), use it directly
        if (typeof value === 'number') {
          normalizedFields[fieldId] = value;
        } else {
          // Parse string values (including comma-separated)
          const parsed = parseCommaSeparated(String(value), fieldId);
          if (parsed !== null) {
            normalizedFields[fieldId] = parsed;
          }
        }
      }
    });

    // Also include special internal fields if they exist in fieldValues (from presets)
    // These fields are stored internally but not displayed in the form
    const specialFields = ['protocol', 'countryFull', 'fofaCountry'];
    specialFields.forEach(fieldId => {
      const value = fieldValues[fieldId];
      if (value !== undefined && value !== null && value !== '') {
        // Check if value was originally from originalFields (preset) - preserve original type
        const originalValue = originalFields[fieldId];
        if (originalValue !== undefined && originalValue !== null && originalValue !== '') {
          // Use original value type (array, string, etc.)
          normalizedFields[fieldId] = originalValue;
        } else if (Array.isArray(value) || typeof value === 'string') {
          // If it's already an array or string, use it directly
          normalizedFields[fieldId] = value;
        } else {
          // Parse comma-separated strings
          const parsed = parseCommaSeparated(String(value), fieldId);
          if (parsed !== null) {
            normalizedFields[fieldId] = parsed;
          }
        }
      }
    });

    // Only submit if we have at least one field
    if (Object.keys(normalizedFields).length > 0) {
      onSubmit(normalizedFields);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Field Selection */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
          <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-2">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
            </svg>
          </div>
          Select Fields to Include
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {fieldTypes.map(field => (
            <label key={field.id} className={`group relative flex items-center p-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedFields.includes(field.id) 
                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/50 shadow-md dark:shadow-blue-900/20' 
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm bg-white dark:bg-gray-700/70'
            }`}>
              <input
                type="checkbox"
                checked={selectedFields.includes(field.id)}
                onChange={() => handleFieldToggle(field.id)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 flex-shrink-0 transition-all duration-200 ${
                selectedFields.includes(field.id)
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-500 dark:bg-blue-500'
                  : 'border-gray-300 dark:border-gray-500 group-hover:border-gray-400 dark:group-hover:border-gray-400'
              }`}>
                {selectedFields.includes(field.id) && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className={`text-xs font-medium transition-colors leading-tight ${
                selectedFields.includes(field.id)
                  ? 'text-gray-700 dark:text-gray-50'
                  : 'text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-300'
              }`}>{field.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Field Inputs */}
      {selectedFields.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800/80 dark:to-gray-700/80 rounded-xl p-4 border border-blue-100 dark:border-gray-600/50">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
            <div className="w-5 h-5 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mr-2">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            Enter Field Values
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {selectedFields.map(fieldId => {
              const field = fieldTypes.find(f => f.id === fieldId);
              return (
                <div key={fieldId} className="group space-y-1">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={fieldValues[fieldId] || ''}
                      onChange={(e) => handleValueChange(fieldId, e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-500"
                    >
                      <option value="">Select {field.label}</option>
                      {field.options.map(option => (
                        <option key={option} value={option}>{option.toUpperCase()}</option>
                      ))}
                    </select>
                  ) : fieldId === 'port' ? (
                    <>
                      {/* Multi-select port interface */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {commonPorts.map(port => {
                            const currentPorts = fieldValues.port ? fieldValues.port.split(',').map(p => p.trim()).filter(p => p) : [];
                            const isSelected = currentPorts.includes(String(port));
                            return (
                              <button
                                key={port}
                                type="button"
                                onClick={() => handlePortToggle(port)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border-2 transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-400 shadow-md dark:shadow-blue-900/30'
                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
                                }`}
                              >
                                {port}
                              </button>
                            );
                          })}
                        </div>
                        <input
                          type="text"
                          value={fieldValues[fieldId] || ''}
                          onChange={(e) => handleValueChange(fieldId, e.target.value)}
                          placeholder="Or enter custom ports (comma-separated, e.g., 80, 443, 8443)"
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-500"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">Click ports above or enter custom ports separated by commas</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <input
                        type={field.type}
                        value={fieldValues[fieldId] || ''}
                        onChange={(e) => handleValueChange(fieldId, e.target.value)}
                        placeholder={field.placeholder + (field.type === 'text' ? ' (comma-separated for multiple)' : '')}
                        min={field.min}
                        max={field.max}
                        className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-500"
                      />
                      {field.type === 'text' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">You can enter multiple values separated by commas</p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Submit and Clear Buttons */}
      <div className="flex justify-center gap-3 pt-3">
        <button
          type="button"
          onClick={() => {
            setSelectedFields([]);
            setFieldValues({});
            setOriginalFields({});
          }}
          disabled={selectedFields.length === 0 || isLoading}
          className="px-6 py-2.5 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </div>
        </button>
        <button
          type="submit"
          disabled={selectedFields.length === 0 || isLoading}
          className="group relative px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
        >
          <div className="flex items-center">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                Converting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Convert to Queries
              </>
            )}
          </div>
        </button>
      </div>
    </form>
  );
});

export default FieldsForm;
