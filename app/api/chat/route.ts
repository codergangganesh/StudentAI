import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const { messages, model, temperature } = await req.json();

    const apiKey = process.env.GROK_API_KEY;

    // Fallback Mock Stream if API Key is not set (Great for demoing without setup)
    if (!apiKey || apiKey === 'your-grok-api-key-here') {
      console.warn('GROK_API_KEY environment variable is not configured. Streaming mock response.');
      return mockStreamResponse(messages);
    }

    const payload = {
      model: model || 'grok-2-1212',
      messages: [
        {
          role: 'system',
          content: 'You are Grok, an advanced AI chatbot designed by xAI. You are helpful, intelligent, slightly witty, and highly knowledgeable. Respond in markdown when appropriate.',
        },
        ...messages,
      ],
      temperature: temperature !== undefined ? temperature : 0.7,
      stream: true,
    };

    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Grok API returned an error:', errorText);
      
      let errorMessage = `Grok API error: ${response.statusText} (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson?.error?.message) {
          errorMessage = `Grok API: ${errorJson.error.message}`;
        }
      } catch (_) {}

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // Set up standard ReadableStream to parse SSE chunks and stream text
    const responseStream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');

            // Save the last partial line back to the buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
              const cleanedLine = line.trim();
              if (!cleanedLine) continue;
              if (cleanedLine === 'data: [DONE]') continue;

              if (cleanedLine.startsWith('data: ')) {
                try {
                  const jsonStr = cleanedLine.slice(6);
                  const parsed = JSON.parse(jsonStr);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    controller.enqueue(new TextEncoder().encode(content));
                  }
                } catch (err) {
                  // Ignore parse errors on partial SSE chunks
                }
              }
            }
          }

          // Enqueue remaining buffer if any
          if (buffer.startsWith('data: ')) {
            try {
              const jsonStr = buffer.slice(6).trim();
              if (jsonStr && jsonStr !== '[DONE]') {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content));
                }
              }
            } catch (err) {}
          }
        } catch (e) {
          controller.error(e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Simulated Stream Response for Demo Mode
function mockStreamResponse(messages: any[]) {
  const lastUserMsg = messages[messages.length - 1]?.content || '';
  
  const text = `**Grok Demo Mode** 🚀

It looks like your **GROK_API_KEY** is not configured in your \`.env.local\` file yet. No problem! I've started this simulated response stream to show you how fast, smooth, and beautiful the interface is.

Here's what you wrote:
> "${lastUserMsg}"

### Features currently active:
1. **Streaming Responses**: Realtime token-by-token client rendering.
2. **Interactive UI**: Clean, responsive layout with collapsible sidebar and dark/light modes.
3. **Voice Mode**: Supports local text-to-speech and speech-to-text.
4. **Markdown & Code**: Highlighted syntax and copy options.

Configure your API keys in your environment variables to link the live xAI Grok models! Let me know if there's anything else I can demonstrate for you.`;

  const responseStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const words = text.split(' ');
      
      for (const word of words) {
        // Enqueue word with space
        controller.enqueue(encoder.encode(word + ' '));
        // Add artificial delay to simulate streaming (20ms-50ms per word)
        await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 30));
      }
      controller.close();
    },
  });

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
