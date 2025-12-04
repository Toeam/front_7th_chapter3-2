import { useState, useCallback } from 'react';
import type { Coupon } from '../types';
import { AdminPage } from './components/ui/AdminPage';
import { CartPage } from './components/ui/CartPage';
import { useCart } from './hooks/useCart';
import { useProducts, type ProductWithUI } from './hooks/useProducts';
import { useCoupons } from './hooks/useCoupons';
import { useNotifications } from './hooks/useNotifications';

// 초기 데이터
const initialProducts: ProductWithUI[] = [
  {
    id: 'p1',
    name: '상품1',
    price: 10000,
    stock: 20,
    discounts: [
      { quantity: 10, rate: 0.1 },
      { quantity: 20, rate: 0.2 }
    ],
    description: '최고급 품질의 프리미엄 상품입니다.'
  },
  {
    id: 'p2',
    name: '상품2',
    price: 20000,
    stock: 20,
    discounts: [
      { quantity: 10, rate: 0.15 }
    ],
    description: '다양한 기능을 갖춘 실용적인 상품입니다.',
    isRecommended: true
  },
  {
    id: 'p3',
    name: '상품3',
    price: 30000,
    stock: 20,
    discounts: [
      { quantity: 10, rate: 0.2 },
      { quantity: 30, rate: 0.25 }
    ],
    description: '대용량과 고성능을 자랑하는 상품입니다.'
  }
];

// 초기 쿠폰 데이터
const initialCoupons: Coupon[] = [
  {
    name: '5000원 할인',
    code: 'AMOUNT5000',
    discountType: 'amount',
    discountValue: 5000
  },
  {
    name: '10% 할인',
    code: 'PERCENT10',
    discountType: 'percentage',
    discountValue: 10
  }
];

const App = () => {

  const {
    products,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    filteredProducts,
    editingProduct,
    setEditingProduct,
    productForm,
    setProductForm,
    addProduct,
    updateProduct,
    deleteProduct,
    startEditProduct,
  } = useProducts({ initialProducts });

  const {
    cart,
    selectedCoupon,
    setSelectedCoupon,
    totals,
    totalItemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    getRemainingStock,
    calculateItemTotal,
    clearCart,
  } = useCart();

  const { coupons, addCoupon, deleteCoupon } = useCoupons({ initialCoupons });

  const [isAdmin, setIsAdmin] = useState(false);
  const { notifications, addNotification, removeNotification } = useNotifications();
  // 쿠폰 폼 표시 여부
  const [showCouponForm, setShowCouponForm] = useState(false);
  // 활성화된 탭
  const [activeTab, setActiveTab] = useState<'products' | 'coupons'>('products');
  // 상품 폼 표시 여부
  const [showProductForm, setShowProductForm] = useState(false);
  const [couponForm, setCouponForm] = useState({
    name: '',
    code: '',
    discountType: 'amount' as 'amount' | 'percentage',
    discountValue: 0
  });

//가격 포맷팅
  const formatPrice = (price: number, productId?: string): string => {
    if (productId) {
      const product = products.find(p => p.id === productId);
      if (product && getRemainingStock(product) <= 0) {
        return 'SOLD OUT';
      }
    }

    if (isAdmin) {
      return `${price.toLocaleString()}원`;
    }
    
    return `₩${price.toLocaleString()}`;
  };

  // 쿠폰 적용 (비즈니스 규칙 + useCart 상태 조합)
  const applyCoupon = useCallback((coupon: Coupon) => {
    const currentTotal = totals.totalAfterDiscount;
    
    if (currentTotal < 10000 && coupon.discountType === 'percentage') {
      addNotification('percentage 쿠폰은 10,000원 이상 구매 시 사용 가능합니다.', 'error');
      return;
    }

    setSelectedCoupon(coupon);
    addNotification('쿠폰이 적용되었습니다.', 'success');
  }, [addNotification, totals, setSelectedCoupon]);

  // 주문 완료
  const completeOrder = useCallback(() => {
    const orderNumber = `ORD-${Date.now()}`;
    addNotification(`주문이 완료되었습니다. 주문번호: ${orderNumber}`, 'success');
    clearCart();
  }, [addNotification, clearCart]);

  // 상품 추가
  const addProductWithToast = useCallback(
    (newProduct: Omit<ProductWithUI, 'id'>) => {
      addProduct(newProduct);
      addNotification('상품이 추가되었습니다.', 'success');
    },
    [addProduct, addNotification]
  );

  const updateProductWithToast = useCallback(
    (productId: string, updates: Partial<ProductWithUI>) => {
      updateProduct(productId, updates);
      addNotification('상품이 수정되었습니다.', 'success');
    },
    [updateProduct, addNotification]
  );

  const addCouponWithToast = useCallback(
    (newCoupon: Coupon) => {
      const result = addCoupon(newCoupon);
      if (!result.ok && result.reason === 'DUPLICATE_CODE') {
        addNotification('이미 존재하는 쿠폰 코드입니다.', 'error');
        return;
      }
      addNotification('쿠폰이 추가되었습니다.', 'success');
    },
    [addCoupon, addNotification]
  );

  // 상품 수정 시작 시 폼을 열어주는 래퍼
  const startEditProductWithForm = useCallback(
    (product: ProductWithUI) => {
      startEditProduct(product);
      setShowProductForm(true);
    },
    [startEditProduct, setShowProductForm]
  );

  // 장바구니 수량 변경 + 재고 초과 알림 처리
  const updateQuantityWithToast = useCallback(
    (productId: string, newQuantity: number) => {
      const result = updateQuantity(productId, newQuantity);

      if (!result.ok && result.reason === 'EXCEED_STOCK') {
        const product = products.find(p => p.id === productId);
        if (product) {
          const maxStock = product.stock;
          addNotification(`재고는 ${maxStock}개까지만 있습니다.`, 'error');
        }
      }
    },
    [updateQuantity, products, addNotification]
  );

  // 장바구니 담기 + 알림 처리
  const addToCartWithToast = useCallback(
    (product: ProductWithUI) => {
      const result = addToCart(product);

      if (result.ok) {
        addNotification('장바구니에 담았습니다', 'success');
      } else if (result.reason === 'OUT_OF_STOCK') {
        addNotification('재고가 부족합니다!', 'error');
      } else if (result.reason === 'EXCEED_STOCK') {
        const maxStock = product.stock;
        addNotification(`재고는 ${maxStock}개까지만 있습니다.`, 'error');
      }
    },
    [addToCart, addNotification]
  );

  // 상품 제출
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct && editingProduct !== 'new') {
      updateProductWithToast(editingProduct, productForm);
      setEditingProduct(null);
    } else {
      addProductWithToast({
        ...productForm,
        discounts: productForm.discounts
      });
    }
    setProductForm({ name: '', price: 0, stock: 0, description: '', discounts: [] });
    setEditingProduct(null);
    setShowProductForm(false);
  };

  // 쿠폰 제출
  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCouponWithToast(couponForm);
    setCouponForm({
      name: '',
      code: '',
      discountType: 'amount',
      discountValue: 0
    });
    setShowCouponForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-4 rounded-md shadow-md text-white flex justify-between items-center ${
                notif.type === 'error' ? 'bg-red-600' : 
                notif.type === 'warning' ? 'bg-yellow-600' : 
                'bg-green-600'
              }`}
            >
              <span className="mr-2">{notif.message}</span>
              <button 
                onClick={() => removeNotification(notif.id)}
                className="text-white hover:text-gray-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center flex-1">
              <h1 className="text-xl font-semibold text-gray-800">SHOP</h1>
              {!isAdmin && (
                <div className="ml-8 flex-1 max-w-md">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="상품 검색..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>
            <nav className="flex items-center space-x-4">
              <button
                onClick={() => setIsAdmin(!isAdmin)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  isAdmin 
                    ? 'bg-gray-800 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {isAdmin ? '쇼핑몰로 돌아가기' : '관리자 페이지로'}
              </button>
              {!isAdmin && (
                <div className="relative">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {totalItemCount}
                    </span>
                  )}
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isAdmin ? (
          <AdminPage
            products={products}
            coupons={coupons}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            showProductForm={showProductForm}
            setShowProductForm={setShowProductForm}
            editingProduct={editingProduct}
            setEditingProduct={setEditingProduct}
            productForm={productForm}
            setProductForm={setProductForm}
            couponForm={couponForm}
            setCouponForm={setCouponForm}
            showCouponForm={showCouponForm}
            setShowCouponForm={setShowCouponForm}
            formatPrice={formatPrice}
            startEditProduct={startEditProductWithForm}
            deleteProduct={deleteProduct}
            handleProductSubmit={handleProductSubmit}
            handleCouponSubmit={handleCouponSubmit}
            deleteCoupon={deleteCoupon}
            addNotification={addNotification}
          />
        ) : (
          <CartPage
            products={products}
            filteredProducts={filteredProducts}
            debouncedSearchTerm={debouncedSearchTerm}
            cart={cart}
            coupons={coupons}
            selectedCoupon={selectedCoupon}
            totals={totals}
            formatPrice={formatPrice}
            getRemainingStock={getRemainingStock}
            addToCart={addToCartWithToast}
            calculateItemTotal={calculateItemTotal}
            removeFromCart={removeFromCart}
            updateQuantity={updateQuantityWithToast}
            applyCoupon={applyCoupon}
            setSelectedCoupon={setSelectedCoupon}
            completeOrder={completeOrder}
          />
        )}
      </main>
    </div>
  );
};

export default App;