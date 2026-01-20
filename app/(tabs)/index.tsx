import { getProducts } from '@/src/api/fakestore';
import type { Product } from '@/src/types/fakestore';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type UiState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: Product[] };

export default function ProductsScreen() {
  const router = useRouter();

  const [state, setState] = useState<UiState>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  // NEW: search + filter
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');

  const load = useCallback(async () => {
    try {
      const data = await getProducts();
      setState({ status: 'success', data });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur inconnue';
      setState({ status: 'error', message });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const products = useMemo(() => (state.status === 'success' ? state.data : []), [state]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.category) set.add(p.category);
    }
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = category === 'All' ? true : p.category === category;
      const matchesQuery =
        q.length === 0
          ? true
          : (p.title ?? '').toLowerCase().includes(q) ||
            (p.description ?? '').toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [products, query, category]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const clearFilters = useCallback(() => {
    setQuery('');
    setCategory('All');
  }, []);

  const renderItem = ({ item }: { item: Product }) => (
    <Pressable
      onPress={() => router.push(`/product/${item.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image source={{ uri: item.image }} style={styles.image} resizeMode="contain" />
      <View style={styles.content}>
        <Text numberOfLines={2} style={styles.title}>
          {item.title}
        </Text>
        <Text style={styles.price}>${Number(item.price).toFixed(2)}</Text>
        {!!item.category && <Text style={styles.meta}>{item.category}</Text>}
      </View>
    </Pressable>
  );

  if (state.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.centerText}>Chargement des produits…</Text>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Impossible de charger</Text>
        <Text style={styles.errorMsg}>{state.message}</Text>
        <Pressable style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher un produit…"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        <Pressable style={styles.clearBtn} onPress={clearFilters}>
          <Text style={styles.clearText}>Reset</Text>
        </Pressable>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {categories.map((c) => {
          const active = c === category;
          return (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text
                style={[styles.chipText, active && styles.chipTextActive]}
                numberOfLines={1}
              >
                {c}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptyText}>
              Essaie de changer la catégorie ou la recherche.
            </Text>
            <Pressable style={styles.retryBtn} onPress={clearFilters}>
              <Text style={styles.retryText}>Réinitialiser</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  clearText: { fontWeight: '700' },

  chipsRow: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  chipActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: 'white' },

  listContainer: { paddingHorizontal: 12, paddingBottom: 12 },
  sep: { height: 10 },

  card: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  pressed: { opacity: 0.85 },

  image: { width: 70, height: 70, marginRight: 12 },
  content: { flex: 1, gap: 6 },
  title: { fontSize: 14, fontWeight: '600' },
  price: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 12, opacity: 0.7 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  centerText: { opacity: 0.8 },
  errorTitle: { fontSize: 16, fontWeight: '700' },
  errorMsg: { textAlign: 'center', opacity: 0.8 },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#111',
  },
  retryText: { color: 'white', fontWeight: '700' },

  empty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { opacity: 0.8, textAlign: 'center' },
});
