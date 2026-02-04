import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Building2, ArrowRight, Loader2 } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    orgName: '',
    industry: '',
    orgSizeType: 'SME'
  });

  useEffect(() => {
    checkExistingOrg();
  }, []);

  const checkExistingOrg = async () => {
    try {
      const user = await base44.auth.me();
      if (user.org_id) {
        window.location.href = createPageUrl('Dashboard');
      }
    } catch (e) {
      // User not authenticated
      base44.auth.redirectToLogin();
    }
  };

  const industries = [
    'Retail & E-commerce',
    'Manufacturing',
    'Technology & Software',
    'Professional Services',
    'Food & Beverage',
    'Construction',
    'Logistics & Trading',
    'Healthcare',
    'Education',
    'Other'
  ];

  const handleCreateOrganisation = async () => {
    if (!formData.orgName.trim()) return;
    
    setLoading(true);
    try {
      const org = await base44.entities.Organisation.create({
        name: formData.orgName.trim(),
        industry: formData.industry || null,
        org_size_type: formData.orgSizeType,
        settings: {
          sg_presence_weight: 30,
          ownership_weight: 30,
          financial_weight: 40,
          red_flags_weight: 10
        }
      });

      await base44.auth.updateMe({
        org_id: org.id,
        org_role: 'admin'
      });

      window.location.href = createPageUrl('Dashboard');
    } catch (error) {
      console.error('Failed to create organisation:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to KYC Confidence</h1>
          <p className="text-slate-500 mt-2">Let's set up your organisation</p>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Create Your Organisation
            </CardTitle>
            <CardDescription>
              This will be your team's workspace for managing KYC records and assessments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organisation Name *</Label>
              <Input
                id="orgName"
                placeholder="e.g., ABC Trading Pte Ltd"
                value={formData.orgName}
                onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
              />
              <p className="text-xs text-slate-500">Your company or business name</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry (Optional)</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map(ind => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgSizeType">Organisation Size *</Label>
              <Select
                value={formData.orgSizeType}
                onValueChange={(value) => setFormData({ ...formData, orgSizeType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SME">SME (Range-based financial inputs)</SelectItem>
                  <SelectItem value="Enterprise">Enterprise (Exact financial figures)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                SMEs use range selections for easier data entry. Enterprises enter precise figures.
              </p>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="text-sm text-emerald-800">
                <strong>You'll be the Admin</strong> of this organisation. 
                You can invite team members and assign roles after setup.
              </p>
            </div>

            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={handleCreateOrganisation}
              disabled={!formData.orgName.trim() || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Organisation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}