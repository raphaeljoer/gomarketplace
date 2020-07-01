import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { Product } from '../pages/Cart/styles';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storageProducts) {
        setProducts(JSON.parse(storageProducts));
      }
    }
    // AsyncStorage.clear();
    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const newProduct: Product = { ...product, quantity: 1 };
      setProducts([...products, newProduct]);

      await AsyncStorage.setItem(
        `@GoMarketplace:products`,
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProducts = products.map<Product>(product => {
        if (product.id === id) {
          return { ...product, quantity: product.quantity + 1 };
        }
        return product;
      });

      setProducts(newProducts);

      await AsyncStorage.setItem(
        `@GoMarketplace:products`,
        JSON.stringify(products),
      );
    },
    [products],
  );

  const remove = useCallback(
    async id => {
      const newProducts = products.filter(item => item.id !== id);

      setProducts(newProducts);

      await AsyncStorage.setItem(
        `@GoMarketplace:products`,
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const findProduct = products.find(product => product.id === id);

      if (!findProduct) {
        throw new Error('Product not found');
      }

      if (findProduct.quantity <= 1) {
        remove(id);
        return;
      }

      const newProducts = products.map(product => {
        if (product.id === id) {
          const newProduct = { ...product, quantity: product.quantity - 1 };
          return newProduct;
        }
        return product;
      });

      setProducts(newProducts);

      await AsyncStorage.setItem(
        `@GoMarketplace:products`,
        JSON.stringify(products),
      );
    },
    [products, remove],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, remove, products, setProducts }),
    [addToCart, increment, decrement, remove, products, setProducts],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
