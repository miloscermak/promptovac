// Jediné místo s definicí modelů – sdílí ho Node funkce i Edge funkce.
// id = OpenRouter ID, vision = umí přijmout obrázek, tag = štítek v UI
export const MODELS = [
  { id: 'openai/gpt-5.6-luna', name: 'GPT-5.6 Luna', provider: 'OpenAI', tag: 'rychlý', vision: true, description: 'Nejrychlejší z nové řady GPT-5.6' },
  { id: 'openai/gpt-5.6-sol', name: 'GPT-5.6 Sol', provider: 'OpenAI', tag: 'přemýšlející', vision: true, description: 'Vlajkový model OpenAI pro složité úlohy' },
  { id: 'anthropic/claude-sonnet-5', name: 'Claude Sonnet 5', provider: 'Anthropic', tag: 'rychlý', vision: true, description: 'Vybalancovaný výkon a rychlost' },
  { id: 'anthropic/claude-opus-5', name: 'Claude Opus 5', provider: 'Anthropic', tag: 'přemýšlející', vision: true, description: 'Nový vlajkový Claude (červenec 2026)' },
  { id: 'anthropic/claude-fable-5', name: 'Claude Fable 5', provider: 'Anthropic', tag: 'vlajkový', vision: true, description: 'Nejchytřejší model Anthropicu, třída Mythos' },
  { id: 'google/gemini-3.6-flash', name: 'Gemini 3.6 Flash', provider: 'Google', tag: 'rychlý', vision: true, description: 'Nejnovější rychlý model Googlu' },
  { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', provider: 'Google', tag: 'přemýšlející', vision: true, description: 'Nejsilnější Gemini (preview)' },
  // Grok 4.5 není dostupný v EU regionu (403 z xAI), proto starší 4.3
  { id: 'x-ai/grok-4.3', name: 'Grok 4.3', provider: 'xAI', tag: 'xAI', vision: true, description: 'Aktuální model od xAI dostupný v Evropě' },
  { id: 'mistralai/mistral-medium-3-5', name: 'Mistral Medium 3.5', provider: 'Mistral', tag: 'evropský', vision: true, description: 'Aktuální střední model od Mistralu' },
  { id: 'deepseek/deepseek-v4-pro', name: 'DeepSeek V4 Pro', provider: 'DeepSeek', tag: 'čínský', vision: false, description: 'Silný čínský model za zlomek ceny' },
  { id: 'moonshotai/kimi-k3', name: 'Kimi K3', provider: 'Moonshot AI', tag: 'čínský', vision: true, description: 'Nejnovější vlajkový model Moonshot AI' },
  { id: 'minimax/minimax-m3', name: 'MiniMax M3', provider: 'MiniMax', tag: 'čínský', vision: true, description: 'Levný multimodální model od MiniMax' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b', name: 'Nemotron 3 Ultra', provider: 'NVIDIA', tag: 'open-source', vision: false, description: 'Vlajkový otevřený model od NVIDIE' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', provider: 'OpenAI (open-source)', tag: 'lokální', vision: false, description: 'Open-source model, jde provozovat lokálně' },
  { id: 'qwen/qwen3.5-9b', name: 'Qwen 3.5 9B', provider: 'Alibaba (open-source)', tag: 'lokální', vision: true, description: 'Malý open-source model s podporou obrázků' }
];
