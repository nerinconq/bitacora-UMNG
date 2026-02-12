
/**
 * Formats a full name to the style "Surname; Initial."
 * Example: "Felipe Pedraza" -> "Pedraza; F."
 */
export const formatStudentName = (fullName: string): string => {
  if (!fullName || !fullName.trim()) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName;
  
  const surname = parts[parts.length - 1];
  const firstName = parts[0];
  const initial = firstName.charAt(0).toUpperCase();
  
  return `${surname}; ${initial}.`;
};
