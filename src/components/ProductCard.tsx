import type { Product } from '@/src/types/fakestore';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  product: Product;
  onPress?: () => void;
};

export function ProductCard({ product, onPress }: Props) {
  const price = Number(product.price);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.pressed : null]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: product.image }} style={styles.image} resizeMode="contain" />
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text numberOfLines={2} style={styles.title}>
            {product.title}
          </Text>
          <Text style={styles.price}>${Number.isFinite(price) ? price.toFixed(2) : '—'}</Text>
        </View>

        {!!product.category && (
          <View style={styles.badge}>
            <Text style={styles.badgeText} numberOfLines={1}>
              {product.category}
            </Text>
          </View>
        )}

        {!!product.description && (
          <Text numberOfLines={2} style={styles.description}>
            {product.description}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  pressed: { opacity: 0.85 },

  imageWrap: {
    width: 74,
    height: 74,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  image: { width: 62, height: 62 },

  content: { flex: 1, gap: 8 },
  headerRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  title: { flex: 1, fontSize: 14, fontWeight: '700' },
  price: { fontSize: 14, fontWeight: '800' },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  badgeText: { fontSize: 12, fontWeight: '700', opacity: 0.8 },

  description: { fontSize: 12, opacity: 0.75, lineHeight: 16 },
});
