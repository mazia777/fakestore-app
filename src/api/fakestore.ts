import type { Product } from '@/src/types/fakestore';

const BASE_URL = 'https://fakestoreapi.com';

type ApiError = {
  message?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });

    const contentType = res.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');

    const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => '');

    if (!res.ok) {
      const apiMsg =
        (body && typeof body === 'object' && (body as ApiError).message) ||
        (typeof body === 'string' && body) ||
        `Erreur API (${res.status})`;

      throw new Error(apiMsg);
    }

    return body as T;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Temps de réponse dépassé (timeout).');
    }
    throw e instanceof Error ? e : new Error('Erreur inconnue');
  } finally {
    clearTimeout(timeout);
  }
}

export function getProducts() {
  return request<Product[]>('/products');
}

export function getProductById(id: number) {
  return request<Product>(`/products/${id}`);
}
