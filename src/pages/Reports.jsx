import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart3, Download, Filter, Building2, 
  AlertTriangle, Loader2, Calendar, Search,
  ChevronDown, ChevronUp, Clock
} from "lucide-react";
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/components/auth/useAuth';
import RiskBadge from '@/components/ui/RiskBadge';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { PageTransition } from '@/components/ui/PageTransition';

export default function Reports() {
  const { user, organisation, loading: authLoading, isAuthenticated } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [counterparties, setCounterparties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [dateRange, setDateRange] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('created_date');
  const [sortDir, setSortDir] = useState('desc');

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
      loadData();
    }
  }, [authLoading, isAuthenticated, user]);

  const loadData = async () => {
    try {
      const [assessmentData, counterpartyData] = await Promise.all([
        base44.entities.Assessment.filter({ org_id: user.org_id }, '-created_date'),
        base44.entities.Counterparty.filter({ org_id: user.org_id })
      ]);
      setAssessments(assessmentData);
      setCounterparties(counterpartyData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCounterpartyTypes = (counterpartyId) => {
    const cp = counterparties.find(c => c.id === counterpartyId);
    return cp?.types || [];
  };

  const filteredAssessments = assessments.filter(a => {
    // Date filter
    if (dateRange !== 'all') {
      const assessmentDate = new Date(a.created_date);
      const cutoff = dateRange === '30' ? subDays(new Date(), 30) : subDays(new Date(), 90);
      if (!isAfter(assessmentDate, cutoff)) return false;
    }

    // Risk filter
    if (riskFilter !== 'all' && a.risk_band !== riskFilter) return false;

    // Type filter
    if (typeFilter !== 'all') {
      const types = getCounterpartyTypes(a.counterparty_id);
      if (!types.includes(typeFilter)) return false;
    }

    // Search
    if (search && !a.counterparty_name?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Sort
  const sortedAssessments = [...filteredAssessments].sort((a, b) => {
    let aVal, bVal;
    if (sortField === 'created_date') {
      aVal = new Date(a.created_date);
      bVal = new Date(b.created_date);
    } else if (sortField === 'total_score') {
      aVal = a.total_score;
      bVal = b.total_score;
    } else if (sortField === 'counterparty_name') {
      aVal = a.counterparty_name?.toLowerCase() || '';
      bVal = b.counterparty_name?.toLowerCase() || '';
    }
    
    if (sortDir === 'asc') return aVal > bVal ? 1 : -1;
    return aVal < bVal ? 1 : -1;
  });

  // Risk distribution
  const riskDistribution = {
    green: assessments.filter(a => a.risk_band === 'green').length,
    amber: assessments.filter(a => a.risk_band === 'amber').length,
    red: assessments.filter(a => a.risk_band === 'red').length,
    high_risk: assessments.filter(a => a.risk_band === 'high_risk' || a.risk_band === 'fail').length
  };

  // High risk list
  const highRiskAssessments = assessments
    .filter(a => a.total_score < 60)
    .sort((a, b) => a.total_score - b.total_score)
    .slice(0, 10);

  // Expiring assessments (> 180 days old)
  const expiringAssessments = assessments.filter(a => {
    const assessmentDate = new Date(a.created_date);
    const cutoff = subDays(new Date(), 180);
    return !isAfter(assessmentDate, cutoff);
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const exportCSV = () => {
    const headers = ['Counterparty', 'Score', 'Risk Band', 'Date', 'Assessor'];
    const rows = sortedAssessments.map(a => [
      a.counterparty_name,
      a.total_score,
      a.risk_band,
      format(new Date(a.created_date), 'yyyy-MM-dd'),
      a.assessor_email
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessments_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const handleRefresh = async () => {
    await loadData();
  };

  return (
    <PageTransition>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 overscroll-none">
          <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reports</h1>
            <p className="text-slate-500 dark:text-slate-400">Assessment history and risk analysis</p>
          </div>
          <Button variant="outline" onClick={exportCSV} className="select-none">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Green', count: riskDistribution.green, color: 'bg-emerald-500' },
            { label: 'Amber', count: riskDistribution.amber, color: 'bg-amber-500' },
            { label: 'Red', count: riskDistribution.red, color: 'bg-red-500' },
            { label: 'High Risk', count: riskDistribution.high_risk, color: 'bg-red-800' }
          ].map(item => (
            <Card key={item.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="text-2xl font-bold">{item.count}</p>
                  </div>
                  <div className={`w-10 h-10 ${item.color} rounded-lg opacity-80`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* High Risk List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Top High-Risk Counterparties
              </CardTitle>
              <CardDescription>Lowest scores requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {highRiskAssessments.length > 0 ? (
                <div className="space-y-2">
                  {highRiskAssessments.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-red-700">{a.total_score}</span>
                        <span className="text-slate-700">{a.counterparty_name}</span>
                      </div>
                      <RiskBadge band={a.risk_band} size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">No high-risk assessments</p>
              )}
            </CardContent>
          </Card>

          {/* Expiring Reassessments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Due for Reassessment
              </CardTitle>
              <CardDescription>Older than 180 days</CardDescription>
            </CardHeader>
            <CardContent>
              {expiringAssessments.length > 0 ? (
                <div className="space-y-2">
                  {expiringAssessments.slice(0, 5).map(a => (
                    <div key={a.id} className="p-3 bg-amber-50 rounded-lg">
                      <p className="font-medium text-slate-700">{a.counterparty_name}</p>
                      <p className="text-xs text-amber-600">
                        Assessed {format(new Date(a.created_date), 'dd MMM yyyy')}
                      </p>
                    </div>
                  ))}
                  {expiringAssessments.length > 5 && (
                    <p className="text-sm text-slate-500 text-center">
                      +{expiringAssessments.length - 5} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">All assessments current</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by counterparty..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-36">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="w-36">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="amber">Amber</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="high_risk">High Risk</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assessment History</CardTitle>
            <CardDescription>{sortedAssessments.length} assessments found</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedAssessments.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort('counterparty_name')}
                      >
                        <div className="flex items-center gap-1">
                          Counterparty <SortIcon field="counterparty_name" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort('total_score')}
                      >
                        <div className="flex items-center gap-1">
                          Score <SortIcon field="total_score" />
                        </div>
                      </TableHead>
                      <TableHead>Risk Band</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort('created_date')}
                      >
                        <div className="flex items-center gap-1">
                          Date <SortIcon field="created_date" />
                        </div>
                      </TableHead>
                      <TableHead>Assessor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAssessments.map(a => (
                      <TableRow key={a.id} className="min-h-[44px]">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <span className="dark:text-slate-200">{a.counterparty_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{a.total_score}</span>
                        </TableCell>
                        <TableCell>
                          <RiskBadge band={a.risk_band} size="sm" />
                        </TableCell>
                        <TableCell>
                          {format(new Date(a.created_date), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {a.assessor_email}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No assessments found matching your filters</p>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </div>
      </PullToRefresh>
    </PageTransition>
  );
}