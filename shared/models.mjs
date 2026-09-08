// Jediné místo s definicí modelů – sdílí ho Node funkce i Edge funkce.
// id = OpenRouter ID, vision = umí přijmout obrázek, tag = štítek v UI
// Výběr aktualizován 8. 9. 2026, všechna ID ověřena proti OpenRouter API.
export const MODELS = [
  // --- OpenAI ---
  // Pozor: GPT-6 Astra je drahý ($10/$50 za M tokenů) – s opakováním v Promptovači to naskakuje.
  { id: 'openai/gpt-6-astra', name: 'GPT-6 Astra', provider: 'OpenAI', tag: 'vlajkový', vision: true, description: 'Nová vlajková loď OpenAI (září 2026), 1M kontext' },
  { id: 'openai/gpt-5.6-terra', name: 'GPT-5.6 Terra', provider: 'OpenAI', tag: 'vyvážený', vision: true, description: 'Střední model řady 5.6 – poměr výkon/cena' },
  { id: 'openai/gpt-5.6-luna', name: 'GPT-5.6 Luna', provider: 'OpenAI', tag: 'rychlý', vision: true, description: 'Rychlý a levný, default ChatGPT pro free uživatele' },

  // --- Anthropic: rodina Claude 5 (léto 2026) ---
  // Pozor: Fable 5.1 je drahý ($10/$50 za M tokenů) – s opakováním v Promptovači to naskakuje.
  { id: 'anthropic/claude-fable-5.1', name: 'Claude Fable 5.1', provider: 'Anthropic', tag: 'vlajkový', vision: true, description: 'Nejchytřejší model Anthropicu, třída Mythos (drahý)' },
  { id: 'anthropic/claude-opus-5', name: 'Claude Opus 5', provider: 'Anthropic', tag: 'přemýšlející', vision: true, description: 'Vlajkový Opus, 1M kontext (červenec 2026)' },
  { id: 'anthropic/claude-sonnet-5', name: 'Claude Sonnet 5', provider: 'Anthropic', tag: 'vyvážený', vision: true, description: 'Vybalancovaný výkon a cena, 1M kontext' },

  // --- Google ---
  { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', provider: 'Google', tag: 'přemýšlející', vision: true, description: 'Nejsilnější Gemini (preview), bere i audio/video' },
  { id: 'google/gemini-3.8-flash', name: 'Gemini 3.8 Flash', provider: 'Google', tag: 'rychlý', vision: true, description: 'Nejnovější rychlý model Googlu (září 2026)' },

  // --- xAI ---
  // Grok 4.5 vracel v EU 403; 4.6 je k 9/2026 stále nejnovější – při 403 vrátit x-ai/grok-4.3.
  { id: 'x-ai/grok-4.6', name: 'Grok 4.6', provider: 'xAI', tag: 'xAI', vision: true, description: 'Nový vlajkový Grok, 500K kontext (srpen 2026)' },

  // --- Evropa ---
  { id: 'mistralai/mistral-medium-3-5', name: 'Mistral Medium 3.5', provider: 'Mistral', tag: 'evropský', vision: true, description: 'Aktuální vlajkový model od Mistralu' },

  // --- Čínská vlna ---
  { id: 'deepseek/deepseek-v4-pro-0813', name: 'DeepSeek V4 Pro', provider: 'DeepSeek', tag: 'čínský', vision: false, description: 'Ostrá GA verze V4 Pro (13. 8. 2026), skvělá cena' },
  { id: 'moonshotai/kimi-k3', name: 'Kimi K3', provider: 'Moonshot AI', tag: 'čínský', vision: true, description: 'Nejsilnější model s otevřenými vahami' },
  { id: 'qwen/qwen3.8-max-0902', name: 'Qwen 3.8-Max', provider: 'Alibaba', tag: 'čínský', vision: true, description: 'Vlajkový Qwen (srpen 2026), 1M kontext' },
  { id: 'z-ai/glm-5.2', name: 'GLM 5.2', provider: 'Z.ai', tag: 'čínský', vision: false, description: '1M kontext za zlomek ceny konkurence' },

  // --- Open-source / lokální ---
  { id: 'nvidia/nemotron-3.5-lightning:free', name: 'Nemotron 3.5 Lightning', provider: 'NVIDIA (open-source)', tag: 'free', vision: false, description: 'Otevřený model s free endpointem – nulové náklady' },
  { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B', provider: 'Alibaba (open-source)', tag: 'lokální', vision: true, description: 'Malý otevřený vision model, jde provozovat lokálně' }
];
