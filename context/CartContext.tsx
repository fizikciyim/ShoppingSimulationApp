import React, { createContext, useContext, useState, ReactNode } from "react";
import { Platform } from "react-native"; // <- bunu ekle
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Product {
  id: string;
  name: string;
  price: number;
  images?: string[]; // ✅ string URL dizisi
  quantity?: number;
}

interface CartContextType {
  cartItems: Product[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void; // <- Bunu ekledik
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [cartItems, setCartItems] = useState<Product[]>([]);

  const addToCart = (product: Product) => {
    // 🔧 her zaman number
    const fixedPrice = Number((product as any).price);

    // 🔧 images => string[] normalizasyonu
    const rawImages: any[] = Array.isArray((product as any).images)
      ? (product as any).images
      : [];

    const normalizedImages: string[] = rawImages
      .map((im) => (typeof im === "string" ? im : im?.uri))
      .filter(Boolean);

    // fallback tekil image alanı varsa onu da ekle
    const singleImage = (product as any).image;
    if (!normalizedImages.length && singleImage) {
      normalizedImages.push(
        typeof singleImage === "string" ? singleImage : singleImage?.uri
      );
    }

    const fixedProduct = {
      ...(product as any),
      price: fixedPrice,
      images: normalizedImages, // ✅ artık her zaman string[]
    };

    setCartItems((prev) => {
      const exists = prev.find((p) => p.id === fixedProduct.id);
      if (exists) {
        return prev.map((p) =>
          p.id === fixedProduct.id
            ? { ...p, quantity: (p.quantity ?? 1) + 1 }
            : p
        );
      } else {
        return [...prev, { ...fixedProduct, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter((p) => p.id !== id));
  };

  const increaseQuantity = (id: string) => {
    setCartItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity: p.quantity! + 1 } : p))
    );
  };
  // CartContext.tsx
  const clearCart = () => {
    setCartItems([]);
    if (Platform.OS === "web") {
      localStorage.removeItem("cart");
    } else {
      AsyncStorage.removeItem("cart").catch(console.warn);
    }
  };

  const decreaseQuantity = (id: string) => {
    setCartItems((prev) =>
      prev
        .map((p) =>
          p.id === id
            ? { ...p, quantity: p.quantity! > 1 ? p.quantity! - 1 : 0 }
            : p
        )
        .filter((p) => p.quantity! > 0)
    );
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
