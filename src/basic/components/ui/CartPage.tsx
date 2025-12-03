import type { CartItem, Coupon, Product } from '../../../types';
import { ProductCard } from '../entities/product/ProductCard';
import { CartItemRow } from '../entities/cart/CartItemRow';
import { CartSummary } from '../entities/cart/CartSummary';
import { CouponSelect } from '../entities/coupon/CouponSelect';

interface ProductWithUI extends Product {
  description?: string;
  isRecommended?: boolean;
}

interface CartPageProps {
  products: ProductWithUI[];
  filteredProducts: ProductWithUI[];
  debouncedSearchTerm: string;
  cart: CartItem[];
  coupons: Coupon[];
  selectedCoupon: Coupon | null;
  totals: {
    totalBeforeDiscount: number;
    totalAfterDiscount: number;
  };
  formatPrice: (price: number, productId?: string) => string;
  getRemainingStock: (product: Product) => number;
  addToCart: (product: ProductWithUI) => void;
  calculateItemTotal: (item: CartItem) => number;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, newQuantity: number) => void;
  applyCoupon: (coupon: Coupon) => void;
  setSelectedCoupon: (coupon: Coupon | null) => void;
  completeOrder: () => void;
}

export function CartPage({
  products,
  filteredProducts,
  debouncedSearchTerm,
  cart,
  coupons,
  selectedCoupon,
  totals,
  formatPrice,
  getRemainingStock,
  addToCart,
  calculateItemTotal,
  removeFromCart,
  updateQuantity,
  applyCoupon,
  setSelectedCoupon,
  completeOrder
}: CartPageProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        {/* 상품 목록 */}
        <section>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">전체 상품</h2>
            <div className="text-sm text-gray-600">
              총 {products.length}개 상품
            </div>
          </div>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">"{debouncedSearchTerm}"에 대한 검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => {
                const remainingStock = getRemainingStock(product);
                
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    remainingStock={remainingStock}
                    formatPrice={formatPrice}
                    onAddToCart={() => addToCart(product)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
      
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-4">
          <section className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              장바구니
            </h2>
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-gray-500 text-sm">장바구니가 비어있습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => {
                  const itemTotal = calculateItemTotal(item);
                  const originalPrice = item.product.price * item.quantity;
                  const hasDiscount = itemTotal < originalPrice;
                  const discountRate = hasDiscount ? Math.round((1 - itemTotal / originalPrice) * 100) : 0;
                  
                  return (
                    <CartItemRow
                      key={item.product.id}
                      item={item}
                      itemTotal={itemTotal}
                      discountRate={discountRate}
                      onRemove={() => removeFromCart(item.product.id)}
                      onIncrease={() => updateQuantity(item.product.id, item.quantity + 1)}
                      onDecrease={() => updateQuantity(item.product.id, item.quantity - 1)}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {cart.length > 0 && (
            <>
              <CouponSelect
                coupons={coupons}
                selectedCode={selectedCoupon?.code ?? null}
                onChange={(code) => {
                  const coupon = coupons.find(c => c.code === code);
                  if (coupon) applyCoupon(coupon);
                  else setSelectedCoupon(null);
                }}
              />

              <CartSummary
                totals={totals}
                onCompleteOrder={completeOrder}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

