import type { CartItem } from '../../../../types';

interface CartItemRowProps {
  item: CartItem;
  itemTotal: number;
  discountRate: number;
  onRemove: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
}

export function CartItemRow({
  item,
  itemTotal,
  discountRate,
  onRemove,
  onIncrease,
  onDecrease
}: CartItemRowProps) {
  return (
    <div className="border-b pb-3 last:border-b-0">
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-gray-900 flex-1">{item.product.name}</h4>
        <button 
          onClick={onRemove} 
          className="text-gray-400 hover:text-red-500 ml-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={onDecrease} 
            className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
          >
            <span className="text-xs">−</span>
          </button>
          <span className="mx-3 text-sm font-medium w-8 text-center">{item.quantity}</span>
          <button 
            onClick={onIncrease} 
            className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
          >
            <span className="text-xs">+</span>
          </button>
        </div>
        <div className="text-right">
          {discountRate > 0 && (
            <span className="text-xs text-red-500 font-medium block">-{discountRate}%</span>
          )}
          <p className="text-sm font-medium text-gray-900">
            {Math.round(itemTotal).toLocaleString()}원
          </p>
        </div>
      </div>
    </div>
  );
}

