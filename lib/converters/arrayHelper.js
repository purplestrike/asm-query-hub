// Helper function to handle array values in converters
export function handleArrayField(fieldValue, formatSingle, formatMultiple = null) {
  if (!fieldValue) return null;
  
  const values = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
  if (values.length === 0) return null;
  
  if (values.length === 1) {
    return formatSingle(values[0]);
  }
  
  // Multiple values
  if (formatMultiple) {
    return formatMultiple(values);
  }
  // Default: use OR logic
  return `(${values.map(v => formatSingle(v)).join(' OR ')})`;
}

