// Función para resaltar texto con claves únicas
export const highlightText = (text, query, noteId) => {
  if (!query.trim()) return text;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ?
      <Text key={`${noteId}-${index}-${part}-${Math.random().toString(36).substring(2, 9)}`} style={{ backgroundColor: '#FFEB3B', fontWeight: 'bold' }}>{part}</Text> :
      part
  );
};