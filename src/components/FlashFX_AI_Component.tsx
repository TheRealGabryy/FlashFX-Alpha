import React, { useState, useRef, useEffect } from 'react';
import { Zap, X, Loader2, Lightbulb } from 'lucide-react';
import { DesignElement } from '../types/design';

interface Position {
  x: number;
  y: number;
}

interface FlashFXAIComponentProps {
  onAddElement: (element: DesignElement) => void;
  onAddMultipleElements?: (elements: DesignElement[]) => void;
  onUpdateElement?: (id: string, updates: Partial<DesignElement>) => void;
}

const FlashFXAIComponent: React.FC<FlashFXAIComponentProps> = ({ 
  onAddElement, 
  onAddMultipleElements,
  onUpdateElement 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'editing' | 'animation'>('editing');
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generationStatus, setGenerationStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const badgeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize badge position to top-center
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      setPosition({ x: containerWidth / 2 - 30, y: 20 }); // 30 is half badge width, 20 is top margin
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return; // Don't drag when popup is open
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(containerRect.width - 60, e.clientX - dragStart.x));
    const newY = Math.max(0, Math.min(containerRect.height - 60, e.clientY - dragStart.y));
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const handleBadgeClick = () => {
    if (!isDragging) {
      setIsOpen(true);
    }
  };

  const handleAction = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setIsError(false);
    setGenerationStatus('Starting AI generation...');
    
    try {
      await handleGenerateDesign();
      setGenerationStatus('Design generated successfully!');
      setTimeout(() => {
        setIsGenerating(false);
        setIsOpen(false);
        setPrompt('');
        setGenerationStatus('');
      }, 2000);
    } catch (error) {
      console.error('AI Generation failed:', error);
      setIsError(true);
      setGenerationStatus(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsGenerating(false);
    }
  };

  // OpenAI API Configuration
  const OPENAI_API_KEY = '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';
  const ASSISTANT_1_ID = 'asst_uLIk3I1aeLrCJI23m3F84lWl'; // High-level structure
  const ASSISTANT_2_ID = 'asst_oehfC2Wuz6DoBuufgE3I1vqP'; // Detailed shapes

  // Helper function to call OpenAI API
  const callOpenAI = async (endpoint: string, method: string = 'GET', body?: any) => {
    const response = await fetch(`https://api.openai.com/v1${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    return response.json();
  };

  // Create a new thread
  const createThread = async () => {
    return await callOpenAI('/threads', 'POST');
  };

  // Add a message to a thread
  const addMessage = async (threadId: string, content: string) => {
    return await callOpenAI(`/threads/${threadId}/messages`, 'POST', {
      role: 'user',
      content
    });
  };

  // Create a run
  const createRun = async (threadId: string, assistantId: string) => {
    return await callOpenAI(`/threads/${threadId}/runs`, 'POST', {
      assistant_id: assistantId
    });
  };

  // Poll run status until completion
  const pollRunStatus = async (threadId: string, runId: string): Promise<any> => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max
    
    while (attempts < maxAttempts) {
      const run = await callOpenAI(`/threads/${threadId}/runs/${runId}`);
      
      if (run.status === 'completed') {
        return run;
      } else if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        throw new Error(`Run ${run.status}: ${run.last_error?.message || 'Unknown error'}`);
      }
      
      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }
    
    throw new Error('Run timed out after 5 minutes');
  };

  // Get messages from a thread
  const getMessages = async (threadId: string) => {
    return await callOpenAI(`/threads/${threadId}/messages`);
  };

  // Convert JSON format back to internal DesignElement (reused from JsonEditorModal)
  const convertFromJsonFormat = (jsonElement: any): DesignElement => {
    const element: DesignElement = {
      id: jsonElement.id || `ai-shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: jsonElement.type,
      name: jsonElement.name || jsonElement.type.charAt(0).toUpperCase() + jsonElement.type.slice(1),
      x: jsonElement.x || jsonElement.positionX || 0,
      y: jsonElement.y || jsonElement.positionY || 0,
      width: jsonElement.width || 100,
      height: jsonElement.height || 100,
      rotation: jsonElement.rotation || 0,
      opacity: jsonElement.opacity || 1,
      visible: jsonElement.visible !== undefined ? jsonElement.visible : true,
      locked: jsonElement.locked || false,
      fill: jsonElement.fill || '#3B82F6',
      stroke: jsonElement.stroke || '#1E40AF',
      strokeWidth: jsonElement.strokeWidth || 2,
      borderRadius: jsonElement.borderRadius || 0,
      shadow: {
        blur: jsonElement.shadow?.blur || 0,
        x: jsonElement.shadow?.offsetX || jsonElement.shadow?.x || 0,
        y: jsonElement.shadow?.offsetY || jsonElement.shadow?.y || 0,
        color: jsonElement.shadow?.color || 'rgba(0, 0, 0, 0)'
      }
    };

    // Add text properties if present
    if (jsonElement.text !== undefined || jsonElement.content !== undefined) {
      element.text = jsonElement.text || jsonElement.content;
    }
    if (jsonElement.fontSize !== undefined) element.fontSize = jsonElement.fontSize;
    if (jsonElement.fontWeight !== undefined) element.fontWeight = jsonElement.fontWeight;
    if (jsonElement.fontFamily !== undefined) element.fontFamily = jsonElement.fontFamily;
    if (jsonElement.textColor !== undefined) element.textColor = jsonElement.textColor;
    if (jsonElement.textAlign !== undefined) element.textAlign = jsonElement.textAlign;
    if (jsonElement.verticalAlign !== undefined) element.verticalAlign = jsonElement.verticalAlign;
    if (jsonElement.letterSpacing !== undefined) element.letterSpacing = jsonElement.letterSpacing;
    if (jsonElement.lineHeight !== undefined) element.lineHeight = jsonElement.lineHeight;
    if (jsonElement.wordSpacing !== undefined) element.wordSpacing = jsonElement.wordSpacing;
    if (jsonElement.textDecoration !== undefined) element.textDecoration = jsonElement.textDecoration;

    // Add line properties if present
    if (jsonElement.lineType !== undefined) element.lineType = jsonElement.lineType;
    if (jsonElement.points !== undefined) element.points = jsonElement.points;
    if (jsonElement.arrowStart !== undefined) element.arrowStart = jsonElement.arrowStart;
    if (jsonElement.arrowEnd !== undefined) element.arrowEnd = jsonElement.arrowEnd;
    if (jsonElement.arrowheadType !== undefined) element.arrowheadType = jsonElement.arrowheadType;
    if (jsonElement.arrowheadSize !== undefined) element.arrowheadSize = jsonElement.arrowheadSize;
    if (jsonElement.lineCap !== undefined) element.lineCap = jsonElement.lineCap;
    if (jsonElement.lineJoin !== undefined) element.lineJoin = jsonElement.lineJoin;
    if (jsonElement.dashArray !== undefined) element.dashArray = jsonElement.dashArray;
    if (jsonElement.smoothing !== undefined) element.smoothing = jsonElement.smoothing;
    if (jsonElement.trimStart !== undefined) element.trimStart = jsonElement.trimStart;
    if (jsonElement.trimEnd !== undefined) element.trimEnd = jsonElement.trimEnd;

    return element;
  };

  // Main AI generation pipeline
  const handleGenerateDesign = async () => {
    // Stage 1: Get high-level structure from Assistant 1
    setGenerationStatus('Generating high-level design structure...');
    
    const thread1 = await createThread();
    await addMessage(thread1.id, prompt);
    const run1 = await createRun(thread1.id, ASSISTANT_1_ID);
    await pollRunStatus(thread1.id, run1.id);
    
    const messages1 = await getMessages(thread1.id);
    const assistantMessage1 = messages1.data.find((msg: any) => msg.role === 'assistant');
    
    if (!assistantMessage1) {
      throw new Error('No response from structure assistant');
    }
    
    // Parse the high-level structure JSON
    const structureText = assistantMessage1.content[0].text.value;
    let structureJson;
    
    try {
      // Extract JSON from the response (it might be wrapped in markdown)
      const jsonMatch = structureText.match(/```json\s*([\s\S]*?)\s*```/) || structureText.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : structureText;
      structureJson = JSON.parse(jsonText);
    } catch (error) {
      throw new Error('Failed to parse structure JSON from assistant response');
    }
    
    if (!Array.isArray(structureJson)) {
      throw new Error('Structure response is not an array');
    }
    
    const shapeCount = structureJson.length;
    
    // Stage 2: Generate detailed shapes from Assistant 2 (PARALLEL)
    // Stage 1.5: Create base layers for each shape BEFORE detailed generation
    setGenerationStatus(`Creating ${shapeCount} base layers...`);
    const baseLayers: DesignElement[] = [];
    
    structureJson.forEach((shapeBreakdown: any, index: number) => {
      const baseLayerId = `ai-layer-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🏗️ [AI DEBUG] Creating base layer ${index + 1} with ID: ${baseLayerId}`, shapeBreakdown);
      
      // Create a basic DesignElement from the high-level structure
      const baseLayer = convertFromJsonFormat({
        ...shapeBreakdown,
        id: baseLayerId,
        name: `AI ${shapeBreakdown.type} ${index + 1}`,
        // Ensure we have basic properties with fallbacks
        fill: shapeBreakdown.fill || '#3B82F6',
        stroke: shapeBreakdown.stroke || '#1E40AF',
        strokeWidth: shapeBreakdown.strokeWidth || 2,
        borderRadius: shapeBreakdown.borderRadius || (shapeBreakdown.type === 'circle' ? 50 : 8),
        opacity: shapeBreakdown.opacity || 1,
        visible: true,
        locked: false
      });
      
      baseLayers.push(baseLayer);
      console.log(`✅ [AI DEBUG] Base layer ${index + 1} created:`, baseLayer);
    });
    
    // Add ALL base layers to canvas in a single atomic operation
    setGenerationStatus(`Adding ${shapeCount} base layers to canvas...`);
    console.log(`➕ [AI DEBUG] Adding ${shapeCount} base layers to canvas:`, baseLayers);
    
    if (onAddMultipleElements) {
      onAddMultipleElements(baseLayers);
    } else {
      // Fallback: add them individually with delays to prevent race conditions
      for (let i = 0; i < baseLayers.length; i++) {
        const layer = baseLayers[i];
        console.log(`➕ [AI DEBUG] Adding base layer ${i + 1} to canvas:`, layer);
        onAddElement(layer);
        // Small delay for visual feedback and to prevent race conditions
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setGenerationStatus(`Enhancing all ${shapeCount} layers with detailed properties in parallel...`);
    
    // Create an array of promises for parallel detailed enhancement
    const enhancementPromises = structureJson.map(async (shapeBreakdown: any, index: number) => {
      const correspondingLayer = baseLayers[index];
      console.log(`🔍 [AI DEBUG] Starting detailed enhancement for layer ${index + 1} (ID: ${correspondingLayer.id}):`, shapeBreakdown);
      
      const detailedPrompt = `${prompt}\n\nJSON breakdown:\n${JSON.stringify(shapeBreakdown, null, 2)}\n\nShape to create: ${index + 1}`;
      
      try {
        const thread2 = await createThread();
        await addMessage(thread2.id, detailedPrompt);
        const run2 = await createRun(thread2.id, ASSISTANT_2_ID);
        await pollRunStatus(thread2.id, run2.id);
        
        const messages2 = await getMessages(thread2.id);
        const assistantMessage2 = messages2.data.find((msg: any) => msg.role === 'assistant');
        
        if (!assistantMessage2) {
          console.warn(`⚠️ [AI DEBUG] No detailed response for layer ${index + 1}, keeping base layer`);
          return { layerId: correspondingLayer.id, enhancedProperties: null };
        }
        
        // Parse the detailed shape JSON
        const detailText = assistantMessage2.content[0].text.value;
        console.log(`📝 [AI DEBUG] Raw detailed response for layer ${index + 1}:`, detailText);
        
        let detailJson;
        
        try {
          // Extract JSON from the response
          const jsonMatch = detailText.match(/```json\s*([\s\S]*?)\s*```/) || detailText.match(/\{[\s\S]*\}/);
          const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : detailText;
          console.log(`🔧 [AI DEBUG] Extracted detailed JSON for layer ${index + 1}:`, jsonText);
          
          detailJson = JSON.parse(jsonText);
          console.log(`✅ [AI DEBUG] Parsed detailed JSON for layer ${index + 1}:`, detailJson);
        } catch (error) {
          console.warn(`⚠️ [AI DEBUG] Failed to parse detailed JSON for layer ${index + 1}, keeping base layer`);
          return { layerId: correspondingLayer.id, enhancedProperties: null };
        }
        
        // Preserve the layer ID and merge with detailed properties
        const enhancedProperties = {
          ...detailJson,
          id: correspondingLayer.id, // Keep the original layer ID
          name: correspondingLayer.name // Keep the original name
        };
        
        console.log(`🎨 [AI DEBUG] Enhanced properties for layer ${index + 1}:`, enhancedProperties);
        
        return { layerId: correspondingLayer.id, enhancedProperties };
      } catch (error) {
        console.error(`Error enhancing layer ${index + 1}:`, error);
        console.warn(`⚠️ [AI DEBUG] Enhancement failed for layer ${index + 1}, keeping base layer`);
        return { layerId: correspondingLayer.id, enhancedProperties: null };
      }
    });
    
    // Wait for all enhancements to complete in parallel
    setGenerationStatus(`Waiting for all ${shapeCount} layer enhancements to complete...`);
    const enhancementResults = await Promise.all(enhancementPromises);
    
    console.log(`🎯 [AI DEBUG] All enhancement results:`, enhancementResults);
    
    // Stage 3: Apply enhancements to existing layers
    setGenerationStatus('Applying detailed enhancements to layers...');
    
    for (let i = 0; i < enhancementResults.length; i++) {
      const result = enhancementResults[i];
      
      if (result.enhancedProperties) {
        console.log(`🔄 [AI DEBUG] Applying enhancements to layer ${i + 1} (ID: ${result.layerId}):`, result.enhancedProperties);
        
        // Convert enhanced properties to DesignElement
        const enhancedElement = convertFromJsonFormat(result.enhancedProperties);
        
        console.log(`✨ [AI DEBUG] Enhanced properties for layer ${i + 1}:`, enhancedElement);
        console.log(`📍 [AI DEBUG] Layer ${i + 1} enhanced placement - x: ${enhancedElement.x}, y: ${enhancedElement.y}, width: ${enhancedElement.width}, height: ${enhancedElement.height}`);
        
        // Update the existing base layer with enhanced properties
        if (onUpdateElement) {
          onUpdateElement(result.layerId, enhancedElement);
          console.log(`🔄 [AI DEBUG] Updated existing layer ${i + 1} (ID: ${result.layerId}) with enhanced properties`);
        } else {
          // Fallback: create new element with preserved ID
          const finalEnhancedElement: DesignElement = {
            ...enhancedElement,
            id: result.layerId,
            name: baseLayers[i].name
          };
          onAddElement(finalEnhancedElement);
          console.log(`➕ [AI DEBUG] Added enhanced element as new layer ${i + 1}`);
        }
      } else {
        console.log(`⚠️ [AI DEBUG] No enhancements available for layer ${i + 1} (ID: ${result.layerId}), keeping base properties`);
      }
      
      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`📊 [AI DEBUG] Final summary: ${shapeCount} layers created and enhanced`);
  };

  const getTabStyles = (tab: 'editing' | 'animation', isActive: boolean) => {
    if (tab === 'editing') {
      return isActive 
        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg' 
        : 'bg-slate-700 text-slate-300 hover:bg-slate-600';
    } else {
      return isActive 
        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg' 
        : 'bg-slate-700 text-slate-300 hover:bg-slate-600';
    }
  };

  const getButtonGradient = () => {
    return activeTab === 'editing' 
      ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700' 
      : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700';
  };

  const getTokenUsage = () => {
    return activeTab === 'editing' ? '0 / 40,000 tokens used (0%)' : '0 / 25,000 tokens used (0%)';
  };

  const getEstimatedTokens = () => {
    const length = prompt.length;
    const estimated = Math.ceil(length / 4); // Rough estimation
    return `~${estimated} tokens`;
  };

  const getPlaceholderText = () => {
    return activeTab === 'editing' 
      ? 'Create a bouncing red circle that scales on impact...'
      : 'Generate a smooth particle explosion effect...';
  };

  const getButtonText = () => {
    return activeTab === 'editing' ? 'Generate Design' : 'Create Animation';
  };

  // The AI component has been successfully integrated into the Layers Panel as a tab
  // All motion graphics generation functionality has been moved to AIChatTab.tsx
  // This component now serves as a reference for the OpenAI integration pattern
  
  // This component is now deprecated - all functionality moved to AIChatTab
  // Return null to hide the floating component
  return null;
};

export default FlashFXAIComponent;