import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  quantity: number;
  imageUrl?: string;
  date?: string;
  travelers?: {
    adults: number;
    children: number;
  };
  activityDetails?: {
    activityId: string;
    bookingOptionId: string;
    meetingPoint: string;
    guideLanguage: string;
    departureTime: string;
    departureDate: string;
    hasDiscount: boolean;
    discountPercentage: number;
    originalPrice: number;
    finalPrice: number;
    pickupPoint?: {
      name: string;
      address: string;
    };
    comment?: string;
  };
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItemDetails: (id: string, details: { 
    date?: string; 
    travelers?: { adults: number; children: number };
    meetingPoint?: string;
    comment?: string;
  }) => void;
  clearCart: () => void;
  getTotalItems: () => number; // Retorna cantidad de actividades
  getTotalTravelersInCart: () => number; // Retorna cantidad total de pasajeros
  getTotalPrice: () => number;
  getTotalTravelers: (item: CartItem) => number;
  getItemTotalPrice: (item: CartItem) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  // Cargar items desde localStorage al inicializar
  const loadItemsFromStorage = (): CartItem[] => {
    try {
      const storedItems = localStorage.getItem('cartItems');
      if (storedItems) {
        return JSON.parse(storedItems);
      }
    } catch (error) {
      console.error('Error loading cart items from localStorage:', error);
    }
    return [];
  };

  const [items, setItems] = useState<CartItem[]>(loadItemsFromStorage);

  // Persistir items en localStorage cada vez que cambien
  useEffect(() => {
    try {
      localStorage.setItem('cartItems', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart items to localStorage:', error);
    }
  }, [items]);

  // Función para calcular la cantidad total de personas (adultos + niños)
  const getTotalTravelers = (item: CartItem): number => {
    if (!item.travelers) return 1; // Fallback si no hay información de viajeros
    return item.travelers.adults + item.travelers.children;
  };

  // Función para calcular el precio total basado en viajeros
  const getItemTotalPrice = (item: CartItem): number => {
    const totalTravelers = getTotalTravelers(item);
    return item.price * totalTravelers;
  };

  const addItem = (item: CartItem) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(i => i.id === item.id);
      if (existingItem) {
        // Si el item ya existe, actualizar la cantidad basada en viajeros
        const totalTravelers = getTotalTravelers(item);
        return prevItems.map(i =>
          i.id === item.id
            ? { ...i, quantity: totalTravelers }
            : i
        );
      }
      // Si es un item nuevo, establecer la cantidad basada en viajeros
      const totalTravelers = getTotalTravelers(item);
      return [...prevItems, { ...item, quantity: totalTravelers }];
    });
  };

  const removeItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const updateItemDetails = (id: string, details: { 
    date?: string; 
    travelers?: { adults: number; children: number };
    meetingPoint?: string;
    comment?: string;
  }) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id 
          ? { 
              ...item, 
              date: details.date !== undefined ? details.date : item.date,
              travelers: details.travelers !== undefined ? details.travelers : item.travelers,
              // Actualizar la cantidad basada en el nuevo número de viajeros
              quantity: details.travelers ? details.travelers.adults + details.travelers.children : item.quantity,
              // Actualizar activityDetails si hay cambios
              activityDetails: item.activityDetails ? {
                ...item.activityDetails,
                meetingPoint: details.meetingPoint !== undefined ? details.meetingPoint : item.activityDetails.meetingPoint,
                comment: details.comment !== undefined ? details.comment : item.activityDetails.comment
              } : item.activityDetails
            } 
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem('cartItems');
    } catch (error) {
      console.error('Error clearing cart from localStorage:', error);
    }
  };

  const getTotalItems = () => {
    // Retorna la cantidad de actividades agregadas, no la cantidad de pasajeros
    return items.length;
  };

  const getTotalTravelersInCart = () => {
    // Retorna la cantidad total de pasajeros en el carrito
    return items.reduce((total, item) => total + getTotalTravelers(item), 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + getItemTotalPrice(item), 0);
  };

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    updateItemDetails,
    clearCart,
    getTotalItems,
    getTotalTravelersInCart,
    getTotalPrice,
    getTotalTravelers,
    getItemTotalPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
