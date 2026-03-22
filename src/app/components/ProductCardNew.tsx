import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { TrendingDown, Clock, Package, Zap, Flame } from 'lucide-react';
import { Product } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'motion/react';
import { PriceAnimation } from './PriceAnimation';
import { formatNumberAmount } from '@/i18n/format';
import { getDateFnsLocale } from '@/i18n/dateLocale';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

interface ProductCardNewProps {
  product: Product;
  /** realtime: метка времени обновления цены */
  priceBumpAt?: number;
}

export function ProductCardNew({ product, priceBumpAt }: ProductCardNewProps) {
  const { t, i18n } = useTranslation();
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (!priceBumpAt) return;
    setBump(true);
    const timer = window.setTimeout(() => setBump(false), 1400);
    return () => window.clearTimeout(timer);
  }, [priceBumpAt]);

  const priceDropPercent = product.oldPrice
    ? Math.round(((product.oldPrice - product.currentPrice) / product.oldPrice) * 100)
    : 0;

  const isLowStock = product.stock < 20;
  const isPriceDropped = priceDropPercent > 0;
  const isHot = priceDropPercent > 20;

  const tier = product.wholesalePrices[1] ?? product.wholesalePrices[0];
  const dateLocale = getDateFnsLocale(i18n.language);

  return (
    <Link to={`/product/${product.id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className={`group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all overflow-hidden border h-full flex flex-col ${
          bump ? 'border-amber-400 ring-2 ring-amber-300/60' : 'border-gray-100'
        }`}
      >
        <div className="relative overflow-hidden">
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            src={product.image}
            alt={product.name}
            className="w-full h-56 object-cover"
          />

          <div className="absolute top-3 left-3 right-3 flex justify-between items-start gap-2">
            {isPriceDropped && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`${
                      isHot
                        ? 'bg-gradient-to-r from-red-600 to-orange-500'
                        : 'bg-gradient-to-r from-emerald-600 to-emerald-500'
                    } text-white px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-lg cursor-default`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span>-{priceDropPercent}%</span>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom">{t('productCard.discountBadgeHint')}</TooltipContent>
              </Tooltip>
            )}

            {isHot && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-lg ml-auto cursor-default"
                  >
                    <Flame className="w-3.5 h-3.5 fill-white" />
                    {t('productCard.top')}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom">{t('productCard.topHint')}</TooltipContent>
              </Tooltip>
            )}

            {isLowStock && !isHot && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-purple-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg ml-auto cursor-default">
                    {t('productCard.lowStock')}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">{t('productCard.lowStockHint')}</TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {product.category}
          </div>

          <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 leading-snug min-h-[3rem] flex-1">
            {product.name}
          </h3>

          <div className="mb-3">
            <div className="flex items-baseline gap-2 mb-1">
              <PriceAnimation
                value={product.currentPrice}
                previousValue={product.oldPrice}
                className="text-2xl font-bold text-emerald-600"
                showChange={false}
              />
            </div>

            {product.oldPrice && product.oldPrice > product.currentPrice && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 line-through">
                  {formatNumberAmount(product.oldPrice, i18n.language)} {t('common.currency')}
                </span>
                <span className="text-xs font-semibold text-emerald-600">
                  {t('productCard.benefit', {
                    amount: formatNumberAmount(product.oldPrice - product.currentPrice, i18n.language),
                    currency: t('common.currency'),
                  })}
                </span>
              </div>
            )}
          </div>

          <div
            className={`flex items-center gap-1.5 text-sm mb-3 px-3 py-2 rounded-lg ${
              isLowStock ? 'bg-orange-50 text-orange-700' : 'bg-gray-50 text-gray-600'
            }`}
          >
            <Package className="w-4 h-4" />
            <span className="font-medium">
              {isLowStock ? t('productCard.stockLeft') : t('productCard.inStock')}{' '}
              {formatNumberAmount(product.stock, i18n.language)} {t('productCard.unitsShort')}
            </span>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3 mb-3 cursor-default">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700">
                    {t('productCard.wholesaleTitle')}
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  {t('productCard.wholesaleFrom', {
                    price: formatNumberAmount(tier.price, i18n.language),
                    currency: t('common.currency'),
                    min: tier.min,
                    units: t('productCard.unitsShort'),
                  })}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">{t('productCard.wholesaleHint')}</TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-3 border-t border-gray-100">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {t('productCard.updated')}{' '}
              {formatDistanceToNow(product.lastUpdate, {
                addSuffix: true,
                locale: dateLocale,
              })}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
