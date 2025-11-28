import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Copy, Sparkles, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { DesignElement } from '../../types/design';
import { OpenAIService } from '../../services/OpenAIService';
import { GenerationStorageService } from '../../services/GenerationStorageService';
import { JSONMapper } from '../../utils/jsonMapper';
import { JSONValidator } from '../../utils/jsonValidator';
import {
  PipelineStage,
  ValidationStatus,
  GenerationProgress,
  GenerationPipeline,
  HighLevelShape,
  LowLevelShape,
} from '../../types/aiPipeline';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface AIChatTabProps {
  onAddElement: (element: DesignElement) => void;
  onAddMultipleElements?: (elements: DesignElement[]) => void;
  onUpdateElement?: (id: string, updates: Partial<DesignElement>) => void;
}

const CHAT_STORAGE_KEY = 'flashfx_ai_chat_history';

const AIChatTab: React.FC<AIChatTabProps> = ({
  onAddElement,
  onAddMultipleElements,
  onUpdateElement
}) => {
  // Load messages from localStorage on mount
  const loadMessagesFromStorage = (): Message[] => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
    // Return default welcome message if nothing stored
    return [
      {
        id: 'welcome-1',
        type: 'ai',
        content: 'Hello! I\'m your AI assistant. I can help you create UI elements, animations, and motion graphics. What would you like to create today?',
        timestamp: new Date()
      }
    ];
  };

  const [messages, setMessages] = useState<Message[]>(loadMessagesFromStorage());
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [status, setStatus] = useState<'ready' | 'processing' | 'error'>('ready');
  const [generationStatus, setGenerationStatus] = useState<string>('');

  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('idle');
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>(null);
  const [currentPipeline, setCurrentPipeline] = useState<GenerationPipeline | null>(null);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({ current: 0, total: 0 });
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [messages]);

  // Debug logging for AI pipeline
  const debugLog = (stage: string, data: any) => {
    console.log(`🤖 [AI PIPELINE] ${stage}:`, data);
  };

  // OpenAI API Configuration (Demo - replace with real keys in production)
  const OPENAI_API_KEY = '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'; // Replace with real API key
  const ASSISTANT_1_ID = 'asst_structure'; // High-level structure assistant
  const ASSISTANT_2_ID = 'asst_details'; // Detailed shapes assistant

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      const maxHeight = 72; // 3 rows * 24px line height
      inputRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  // Enhanced shape creation with guaranteed unique IDs and proper layering
  const createUniqueDesignElement = (shapeData: any, index: number): DesignElement => {
    const timestamp = Date.now() + (index * 100); // Ensure significantly different timestamps
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    const uniqueId = `ai-shape-${timestamp}-${index}-${randomSuffix}`;
    
    debugLog(`Creating unique element ${index + 1}`, { id: uniqueId, shapeData });
    
    // Ensure proper positioning to avoid overlaps
    const baseX = shapeData.x || (200 + (index * 200)); // Better horizontal spacing
    const baseY = shapeData.y || (200 + (index * 150)); // Better vertical spacing
    
    const element: DesignElement = {
      id: uniqueId,
      type: shapeData.type || 'rectangle', // This should always be set from simulateAIGeneration now
      name: shapeData.name || `AI ${shapeData.type || 'Shape'} ${index + 1}`,
      x: baseX,
      y: baseY,
      width: shapeData.width || 120,
      height: shapeData.height || 80,
      rotation: shapeData.rotation || 0,
      opacity: shapeData.opacity || 1,
      visible: true,
      locked: false,
      fill: shapeData.fill || '#3B82F6',
      stroke: shapeData.stroke || '#1E40AF',
      strokeWidth: shapeData.strokeWidth || 2,
      borderRadius: shapeData.borderRadius || (shapeData.type === 'circle' ? 50 : 8),
      shadow: {
        blur: shapeData.shadow?.blur || 4,
        x: shapeData.shadow?.x || shapeData.shadow?.offsetX || 0,
        y: shapeData.shadow?.y || shapeData.shadow?.offsetY || 2,
        color: shapeData.shadow?.color || 'rgba(0, 0, 0, 0.2)'
      }
    };

    // Add text properties if present
    if (shapeData.text || shapeData.content) {
      element.text = shapeData.text || shapeData.content;
      element.fontSize = shapeData.fontSize || 16;
      element.fontWeight = shapeData.fontWeight || '400';
      element.fontFamily = shapeData.fontFamily || 'Inter';
      element.textColor = shapeData.textColor || '#FFFFFF';
      element.textAlign = shapeData.textAlign || 'center';
      element.verticalAlign = shapeData.verticalAlign || 'middle';
    }

    // Add line properties if present
    if (shapeData.type === 'line') {
      element.lineType = shapeData.lineType || 'line';
      element.points = shapeData.points || [{ x: 0, y: 0 }, { x: element.width, y: 0 }];
      element.arrowStart = shapeData.arrowStart || false;
      element.arrowEnd = shapeData.arrowEnd || false;
      element.arrowheadType = shapeData.arrowheadType || 'triangle';
      element.arrowheadSize = shapeData.arrowheadSize || 12;
      element.lineCap = shapeData.lineCap || 'round';
      element.lineJoin = shapeData.lineJoin || 'round';
      element.dashArray = shapeData.dashArray || [];
      element.smoothing = shapeData.smoothing || 0;
      element.trimStart = shapeData.trimStart || 0;
      element.trimEnd = shapeData.trimEnd || 1;
    }

    debugLog(`Created unique element ${index + 1}`, element);
    return element;
  };

  const handleRealAIPipeline = async (userPrompt: string) => {
    const startTime = Date.now();
    const controller = new AbortController();
    setAbortController(controller);

    const pipeline = GenerationStorageService.createNewPipeline(userPrompt);
    setCurrentPipeline(pipeline);
    GenerationStorageService.saveGenerationPipeline(pipeline);

    debugLog('Starting real AI pipeline', { prompt: userPrompt, pipelineId: pipeline.id });

    try {
      setPipelineStage('validating');
      setValidationStatus('pending');
      setGenerationStatus('Validating your prompt...');

      const validationResponse = await OpenAIService.validatePrompt(userPrompt, controller.signal);

      GenerationStorageService.updatePipelineStage(pipeline.id, {
        validation: validationResponse,
      });

      if (!validationResponse.accepted) {
        setValidationStatus('rejected');
        setPipelineStage('error');
        setGenerationStatus('');

        GenerationStorageService.updatePipelineStatus(pipeline.id, 'failed');

        return {
          success: false,
          message: '❌ Prompt Rejected: Your request did not pass validation. Please try a different prompt that aligns with creating UI/design elements.',
        };
      }

      setValidationStatus('accepted');
      await new Promise(resolve => setTimeout(resolve, 500));

      setPipelineStage('high-level');
      setGenerationStatus('Analyzing request and creating design structure...');

      const highLevelShapes = await OpenAIService.generateHighLevelStructure(userPrompt, controller.signal);

      const validation = JSONValidator.validateHighLevelArray(highLevelShapes);
      if (!validation.valid || validation.validShapes.length === 0) {
        throw new Error(`High-level generation failed: ${validation.errors.join(', ')}`);
      }

      GenerationStorageService.updatePipelineStage(pipeline.id, {
        highLevel: {
          shapes: validation.validShapes,
          rawResponse: JSON.stringify(highLevelShapes),
          timestamp: new Date().toISOString(),
        },
      });

      setGenerationProgress({ current: 0, total: validation.validShapes.length });
      setGenerationStatus(`Found ${validation.validShapes.length} elements to create`);
      await new Promise(resolve => setTimeout(resolve, 500));

      setPipelineStage('low-level');
      const lowLevelShapes: LowLevelShape[] = [];
      const failedIndices: number[] = [];

      for (let i = 0; i < validation.validShapes.length; i++) {
        const highLevelShape = validation.validShapes[i];
        setGenerationProgress({ current: i + 1, total: validation.validShapes.length });
        setGenerationStatus(`Processing element ${i + 1} of ${validation.validShapes.length}...`);

        try {
          const lowLevelShape = await OpenAIService.generateLowLevelShape(
            highLevelShape,
            userPrompt,
            0,
            controller.signal
          );

          const shapeValidation = JSONValidator.validateLowLevelShape(lowLevelShape);
          if (shapeValidation.valid) {
            lowLevelShapes.push(lowLevelShape);
          } else {
            console.warn(`Low-level shape ${i} invalid, repairing:`, shapeValidation.errors);
            const repaired = JSONValidator.repairLowLevelShape(lowLevelShape);
            lowLevelShapes.push(repaired);
          }
        } catch (error) {
          console.error(`Failed to generate low-level shape ${i}:`, error);
          failedIndices.push(i);
        }

        if (i < validation.validShapes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      if (lowLevelShapes.length === 0) {
        throw new Error('No shapes were successfully generated');
      }

      GenerationStorageService.updatePipelineStage(pipeline.id, {
        lowLevel: {
          shapes: lowLevelShapes,
          failedIndices,
          timestamp: new Date().toISOString(),
        },
      });

      setPipelineStage('placing');
      setGenerationStatus('Placing elements on canvas...');

      const designElements: DesignElement[] = [];
      const placementFailed: number[] = [];

      for (let i = 0; i < lowLevelShapes.length; i++) {
        try {
          const highLevelShape = validation.validShapes[i];
          const lowLevelShape = lowLevelShapes[i];

          const element = JSONMapper.mapToDesignElement(highLevelShape, lowLevelShape, i);
          const clampedElement = JSONMapper.clampToCanvas(element);
          designElements.push(clampedElement);
        } catch (error) {
          console.error(`Failed to place element ${i}:`, error);
          placementFailed.push(i);
        }
      }

      if (designElements.length === 0) {
        throw new Error('No elements could be placed on canvas');
      }

      if (onAddMultipleElements) {
        onAddMultipleElements(designElements);
      } else {
        for (const element of designElements) {
          onAddElement(element);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      GenerationStorageService.updatePipelineStage(pipeline.id, {
        placement: {
          elementIds: designElements.map(e => e.id),
          failed: placementFailed,
          timestamp: new Date().toISOString(),
        },
      });

      const processingTime = Date.now() - startTime;
      GenerationStorageService.updatePipelineStatus(pipeline.id, 'complete', {
        totalElements: validation.validShapes.length,
        successfulElements: designElements.length,
        processingTimeMs: processingTime,
      });

      setPipelineStage('complete');
      setGenerationStatus('');

      const successMessage = `✅ Successfully created ${designElements.length} elements in ${(processingTime / 1000).toFixed(1)}s!`;
      const warningMessage = failedIndices.length > 0
        ? `\n⚠️ ${failedIndices.length} element(s) could not be generated.`
        : '';
      const placementWarning = placementFailed.length > 0
        ? `\n⚠️ ${placementFailed.length} element(s) could not be placed.`
        : '';

      return {
        success: true,
        message: successMessage + warningMessage + placementWarning,
      };

    } catch (error) {
      const pipelineError = OpenAIService.createPipelineError(
        pipelineStage,
        error,
        true
      );

      GenerationStorageService.addPipelineError(pipeline.id, pipelineError);
      GenerationStorageService.updatePipelineStatus(pipeline.id, 'failed');

      setPipelineStage('error');
      setGenerationStatus('');

      throw error;
    } finally {
      setAbortController(null);
    }
  };

  const simulateAIGeneration = async (userPrompt: string): Promise<DesignElement[]> => {
    debugLog('Legacy simulation - should not be called');

    if (prompt.includes('button') || prompt.includes('ui')) {
      shapes = [
        {
          type: 'button',
          name: 'Primary Button',
          x: 300,
          y: 300,
          width: 160,
          height: 50,
          fill: '#3B82F6',
          stroke: '#1E40AF',
          borderRadius: 8,
          text: 'Click Me',
          fontSize: 16,
          fontWeight: '600',
          textColor: '#FFFFFF'
        },
        {
          type: 'button',
          name: 'Secondary Button',
          x: 500,
          y: 300,
          width: 160,
          height: 50,
          fill: '#6B7280',
          stroke: '#4B5563',
          borderRadius: 8,
          text: 'Cancel',
          fontSize: 16,
          fontWeight: '400',
          textColor: '#FFFFFF'
        }
      ];
    } else if (prompt.includes('chat') || prompt.includes('message')) {
      shapes = [
        {
          type: 'chat-frame',
          name: 'Phone Frame',
          x: 300,
          y: 200,
          width: 320,
          height: 568,
          fill: '#000000',
          stroke: '#374151',
          borderRadius: 36
        },
        {
          type: 'chat-bubble',
          name: 'User Message',
          x: 330,
          y: 300,
          width: 200,
          height: 60,
          fill: '#3B82F6',
          stroke: '#1E40AF',
          borderRadius: 18,
          text: 'Hello there!',
          fontSize: 14,
          textColor: '#FFFFFF'
        },
        {
          type: 'chat-bubble',
          name: 'Response',
          x: 330,
          y: 380,
          width: 220,
          height: 80,
          fill: '#1F2937',
          stroke: '#374151',
          borderRadius: 18,
          text: 'Hi! How can I help?',
          fontSize: 14,
          textColor: '#FFFFFF'
        }
      ];
    } else if (prompt.includes('circle') || prompt.includes('round')) {
      shapes = Array.from({ length: 5 }, (_, index) => ({
        type: 'circle',
        name: `Circle ${index + 1}`,
        x: 300 + (index * 150),
        y: 300 + (index % 2) * 180,
        width: 80 + (index * 10),
        height: 80 + (index * 10),
        fill: [`#EF4444`, '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][index],
        stroke: [`#DC2626`, '#1E40AF', '#059669', '#D97706', '#7C3AED'][index],
        borderRadius: 50
      }));
    } else if (prompt.includes('dashboard') || prompt.includes('cards')) {
      shapes = [
        {
          type: 'rectangle',
          name: 'Header Card',
          x: 300,
          y: 200,
          width: 600,
          height: 120,
          fill: '#1F2937',
          stroke: '#374151',
          borderRadius: 12,
          shadow: { blur: 8, x: 0, y: 4, color: 'rgba(0, 0, 0, 0.1)' }
        },
        {
          type: 'rectangle',
          name: 'Stats Card 1',
          x: 300,
          y: 340,
          width: 180,
          height: 140,
          fill: '#3B82F6',
          stroke: '#1E40AF',
          borderRadius: 8,
          shadow: { blur: 6, x: 0, y: 2, color: 'rgba(0, 0, 0, 0.1)' }
        },
        {
          type: 'rectangle',
          name: 'Stats Card 2',
          x: 500,
          y: 340,
          width: 180,
          height: 140,
          fill: '#10B981',
          stroke: '#059669',
          borderRadius: 8,
          shadow: { blur: 6, x: 0, y: 2, color: 'rgba(0, 0, 0, 0.1)' }
        },
        {
          type: 'rectangle',
          name: 'Stats Card 3',
          x: 700,
          y: 340,
          width: 180,
          height: 140,
          fill: '#F59E0B',
          stroke: '#D97706',
          borderRadius: 8,
          shadow: { blur: 6, x: 0, y: 2, color: 'rgba(0, 0, 0, 0.1)' }
        }
      ];
    } else {
      // Default generation - geometric shapes
      shapes = [
        {
          type: 'rectangle',
          name: 'Rectangle',
          x: 300,
          y: 300,
          width: 150,
          height: 100,
          fill: '#3B82F6',
          stroke: '#1E40AF',
          borderRadius: 8
        },
        {
          type: 'circle',
          name: 'Circle',
          x: 500,
          y: 300,
          width: 120,
          height: 120,
          fill: '#EF4444',
          stroke: '#DC2626',
          borderRadius: 50
        },
        {
          type: 'text',
          name: 'Title Text',
          x: 350,
          y: 450,
          width: 200,
          height: 50,
          fill: 'transparent',
          stroke: 'transparent',
          strokeWidth: 0,
          text: 'Generated Design',
          fontSize: 24,
          fontWeight: '600',
          textColor: '#FFFFFF'
        },
        {
          type: 'button',
          name: 'Action Button',
          x: 400,
          y: 520,
          width: 140,
          height: 48,
          fill: '#FFD700',
          stroke: '#FFA500',
          borderRadius: 12,
          text: 'Get Started',
          fontSize: 16,
          fontWeight: '600',
          textColor: '#000000'
        }
      ];
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    debugLog('AI generation completed', { shapeCount: shapes.length, shapes });
    return shapes;
  };

  const handleCancelGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setPipelineStage('idle');
      setGenerationStatus('');
      setIsProcessing(false);
      setStatus('ready');

      const cancelMessage: Message = {
        id: `cancel-${Date.now()}`,
        type: 'ai',
        content: '⛔ Generation cancelled by user.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, cancelMessage]);
    }
  };

  // Stream message character by character with enhanced timing
  const streamMessage = async (messageId: string, content: string) => {
    setStreamingMessageId(messageId);
    
    for (let i = 0; i <= content.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 25)); // Slightly faster streaming
      const partialContent = content.slice(0, i);
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: partialContent, isStreaming: i < content.length }
          : msg
      ));
      
      // Auto-scroll during streaming
      if (i % 10 === 0) { // Scroll every 10 characters
        scrollToBottom();
      }
    }
    
    setStreamingMessageId(null);
    scrollToBottom();
  };

  const handleAIResponse = async (userMessage: string) => {
    setStatus('processing');
    setIsProcessing(true);
    setPipelineStage('idle');
    setValidationStatus(null);

    try {
      const confirmationId = `confirmation-${Date.now()}`;
      const confirmationMessage: Message = {
        id: confirmationId,
        type: 'ai',
        content: '🚀 Starting AI-powered design generation pipeline...',
        timestamp: new Date(),
        isStreaming: false
      };

      setMessages(prev => [...prev, confirmationMessage]);
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = await handleRealAIPipeline(userMessage);

      const resultId = `result-${Date.now()}`;
      const resultMessage: Message = {
        id: resultId,
        type: 'ai',
        content: result.message,
        timestamp: new Date(),
        isStreaming: false
      };

      setMessages(prev => [...prev, resultMessage]);
      await streamMessage(resultId, result.message);

    } catch (error) {
      const errorId = `error-${Date.now()}`;
      let errorContent = 'An unexpected error occurred.';

      if (error instanceof Error) {
        if (error.message.includes('cancelled')) {
          errorContent = '⛔ Generation was cancelled.';
        } else if (error.message.includes('401')) {
          errorContent = '🔑 API Key Error: Invalid or missing OpenAI API key. Please check your configuration.';
        } else if (error.message.includes('429')) {
          errorContent = '⌛ Rate Limit: Too many requests. Please wait a moment and try again.';
        } else {
          errorContent = `❌ Error: ${error.message}`;
        }
      }

      const errorMessage: Message = {
        id: errorId,
        type: 'ai',
        content: errorContent,
        timestamp: new Date(),
        isStreaming: false
      };

      setMessages(prev => [...prev, errorMessage]);
      await streamMessage(errorId, errorMessage.content);
    }

    setIsProcessing(false);
    setStatus('ready');
    setPipelineStage('idle');
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputValue.trim();
    setInputValue('');

    debugLog('User message sent', userMessage);
    await handleAIResponse(messageContent);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    const welcomeMessage = {
      id: 'welcome-reset',
      type: 'ai' as const,
      content: 'Chat cleared! I\'m ready to help you create new UI elements and animations. What would you like to build?',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    // Clear from localStorage
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify([welcomeMessage]));
    } catch (error) {
      console.error('Failed to clear chat history from storage:', error);
    }
    debugLog('Chat cleared');
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = () => {
    switch (status) {
      case 'ready': return 'bg-gradient-to-r from-green-400 to-emerald-400';
      case 'processing': return 'bg-gradient-to-r from-violet-400 to-pink-400';
      case 'error': return 'bg-gradient-to-r from-red-400 to-orange-400';
      default: return 'bg-gray-400';
    }
  };

  const renderPipelineStatus = () => {
    if (pipelineStage === 'validating') {
      return (
        <div className="flex items-center space-x-2 py-2">
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          <span className="text-sm text-blue-400">Validating prompt...</span>
        </div>
      );
    }

    if (validationStatus === 'accepted') {
      return (
        <div className="flex items-center space-x-2 py-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400">Prompt Accepted ✓</span>
        </div>
      );
    }

    if (validationStatus === 'rejected') {
      return (
        <div className="flex items-center space-x-2 py-2">
          <XCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">Prompt Rejected ✗</span>
        </div>
      );
    }

    if (pipelineStage === 'high-level' || pipelineStage === 'low-level' || pipelineStage === 'placing') {
      return (
        <div className="space-y-2 py-2">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
            <span className="text-sm text-violet-400">{generationStatus}</span>
          </div>
          {generationProgress.total > 0 && (
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-violet-400 to-pink-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-violet-950/30 via-gray-900/50 to-pink-950/30 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 via-transparent to-pink-600/5 animate-pulse" />

      {/* Enhanced Header with Status */}
      <div className="flex-shrink-0 p-3 border-b border-violet-500/20 bg-gradient-to-r from-violet-950/50 to-pink-950/50 backdrop-blur-sm relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
              <h3 className="font-semibold text-sm bg-gradient-to-r from-violet-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                FlashFX agent
              </h3>
            </div>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${status === 'processing' ? 'animate-pulse' : ''}`} />
              <span className="text-xs text-gray-400 capitalize">{status}</span>
            </div>
          </div>

          <button
            onClick={clearChat}
            disabled={isProcessing}
            className="p-1.5 rounded-md hover:bg-violet-700/30 transition-colors group disabled:opacity-50"
            title="Clear Chat"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-pink-400" />
          </button>
        </div>

        {/* Processing Status Bar */}
        {isProcessing && (
          <div className="mt-2 p-2 bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {renderPipelineStatus()}
              </div>
              {abortController && (
                <button
                  onClick={handleCancelGeneration}
                  className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Chat Container with gradient */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar relative z-10"
        style={{ height: '80%' }}
      >
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} message-animation`}
            style={{
              animationDelay: `${Math.min(index * 100, 1000)}ms`,
              animationFillMode: 'both'
            }}
          >
            <div className={`max-w-[85%] group relative`}>
              {/* Enhanced Message Bubble */}
              <div
                className={`px-3 py-2.5 rounded-lg shadow-lg transition-all duration-200 message-bubble-hover backdrop-blur-sm ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-tr-sm border border-violet-400/30'
                    : 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 text-gray-100 rounded-tl-sm border border-violet-500/20'
                }`}
              >
                {/* AI Content */}
                {message.type === 'ai' && (
                  <div className="flex-1">
                    {message.isStreaming && !message.content ? (
                      renderThinkingIndicator()
                    ) : (
                      <div>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content}
                          {message.isStreaming && streamingMessageId === message.id && (
                            <span className="inline-block w-0.5 h-4 bg-violet-400 ml-1 animate-pulse" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                          <span>{formatTime(message.timestamp)}</span>
                          <button
                            onClick={() => copyMessage(message.content)}
                            className="p-1 rounded hover:bg-violet-700/30 transition-colors opacity-0 group-hover:opacity-100"
                            title="Copy message"
                          >
                            <Copy className="w-3 h-3 text-gray-400 hover:text-violet-400" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* User Message */}
                {message.type === 'user' && (
                  <div>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                    <div className="text-xs text-violet-200/70 mt-2 flex items-center justify-between">
                      <span>{formatTime(message.timestamp)}</span>
                      <button
                        onClick={() => copyMessage(message.content)}
                        className="p-1 rounded hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Copy message"
                      >
                        <Copy className="w-3 h-3 text-violet-200/70 hover:text-white" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area - Fixed Bottom */}
      <div className="flex-shrink-0 p-3 border-t border-violet-500/20 bg-gradient-to-r from-violet-950/50 to-pink-950/50 backdrop-blur-sm relative z-10">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask FlashFX to create shapes, UI elements, animations..."
            className="w-full px-4 py-3 pr-14 bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-violet-500/30 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm leading-relaxed backdrop-blur-sm"
            style={{ minHeight: '60px', maxHeight: '100px' }}
            disabled={isProcessing}
          />

          {/* Send button inside textarea */}
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            className={`absolute bottom-3 right-3 p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${
              inputValue.trim() && !isProcessing
                ? 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white transform hover:scale-105 shadow-lg shadow-violet-500/20'
                : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
            }`}
            title="Send message (Enter)"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>

          {/* Character count */}
          {inputValue.length > 0 && (
            <div className="absolute bottom-3 left-3 text-xs text-gray-500">
              {inputValue.length}/500
            </div>
          )}
        </div>

        {/* Quick Suggestions */}
        {messages.length <= 2 && !isProcessing && (
          <div className="mt-2 flex flex-wrap gap-1">
            {[
              'Create 5 colorful circles',
              'Design a chat interface',
              'Make dashboard cards',
              'Generate buttons'
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInputValue(suggestion)}
                className="px-2 py-1 bg-gradient-to-r from-violet-700/30 to-pink-700/30 hover:from-violet-600/40 hover:to-pink-600/40 border border-violet-500/20 text-xs text-gray-300 rounded-lg transition-colors backdrop-blur-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChatTab;