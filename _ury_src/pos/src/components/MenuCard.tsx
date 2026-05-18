import { FC } from 'react';
import { formatCurrency, cn } from '../lib/utils';
import { t } from '../i18n';

interface MenuCardProps {
  id: string;
  name: string;
  price: number;
  item_image: string | null;
  course?: string;
  item: string;
  /** Max qty to order (available − drafts). Omit prop to hide the stock line (non–stock items). */
  orderable_qty?: number;
  /** Physical on-hand qty from Bin */
  stock_qty?: number;
  onClick?: () => void;
  disabled?: boolean;
}

const MenuCard: FC<MenuCardProps> = ({
  name,
  price,
  item_image,
  course,
  item,
  orderable_qty,
  stock_qty,
  onClick,
  disabled,
}) => {
  const hasAvailable =
    orderable_qty !== undefined &&
    Number.isFinite(orderable_qty) &&
    !Number.isNaN(orderable_qty);
  const hasOnHand =
    stock_qty !== undefined &&
    Number.isFinite(stock_qty) &&
    !Number.isNaN(stock_qty);

  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer min-h-56 flex flex-col",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
      onClick={disabled ? undefined : onClick}
    >
      {/* Image section - fixed height; clip only here so text below is not cut off */}
      <div className="h-24 shrink-0 overflow-hidden rounded-t-lg">
        {item_image ? (
          <img
            src={item_image}
            alt={name}
            className="w-full h-full object-cover filter saturate-75 brightness-95"
            style={{ filter: 'saturate(0.7) brightness(0.95)' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const placeholder = document.createElement('div');
                placeholder.className = 'w-full h-full bg-gray-200 flex items-center justify-center text-2xl text-gray-400 font-medium';
                placeholder.textContent = name.slice(0, 2).toUpperCase();
                parent.insertBefore(placeholder, target);
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-2xl text-gray-400 font-medium">
            {name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Content section - flex grow with fixed padding */}
      <div className="flex-1 p-3 flex flex-col">
        {/* Name section - fixed height for 2 lines */}
        <div className="">
          <h3 className="font-medium text-gray-900 text-sm leading-5 line-clamp-2" title={name}>
            {name}
          </h3>
        </div>

        {/* Course + stock summary (always visible region) */}
        <div className="mt-1 space-y-0.5">
          <p className="text-[11px] text-gray-700 tabular-nums truncate" title={item}>
            {t('menu.available_for_order')}:{' '}
            {hasAvailable
              ? Number(orderable_qty).toLocaleString(undefined, { maximumFractionDigits: 2 })
              : '--'}
          </p>
          <p className="text-[11px] text-gray-500 tabular-nums truncate" title={item}>
            {t('menu.stock_on_hand')}:{' '}
            {hasOnHand
              ? Number(stock_qty).toLocaleString(undefined, { maximumFractionDigits: 2 })
              : '--'}
          </p>
          <p className="text-xs text-gray-400 truncate" title={course}>
            {course || ' '}
          </p>
        </div>

        {/* Price section - pushed to bottom */}
        <div className="mt-auto pt-2 space-y-0.5 shrink-0">
          <span className="text-sm font-semibold text-gray-900 tabular-nums">
            {formatCurrency(price)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MenuCard; 