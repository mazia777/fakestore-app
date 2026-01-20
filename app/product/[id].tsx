import { getProductById, getProductsByCategory } from '@/src/api/fakestore';
import type { Product } from '@/src/types/fakestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';

type UiState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: Product };

export default function ProductDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 980;
  const similarCols = width >= 1320 ? 4 : width >= 980 ? 3 : width >= 640 ? 2 : 1;

  const id = useMemo(() => {
    const raw = params.id;
    const n = typeof raw === 'string' ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  }, [params.id]);

  const [state, setState] = useState<UiState>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const [color, setColor] = useState<string>('Noir');
  const [size, setSize] = useState<string>('M');
  const [qty, setQty] = useState<number>(1);

  const [similar, setSimilar] = useState<Product[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setState({ status: 'error', message: 'ID produit invalide.' });
      return;
    }

    try {
      setState({ status: 'loading' });

      const product = await getProductById(id);
      setState({ status: 'success', data: product });

      const defaults = getDefaultOptions(product.category);
      setColor(defaults.colors[0] ?? 'Noir');
      setSize(defaults.sizes[0] ?? 'M');
      setQty(1);

      if (product.category) {
        setSimilarLoading(true);
        try {
          const list = await getProductsByCategory(product.category);
          setSimilar(list.filter((p) => p.id !== product.id).slice(0, 12));
        } finally {
          setSimilarLoading(false);
        }
      } else {
        setSimilar([]);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur inconnue";
      setState({ status: 'error', message });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  if (state.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.centerText}>Chargement du produit…</Text>
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

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const product = state.data;
  const options = getDefaultOptions(product.category);

  const price = Number(product.price);
  const promo = 20;
  const oldPrice = price ? price / (1 - promo / 100) : null;

  const addToCart = () => {
    alert(
      `Ajouté au panier ✅\n\n${product.title}\nCouleur: ${color}\nTaille: ${size}\nQuantité: ${qty}`,
    );
  };

  const renderSimilar = ({ item }: { item: Product }) => (
    <Pressable
      style={({ pressed }) => [styles.similarCard, pressed && styles.pressed]}
      onPress={() => router.push(`/product/${item.id}`)}
    >
      <View style={styles.similarMedia}>
        <Image source={{ uri: item.image }} style={styles.similarImage} resizeMode="contain" />
      </View>

      <View style={styles.similarBody}>
        <Text style={styles.similarBrand} numberOfLines={1}>
          {(item.category ?? 'FAKESTORE').toUpperCase()}
        </Text>

        <Text style={styles.similarTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {!!item.description && (
          <Text style={styles.similarDesc} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.similarPriceRow}>
          <Text style={styles.similarPrice}>{formatEuro(Number(item.price))}</Text>
        </View>

        <View style={styles.similarCta}>
          <Text style={styles.similarCtaText}>Voir le produit</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={similar}
        key={`cols-${similarCols}`} // important: force re-render quand numColumns change (responsive)
        numColumns={similarCols}
        renderItem={renderSimilar}
        keyExtractor={(item) => String(item.id)}
        columnWrapperStyle={similarCols > 1 ? styles.columnsWrap : undefined}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            {/* TOP DETAIL (responsive) */}
            <View style={[styles.detailWrap, isDesktop ? styles.detailRow : styles.detailCol]}>
              <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
                <Image source={{ uri: product.image }} style={styles.heroImage} resizeMode="contain" />
              </View>

              <View style={[styles.content, isDesktop && styles.contentDesktop]}>
                <Text style={styles.brand}>{(product.category ?? 'FAKESTORE').toUpperCase()}</Text>
                <Text style={styles.title}>{product.title}</Text>

                <View style={styles.priceRow}>
                  <Text style={styles.price}>{formatEuro(price)}</Text>
                  {oldPrice ? <Text style={styles.oldPrice}>{formatEuro(oldPrice)}</Text> : null}
                  <Text style={styles.discount}>-{promo}%</Text>
                </View>

                {!!product.rating?.rate && (
                  <Text style={styles.rating}>
                    ★ {product.rating.rate.toFixed(1)}
                    {product.rating.count ? ` (${product.rating.count})` : ''}
                  </Text>
                )}

                {!!product.description && <Text style={styles.description}>{product.description}</Text>}

                {/* OPTIONS */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Couleur</Text>
                  <View style={styles.chips}>
                    {options.colors.map((c) => {
                      const active = c === color;
                      return (
                        <Pressable
                          key={c}
                          onPress={() => setColor(c)}
                          style={[styles.chip, active && styles.chipActive]}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Taille</Text>
                  <View style={styles.chips}>
                    {options.sizes.map((s) => {
                      const active = s === size;
                      return (
                        <Pressable
                          key={s}
                          onPress={() => setSize(s)}
                          style={[styles.chip, active && styles.chipActive]}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Quantité</Text>
                  <View style={styles.qtyRow}>
                    <Pressable style={styles.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
                      <Text style={styles.qtyBtnText}>-</Text>
                    </Pressable>

                    <Text style={styles.qtyValue}>{qty}</Text>

                    <Pressable style={styles.qtyBtn} onPress={() => setQty((q) => q + 1)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>

                <Pressable style={styles.cta} onPress={addToCart}>
                  <Text style={styles.ctaText}>Ajouter au panier</Text>
                </Pressable>
              </View>
            </View>

            {/* SECTION TITLE LIKE "Composez l'ensemble parfait" */}
            <View style={styles.similarHeader}>
              <Text style={styles.similarHeaderTitle}>Composez l&apos;ensemble parfait</Text>
              {similarLoading ? <ActivityIndicator /> : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.similarEmpty}>
            <Text style={styles.similarEmptyText}>
              {similarLoading ? 'Chargement…' : 'Aucun article similaire.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function getDefaultOptions(category?: string) {
  const c = (category ?? '').toLowerCase();

  if (c.includes('men') || c.includes('women')) {
    return {
      colors: ['Noir', 'Blanc', 'Beige', 'Bleu', 'Vert'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
    };
  }

  if (c.includes('electronics')) {
    return {
      colors: ['Noir', 'Argent', 'Blanc'],
      sizes: ['Standard'],
    };
  }

  if (c.includes('jewel')) {
    return {
      colors: ['Or', 'Argent', 'Rose gold'],
      sizes: ['Unique'],
    };
  }

  return { colors: ['Noir', 'Blanc', 'Beige'], sizes: ['Standard'] };
}

function formatEuro(value: number) {
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  } catch {
    return `${value.toFixed(2)} €`;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f3f4f6' },
  container: { padding: 16, paddingBottom: 28 },

  // states
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 10 },
  centerText: { opacity: 0.8, textAlign: 'center' },
  errorTitle: { fontSize: 16, fontWeight: '900' },
  errorMsg: { textAlign: 'center', opacity: 0.8 },

  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#111',
  },
  retryText: { color: 'white', fontWeight: '900' },

  backBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  backText: { fontWeight: '900' },

  // header + detail layout
  headerWrap: { gap: 16, marginBottom: 14 },
  detailWrap: {
    borderRadius: 18,
    backgroundColor: 'white',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e9e9e9',
  },
  detailRow: { flexDirection: 'row' },
  detailCol: { flexDirection: 'column' },

  hero: {
    backgroundColor: '#f7f7f7',
    alignItems: 'center',
    justifyContent: 'center',
    height: 420,
  },
  heroDesktop: { flex: 1.2, height: 560 },
  heroImage: { width: '86%', height: '86%' },

  content: { padding: 16, gap: 10 },
  contentDesktop: { flex: 1 },

  brand: { fontSize: 12, fontWeight: '900', letterSpacing: 0.4, color: '#111' },
  title: { fontSize: 20, fontWeight: '900', color: '#111', lineHeight: 26 },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
  price: { fontSize: 18, fontWeight: '900', color: '#111' },
  oldPrice: { fontSize: 13, fontWeight: '800', color: '#666', textDecorationLine: 'line-through' },
  discount: { fontSize: 13, fontWeight: '900', color: '#2563eb' },

  rating: { fontSize: 12, fontWeight: '900', opacity: 0.85 },
  description: { fontSize: 13, lineHeight: 18, opacity: 0.85 },

  section: { marginTop: 6, gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '900' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  chipActive: { backgroundColor: '#111', borderColor: '#111' },
  chipText: { fontSize: 12, fontWeight: '900' },
  chipTextActive: { color: 'white' },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 18, fontWeight: '900' },
  qtyValue: { fontSize: 16, fontWeight: '900', minWidth: 24, textAlign: 'center' },

  cta: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#111',
    alignItems: 'center',
  },
  ctaText: { color: 'white', fontWeight: '900', fontSize: 14 },

  // similar section
  similarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  similarHeaderTitle: { fontSize: 18, fontWeight: '900', color: '#111' },

  columnsWrap: { gap: 12 },
  similarCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'white',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e9e9e9',
    marginBottom: 12,
  },
  pressed: { opacity: 0.92 },

  similarMedia: {
    height: 210,
    backgroundColor: '#f7f7f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  similarImage: { width: '86%', height: '86%' },

  similarBody: { padding: 12, gap: 6 },
  similarBrand: { fontSize: 11, fontWeight: '900', opacity: 0.8 },
  similarTitle: { fontSize: 13, fontWeight: '900', color: '#111', lineHeight: 18 },
  similarDesc: { fontSize: 12, opacity: 0.8, lineHeight: 16 },

  similarPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  similarPrice: { fontSize: 14, fontWeight: '900', color: '#111' },

  similarCta: {
    marginTop: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#111',
    alignItems: 'center',
  },
  similarCtaText: { color: 'white', fontWeight: '900', fontSize: 12 },

  similarEmpty: { paddingVertical: 14 },
  similarEmptyText: { opacity: 0.7 },
});
