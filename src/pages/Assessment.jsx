import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileCheck, Building2 } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/components/auth/useAuth';
import AssessmentWizard from '@/components/assessment/AssessmentWizard';
import { Button } from "@/components/ui/button";

export default function Assessment() {
  const { user, organisation, loading: authLoading, isAuthenticated, canEdit } = useAuth();
  const navigate = useNavigate();
  const [counterparties, setCounterparties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preselectedId, setPreselectedId] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      base44.auth.redirectToLogin();
      return;
    }
    
    if (!authLoading && isAuthenticated && !user?.org_id) {
      window.location.href = createPageUrl('Onboarding');
      return;
    }

    // Check for preselected counterparty
    const urlParams = new URLSearchParams(window.location.search);
    const cpId = urlParams.get('counterparty');
    if (cpId) {
      setPreselectedId(cpId);
    }

    if (user?.org_id) {
      loadCounterparties();
    }
  }, [authLoading, isAuthenticated, user]);

  const loadCounterparties = async () => {
    try {
      const records = await base44.entities.Counterparty.filter({ org_id: user.org_id });
      setCounterparties(records);
    } catch (error) {
      console.error('Failed to load counterparties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (assessment) => {
    navigate(createPageUrl('Dashboard'));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card>
            <CardContent className="py-16 text-center">
              <FileCheck className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="font-semibold text-slate-900 mb-2">View-Only Access</h3>
              <p className="text-slate-500">
                You don't have permission to run assessments. Contact your admin for access.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (counterparties.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Assessment</h1>
            <p className="text-slate-500">Run a KYC credit confidence assessment</p>
          </div>
          
          <Card>
            <CardContent className="py-16 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="font-semibold text-slate-900 mb-2">No Records Found</h3>
              <p className="text-slate-500 mb-6">
                Add a counterparty record before running an assessment.
              </p>
              <Link to={createPageUrl('Records')}>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Add Your First Record
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Assessment</h1>
          <p className="text-slate-500">Run a KYC credit confidence assessment</p>
        </div>

        <AssessmentWizard
          counterparties={counterparties}
          preselectedCounterpartyId={preselectedId}
          user={user}
          organisation={organisation}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}