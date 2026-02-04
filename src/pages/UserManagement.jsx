import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, UserPlus, Shield, Activity, Mail, Calendar, 
  Search, Loader2, AlertCircle 
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PageTransition } from '@/components/ui/PageTransition';
import { PullToRefresh } from '@/components/ui/PullToRefresh';

export default function UserManagement() {
  const { user, organisation, loading: authLoading, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user && organisation) {
      loadData();
    }
  }, [user, organisation]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, invitesData, logsData] = await Promise.all([
        base44.entities.User.list(),
        base44.users.listPendingInvites(),
        base44.entities.AuditLog.filter({ org_id: organisation.id }, '-created_date', 50)
      ]);
      setUsers(usersData.filter(u => u.org_id === organisation.id));
      setPendingInvites(invitesData || []);
      setAuditLogs(logsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return;
    
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      
      // Log the action
      await base44.entities.AuditLog.create({
        org_id: organisation.id,
        user_email: user.email,
        user_name: user.full_name || user.email,
        action: 'user_invited',
        entity_type: 'User',
        details: { invited_email: inviteEmail, role: inviteRole },
        timestamp: new Date().toISOString()
      });
      
      toast.success('Invitation sent');
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole('user');
      loadData();
    } catch (error) {
      console.error('Invite error:', error);
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role) => {
    const config = {
      admin: { label: 'Admin', color: 'bg-red-100 text-red-700' },
      manager: { label: 'Manager', color: 'bg-blue-100 text-blue-700' },
      user: { label: 'User', color: 'bg-slate-100 text-slate-700' }
    };
    const { label, color } = config[role] || config.user;
    return <Badge className={color}>{label}</Badge>;
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <PageTransition>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Admin access required to view user management.
            </AlertDescription>
          </Alert>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PullToRefresh onRefresh={loadData}>
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">User Management</h1>
              <p className="text-slate-500 dark:text-slate-400">Manage team members and view activity</p>
            </div>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New User</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join {organisation?.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User - View and create records</SelectItem>
                        <SelectItem value="manager">Manager - Full access except settings</SelectItem>
                        <SelectItem value="admin">Admin - Full access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleInviteUser}
                    disabled={inviting || !inviteEmail}
                    className="w-full"
                  >
                    {inviting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Audit Trail
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle>Team Members</CardTitle>
                      <CardDescription>
                        {users.length} active user{users.length !== 1 ? 's' : ''} • {pendingInvites.length} pending
                      </CardDescription>
                    </div>
                    <div className="w-full max-w-xs">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      {searchQuery ? 'No users found' : 'No users yet'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingInvites.length > 0 && (
                        <div className="pb-3 border-b">
                          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Pending Invitations</h3>
                          {pendingInvites.map((invite) => (
                            <div 
                              key={invite.email}
                              className="flex items-center justify-between p-4 border rounded-lg bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 mb-2"
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
                                  <Mail className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                    {invite.email}
                                  </p>
                                  <p className="text-sm text-amber-600 dark:text-amber-400">
                                    Invitation pending
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {getRoleBadge(invite.role)}
                                {invite.invited_at && (
                                  <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(invite.invited_at), 'dd MMM yyyy')}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {filteredUsers.map((u) => (
                        <div 
                          key={u.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                {u.full_name?.[0] || u.email?.[0]?.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                {u.full_name || 'User'}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                {u.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getRoleBadge(u.org_role || u.role)}
                            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(u.created_date), 'dd MMM yyyy')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audit Trail Tab */}
            <TabsContent value="audit" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Log</CardTitle>
                  <CardDescription>
                    Recent actions performed by team members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      No activity recorded yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {auditLogs.map((log) => (
                        <div 
                          key={log.id}
                          className="flex items-start gap-3 p-3 border rounded-lg text-sm"
                        >
                          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0">
                            <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-900 dark:text-slate-100">
                              <strong>{log.user_name}</strong> {log.action.replace(/_/g, ' ')}
                            </p>
                            {log.details && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {JSON.stringify(log.details)}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                              {format(new Date(log.timestamp), 'dd MMM yyyy, h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PullToRefresh>
    </PageTransition>
  );
}