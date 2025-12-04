import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CartItem, Coupon, Product } from '../../types';

interface UseCartOptions {
  initialCart?: CartItem[];
  initialSelectedCoupon?: Coupon | null;
}

export function useCart(options: UseCartOptions = {}) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (options.initialCart) return options.initialCart;
    const saved = localStorage.getItem('cart');
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(
    options.initialSelectedCoupon ?? null
  );

  // 장바구니 로컬스토리지 동기화
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('cart');
    }
  }, [cart]);

  const getRemainingStock = useCallback(
    (product: Product): number => {
      const cartItem = cart.find(item => item.product.id === product.id);
      const remaining = product.stock - (cartItem?.quantity || 0);
      return remaining;
    },
    [cart]
  );

  const getMaxApplicableDiscount = useCallback(
    (item: CartItem): number => {
      const { discounts } = item.product;
      const { quantity } = item;

      const baseDiscount = discounts.reduce((maxDiscount, discount) => {
        return quantity >= discount.quantity && discount.rate > maxDiscount
          ? discount.rate
          : maxDiscount;
      }, 0);

      const hasBulkPurchase = cart.some(cartItem => cartItem.quantity >= 10);
      if (hasBulkPurchase) {
        return Math.min(baseDiscount + 0.05, 0.5);
      }

      return baseDiscount;
    },
    [cart]
  );

  // 개별 아이템의 할인 적용 후 총액 계산
  const calculateItemTotal = useCallback(
    (item: CartItem): number => {
      const { price } = item.product;
      const { quantity } = item;
      const discount = getMaxApplicableDiscount(item);

      return Math.round(price * quantity * (1 - discount));
    },
    [getMaxApplicableDiscount]
  );

  const totals = useMemo(() => {
    let totalBeforeDiscount = 0;
    let totalAfterDiscount = 0;

    cart.forEach(item => {
      const itemPrice = item.product.price * item.quantity;
      totalBeforeDiscount += itemPrice;
      totalAfterDiscount += calculateItemTotal(item);
    });

    if (selectedCoupon) {
      if (selectedCoupon.discountType === 'amount') {
        totalAfterDiscount = Math.max(0, totalAfterDiscount - selectedCoupon.discountValue);
      } else {
        totalAfterDiscount = Math.round(
          totalAfterDiscount * (1 - selectedCoupon.discountValue / 100)
        );
      }
    }

    return {
      totalBeforeDiscount: Math.round(totalBeforeDiscount),
      totalAfterDiscount: Math.round(totalAfterDiscount),
    };
  }, [cart, selectedCoupon, calculateItemTotal]);

  const addToCartPure = (cartState: CartItem[], product: Product): CartItem[] => {
    const existingItem = cartState.find(item => item.product.id === product.id);
    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      if (newQuantity > product.stock) {
        return cartState;
      }
      return cartState.map(item =>
        item.product.id === product.id ? { ...item, quantity: newQuantity } : item
      );
    }
    return [...cartState, { product, quantity: 1 }];
  };

  const addToCart = useCallback(
    (product: Product) => {
      const remainingStock = getRemainingStock(product);
      if (remainingStock <= 0) {
        return { ok: false as const, reason: 'OUT_OF_STOCK' as const };
      }

      let exceeded = false;
      setCart(prevCart => {
        const next = addToCartPure(prevCart, product);
        if (next === prevCart) {
          exceeded = true;
        }
        return next;
      });

      if (exceeded) {
        return { ok: false as const, reason: 'EXCEED_STOCK' as const };
      }

      return { ok: true as const };
    },
    [getRemainingStock]
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, newQuantity: number, product?: Product) => {
      if (newQuantity <= 0) {
        setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
        return { ok: true as const };
      }

      if (product && newQuantity > product.stock) {
        return { ok: false as const, reason: 'EXCEED_STOCK' as const };
      }

      setCart(prevCart =>
        prevCart.map(item =>
          item.product.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
      return { ok: true as const };
    },
    []
  );

  const applyCoupon = useCallback(
    (coupon: Coupon) => {
      setSelectedCoupon(coupon);
    },
    []
  );

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedCoupon(null);
  }, []);

  const totalItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  return {
    cart,
    selectedCoupon,
    setSelectedCoupon,
    totals,
    totalItemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    applyCoupon,
    getRemainingStock,
    calculateItemTotal,
    clearCart,
  };
}


