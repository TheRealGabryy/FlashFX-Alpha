import { SpotlightPosition, TutorialStep } from '../types/tutorial';

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    target: 'toolbar',
    title: 'Welcome to the Toolbar',
    message: 'This is the Toolbar - your main workspace for adding shapes, text, and images to your canvas',
    position: 'bottom'
  },
  {
    id: 2,
    target: 'image-button',
    title: 'Add Images',
    message: 'Click here to add images to your design - upload from computer, search Google Images, or generate with AI',
    position: 'bottom'
  },
  {
    id: 3,
    target: 'grid-button',
    title: 'Grid Settings',
    message: 'Grid Settings help you arrange shapes precisely on the canvas with snap-to-grid alignment',
    position: 'bottom'
  },
  {
    id: 4,
    target: 'layers-panel',
    title: 'Layers Panel',
    message: 'The Layers Panel shows every shape on your canvas - click to select, drag to reorder, and manage visibility',
    position: 'right'
  },
  {
    id: 5,
    target: 'ai-tab',
    title: 'AI Tab (Experimental)',
    message: 'Chat with AI to make intelligent changes to your design. This is an EXPERIMENTAL feature!',
    position: 'right'
  },
  {
    id: 6,
    target: 'presets-tab',
    title: 'Presets Tab',
    message: 'Save your favorite designs as presets and add them to new projects with one click',
    position: 'right'
  },
  {
    id: 7,
    target: 'tutorial-button',
    title: 'Tutorial Button',
    message: 'Click here anytime to restart this tutorial and learn the features again',
    position: 'top'
  }
];

export const TUTORIAL_COMPLETED_KEY = 'flashfx_tutorial_completed';

export function getSpotlightPosition(target: string): SpotlightPosition | null {
  const element = document.querySelector(`[data-tutorial-target="${target}"]`);

  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  const padding = 8;

  return {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + (padding * 2),
    height: rect.height + (padding * 2),
    borderRadius: 12
  };
}

export function getPanelPosition(
  spotlight: SpotlightPosition,
  position: 'top' | 'bottom' | 'left' | 'right',
  panelWidth: number = 400,
  panelHeight: number = 200
): { top: number; left: number } {
  const gap = 20;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  let top = 0;
  let left = 0;

  switch (position) {
    case 'bottom':
      top = spotlight.top + spotlight.height + gap;
      left = spotlight.left + (spotlight.width / 2) - (panelWidth / 2);
      break;
    case 'top':
      top = spotlight.top - panelHeight - gap;
      left = spotlight.left + (spotlight.width / 2) - (panelWidth / 2);
      break;
    case 'right':
      top = spotlight.top + (spotlight.height / 2) - (panelHeight / 2);
      left = spotlight.left + spotlight.width + gap;
      break;
    case 'left':
      top = spotlight.top + (spotlight.height / 2) - (panelHeight / 2);
      left = spotlight.left - panelWidth - gap;
      break;
  }

  left = Math.max(20, Math.min(left, windowWidth - panelWidth - 20));
  top = Math.max(20, Math.min(top, windowHeight - panelHeight - 20));

  return { top, left };
}

export function scrollElementIntoView(target: string): void {
  const element = document.querySelector(`[data-tutorial-target="${target}"]`);

  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });
  }
}

export function isTutorialCompleted(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setTutorialCompleted(completed: boolean): void {
  try {
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, completed.toString());
  } catch (error) {
    console.error('Failed to save tutorial completion status:', error);
  }
}
