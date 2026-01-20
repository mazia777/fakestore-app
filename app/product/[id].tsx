import { getProductById } from '@/src/api/fakestore';
import type { Product } from '@/src/types/fakestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type UiState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: Product };

export default function ProductDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const id = useMemo(() => Number(params.id), [params.id]);
  const [state, setState] = useState<UiState>({ status: 'loading' });

  const load = useCallback(async () => {
    if (!Number.isFinite(id) || id <= 0) {
      setState({ status: 'error', message: 'ID produit invalide' });
      return;
    }

    try {
      const data = await getProductById(id);
      setState({ status: 'success', data });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur inconnue';
      setState({ status: 'error', message });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (state.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.centerText}>Chargement…</Text>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Erreur</Text>
        <Text style={styles.centerText}>{state.message}</Text>

        <Pressable style={styles.btn} onPress={load}>
          <Text style={styles.btnText}>Réessayer</Text>
        </Pressable>

        <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => router.back()}>
          <Text style={[styles.btnText, styles.btnGhostText]}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const p = state.data;

  return (
    <View style={styles.screen}>
      <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => router.back()}>
        <Text style={[styles.btnText, styles.btnGhostText]}>← Retour</Text>
      </Pressable>

      <View style={styles.card}>
        <Image source={{ uri: p.image }} style={styles.image} resizeMode="contain" />
        <Text style={styles.title}>{p.title}</Text>
        <Text style={styles.price}>${Number(p.price).toFixed(2)}</Text>
        {!!p.category && <Text style={styles.meta}>{p.category}</Text>}
        {!!p.description && <Text style={styles.desc}>{p.description}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 12, gap: 12 },
  card: {
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    backgroundColor: 'white',
    gap: 10,
  },
  image: { width: '100%', height: 220 },
  title: { fontSize: 16, fontWeight: '700' },
  price: { fontSize: 16, fontWeight: '800' },
  meta: { fontSize: 12, opacity: 0.7 },
  desc: { fontSize: 13, lineHeight: 18, opacity: 0.9 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  centerText: { opacity: 0.8, textAlign: 'center' },
  errorTitle: { fontSize: 16, fontWeight: '800' },

  btn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#111',
  },
  btnText: { color: 'white', fontWeight: '700' },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  btnGhostText: { color: '#111' },
});
