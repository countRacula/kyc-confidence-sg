import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/useAuth';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Search, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import RiskBadge from '@/components/ui/RiskBadge';
import ScoreGauge from '@/components/ui/ScoreGauge';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function Archive() {
  const { user, organisation, loading: authLoading, isAuthenticated } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      base44.auth.redirectToLogin();
      return;
    }
    
    if (!authLoading && isAuthenticated && !user?.org_id) {
      window.location.href = createPageUrl('Onboarding');
      return;
    }

    if (user?.org_id) {
      loadAssessments();
    }
  }, [authLoading, isAuthenticated, user]);

  const loadAssessments = async () => {
    try {
      const data = await base44.entities.Assessment.filter(
        { org_id: user.org_id },
        '-created_date',
        1000
      );
      setAssessments(data);
      setFilteredAssessments(data);
    } catch (error) {
      console.error('Failed to load assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    const filtered = assessments.filter(a =>
      a.counterparty_name.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredAssessments(filtered);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const componentBars = selectedAssessment ? [
    { label: 'SG Presence', score: selectedAssessment.component_scores?.sg_presence || 0, max: 30, color: 'bg-blue-500' },
    { label: 'Ownership', score: selectedAssessment.component_scores?.ownership || 0, max: 30, color: 'bg-purple-500' },
    { label: 'Financial', score: selectedAssessment.component_scores?.financial || 0, max: 40, color: 'bg-emerald-500' },
    { label: 'Red Flags', score: selectedAssessment.component_scores?.red_flags || 0, max: 10, color: 'bg-amber-500' }
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Assessment Archive</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">View all completed assessments and their scores</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by company name..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Assessment List */}
        <div className="space-y-4">
          {filteredAssessments.length > 0 ? (
            filteredAssessments.map(assessment => (
              <Card
                key={assessment.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedAssessment(assessment)}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {assessment.counterparty_name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {format(new Date(assessment.created_date), 'dd MMM yyyy')} • By {assessment.assessor_email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 md:justify-end">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {assessment.total_score}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">out of 100</p>
                      </div>
                      <RiskBadge band={assessment.risk_band} size="sm" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-slate-500">No assessments found</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Assessment Details Modal */}
      <Dialog open={!!selectedAssessment} onOpenChange={() => setSelectedAssessment(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedAssessment && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedAssessment.counterparty_name}
                </DialogTitle>
              </DialogHeader>

              {/* Main Score */}
              <Card className={cn(
                "border-2",
                selectedAssessment.hard_stop_flag
                  ? "border-red-300 bg-red-50"
                  : selectedAssessment.risk_band === 'green'
                  ? "border-emerald-200 bg-emerald-50/50"
                  : selectedAssessment.risk_band === 'amber'
                  ? "border-amber-200 bg-amber-50/50"
                  : "border-red-200 bg-red-50/50"
              )}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-shrink-0">
                      {selectedAssessment.hard_stop_flag ? (
                        <div className="w-40 h-40 rounded-full bg-red-100 flex items-center justify-center">
                          <XCircle className="w-20 h-20 text-red-600" />
                        </div>
                      ) : (
                        <ScoreGauge score={selectedAssessment.total_score} size="lg" />
                      )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        Credit Confidence Score
                      </h2>
                      <div className="mb-4">
                        <RiskBadge band={selectedAssessment.risk_band} showDescription size="lg" />
                      </div>
                      {selectedAssessment.hard_stop_flag && (
                        <div className="flex items-center gap-2 text-red-700 bg-red-100 rounded-lg px-4 py-2 w-fit">
                          <AlertTriangle className="w-5 h-5" />
                          <span className="font-medium">{selectedAssessment.hard_stop_reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Score Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Score Breakdown</CardTitle>
                  <CardDescription>Performance across assessment components</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {componentBars.map(bar => (
                    <div key={bar.label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">{bar.label}</span>
                        <span className="font-medium">{bar.score}/{bar.max}</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", bar.color)}
                          style={{ width: `${(bar.score / bar.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Key Scoring Factors */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Key Scoring Factors</CardTitle>
                  <CardDescription>Top reasons impacting the score</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(selectedAssessment.reasons || []).slice(0, 8).map((reason, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        {reason.startsWith('+') ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        ) : reason.startsWith('-') ? (
                          <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-slate-200 mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-slate-700">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Recommended Actions */}
              {(selectedAssessment.recommended_actions || []).length > 0 && (
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Recommended Actions
                    </CardTitle>
                    <CardDescription>Steps to mitigate identified risks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {selectedAssessment.recommended_actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-slate-700 text-sm">{action}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}

              {/* Assessment Metadata */}
              <Card className="bg-slate-50 dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-base">Assessment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Assessment Date</p>
                      <p className="font-medium">{format(new Date(selectedAssessment.created_date), 'dd MMM yyyy HH:mm')}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Assessor</p>
                      <p className="font-medium">{selectedAssessment.assessor_email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}