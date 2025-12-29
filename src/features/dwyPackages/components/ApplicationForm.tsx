// =============================================================================
// ApplicationForm Component
// Form for creators to apply for DWY packages
// =============================================================================

import { useState } from 'react';
import type { DwyPackage, DwyApplicationFormData } from '../dwyTypes';
import { BUSINESS_TYPES, REVENUE_RANGES, TIMELINE_OPTIONS } from '../dwyTypes';

interface ApplicationFormProps {
  package: DwyPackage;
  onSubmit: (formData: DwyApplicationFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function ApplicationForm({
  package: pkg,
  onSubmit,
  onCancel,
  isSubmitting,
}: ApplicationFormProps) {
  const [formData, setFormData] = useState<DwyApplicationFormData>({
    business_name: '',
    business_type: '',
    current_revenue: '',
    goals: '',
    timeline: '',
    website_url: '',
    social_links: {},
    how_heard: '',
    additional_notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.business_name || !formData.business_type || !formData.current_revenue || !formData.goals || !formData.timeline) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    }
  };

  const updateField = <K extends keyof DwyApplicationFormData>(
    field: K,
    value: DwyApplicationFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">Apply for {pkg.name}</h2>
          <p className="text-gray-600 mt-1">{pkg.tagline}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Business Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.business_name}
                onChange={e => updateField('business_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Your business or brand name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.business_type}
                onChange={e => updateField('business_type', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select type...</option>
                {BUSINESS_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Revenue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Monthly Revenue <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.current_revenue}
              onChange={e => updateField('current_revenue', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">Select range...</option>
              {REVENUE_RANGES.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Goals */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What are your main goals? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.goals}
              onChange={e => updateField('goals', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={4}
              placeholder="What do you want to achieve? What problems are you facing?"
              required
            />
          </div>

          {/* Timeline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              When do you want to start? <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.timeline}
              onChange={e => updateField('timeline', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">Select timeline...</option>
              {TIMELINE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website URL (optional)
            </label>
            <input
              type="url"
              value={formData.website_url}
              onChange={e => updateField('website_url', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://yourwebsite.com"
            />
          </div>

          {/* How heard */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How did you hear about us? (optional)
            </label>
            <input
              type="text"
              value={formData.how_heard}
              onChange={e => updateField('how_heard', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., YouTube, referral, social media..."
            />
          </div>

          {/* Additional notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anything else we should know? (optional)
            </label>
            <textarea
              value={formData.additional_notes}
              onChange={e => updateField('additional_notes', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="Any additional context or questions..."
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApplicationForm;
