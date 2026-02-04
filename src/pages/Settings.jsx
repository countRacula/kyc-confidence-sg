import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, Users, Building2, Scale,
  Plus, Trash2, Loader2, RefreshCw, Mail
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/components/auth/useAuth';
import { toast } from 'sonner';

export default function Settings() {
  const { user, organisation, loading: authLoading, isAuthenticated, isAdmin, refreshOrg } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [orgName, setOrgName] = useState('');
  const [weights, setWeights] = useState({
    sg_presence: 30,
    ownership: 30,
    financial: 40,
    red_flags: 10
  });
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviting, setInviting] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      base44.auth.redirectToLogin();
      return;
    }
    
    if (!authLoading && isAuthenticated && !user?.org_id) {
      window.location.href = createPageUrl('Onboarding');
      return;
    }

    if (organisation) {
      setOrgName(organisation.name);
      if (organisation.settings) {
        setWeights({
          sg_presence: organisation.settings.sg_presence_weight || 30,
          ownership: organisation.settings.ownership_weight || 30,
          financial: organisation.settings.financial_weight || 40,
          red_flags: organisation.settings.red_flags_weight || 10
        });
      }
    }

    if (user?.org_id) {
      loadTeamMembers();
    }
  }, [authLoading, isAuthenticated, user, organisation]);

  const loadTeamMembers = async () => {
    try {
      const users = await base44.entities.User.list();
      const orgUsers = users.filter(u => u.org_id === user.org_id);
      setTeamMembers(orgUsers);
    } catch (error) {
      console.error('Failed to load team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrg = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      await base44.entities.Organisation.update(organisation.id, {
        name: orgName,
        settings: {
          sg_presence_weight: weights.sg_presence,
          ownership_weight: weights.ownership,
          financial_weight: weights.financial,
          red_flags_weight: weights.red_flags
        }
      });
      await refreshOrg();
      toast.success('Settings saved');
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetWeights = () => {
    setWeights({
      sg_presence: 30,
      ownership: 30,
      financial: 40,
      red_flags: 10
    });
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !isAdmin) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail, 'user');
      // Note: The invited user will need to be associated with this org after they accept
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
    } catch (error) {
      console.error('Failed to invite:', error);
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    if (!isAdmin) return;
    try {
      await base44.entities.User.update(userId, { org_role: newRole });
      await loadTeamMembers();
      toast.success('Role updated');
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleRemoveUser = async () => {
    if (!deleteUser || !isAdmin) return;
    try {
      await base44.entities.User.update(deleteUser.id, { org_id: null, org_role: null });
      await loadTeamMembers();
      toast.success('User removed from organisation');
    } catch (error) {
      console.error('Failed to remove user:', error);
      toast.error('Failed to remove user');
    } finally {
      setDeleteUser(null);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Admin</Badge>;
      case 'manager':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Manager</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-600 border-slate-200">Viewer</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const totalWeight = weights.sg_presence + weights.ownership + weights.financial + weights.red_flags;

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    try {
      await base44.entities.User.delete(user.id);
      await base44.auth.logout();
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 overscroll-none">
      <div className="max-w-4xl mx-auto px-6 py-8 pb-24 lg:pb-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your organisation and team</p>
        </div>

        <Tabs defaultValue="organisation">
          <TabsList className="mb-6 dark:bg-slate-800">
            <TabsTrigger value="organisation" className="flex items-center gap-2 select-none">
              <Building2 className="w-4 h-4" />
              Organisation
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="team" className="flex items-center gap-2 select-none">
                <Users className="w-4 h-4" />
                Team
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="scoring" className="flex items-center gap-2 select-none">
                <Scale className="w-4 h-4" />
                Scoring
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="organisation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Organisation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Organisation Name</Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={!isAdmin}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input
                    value={organisation?.industry || ''}
                    disabled
                    className="bg-slate-50"
                  />
                </div>

                {isAdmin && (
                  <Button 
                    onClick={handleSaveOrg}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div>
                    <p className="font-medium dark:text-slate-200">{user?.full_name || user?.email}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
                  </div>
                  {getRoleBadge(user?.org_role)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-900/50">
              <CardHeader>
                <CardTitle className="text-base text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900/50">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">Delete Account</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Permanently delete your account and all data</p>
                  </div>
                  <Button 
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    className="select-none"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="team" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Invite Team Member</CardTitle>
                  <CardDescription>Send an invitation to join your organisation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleInviteUser}
                      disabled={!inviteEmail || inviting}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {inviting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Invite
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p><strong>Admin:</strong> Full access - manage settings, users, and all records</p>
                    <p><strong>Manager:</strong> Create and edit records, run assessments</p>
                    <p><strong>Viewer:</strong> View-only access to records and reports</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Team Members</CardTitle>
                  <CardDescription>{teamMembers.length} members</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teamMembers.map(member => (
                      <div 
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="font-medium text-emerald-700">
                              {member.full_name?.[0] || member.email?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{member.full_name || 'Unnamed'}</p>
                            <p className="text-sm text-slate-500">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {member.id === user.id ? (
                            <Badge className="bg-emerald-100 text-emerald-700">You</Badge>
                          ) : (
                            <>
                              <Select
                                value={member.org_role || 'viewer'}
                                onValueChange={(value) => handleUpdateUserRole(member.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteUser(member)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="scoring" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Scoring Weights</CardTitle>
                  <CardDescription>
                    Customize how different components contribute to the total score. 
                    Default total is 110 points (normalized to 100).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Singapore Presence</Label>
                        <span className="text-sm font-medium">{weights.sg_presence} points</span>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={weights.sg_presence}
                        onChange={(e) => setWeights({ ...weights, sg_presence: parseInt(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Ownership & Control</Label>
                        <span className="text-sm font-medium">{weights.ownership} points</span>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={weights.ownership}
                        onChange={(e) => setWeights({ ...weights, ownership: parseInt(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Financial Health</Label>
                        <span className="text-sm font-medium">{weights.financial} points</span>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max="60"
                        value={weights.financial}
                        onChange={(e) => setWeights({ ...weights, financial: parseInt(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Red Flags</Label>
                        <span className="text-sm font-medium">{weights.red_flags} points</span>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={weights.red_flags}
                        onChange={(e) => setWeights({ ...weights, red_flags: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Total Weight</span>
                      <span className={`font-semibold ${totalWeight !== 110 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {totalWeight} points
                      </span>
                    </div>
                    {totalWeight !== 110 && (
                      <p className="text-xs text-amber-600 mt-1">
                        Note: Default total is 110 points. Scores will be capped at 100.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      onClick={handleResetWeights}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset to Default
                    </Button>
                    <Button 
                      onClick={handleSaveOrg}
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Weights
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Delete User Dialog */}
        <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {deleteUser?.full_name || deleteUser?.email} from your organisation?
                They will lose access to all organisation data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleRemoveUser}
                className="bg-red-600 hover:bg-red-700"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}