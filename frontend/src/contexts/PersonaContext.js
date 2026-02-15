import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';

const PersonaContext = createContext(null);

export function usePersona() {
  return useContext(PersonaContext);
}

// Persona definitions mirrored from backend — kept in sync manually.
// The backend is the source of truth; this is for instant UI feedback.
const PERSONAS = {
  academic: {
    id: 'academic',
    label: 'Academic Mentor',
    greeting: "Hello! I'm your Academic Mentor. Upload a document and let's explore it together.",
    voice: 'alloy',
    bg: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)',
    bgDark: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
  },
  professional: {
    id: 'professional',
    label: 'Professional Analyst',
    greeting: 'Good day. I\'m ready to analyze your documents with precision. Upload a file to begin.',
    voice: 'onyx',
    bg: 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
    bgDark: 'linear-gradient(135deg, #212121 0%, #424242 100%)',
  },
  casual: {
    id: 'casual',
    label: 'Casual Helper',
    greeting: "Hey there! Drop a file and ask me anything — I'll keep it simple.",
    voice: 'shimmer',
    bg: 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)',
    bgDark: 'linear-gradient(135deg, #01579b 0%, #0277bd 100%)',
  },
  einstein: {
    id: 'einstein',
    label: 'Albert Einstein',
    greeting: 'Ah, willkommen! As I always say, the important thing is not to stop questioning. Show me your document!',
    voice: 'echo',
    bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
    bgDark: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
  },
  genz_tutor: {
    id: 'genz_tutor',
    label: 'Gen-Z Tutor',
    greeting: "yooo welcome to FileGeek!! drop ur file and let's get this bread fr fr",
    voice: 'nova',
    bg: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
    bgDark: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 100%)',
  },
  sherlock: {
    id: 'sherlock',
    label: 'Sherlock Holmes',
    greeting: 'The game is afoot! Present your document, and I shall deduce its every secret.',
    voice: 'fable',
    bg: 'linear-gradient(135deg, #efebe9 0%, #d7ccc8 100%)',
    bgDark: 'linear-gradient(135deg, #263238 0%, #37474f 100%)',
  },
};

export const PERSONA_LIST = Object.values(PERSONAS);

export function PersonaProvider({ children }) {
  const [personaId, setPersonaId] = useState(
    () => localStorage.getItem('filegeek-persona') || 'academic'
  );

  const persona = useMemo(() => PERSONAS[personaId] || PERSONAS.academic, [personaId]);

  const selectPersona = useCallback((id) => {
    setPersonaId(id);
    localStorage.setItem('filegeek-persona', id);
  }, []);

  return (
    <PersonaContext.Provider value={{ persona, personaId, selectPersona, personas: PERSONA_LIST }}>
      {children}
    </PersonaContext.Provider>
  );
}
