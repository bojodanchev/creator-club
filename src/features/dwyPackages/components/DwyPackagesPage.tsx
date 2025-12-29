// =============================================================================
// DwyPackagesPage Component
// Main page for DWY packages overview and application
// =============================================================================

import { useState } from 'react';
import { usePackages } from '../hooks/usePackages';
import { useApplications } from '../hooks/useApplications';
import { useEngagements } from '../hooks/useEngagements';
import { PackageCard } from './PackageCard';
import { ApplicationForm } from './ApplicationForm';
import { MyApplications } from './MyApplications';
import { EngagementDashboard } from './EngagementDashboard';
import type { DwyPackage, DwyApplicationFormData } from '../dwyTypes';

export function DwyPackagesPage() {
  const { packages, isLoading: packagesLoading } = usePackages();
  const {
    applications,
    isLoading: applicationsLoading,
    submitApplication,
    withdrawApplication,
    hasPendingForPackage,
  } = useApplications();
  const { activeEngagements, isLoading: engagementsLoading } = useEngagements();

  const [selectedPackage, setSelectedPackage] = useState<DwyPackage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApplications, setShowApplications] = useState(false);

  const isLoading = packagesLoading || applicationsLoading || engagementsLoading;

  const handleApply = (pkg: DwyPackage) => {
    setSelectedPackage(pkg);
  };

  const handleSubmit = async (formData: DwyApplicationFormData) => {
    if (!selectedPackage) return;
    setIsSubmitting(true);
    try {
      await submitApplication(selectedPackage.id, formData);
      setSelectedPackage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async (id: string) => {
    if (confirm('Are you sure you want to withdraw this application?')) {
      await withdrawApplication(id);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto mb-12"></div>
          <div className="grid md:grid-cols-2 gap-8">
            {[1, 2].map(i => (
              <div key={i} className="bg-gray-200 rounded-2xl h-96"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {/* Active Engagements */}
      {activeEngagements.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Active Engagements</h2>
          <div className="space-y-6">
            {activeEngagements.map(engagement => (
              <EngagementDashboard key={engagement.id} engagement={engagement} />
            ))}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Done-With-You Packages
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          For creators who want professional help building their marketing infrastructure.
          We work with a limited number of creators.
        </p>
      </div>

      {/* Applications toggle */}
      {applications.length > 0 && (
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setShowApplications(!showApplications)}
            className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
          >
            {showApplications ? (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Hide My Applications
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                View My Applications ({applications.length})
              </>
            )}
          </button>
        </div>
      )}

      {/* Applications list */}
      {showApplications && (
        <div className="mb-12">
          <MyApplications
            applications={applications}
            isLoading={applicationsLoading}
            onWithdraw={handleWithdraw}
          />
        </div>
      )}

      {/* Package Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {packages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            package={pkg}
            hasApplication={hasPendingForPackage(pkg.id)}
            onApply={() => handleApply(pkg)}
          />
        ))}
      </div>

      {/* Trust Section */}
      <div className="text-center bg-gradient-to-b from-gray-50 to-white rounded-2xl p-8 border border-gray-100">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Scale Your Creator Business?
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            We work with a limited number of creators who are serious about building
            sustainable, revenue-generating systems. If that's you, apply now.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              No long-term contracts
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Results-focused approach
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Dedicated support
            </div>
          </div>
        </div>
      </div>

      {/* Application Form Modal */}
      {selectedPackage && (
        <ApplicationForm
          package={selectedPackage}
          onSubmit={handleSubmit}
          onCancel={() => setSelectedPackage(null)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

export default DwyPackagesPage;
