import React from 'react';
import { Coupon, Product } from '../../../types';
import { ProductAdminFeature } from '../features/product/ProductAdminFeature';
import { CouponAdminFeature } from '../features/coupon/CouponAdminFeature';

interface ProductWithUI extends Product {
  description?: string;
  isRecommended?: boolean;
}

interface DiscountFormValue {
  quantity: number;
  rate: number;
}

interface ProductFormState {
  name: string;
  price: number;
  stock: number;
  description: string;
  discounts: DiscountFormValue[];
}

interface CouponFormState {
  name: string;
  code: string;
  discountType: 'amount' | 'percentage';
  discountValue: number;
}

type TabType = 'products' | 'coupons';

interface AdminPageProps {
  products: ProductWithUI[];
  coupons: Coupon[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  showProductForm: boolean;
  setShowProductForm: (value: boolean) => void;
  editingProduct: string | null;
  setEditingProduct: (value: string | null) => void;
  productForm: ProductFormState;
  setProductForm: React.Dispatch<React.SetStateAction<ProductFormState>>;
  couponForm: CouponFormState;
  setCouponForm: React.Dispatch<React.SetStateAction<CouponFormState>>;
  showCouponForm: boolean;
  setShowCouponForm: (value: boolean) => void;
  formatPrice: (price: number, productId?: string) => string;
  startEditProduct: (product: ProductWithUI) => void;
  deleteProduct: (productId: string) => void;
  handleProductSubmit: (e: React.FormEvent) => void;
  handleCouponSubmit: (e: React.FormEvent) => void;
  deleteCoupon: (couponCode: string) => void;
  addNotification: (message: string, type?: 'error' | 'success' | 'warning') => void;
}

export function AdminPage({
  products,
  coupons,
  activeTab,
  setActiveTab,
  showProductForm,
  setShowProductForm,
  editingProduct,
  setEditingProduct,
  productForm,
  setProductForm,
  couponForm,
  setCouponForm,
  showCouponForm,
  setShowCouponForm,
  formatPrice,
  startEditProduct,
  deleteProduct,
  handleProductSubmit,
  handleCouponSubmit,
  deleteCoupon,
  addNotification
}: AdminPageProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-gray-600 mt-1">상품과 쿠폰을 관리할 수 있습니다</p>
      </div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button 
            onClick={() => setActiveTab('products')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'products' 
                ? 'border-gray-900 text-gray-900' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            상품 관리
          </button>
          <button 
            onClick={() => setActiveTab('coupons')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'coupons' 
                ? 'border-gray-900 text-gray-900' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            쿠폰 관리
          </button>
        </nav>
      </div>

      {activeTab === 'products' ? (
        <ProductAdminFeature
          products={products}
          formatPrice={formatPrice}
          showProductForm={showProductForm}
          setShowProductForm={setShowProductForm}
          editingProduct={editingProduct}
          setEditingProduct={setEditingProduct}
          productForm={productForm}
          setProductForm={setProductForm}
          startEditProduct={startEditProduct}
          deleteProduct={deleteProduct}
          handleProductSubmit={handleProductSubmit}
          addNotification={addNotification}
        />
      ) : (
        <CouponAdminFeature
          coupons={coupons}
          showCouponForm={showCouponForm}
          setShowCouponForm={setShowCouponForm}
          couponForm={couponForm}
          setCouponForm={setCouponForm}
          deleteCoupon={deleteCoupon}
          handleCouponSubmit={handleCouponSubmit}
          addNotification={addNotification}
        />
      )}
    </div>
  );
}

