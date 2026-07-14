// Jedno volání modelu – Edge Function, která streamuje odpověď z OpenRouteru.
// Edge funkce nemá 10s limit běžných Netlify funkcí (počítá se jen CPU čas),
// takže zvládne i dlouhé odpovědi přemýšlejících modelů.
import { MODELS } from '../../shared/models.mjs';

export default async (request) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Neplatný požadavek' }, { status: 400 });
  }

  const { model, prompt, imageBase64 } = body;
  const apiKey = Netlify.env.get('OPENROUTER_API_KEY');

  if (!apiKey) return Response.json({ error: 'Chybí OPENROUTER_API_KEY v nastavení Netlify' }, { status: 500 });
  if (!prompt?.trim()) return Response.json({ error: 'Chybí prompt' }, { status: 400 });
  if (!MODELS.some((m) => m.id === model)) return Response.json({ error: 'Neznámý model' }, { status: 400 });

  const content = imageBase64
    ? [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
      ]
    : prompt;

  const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': 'Promptovac'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content }],
      stream: true
    })
  });

  if (!upstream.ok) {
    const errText = await upstream.text();
    return Response.json(
      { error: `HTTP ${upstream.status}: ${errText.slice(0, 300)}` },
      { status: 502 }
    );
  }

  // Stream z OpenRouteru pošleme beze změny dál – frontend si ho rozparsuje
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    }
  });
};

export const config = { path: '/api/test' };
