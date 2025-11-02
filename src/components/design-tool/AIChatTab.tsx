import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Copy, Sparkles } from 'lucide-react';
import { DesignElement } from '../../types/design';

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

const AIChatTab: React.FC<AIChatTabProps> = ({
  onAddElement,
  onAddMultipleElements,
  onUpdateElement
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      type: 'ai',
      content: 'Hello! I\'m your AI assistant. I can help you create UI elements, animations, and motion graphics. What would you like to create today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [status, setStatus] = useState<'ready' | 'processing' | 'error'>('ready');
  const [generationStatus, setGenerationStatus] = useState<string>('');
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Debug logging for AI pipeline
  const debugLog = (stage: string, data: any) => {
    console.log(`🤖 [AI PIPELINE] ${stage}:`, data);
  };

  // OpenAI API Configuration (Demo - replace with real keys in production)
  const OPENAI_API_KEY = 'sk-proj-demo-key'; // Replace with real API key
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

  // Mock AI generation for demo (replace with real OpenAI calls in production)
  const simulateAIGeneration = async (userPrompt: string): Promise<DesignElement[]> => {
    debugLog('Starting AI generation simulation', { prompt: userPrompt });
    
    // Simulate different responses based on user input
    const prompt = userPrompt.toLowerCase();
    let shapes: any[] = [];

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

  // Fixed pipeline: Create separate elements with guaranteed unique IDs
  const handleMotionGraphicsGeneration = async (userPrompt: string) => {
    try {
      setStatus('processing');
      debugLog('Starting motion graphics generation pipeline', { prompt: userPrompt });
      
      // Stage 1: Generate shape data (simulated for demo)
      setGenerationStatus('Analyzing your request and generating design structure...');
      const shapesData = await simulateAIGeneration(userPrompt);
      
      debugLog('Generated shapes data', shapesData);
      
      if (!Array.isArray(shapesData) || shapesData.length === 0) {
        throw new Error('No shapes were generated from the AI response');
      }
      
      const shapeCount = shapesData.length;
      setGenerationStatus(`Creating ${shapeCount} individual design elements with unique IDs...`);
      
      // Stage 2: Create individual DesignElements with guaranteed unique IDs
      const designElements: DesignElement[] = [];
      
      for (let i = 0; i < shapesData.length; i++) {
        const shapeData = shapesData[i];
        // Add small delay to ensure unique timestamps
        await new Promise(resolve => setTimeout(resolve, 50)); // Longer delay for unique timestamps
        const designElement = createUniqueDesignElement(shapeData, i);
        designElements.push(designElement);
        
        debugLog(`Created design element ${i + 1}`, designElement);
      }
      
      debugLog('All design elements created', {
        count: designElements.length,
        ids: designElements.map(el => el.id),
        elements: designElements
      });
      
      // Stage 3: Add elements one by one with proper delays to prevent race conditions
      setGenerationStatus(`Adding ${shapeCount} elements to canvas...`);
      
      // Try batch addition first
      if (onAddMultipleElements) {
        debugLog('Adding elements in batch', designElements);
        onAddMultipleElements(designElements);
        setGenerationStatus(`Added all ${shapeCount} elements to canvas!`);
      } else {
        // Fallback to individual addition
        debugLog('Adding elements individually to ensure proper canvas state');
        for (let i = 0; i < designElements.length; i++) {
          const element = designElements[i];
          debugLog(`Adding element ${i + 1} individually`, element);
          onAddElement(element);
          // Delay to ensure each element is properly added to canvas state
          await new Promise(resolve => setTimeout(resolve, 500));
          setGenerationStatus(`Added element ${i + 1} of ${shapeCount}...`);
        }
      }
      
      setGenerationStatus('');
      setStatus('ready');
      return `✅ Successfully created ${shapeCount} individual design elements! Each element has been added to your canvas as a separate layer and can be edited independently.`;
      
    } catch (error) {
      setStatus('error');
      debugLog('Motion graphics generation failed', error);
      throw new Error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Enhanced AI response handler with proper flow
  const handleAIResponse = async (userMessage: string) => {
    setStatus('processing');
    setIsProcessing(true);

    try {
      // Step 1: Immediately show confirmation message
      const confirmationId = `confirmation-${Date.now()}`;
      const confirmationMessage: Message = {
        id: confirmationId,
        type: 'ai',
        content: 'I will create the animation you requested with all the provided UI components and details',
        timestamp: new Date(),
        isStreaming: false
      };
      
      setMessages(prev => [...prev, confirmationMessage]);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Show AI thinking message
      const thinkingId = `thinking-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: thinkingId,
        type: 'ai',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      }]);

      // Step 3: Execute motion graphics generation
      const result = await handleMotionGraphicsGeneration(userMessage);
      
      // Step 4: Remove thinking message and show success
      setMessages(prev => prev.filter(msg => msg.id !== thinkingId));
      
      const successId = `success-${Date.now()}`;
      const successMessage: Message = {
        id: successId,
        type: 'ai',
        content: result,
        timestamp: new Date(),
        isStreaming: false
      };
      
      setMessages(prev => [...prev, successMessage]);
      await streamMessage(successId, result);
      
    } catch (error) {
      // Remove thinking message and show error
      setMessages(prev => prev.filter(msg => msg.id.startsWith('thinking-')));
      
      const errorId = `error-${Date.now()}`;
      const errorMessage: Message = {
        id: errorId,
        type: 'ai',
        content: `I apologize, but I encountered an error while creating your design: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again with a different request.`,
        timestamp: new Date(),
        isStreaming: false
      };
      
      setMessages(prev => [...prev, errorMessage]);
      await streamMessage(errorId, errorMessage.content);
    }

    setIsProcessing(false);
    setStatus('ready');
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
    setMessages([{
      id: 'welcome-reset',
      type: 'ai',
      content: 'Chat cleared! I\'m ready to help you create new UI elements and animations. What would you like to build?',
      timestamp: new Date()
    }]);
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

  const renderThinkingIndicator = () => (
    <div className="flex items-center space-x-2 text-gray-400 py-2">
      <div className="flex items-center space-x-1">
        <span className="text-sm bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">AI is thinking</span>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gradient-to-r from-violet-400 to-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gradient-to-r from-violet-400 to-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gradient-to-r from-violet-400 to-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
      {generationStatus && (
        <div className="text-xs bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent ml-2">
          {generationStatus}
        </div>
      )}
    </div>
  );

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
        {isProcessing && generationStatus && (
          <div className="mt-2 p-2 bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">{generationStatus}</span>
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