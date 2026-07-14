import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const { messages, model, temperature } = await req.json();

    // Support both GROQ_API_KEY and GROK_API_KEY environments defensively
    let apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
    if (apiKey) {
      apiKey = apiKey.trim().replace(/^['"]|['"]$/g, '');
    }

    // Fallback Mock Stream if API Key is not set or is still the default placeholder
    if (!apiKey || apiKey === 'your-groq-api-key-here' || apiKey === 'your-grok-api-key-here' || apiKey === '') {
      console.warn('Groq API Key environment variable is not configured. Streaming mock response.');
      return mockStreamResponse(messages);
    }

    // Check if the conversation contains any image attachments
    const hasImages = messages.some((m: any) => {
      if (Array.isArray(m.content)) {
        return m.content.some((part: any) => part.type === 'image_url');
      }
      return false;
    });

    // Determine the Groq model to query
    // If text contains images, automatically route to the Llama-3.2 Vision model
    let selectedModel = model || 'llama-3.3-70b-versatile';
    if (hasImages) {
      selectedModel = 'llama-3.2-11b-vision-preview';
    } else if (selectedModel === 'grok-2' || selectedModel === 'grok-beta') {
      // Graceful map if local state still holds previous Grok settings
      selectedModel = selectedModel === 'grok-beta' ? 'llama-3.1-8b-instant' : 'llama-3.3-70b-versatile';
    }

    const payload = {
      model: selectedModel,
      messages: [
        {
          role: 'system',
          content: 'You are Groq, an advanced AI chatbot powered by ultra-fast Llama models. You are helpful, intelligent, slightly witty, and highly knowledgeable. Respond in markdown when appropriate.',
        },
        ...messages,
      ],
      temperature: temperature !== undefined ? temperature : 0.7,
      stream: true,
    };

    console.log('Sending completions payload to Groq API:', JSON.stringify(payload));

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API returned an error:', errorText);
      
      let errorMessage = `Groq API error: ${response.statusText} (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson?.error?.message) {
          errorMessage = `Groq API: ${errorJson.error.message}`;
        } else if (errorJson?.message) {
          errorMessage = `Groq API: ${errorJson.message}`;
        } else if (errorJson?.error) {
          errorMessage = `Groq API: ${typeof errorJson.error === 'string' ? errorJson.error : JSON.stringify(errorJson.error)}`;
        }
      } catch (_) {
        if (errorText && errorText.length < 150) {
          errorMessage = `Groq API: ${errorText}`;
        }
      }

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
  
  const text = `**Groq Demo Mode** 🚀

It looks like your **GROQ_API_KEY** is not configured in your \`.env.local\` file yet. No problem! I've started this simulated response stream to show you how fast, smooth, and beautiful the interface is.

Here's what you wrote:
> "${lastUserMsg}"

### Features currently active:
1. **Streaming Responses**: Realtime token-by-token client rendering.
2. **Interactive UI**: Clean, responsive layout with collapsible sidebar and dark/light modes.
3. **Voice Mode**: Supports local text-to-speech and speech-to-text.
4. **Markdown & Code**: Highlighted syntax and copy options.

Configure your API keys in your environment variables to link the live Groq Llama models! Let me know if there's anything else I can demonstrate for you.`;

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
