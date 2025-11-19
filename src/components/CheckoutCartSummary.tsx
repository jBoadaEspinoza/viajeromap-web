import React, { useCallback, useMemo, useState } from 'react';
import CheckoutCartItem, { CheckoutSummaryItem } from './CheckoutCartItem';

interface CheckoutCartSummaryProps {
  title?: string;
  items: CheckoutSummaryItem[];
  language: string;
  onRemoveItem?: (itemId: string) => void;
  onEditLanguage?: (item: CheckoutSummaryItem, languageCode: string, languageName: string) => void;
  onEditMeetingPoint?: (
    item: CheckoutSummaryItem,
    pickupPoint: { id?: number | string | null; name: string; address: string; latitude?: number | null; longitude?: number | null; cityId?: number | null } | null,
    meetingPointName: string,
    meetingAddress: string
  ) => void;
  onEditComment?: (item: CheckoutSummaryItem, comment: string) => void;
  onEditDate?: (item: CheckoutSummaryItem, payload: { date: string; time?: string }) => void;
  onEditTravelers?: (item: CheckoutSummaryItem, travelers: { adults: number; children: number }) => void;
}

interface PricingOverride {
  discountedTotal: number;
  regularTotal: number;
  discountedUnitPrice: number;
  baseUnitPrice: number;
  currency: string;
  hasDiscount: boolean;
  travelerCount: number;
  specialOfferPercentage: number | null;
}

const getTravelerCount = (item: CheckoutSummaryItem) => {
  // Usar participants si está disponible, si no calcular desde travelers
  return Math.max(item.participants ?? ((item.travelers?.adults ?? 0) + (item.travelers?.children ?? 0)), 1);
};

const getFallbackTotal = (item: CheckoutSummaryItem) => {
  // Usar totalPrice directamente si está disponible (ya viene calculado desde la API)
  if (typeof item.totalPrice === 'number' && item.totalPrice > 0) {
    return item.totalPrice;
  }
  // Solo calcular como fallback si no hay totalPrice
  const travelerCount = getTravelerCount(item);
  const unitPrice = item.unitPrice ?? 0;
  return unitPrice * travelerCount;
};

const CheckoutCartSummary: React.FC<CheckoutCartSummaryProps> = ({ title, items, language, onRemoveItem, onEditLanguage, onEditMeetingPoint, onEditComment, onEditDate, onEditTravelers }) => {
  const [pricingOverrides, setPricingOverrides] = useState<Record<string, PricingOverride>>({});
  const resolvedTitle = title === undefined || title === null ?  "" : title;
  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-PE' : 'en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value || 0);
  };

  const formatDate = (date?: string) => {
    if (!date) return language === 'es' ? 'Sin fecha' : 'No date';
    try {
      const [year, month, day] = date.split('-').map(Number);
      const parsed = new Date(year || 1970, (month || 1) - 1, day || 1);
      return parsed.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return date;
    }
  };

  const formatTravelers = (item: CheckoutSummaryItem) => {
    const parts: string[] = [];
    parts.push(`${item.travelers.adults} ${language === 'es' ? 'adulto(s)' : 'adult(s)'}`);
    if (item.travelers.children > 0) {
      parts.push(`${item.travelers.children} ${language === 'es' ? 'niño(s)' : 'child(ren)'}`);
    }
    return parts.join(', ');
  };

  const handleTotalsChange = useCallback((itemId: string, totals: PricingOverride) => {
    setPricingOverrides((prev) => {
      const current = prev[itemId];
      if (
        current &&
        current.discountedTotal === totals.discountedTotal &&
        current.regularTotal === totals.regularTotal &&
        current.currency === totals.currency &&
        current.hasDiscount === totals.hasDiscount &&
        current.specialOfferPercentage === totals.specialOfferPercentage
      ) {
        return prev;
      }
      return {
        ...prev,
        [itemId]: totals,
      };
    });
  }, []);

  const currency = useMemo(() => {
    const overrideCurrency = Object.values(pricingOverrides)[0]?.currency;
    return overrideCurrency || items[0]?.currency || 'USD';
  }, [pricingOverrides, items]);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const override = pricingOverrides[item.id];
      if (override) {
        // Si hay override, usar el total con descuento si aplica, sino el regular
        return sum + (override.hasDiscount ? override.discountedTotal : override.regularTotal);
      }
      // Si no hay override, usar totalPrice del item (ya viene calculado desde la API)
      // o calcular como fallback
      return sum + getFallbackTotal(item);
    }, 0);
  }, [items, pricingOverrides]);

  const totalTravelers = useMemo(() => {
    return items.reduce(
      (sum, item) => {
        // Usar participants si está disponible, si no calcular desde travelers
        const itemParticipants = item.participants ?? ((item.travelers?.adults || 0) + (item.travelers?.children || 0));
        return sum + itemParticipants;
      },
      0
    );
  }, [items]);

  return (
    <div className="card" style={{ overflowX: 'hidden' }}>
      <div className="card-body p-2 p-md-3">
        {resolvedTitle ? (
          <h2 className="fw-bold mb-3 mb-md-4" style={{ wordBreak: 'break-word', fontSize: '1.25rem' }}>
            {resolvedTitle}
          </h2>
        ) : null}

        {items.map((item) => (
          <CheckoutCartItem
            key={item.id}
            item={item}
            language={language}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            formatTravelers={formatTravelers}
            onRemoveItem={onRemoveItem}
            onEditLanguage={onEditLanguage}
            onEditMeetingPoint={onEditMeetingPoint}
            onEditComment={onEditComment}
            onEditDate={onEditDate}
            onEditTravelers={onEditTravelers}
            onTotalsChange={handleTotalsChange}
          />
        ))}

        <div className="mt-3 mt-md-4 p-2 p-md-3 bg-light rounded d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <div className="mb-2 mb-md-0">
            <div className="text-muted small" style={{ wordBreak: 'break-word' }}>
              {language === 'es' ? 'Todos los impuestos incluidos' : 'All taxes included'}
            </div>
            <div className="text-muted small" style={{ wordBreak: 'break-word' }}>
              {language === 'es'
                ? `Actividades: ${items.length}`
                : `Activities: ${items.length}`}
            </div>
            <div className="text-muted small" style={{ wordBreak: 'break-word' }}>
              {language === 'es'
                ? `Viajeros totales: ${totalTravelers}`
                : `Total travelers: ${totalTravelers}`}
            </div>
          </div>
          <div className="text-center text-md-end mt-2 mt-md-0">
            <div className="text-muted text-uppercase small" style={{ wordBreak: 'break-word' }}>
              {language === 'es' ? 'Total a pagar' : 'Total to pay'}
            </div>
            <div className="fs-5 fs-md-4 fw-bold text-danger" style={{ wordBreak: 'break-word' }}>
              {formatCurrency(totalAmount, currency)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCartSummary;
export type { CheckoutSummaryItem };

