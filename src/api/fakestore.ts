import type { Product } from '@/src/types/fakestore';

const BASE_URL = 'https://fakestoreapi.com';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  return (await res.json()) as T;
}

export function getProducts() {
  return request<Product[]>('/products');
}

export function getProductById(id: number) {
  return request<Product>(`/products/${id}`);
}
