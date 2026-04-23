import type { ArenaMapConfig } from '@/src/shared/lib/arena-config';

const MAP_CODE_PREFIX = 'boa-map:';

function encodeBase64Url(input: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(input, 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  const bytes = new TextEncoder().encode(input);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeBase64Url(input: string): string {
  const normalized = input
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(input.length / 4) * 4, '=');

  if (typeof window === 'undefined') {
    return Buffer.from(normalized, 'base64').toString('utf-8');
  }

  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeMapConfigToCode(config: ArenaMapConfig): string {
  return `${MAP_CODE_PREFIX}${encodeBase64Url(JSON.stringify(config))}`;
}

export function decodeMapCodeToConfig(code: string): ArenaMapConfig {
  const normalized = code.trim();

  if (!normalized.startsWith(MAP_CODE_PREFIX)) {
    throw new Error('Некорректный код карты');
  }

  return JSON.parse(
    decodeBase64Url(normalized.slice(MAP_CODE_PREFIX.length)),
  ) as ArenaMapConfig;
}
