import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/useAuth';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createPageUrl } from '@/utils';
import NegativePressSearch from '@/components/adverseMedia/NegativePressSearch';
import NegativePressResults from '@/components/adverseMedia/NegativePressResults';
import { performNegativePressSearch } from '@/components/adverseMedia/adverseMediaService';
import { toast } from 'sonner';

export default function NegativePressCheck() {
  const location = useLocation();
  const { user, organisation, canEdit, loading: authLoading } = useAuth();
  const [counterparty, setCounterparty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [currentCheck, setCurrentCheck] = useState(null);
  const [progress, setProgress] = useState('');

  const counterpartyId = new URLSearchParams(location.search).get('counterparty');
  const assessmentId = new URLSearchParams(location.search).get('assessment');

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user, counterpartyId]);

  const loadData = async () => {
    if (!counterpartyId) return;

    setLoading(true);
    try {
      const [cp] = await base44.entities.Counterparty.filter({ id: counterpartyId });
      if (cp) {
        setCounterparty(cp);
        // Check for cached result
        await loadCachedCheck(counterpartyId);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load counterparty data');
    } finally {
      setLoading(false);
    }
  };

  const loadCachedCheck = async (cpId) => {
    try {
      const checks = await base44.entities.NegativePressCheck.filter(
        { counterparty_id: cpId, org_id: user.org_id },
        '-executed_at',
        1
      );

      if (checks.length > 0) {
        const latestCheck = checks[0];
        const cacheExpiry = new Date(latestCheck.cached_until);
        if (cacheExpiry > new Date()) {
          setCurrentCheck(latestCheck);
          toast.info('Showing cached results from previous search');
        }
      }
    } catch (error) {
      console.error('Error loading cached check:', error);
    }
  };

  const handleSearch = async (inputs) => {
    if (!canEdit) {
      toast.error('You do not have permission to run checks');
      return;
    }

    setSearching(true);
    setProgress('Initializing search...');

    try {
      const searchResults = await performNegativePressSearch(inputs, setProgress);

      // Save to database
      const cacheExpiry = new Date();
      cacheExpiry.setHours(cacheExpiry.getHours() + 24);

      const check = await base44.entities.NegativePressCheck.create({
        org_id: user.org_id,
        counterparty_id: counterpartyId,
        assessment_id: assessmentId || null,
        executed_by_user_id: user.id,
        executed_at: new Date().toISOString(),
        inputs,
        results: searchResults.results,
        rollup_summary: searchResults.rollup_summary,
        cached_until: cacheExpiry.toISOString()
      });

      setCurrentCheck(check);
      toast.success('Negative press check completed');
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to complete search. Please try again.');
    } finally {
      setSearching(false);
      setProgress('');
    }
  };

  const handleExportPDF = async () => {
    toast.info('PDF export coming soon');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) {
    base44.auth.redirectToLogin();
    return null;
  }

  if (!counterparty) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <Alert>
          <AlertDescription>
            Counterparty not found. Please select a counterparty first.
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Adverse Media Check
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {counterparty.name}
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        {searching && progress && (
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              {progress}
            </AlertDescription>
          </Alert>
        )}

        {/* Search Form or Results */}
        {!currentCheck ? (
          <NegativePressSearch
            counterparty={counterparty}
            onSearch={handleSearch}
            loading={searching}
          />
        ) : (
          <>
            <NegativePressResults
              check={currentCheck}
              onExportPDF={handleExportPDF}
              canExport={canEdit}
            />
            
            {canEdit && (
              <Button
                onClick={() => setCurrentCheck(null)}
                variant="outline"
                className="w-full"
              >
                Run New Search
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}