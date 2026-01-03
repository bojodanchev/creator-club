// ============================================================================
// COMMUNITY PRICING SETTINGS COMPONENT
// Allows creators to configure community pricing (free, one-time, or monthly)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Calendar, Lock } from 'lucide-react';

export type PricingType = 'free' | 'one_time' | 'monthly';

export interface CommunityPricingSettingsProps {
  community: {
    id: string;
    name: string;
    pricing_type: PricingType;
    price_cents: number;
  };
  onSave: (pricing: { type: PricingType; priceCents: number }) => Promise<void>;
  isLoading?: boolean;
}

interface PricingOption {
  type: PricingType;
  label: string;
  description: string;
  icon: React.ElementType;
}

const PRICING_OPTIONS: PricingOption[] = [
  {
    type: 'free',
    label: 'Free',
    description: 'Anyone can join for free',
    icon: Users,
  },
  {
    type: 'one_time',
    label: 'One-time Payment',
    description: 'Pay once, access forever',
    icon: Lock,
  },
  {
    type: 'monthly',
    label: 'Monthly Subscription',
    description: 'Recurring monthly access',
    icon: Calendar,
  },
];

const PLATFORM_FEE_PERCENT = 6.9;

const CommunityPricingSettings: React.FC<CommunityPricingSettingsProps> = ({
  community,
  onSave,
  isLoading = false,
}) => {
  const [selectedType, setSelectedType] = useState<PricingType>(community.pricing_type);
  const [priceEuros, setPriceEuros] = useState<string>(
    community.price_cents > 0 ? (community.price_cents / 100).toFixed(2) : ''
  );
  const [isSaving, setIsSaving] = useState(false);

  // Reset price when switching to free
  useEffect(() => {
    if (selectedType === 'free') {
      setPriceEuros('');
    }
  }, [selectedType]);

  const isPaidOption = selectedType !== 'free';
  const priceInCents = priceEuros ? Math.round(parseFloat(priceEuros) * 100) : 0;
  const hasValidPrice = !isPaidOption || (priceInCents >= 50); // Min 0.50 EUR

  // Calculate estimated earnings after platform fee
  const calculateEarnings = (): string => {
    if (!priceEuros || parseFloat(priceEuros) <= 0) return '0.00';
    const price = parseFloat(priceEuros);
    const fee = price * (PLATFORM_FEE_PERCENT / 100);
    const earnings = price - fee;
    return earnings.toFixed(2);
  };

  const handleSave = async () => {
    if (!hasValidPrice || isSaving) return;

    setIsSaving(true);
    try {
      await onSave({
        type: selectedType,
        priceCents: selectedType === 'free' ? 0 : priceInCents,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid decimal numbers
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setPriceEuros(value);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-1">Community Pricing</h3>
      <p className="text-sm text-slate-500 mb-6">
        Choose how members can access {community.name}
      </p>

      {/* Pricing Type Selection */}
      <div className="space-y-3 mb-6">
        {PRICING_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedType === option.type;

          return (
            <label
              key={option.type}
              className={`
                flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all
                ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }
              `}
            >
              <input
                type="radio"
                name="pricing_type"
                value={option.type}
                checked={isSelected}
                onChange={() => setSelectedType(option.type)}
                className="sr-only"
              />
              <div
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                  ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}
                `}
              >
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <span
                  className={`
                    block font-medium
                    ${isSelected ? 'text-indigo-900' : 'text-slate-900'}
                  `}
                >
                  {option.label}
                </span>
                <span className="text-sm text-slate-500">{option.description}</span>
              </div>
              <div
                className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                  ${isSelected ? 'border-indigo-600' : 'border-slate-300'}
                `}
              >
                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
              </div>
            </label>
          );
        })}
      </div>

      {/* Price Input (only for paid options) */}
      {isPaidOption && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Price
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-500 text-lg font-medium">€</span>
            </div>
            <input
              type="number"
              min="0.50"
              step="0.01"
              value={priceEuros}
              onChange={handlePriceChange}
              placeholder="0.00"
              className="
                w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg
                text-slate-900 placeholder-slate-400
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                transition-colors
              "
            />
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {selectedType === 'one_time'
              ? 'Members pay this amount once for lifetime access'
              : 'Members will be charged this amount every month'}
          </p>
          {priceEuros && parseFloat(priceEuros) > 0 && parseFloat(priceEuros) < 0.5 && (
            <p className="mt-1 text-sm text-amber-600">
              Minimum price is €0.50
            </p>
          )}
        </div>
      )}

      {/* Platform Fee Info Box */}
      {isPaidOption && priceEuros && parseFloat(priceEuros) >= 0.5 && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <DollarSign size={16} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                Estimated earnings per {selectedType === 'monthly' ? 'month' : 'sale'}
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                €{calculateEarnings()}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                After {PLATFORM_FEE_PERCENT}% platform fee (€{(parseFloat(priceEuros) * PLATFORM_FEE_PERCENT / 100).toFixed(2)})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving || isLoading || !hasValidPrice}
        className="
          w-full py-3 px-4 rounded-lg font-medium transition-colors
          bg-indigo-600 text-white hover:bg-indigo-700
          disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed
        "
      >
        {isSaving || isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Saving...
          </span>
        ) : (
          'Save Pricing'
        )}
      </button>
    </div>
  );
};

export default CommunityPricingSettings;
