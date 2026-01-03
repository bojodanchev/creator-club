// ============================================================================
// COMMUNITY PRICING SETTINGS COMPONENT
// Allows creators to configure community pricing (free, one-time, or monthly)
// Self-contained: fetches data internally and saves via service
// ============================================================================

import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Calendar, Lock, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../../core/supabase/client';
import { updateCommunityPricing } from '../communityPaymentService';

export type PricingType = 'free' | 'one_time' | 'monthly';

export interface CommunityPricingSettingsProps {
  communityId: string;
  onSaved?: () => void;
}

interface PricingOption {
  type: PricingType;
  label: string;
  description: string;
  icon: React.ElementType;
}

interface CommunityData {
  id: string;
  name: string;
  pricing_type: PricingType | null;
  price_cents: number | null;
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
  communityId,
  onSaved,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [communityName, setCommunityName] = useState<string>('');
  const [selectedType, setSelectedType] = useState<PricingType>('free');
  const [priceEuros, setPriceEuros] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch community data on mount
  useEffect(() => {
    async function fetchCommunity() {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('communities')
          .select('id, name, pricing_type, price_cents')
          .eq('id', communityId)
          .single();

        if (fetchError) {
          console.error('Error fetching community:', fetchError);
          setError('Failed to load community settings');
          return;
        }

        if (!data) {
          setError('Community not found');
          return;
        }

        const community = data as CommunityData;
        setCommunityName(community.name);
        setSelectedType(community.pricing_type || 'free');
        if (community.price_cents && community.price_cents > 0) {
          setPriceEuros((community.price_cents / 100).toFixed(2));
        }
      } catch (err) {
        console.error('Exception fetching community:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCommunity();
  }, [communityId]);

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
    setError(null);

    try {
      const result = await updateCommunityPricing(communityId, {
        type: selectedType,
        priceCents: selectedType === 'free' ? 0 : priceInCents,
      });

      if (!result.success) {
        setError(result.error || 'Failed to save pricing');
        return;
      }

      onSaved?.();
    } catch (err) {
      console.error('Exception saving pricing:', err);
      setError('An unexpected error occurred');
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div>
        <h4 className="text-base font-medium text-slate-900 mb-1">Community Pricing</h4>
        <p className="text-sm text-slate-500">
          Choose how members can access {communityName}
        </p>
      </div>

      {/* Pricing Type Selection */}
      <div className="space-y-3">
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
        <div>
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
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
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
        disabled={isSaving || !hasValidPrice}
        className="
          w-full py-3 px-4 rounded-lg font-medium transition-colors
          bg-indigo-600 text-white hover:bg-indigo-700
          disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed
        "
      >
        {isSaving ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
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
