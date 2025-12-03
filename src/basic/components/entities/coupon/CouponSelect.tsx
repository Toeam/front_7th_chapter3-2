import type { Coupon } from '../../../../types';

interface CouponSelectProps {
  coupons: Coupon[];
  selectedCode: string | null;
  onChange: (code: string | null) => void;
}

export function CouponSelect({ coupons, selectedCode, onChange }: CouponSelectProps) {
  if (coupons.length === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">쿠폰 할인</h3>
        <button className="text-xs text-blue-600 hover:underline">
          쿠폰 등록
        </button>
      </div>
      <select 
        className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
        value={selectedCode || ''}
        onChange={(e) => {
          onChange(e.target.value || null);
        }}
      >
        <option value="">쿠폰 선택</option>
        {coupons.map(coupon => (
          <option key={coupon.code} value={coupon.code}>
            {coupon.name} ({coupon.discountType === 'amount' 
              ? `${coupon.discountValue.toLocaleString()}원` 
              : `${coupon.discountValue}%`})
          </option>
        ))}
      </select>
    </section>
  );
}

