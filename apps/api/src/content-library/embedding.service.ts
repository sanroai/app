import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '../config/app.config';
import { APP_CONFIG_TOKEN } from '../common/common.constants';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(@Inject(APP_CONFIG_TOKEN) private readonly config: AppConfig) {}

  enabled(): boolean {
    return this.config.AI_EMBEDDING_PROVIDER !== 'none' && Boolean(this.config.AI_API_KEY);
  }

  async embed(text: string): Promise<number[] | null> {
    if (!this.enabled()) return null;
    const provider = this.config.AI_EMBEDDING_PROVIDER;

    try {
      if (provider === 'openai') {
        const base = this.config.AI_BASE_URL.replace(/\/+$/, '');
        const url = `${base}/embeddings`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.config.AI_API_KEY}` },
          body: JSON.stringify({ model: this.config.AI_EMBEDDING_MODEL, input: text.slice(0, 8000) }),
        });
        if (!res.ok) throw new Error(`Embedding API ${res.status} ${res.statusText}`);
        const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
        return data.data?.[0]?.embedding ?? null;
      }

      if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.config.AI_API_KEY}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'models/text-embedding-004', content: { parts: [{ text: text.slice(0, 8000) }] } }),
        });
        if (!res.ok) throw new Error(`Embedding API ${res.status} ${res.statusText}`);
        const data = (await res.json()) as { embedding: { values: number[] } };
        return data.embedding?.values ?? null;
      }

      return null;
    } catch (err) {
      this.logger.warn(`Embedding failed (${provider}): ${(err as Error).message}`);
      return null;
    }
  }
}