import React, { createContext, useState, useContext, useEffect } from 'react';

const ModelContext = createContext(null);

export function useModelContext() {
  return useContext(ModelContext);
}

export function ModelProvider({ children }) {
  const [selectedModel, setSelectedModel] = useState(() => {
    // Load from localStorage or default to gemini-1.5-flash
    return localStorage.getItem('filegeek-selected-model') || 'gemini-1.5-flash';
  });

  // Save to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('filegeek-selected-model', selectedModel);
  }, [selectedModel]);

  // Get provider from model name
  const getProvider = (modelId) => {
    if (modelId.startsWith('gemini')) return 'gemini';
    if (modelId.startsWith('gpt')) return 'openai';
    return 'gemini'; // default
  };

  const provider = getProvider(selectedModel);

  return (
    <ModelContext.Provider
      value={{
        selectedModel,
        setSelectedModel,
        provider,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}
