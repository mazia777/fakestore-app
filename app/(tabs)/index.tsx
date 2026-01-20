import { getProducts } from '@/src/api/fakestore';
import { ProductCard } from '@/src/components/ProductCard';
import type { Product } from '@/src/types/fakestore';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

type UiState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: Product[] };

type SortKey = 'none' | 'price_asc' | 'price_desc' | 'title_asc' | 'title_desc';

export default function ProductsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [state, setState] = useState<UiState>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [sort, setSort] = useState<SortKey>('none');

  const numColumns = useMemo(() => {
    if (width >= 1200) return 4;
    if (width >= 900) return 3;
    if (width >= 650) return 2;
    return 1;
  }, [width]);

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

      const hayTitle = (p.title ?? '').toLowerCase();
      const hayDesc = (p.description ?? '').toLowerCase();
      const matchesQuery = q.length === 0 ? true : hayTitle.includes(q) || hayDesc.includes(q);

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
    <View style={styles.gridItem}>
      <ProductCard product={item} onPress={() => router.push(`/product/${item.id}`)} />
    </View>
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
      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Que recherchez-vous ?"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />

        <Pressable style={styles.clearBtn} onPress={clearFilters}>
          <Text style={styles.clearText}>Reset</Text>
        </Pressable>
      </View>

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
        key={numColumns}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={Header}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptyText}>Change la catégorie ou la recherche.</Text>
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
  screen: { flex: 1, backgroundColor: '#f3f4f6' },

  header: { paddingTop: 12 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  clearText: { fontWeight: '800' },

  chipsWrap: {
    paddingHorizontal: 14,
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
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  chipActive: { backgroundColor: '#111', borderColor: '#111' },
  chipText: { fontSize: 12, fontWeight: '800' },
  chipTextActive: { color: 'white' },

  topBar: { paddingHorizontal: 14, paddingBottom: 12, gap: 10 },
  countText: { fontWeight: '900' },
  sortWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  sortBtnActive: { backgroundColor: '#111', borderColor: '#111' },
  sortText: { fontSize: 12, fontWeight: '900' },
  sortTextActive: { color: 'white' },

  listContainer: {
    paddingHorizontal: 14,
    paddingBottom: 18,
    gap: 14,
  },

  gridRow: { gap: 14, marginBottom: 14 },
  gridItem: { flex: 1, minWidth: 0 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  centerText: { opacity: 0.8, textAlign: 'center' },
  errorTitle: { fontSize: 16, fontWeight: '800' },
  errorMsg: { textAlign: 'center', opacity: 0.8 },

  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#111',
  },
  retryText: { color: 'white', fontWeight: '900' },

  empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '900' },
  emptyText: { opacity: 0.8, textAlign: 'center' },
});
