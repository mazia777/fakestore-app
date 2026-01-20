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
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type UiState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: Product[] };

type SortKey = 'none' | 'price_asc' | 'price_desc' | 'title_asc' | 'title_desc';

export default function ProductsScreen() {
  const router = useRouter();

  const [state, setState] = useState<UiState>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [sort, setSort] = useState<SortKey>('none');

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
    for (const p of products) if (p.category) set.add(p.category);
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const filteredAndSorted = useMemo(() => {
    const q = query.trim().toLowerCase();

    const base = products.filter((p) => {
      const matchesCategory = category === 'All' ? true : p.category === category;
      const matchesQuery =
        q.length === 0
          ? true
          : (p.title ?? '').toLowerCase().includes(q) ||
            (p.description ?? '').toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });

    const arr = [...base];

    switch (sort) {
      case 'price_asc':
        arr.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price_desc':
        arr.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'title_asc':
        arr.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
        break;
      case 'title_desc':
        arr.sort((a, b) => (b.title ?? '').localeCompare(a.title ?? ''));
        break;
      default:
        break;
    }

    return arr;
  }, [products, query, category, sort]);

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
    setSort('none');
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

  const Header = (
    <View style={styles.header}>
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

      {/* Categories (wrap => pas de scrollbar web) */}
      <View style={styles.chipsWrap}>
        {categories.map((c) => {
          const active = c === category;
          return (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                {c}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Count + sort (wrap) */}
      <View style={styles.topBar}>
        <Text style={styles.countText}>Résultats : {filteredAndSorted.length}</Text>

        <View style={styles.sortWrap}>
          <Pressable
            onPress={() => setSort('none')}
            style={[styles.sortBtn, sort === 'none' && styles.sortBtnActive]}
          >
            <Text style={[styles.sortText, sort === 'none' && styles.sortTextActive]}>
              Default
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSort(sort === 'price_asc' ? 'price_desc' : 'price_asc')}
            style={[
              styles.sortBtn,
              (sort === 'price_asc' || sort === 'price_desc') && styles.sortBtnActive,
            ]}
          >
            <Text
              style={[
                styles.sortText,
                (sort === 'price_asc' || sort === 'price_desc') && styles.sortTextActive,
              ]}
            >
              Prix {sort === 'price_asc' ? '↑' : sort === 'price_desc' ? '↓' : ''}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSort(sort === 'title_asc' ? 'title_desc' : 'title_asc')}
            style={[
              styles.sortBtn,
              (sort === 'title_asc' || sort === 'title_desc') && styles.sortBtnActive,
            ]}
          >
            <Text
              style={[
                styles.sortText,
                (sort === 'title_asc' || sort === 'title_desc') && styles.sortTextActive,
              ]}
            >
              A-Z {sort === 'title_asc' ? '↑' : sort === 'title_desc' ? '↓' : ''}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={filteredAndSorted}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListHeaderComponent={Header}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptyText}>Essaie de changer la catégorie ou la recherche.</Text>
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

  header: { paddingTop: 12 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
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

  chipsWrap: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  chipActive: { backgroundColor: '#111', borderColor: '#111' },
  chipText: { fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: 'white' },

  topBar: { paddingHorizontal: 12, paddingBottom: 10, gap: 10 },
  countText: { fontWeight: '800' },
  sortWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  sortBtnActive: { backgroundColor: '#111', borderColor: '#111' },
  sortText: { fontSize: 12, fontWeight: '800' },
  sortTextActive: { color: 'white' },

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
  centerText: { opacity: 0.8, textAlign: 'center' },
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

  empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { opacity: 0.8, textAlign: 'center' },
});
