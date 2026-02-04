import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, FileCheck, BarChart3, Plus, ArrowRight, 
  TrendingUp, Clock, AlertCircle, Info, Loader2
} from "lucide-react";
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/components/auth/useAuth';
import RiskBadge from '@/components/ui/RiskBadge';
import { format, subDays } from 'date-fns';

export default function Dashboard() {
  const { user, organisation, loading: authLoading, isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentAssessments, setRecentAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('all');

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
      loadDashboardData();
    }
  }, [authLoading, isAuthenticated, user, refreshKey]);

  // Refresh data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.org_id) {
        setRefreshKey(prev => prev + 1);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const [counterparties, assessments] = await Promise.all([
        base44.entities.Counterparty.filter({ org_id: user.org_id }),
        base44.entities.Assessment.filter({ org_id: user.org_id }, '-created_date', 100)
      ]);

      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const ninetyDaysAgo = subDays(now, 90);

      const assessments30 = assessments.filter(a => new Date(a.created_date) >= thirtyDaysAgo);
      const assessments90 = assessments.filter(a => new Date(a.created_date) >= ninetyDaysAgo);

      const riskDistribution = {
        green: assessments.filter(a => a.risk_band === 'green').length,
        amber: assessments.filter(a => a.risk_band === 'amber').length,
        red: assessments.filter(a => a.risk_band === 'red').length,
        high_risk: assessments.filter(a => a.risk_band === 'high_risk' || a.risk_band === 'fail').length
      };

      setStats({
        totalRecords: counterparties.length,
        assessments30: assessments30.length,
        assessments90: assessments90.length,
        riskDistribution
      });

      setRecentAssessments(assessments.slice(0, 10));
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const totalRiskCount = stats ? Object.values(stats.riskDistribution).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500">{organisation?.name || 'Your Organisation'}</p>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl('Records')}>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Record
              </Button>
            </Link>
            <Link to={createPageUrl('Assessment')}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <FileCheck className="w-4 h-4 mr-2" />
                Run Assessment
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Records</p>
                  <p className="text-3xl font-bold text-slate-900">{stats?.totalRecords || 0}</p>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Assessments (30d)</p>
                  <p className="text-3xl font-bold text-slate-900">{stats?.assessments30 || 0}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Assessments (90d)</p>
                  <p className="text-3xl font-bold text-slate-900">{stats?.assessments90 || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">High Risk Alerts</p>
                  <p className="text-3xl font-bold text-red-600">{stats?.riskDistribution?.high_risk || 0}</p>
                </div>
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Risk Distribution */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Risk Distribution</CardTitle>
              <CardDescription>Based on all assessments</CardDescription>
            </CardHeader>
            <CardContent>
              {totalRiskCount > 0 ? (
                <div className="space-y-4">
                  {[
                    { band: 'green', label: 'Green', count: stats?.riskDistribution?.green || 0, color: 'bg-emerald-500' },
                    { band: 'amber', label: 'Amber', count: stats?.riskDistribution?.amber || 0, color: 'bg-amber-500' },
                    { band: 'red', label: 'Red', count: stats?.riskDistribution?.red || 0, color: 'bg-red-500' },
                    { band: 'high_risk', label: 'High Risk', count: stats?.riskDistribution?.high_risk || 0, color: 'bg-red-800' }
                  ].map(item => (
                    <div key={item.band} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} transition-all`}
                          style={{ width: `${(item.count / totalRiskCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No assessments yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Assessments */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Assessments</CardTitle>
                <CardDescription>Latest 10 assessments</CardDescription>
              </div>
              <Link to={createPageUrl('Reports')}>
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentAssessments.length > 0 ? (
                <div className="space-y-3">
                  {recentAssessments.map(assessment => (
                    <div 
                      key={assessment.id} 
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border">
                          <Building2 className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{assessment.counterparty_name}</p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(assessment.created_date), 'dd MMM yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-slate-700">{assessment.total_score}</span>
                        <RiskBadge band={assessment.risk_band} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="mb-4">No assessments completed yet</p>
                  <Link to={createPageUrl('Assessment')}>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      Run Your First Assessment
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Risk Guidance */}
        <Card className="mt-6 border-emerald-100 bg-emerald-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="w-5 h-5 text-emerald-600" />
              Risk Band Guidance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-emerald-200">
                <RiskBadge band="green" size="sm" />
                <p className="mt-2 text-sm text-slate-600">
                  <strong>Score 80-100:</strong> Standard credit terms acceptable. Low onboarding risk.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-amber-200">
                <RiskBadge band="amber" size="sm" />
                <p className="mt-2 text-sm text-slate-600">
                  <strong>Score 60-79:</strong> Proceed with credit limits. Consider shorter payment terms.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <RiskBadge band="red" size="sm" />
                <p className="mt-2 text-sm text-slate-600">
                  <strong>Score 40-59:</strong> Require deposit or milestone payments. Enhanced monitoring.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-red-300">
                <RiskBadge band="high_risk" size="sm" />
                <p className="mt-2 text-sm text-slate-600">
                  <strong>Score &lt;40:</strong> Do not extend credit without manual approval and guarantees.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}