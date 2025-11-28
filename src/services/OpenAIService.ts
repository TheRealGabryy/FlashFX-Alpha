import {
  ValidationResponse,
  HighLevelShape,
  LowLevelShape,
  PipelineError,
} from '../types/aiPipeline';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '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';
const OPENAI_API_BASE = 'https://api.openai.com/v1';

const VALIDATOR_ASSISTANT_ID = 'asst_0crxCl5jFThLe0uN6xKwgJAa';
const HIGH_LEVEL_ASSISTANT_ID = 'asst_uLIk3I1aeLrCJI23m3F84lWl';
const LOW_LEVEL_ASSISTANT_ID = 'asst_z8sn6AEmZxXPDPp9DD8A4LC2';

const VALIDATION_TIMEOUT_MS = 30000;
const GENERATION_TIMEOUT_MS = 60000;
const POLL_INTERVAL_MS = 2000;
const MAX_RETRIES = 3;

export class OpenAIService {
  private static async makeRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    signal?: AbortSignal
  ): Promise<any> {
    const url = `${OPENAI_API_BASE}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenAI API Error (${response.status}): ${errorData.error?.message || response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request cancelled by user');
        }
        throw error;
      }
      throw new Error('Unknown error occurred during API request');
    }
  }

  private static async createThread(signal?: AbortSignal): Promise<string> {
    const response = await this.makeRequest('/threads', 'POST', {}, signal);
    return response.id;
  }

  private static async addMessageToThread(
    threadId: string,
    content: string,
    signal?: AbortSignal
  ): Promise<void> {
    await this.makeRequest(
      `/threads/${threadId}/messages`,
      'POST',
      {
        role: 'user',
        content,
      },
      signal
    );
  }

  private static async createRun(
    threadId: string,
    assistantId: string,
    signal?: AbortSignal
  ): Promise<string> {
    const response = await this.makeRequest(
      `/threads/${threadId}/runs`,
      'POST',
      {
        assistant_id: assistantId,
      },
      signal
    );
    return response.id;
  }

  private static async pollRunCompletion(
    threadId: string,
    runId: string,
    maxWaitMs: number,
    signal?: AbortSignal
  ): Promise<'completed' | 'failed'> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      if (signal?.aborted) {
        throw new Error('Request cancelled by user');
      }

      const run = await this.makeRequest(
        `/threads/${threadId}/runs/${runId}`,
        'GET',
        undefined,
        signal
      );

      console.log(`[OpenAI] Run status: ${run.status}`);

      if (run.status === 'completed') {
        return 'completed';
      }

      if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        throw new Error(`Run ${run.status}: ${run.last_error?.message || 'Unknown error'}`);
      }

      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    throw new Error(`Request timed out after ${maxWaitMs}ms`);
  }

  private static async getThreadMessages(
    threadId: string,
    signal?: AbortSignal
  ): Promise<string> {
    const response = await this.makeRequest(
      `/threads/${threadId}/messages`,
      'GET',
      undefined,
      signal
    );

    const assistantMessages = response.data.filter(
      (msg: any) => msg.role === 'assistant'
    );

    if (assistantMessages.length === 0) {
      throw new Error('No response from assistant');
    }

    const latestMessage = assistantMessages[0];
    const textContent = latestMessage.content.find((c: any) => c.type === 'text');

    if (!textContent) {
      throw new Error('No text content in assistant response');
    }

    return textContent.text.value;
  }

  private static extractJSON(text: string): any {
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }

    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }

    throw new Error('No valid JSON found in response');
  }

  static async validatePrompt(
    prompt: string,
    signal?: AbortSignal
  ): Promise<ValidationResponse> {
    console.log('[OpenAI] Starting prompt validation...');

    try {
      const threadId = await this.createThread(signal);
      await this.addMessageToThread(threadId, prompt, signal);
      const runId = await this.createRun(threadId, VALIDATOR_ASSISTANT_ID, signal);

      await this.pollRunCompletion(threadId, runId, VALIDATION_TIMEOUT_MS, signal);

      const response = await this.getThreadMessages(threadId, signal);
      console.log('[OpenAI] Validation response:', response);

      const numericMatch = response.match(/[01]/);
      const accepted = numericMatch ? numericMatch[0] === '1' : false;

      return {
        accepted,
        rawResponse: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[OpenAI] Validation error:', error);
      throw error;
    }
  }

  static async generateHighLevelStructure(
    prompt: string,
    signal?: AbortSignal
  ): Promise<HighLevelShape[]> {
    console.log('[OpenAI] Starting high-level structure generation...');

    try {
      const threadId = await this.createThread(signal);
      await this.addMessageToThread(threadId, prompt, signal);
      const runId = await this.createRun(threadId, HIGH_LEVEL_ASSISTANT_ID, signal);

      await this.pollRunCompletion(threadId, runId, GENERATION_TIMEOUT_MS, signal);

      const response = await this.getThreadMessages(threadId, signal);
      console.log('[OpenAI] High-level response:', response);

      const jsonData = this.extractJSON(response);

      if (!Array.isArray(jsonData)) {
        throw new Error('High-level response is not an array');
      }

      const shapes: HighLevelShape[] = jsonData.map((shape: any) => {
        if (!shape.type || shape.positionX === undefined || shape.positionY === undefined) {
          throw new Error('Invalid shape structure: missing required fields');
        }

        return {
          type: shape.type,
          positionX: shape.positionX,
          positionY: shape.positionY,
          width: shape.width || 100,
          height: shape.height || 100,
          content: shape.content,
        };
      });

      console.log(`[OpenAI] Generated ${shapes.length} high-level shapes`);
      return shapes;
    } catch (error) {
      console.error('[OpenAI] High-level generation error:', error);
      throw error;
    }
  }

  static async generateLowLevelShape(
    highLevelShape: HighLevelShape,
    userPrompt: string,
    retryCount: number = 0,
    signal?: AbortSignal
  ): Promise<LowLevelShape> {
    console.log('[OpenAI] Starting low-level shape generation...');

    try {
      const threadId = await this.createThread(signal);

      const message = `User Request: ${userPrompt}\n\nShape to detail: ${JSON.stringify(highLevelShape, null, 2)}`;
      await this.addMessageToThread(threadId, message, signal);

      const runId = await this.createRun(threadId, LOW_LEVEL_ASSISTANT_ID, signal);
      await this.pollRunCompletion(threadId, runId, GENERATION_TIMEOUT_MS, signal);

      const response = await this.getThreadMessages(threadId, signal);
      console.log('[OpenAI] Low-level response:', response);

      const jsonData = this.extractJSON(response);

      let shapeData = jsonData;
      if (Array.isArray(jsonData) && jsonData.length > 0) {
        shapeData = jsonData[0];
      }

      if (!shapeData.shapeType || !shapeData.settings) {
        throw new Error('Invalid low-level shape structure');
      }

      return shapeData as LowLevelShape;
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        console.log(`[OpenAI] Retrying low-level generation (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.generateLowLevelShape(highLevelShape, userPrompt, retryCount + 1, signal);
      }

      console.error('[OpenAI] Low-level generation error:', error);
      throw error;
    }
  }

  static createPipelineError(
    stage: string,
    error: any,
    recoverable: boolean = false
  ): PipelineError {
    return {
      stage: stage as any,
      message: error instanceof Error ? error.message : String(error),
      details: error,
      timestamp: new Date().toISOString(),
      recoverable,
    };
  }
}
