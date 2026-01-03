import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/contexts/AuthContext';
import { joinCommunity, getMembership } from '../../features/community/communityService';
import { createCommunityCheckout } from '../../features/community/communityPaymentService';
import { supabase } from '../../core/supabase/client';
import { UserPlus, Check, Loader2, ArrowRight } from 'lucide-react';

interface JoinButtonProps {
  communityId: string;
  communityName: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const JoinButton: React.FC<JoinButtonProps> = ({
  communityId,
  communityName,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [communityPricing, setCommunityPricing] = useState<{
    pricing_type: 'free' | 'one_time' | 'monthly';
    price_cents: number;
  } | null>(null);

  // Fetch community pricing when component mounts
  useEffect(() => {
    const fetchPricing = async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('pricing_type, price_cents')
        .eq('id', communityId)
        .single();

      if (!error && data) {
        setCommunityPricing({
          pricing_type: data.pricing_type || 'free',
          price_cents: data.price_cents || 0,
        });
      }
    };

    fetchPricing();
  }, [communityId]);

  // Check membership status when user is authenticated
  useEffect(() => {
    const checkMembership = async () => {
      if (!user) {
        setIsMember(null);
        return;
      }

      const membership = await getMembership(user.id, communityId);
      setIsMember(!!membership);
    };

    checkMembership();
  }, [user, communityId]);

  const handleClick = async () => {
    setError(null);

    // If not authenticated, redirect to signup with return URL
    if (!user) {
      const returnUrl = encodeURIComponent(`/community/${communityId}?action=join`);
      navigate(`/signup?return=${returnUrl}`);
      return;
    }

    // If already a member, navigate to community
    if (isMember) {
      navigate(`/app/community`);
      return;
    }

    // Check if this is a paid community
    if (communityPricing?.pricing_type !== 'free' && communityPricing?.price_cents > 0) {
      // Paid community - redirect to Stripe Checkout
      setIsJoining(true);
      try {
        const result = await createCommunityCheckout({
          communityId,
          successUrl: `${window.location.origin}/community/${communityId}?success=true`,
          cancelUrl: `${window.location.origin}/community/${communityId}?canceled=true`,
        });

        if (result.success && result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
        } else {
          setError(result.error || 'Failed to create checkout. Please try again.');
        }
      } catch (err) {
        setError('An error occurred. Please try again.');
      } finally {
        setIsJoining(false);
      }
      return;
    }

    // Free community - join directly
    setIsJoining(true);
    try {
      const result = await joinCommunity(user.id, communityId);
      if (result) {
        setIsMember(true);
        // Navigate to authenticated community view after short delay
        setTimeout(() => {
          navigate(`/app/community`);
        }, 1000);
      } else {
        setError('Failed to join. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  // Variant classes
  const variantClasses = {
    primary: isMember
      ? 'bg-green-600 text-white hover:bg-green-700'
      : 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: isMember
      ? 'border border-green-300 text-green-700 hover:bg-green-50'
      : 'border border-indigo-300 text-indigo-700 hover:bg-indigo-50',
  };

  // Icon based on state
  const renderIcon = () => {
    if (isJoining) {
      return <Loader2 className={`${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} animate-spin`} />;
    }
    if (isMember) {
      return <Check className={`${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />;
    }
    if (user) {
      return <UserPlus className={`${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />;
    }
    return <ArrowRight className={`${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />;
  };

  // Button text based on state
  const getButtonText = () => {
    if (isJoining) return 'Joining...';
    if (isMember) return 'Go to Community';

    // Show pricing in button text for paid communities
    if (communityPricing?.pricing_type === 'monthly' && communityPricing?.price_cents > 0) {
      return `Subscribe - €${(communityPricing.price_cents / 100).toFixed(2)}/mo`;
    }
    if (communityPricing?.pricing_type === 'one_time' && communityPricing?.price_cents > 0) {
      return `Get Access - €${(communityPricing.price_cents / 100).toFixed(2)}`;
    }

    if (user) return 'Join Community';
    return 'Join to Access';
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleClick}
        disabled={isJoining}
        className={`
          inline-flex items-center justify-center gap-2 font-medium rounded-lg
          transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
      >
        {renderIcon()}
        {getButtonText()}
      </button>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};
