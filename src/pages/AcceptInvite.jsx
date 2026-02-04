import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AcceptInvite() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [inviteToken, setInviteToken] = useState(null);
  const [inviteDetails, setInviteDetails] = useState(null);
  const [organisation, setOrganisation] = useState(null);
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    designation: ''
  });

  useEffect(() => {
    loadInviteDetails();
  }, []);

  const loadInviteDetails = async () => {
    setLoading(true);
    try {
      // Get invite token from URL
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        setError('Invalid or missing invitation link');
        setLoading(false);
        return;
      }

      setInviteToken(token);

      // Check if user is authenticated
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        // Redirect to login with next URL to come back here
        base44.auth.redirectToLogin(window.location.href);
        return;
      }

      // Check if user already has an organization
      const user = await base44.auth.me();
      if (user.org_id) {
        window.location.href = createPageUrl('Dashboard');
        return;
      }

      // Get pending invites to verify this token
      const pendingInvites = await base44.users.listPendingInvites();
      const invite = pendingInvites.find(inv => inv.token === token);

      if (!invite) {
        setError('This invitation is no longer valid or has already been used');
        setLoading(false);
        return;
      }

      setInviteDetails(invite);

      // Fetch the organisation details
      const orgs = await base44.entities.Organisation.filter({ id: invite.org_id });
      if (orgs.length > 0) {
        setOrganisation(orgs[0]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to load invite details:', error);
      setError('Failed to load invitation details');
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!userProfile.firstName.trim() || !userProfile.lastName.trim()) return;
    
    setSubmitting(true);
    try {
      // Update user profile first
      await base44.auth.updateMe({
        full_name: `${userProfile.firstName.trim()} ${userProfile.lastName.trim()}`,
        designation: userProfile.designation.trim() || null
      });

      // Accept the invitation
      await base44.users.acceptInvite(inviteToken);
      
      window.location.href = createPageUrl('Dashboard');
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      setError('Failed to accept invitation. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-slate-500">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Invitation Error</h1>
            <p className="text-slate-500 mt-2">{error}</p>
          </div>
          <Button 
            className="w-full"
            onClick={() => window.location.href = createPageUrl('Landing')}
          >
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!inviteDetails || !organisation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to KYC Confidence</h1>
          <p className="text-slate-500 mt-2">You've been invited to join a team</p>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Complete Your Profile
            </CardTitle>
            <CardDescription>
              You've been invited to join <strong>{organisation.name}</strong> as a {inviteDetails.role}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="text-sm text-emerald-800">
                <strong>Organisation:</strong> {organisation.name}
              </p>
              {organisation.industry && (
                <p className="text-sm text-emerald-800 mt-1">
                  <strong>Industry:</strong> {organisation.industry}
                </p>
              )}
              <p className="text-sm text-emerald-800 mt-1">
                <strong>Your Role:</strong> {inviteDetails.role.charAt(0).toUpperCase() + inviteDetails.role.slice(1)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={userProfile.firstName}
                onChange={(e) => setUserProfile({ ...userProfile, firstName: e.target.value })}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={userProfile.lastName}
                onChange={(e) => setUserProfile({ ...userProfile, lastName: e.target.value })}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Designation (Optional)</Label>
              <Input
                id="designation"
                placeholder="e.g., Risk Manager, Compliance Officer"
                value={userProfile.designation}
                onChange={(e) => setUserProfile({ ...userProfile, designation: e.target.value })}
                disabled={submitting}
              />
            </div>

            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={handleAcceptInvite}
              disabled={!userProfile.firstName.trim() || !userProfile.lastName.trim() || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  Join {organisation.name}
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