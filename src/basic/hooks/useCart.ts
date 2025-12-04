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

  // 현재 cart 상태 값이 필요함
  const getMaxApplicableDiscount = (item: CartItem, cart: CartItem[]): number => {
      // 상품의 할인 정보를 가져옴
      const { discounts } = item.product;
      // 상품의 수량을 가져옴
      const { quantity } = item;
      // 상품의 할인 정보를 가져옴

      //최대 할인율 계산 
      const baseDiscount = discounts.reduce((maxDiscount, discount) => {
        return quantity >= discount.quantity && discount.rate > maxDiscount
          ? discount.rate
          : maxDiscount;
      }, 0);

      const hasBulkPurchase = cart.some((cartItem: CartItem) => cartItem.quantity >= 10);
      if (hasBulkPurchase) {
        return Math.min(baseDiscount + 0.05, 0.5);
      }
      return baseDiscount;
    };

  // 개별 아이템의 할인 적용 후 총액 계산 (순수 함수)
  const calculateItemTotalPure = (item: CartItem, cartItems: CartItem[]): number => {
    const { price } = item.product;
    const { quantity } = item;
    const discount = getMaxApplicableDiscount(item, cartItems);

    return Math.round(price * quantity * (1 - discount));
  };

  // 총합 도출에 대한 계산식 모음
  const calculateCartTotals = (
    cartItems: CartItem[],
    coupon: Coupon | null
  ): { totalBeforeDiscount: number; totalAfterDiscount: number } => {
    let totalBeforeDiscount = 0;
    let totalAfterDiscount = 0;

    cartItems.forEach(item => {
      // 장바구니의 총액
      const itemPrice = item.product.price * item.quantity;

      // 할인 전 총액
      totalBeforeDiscount += itemPrice;

      // 할인 후 총액
      totalAfterDiscount += calculateItemTotalPure(item, cartItems);
    });

    if (coupon) {
      if (coupon.discountType === 'amount') {
        totalAfterDiscount = Math.max(0, totalAfterDiscount - coupon.discountValue);
      } else {
        totalAfterDiscount = Math.round(
          totalAfterDiscount * (1 - coupon.discountValue / 100)
        );
      }
    }

    return {
      totalBeforeDiscount: Math.round(totalBeforeDiscount),
      totalAfterDiscount: Math.round(totalAfterDiscount),
    };
  };

  // 계산만 도출
  const totals = useMemo(() => {
    return calculateCartTotals(cart, selectedCoupon);
  }, [cart, selectedCoupon]);

  // 현재 cart 상태를 사용하는 calculateItemTotal 래퍼 (UI에서 사용)
  const calculateItemTotal = useCallback(
    (item: CartItem): number => calculateItemTotalPure(item, cart),
    [cart]
  );

  // 장바구니 삼품 추가 순수계산
  const addItemToCart = (cartState: CartItem[], product: Product): CartItem[] => {
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
        const next = addItemToCart(prevCart, product);
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
    (productId: string, newQuantity: number) => {
      if (newQuantity <= 0) {
        setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
        return { ok: true as const };
      }

      const targetItem = cart.find(item => item.product.id === productId);
      if (!targetItem) {
        return { ok: false as const, reason: 'NOT_FOUND' as const };
      }

      const maxStock = targetItem.product.stock;
      if (newQuantity > maxStock) {
        return { ok: false as const, reason: 'EXCEED_STOCK' as const };
      }

      setCart(prevCart =>
        prevCart.map(item =>
          item.product.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );

      return { ok: true as const };
    },
    [cart]
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


