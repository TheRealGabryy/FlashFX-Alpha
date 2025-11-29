import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { TutorialState, TutorialContextValue } from '../types/tutorial';
import { TUTORIAL_STEPS, isTutorialCompleted, setTutorialCompleted } from '../utils/tutorialUtils';

const TutorialContext = createContext<TutorialContextValue | undefined>(undefined);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
};

interface TutorialProviderProps {
  children: ReactNode;
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }) => {
  const [state, setState] = useState<TutorialState>({
    isActive: false,
    currentStep: 0,
    hasCompleted: isTutorialCompleted()
  });

  const startTutorial = useCallback(() => {
    setState({
      isActive: true,
      currentStep: 0,
      hasCompleted: state.hasCompleted
    });
  }, [state.hasCompleted]);

  const nextStep = useCallback(() => {
    setState(prev => {
      const nextStepIndex = prev.currentStep + 1;
      if (nextStepIndex >= TUTORIAL_STEPS.length) {
        return prev;
      }
      return {
        ...prev,
        currentStep: nextStepIndex
      };
    });
  }, []);

  const previousStep = useCallback(() => {
    setState(prev => {
      const prevStepIndex = prev.currentStep - 1;
      if (prevStepIndex < 0) {
        return prev;
      }
      return {
        ...prev,
        currentStep: prevStepIndex
      };
    });
  }, []);

  const skipTutorial = useCallback(() => {
    setState(prev => ({
      isActive: false,
      currentStep: 0,
      hasCompleted: true
    }));
    setTutorialCompleted(true);
  }, []);

  const finishTutorial = useCallback(() => {
    setState({
      isActive: false,
      currentStep: 0,
      hasCompleted: true
    });
    setTutorialCompleted(true);
  }, []);

  const resetTutorial = useCallback(() => {
    setState({
      isActive: false,
      currentStep: 0,
      hasCompleted: false
    });
    setTutorialCompleted(false);
  }, []);

  const value: TutorialContextValue = {
    state,
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    finishTutorial,
    resetTutorial
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};
