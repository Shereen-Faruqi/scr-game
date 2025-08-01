import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const GameContext = createContext();

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('gameCart');
      if (savedCart) setCartItems(JSON.parse(savedCart));
    } catch (error) {
      console.error("Failed to parse cart from localStorage:", error);
    }

    try {
      const savedWishlist = localStorage.getItem('gameWishlist');
      if (savedWishlist) setWishlistItems(JSON.parse(savedWishlist));
    } catch (error) {
      console.error("Failed to parse wishlist from localStorage:", error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('gameCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('gameWishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const addToCart = (game) => {
    if (!game || !game.id) return;

    const alreadyInCart = cartItems.some((item) => item.id === game.id);
    if (alreadyInCart) {
      toast.warning(`${game.title} is already in the cart.`);
      return;
    }

    setCartItems(prev => [...prev, {
      ...game,
      type: game.genre || 'Base Game',
      currentPrice: game.price,
      originalPrice: game.originalPrice,
      discount: game.originalPrice
        ? Math.round(((game.originalPrice - game.price) / game.originalPrice) * 100)
        : 0,
      selfRefundable: true,
      rewards: game.rating >= 4.8 ? "Earn a boosted 20% back in Epic Rewards!" : null
    }]);

    toast.success(`${game.title} added to cart!`);
  };

  const addToWishlist = (game) => {
    const existingItem = wishlistItems.find(item => item.id === game.id);
    if (existingItem) {
      toast.error(`${game.title} is already in your wishlist!`);
      return;
    }

    setWishlistItems(prev => [...prev, game]);
    toast.success(`${game.title} added to wishlist!`);
  };

  const removeFromWishlist = (gameId) => {
    const itemToRemove = wishlistItems.find(item => item.id === gameId);
    setWishlistItems(prev => prev.filter(item => item.id !== gameId));
    if (itemToRemove) {
      toast.info(`${itemToRemove.title} removed from wishlist.`);
    }
  };

  const removeFromCart = (gameId) => {
    setCartItems(prev => prev.filter(item => item.id !== gameId));
  };

  const moveToCartFromWishlist = (gameId) => {
    const item = wishlistItems.find(item => item.id === gameId);
    if (item) {
      addToCart(item);
      removeFromWishlist(gameId);
    }
  };

  const moveToWishlistFromCart = (gameId) => {
    const item = cartItems.find(item => item.id === gameId);
    if (item) {
      addToWishlist({
        id: item.id,
        image: item.image,
        title: item.title,
        genre: item.type,
        rating: item.rating,
        price: item.currentPrice,
      });
      removeFromCart(gameId);
    }
  };

  const isInCart = (gameId) => cartItems.some(item => item.id === gameId);
  const isInWishlist = (gameId) => wishlistItems.some(item => item.id === gameId);

  const value = {
    cartItems,
    wishlistItems,
    addToCart,
    removeFromCart,
    addToWishlist,
    removeFromWishlist,
    moveToCartFromWishlist,
    moveToWishlistFromCart,
    isInCart,
    isInWishlist,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
