import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Building2, Plus, Search, Filter, MoreVertical, 
  Pencil, Trash2, FileCheck, Loader2, AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/components/auth/useAuth';
import CounterpartyForm from '@/components/records/CounterpartyForm';
import DocumentUploader from '@/components/records/DocumentUploader';
import { format } from 'date-fns';

export default function Records() {
  const { user, organisation, loading: authLoading, isAuthenticated, canEdit } = useAuth();
  const [counterparties, setCounterparties] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

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
      const [records, docs] = await Promise.all([
        base44.entities.Counterparty.filter({ org_id: user.org_id }, '-created_date'),
        base44.entities.Document.filter({ org_id: user.org_id })
      ]);
      setCounterparties(records);
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    setSaving(true);
    try {
      if (editingRecord) {
        await base44.entities.Counterparty.update(editingRecord.id, formData);
      } else {
        await base44.entities.Counterparty.create({
          ...formData,
          org_id: user.org_id
        });
      }
      await loadData();
      setShowForm(false);
      setEditingRecord(null);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteRecord) return;
    try {
      await base44.entities.Counterparty.delete(deleteRecord.id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setDeleteRecord(null);
    }
  };

  const filteredRecords = counterparties.filter(record => {
    const matchesSearch = record.name.toLowerCase().includes(search.toLowerCase()) ||
                         record.uen?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || record.types?.includes(filterType);
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>;
      case 'in_review':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">In Review</Badge>;
      case 'inactive':
        return <Badge className="bg-slate-100 text-slate-600 border-slate-200">Inactive</Badge>;
      default:
        return null;
    }
  };

  const getTypeLabels = (types) => {
    const labels = {
      vendor: 'Vendor',
      supplier: 'Supplier',
      client: 'Client'
    };
    return types?.map(t => labels[t]).join(', ') || '-';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 overscroll-none">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Records</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage your vendors, suppliers, and clients</p>
          </div>
          {canEdit && (
            <Button 
              onClick={() => { setEditingRecord(null); setShowForm(true); }}
              className="bg-emerald-600 hover:bg-emerald-700 select-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Record
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or UEN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-3">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-36">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Records List */}
        {filteredRecords.length > 0 ? (
          <div className="grid gap-4">
            {filteredRecords.map(record => (
              <Card key={record.id} className="hover:shadow-md transition-shadow">
               <CardContent className="p-4 md:p-6">
                 <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                   <div className="flex items-start gap-3 md:gap-4 min-w-0 flex-1">
                     <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                       <Building2 className="w-5 h-5 md:w-6 md:h-6 text-slate-500" />
                     </div>
                     <div className="min-w-0 flex-1">
                       <div className="flex flex-wrap items-center gap-2 mb-1">
                         <h3 className="font-semibold text-slate-900 break-words">{record.name}</h3>
                         {getStatusBadge(record.status)}
                         {(!record.uen || record.uen === 'PENDING') && (
                           <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                             <AlertCircle className="w-3 h-3 mr-1" />
                             Incomplete
                           </Badge>
                         )}
                       </div>
                       <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-slate-500">
                         <span className="break-all">UEN: {record.uen || '-'}</span>
                         <span>Type: {getTypeLabels(record.types)}</span>
                         {record.start_date && (
                           <span>Since: {format(new Date(record.start_date), 'MMM yyyy')}</span>
                         )}
                       </div>
                       {record.primary_contact_name && (
                         <p className="text-xs md:text-sm text-slate-500 mt-1 break-words">
                           Contact: {record.primary_contact_name}
                           {record.email && ` • ${record.email}`}
                         </p>
                       )}
                     </div>
                   </div>

                   <div className="flex items-center gap-2 flex-shrink-0">
                     <Link to={`${createPageUrl('Assessment')}?counterparty=${record.id}`}>
                       <Button variant="outline" size="sm" className="text-xs md:text-sm">
                         <FileCheck className="w-4 h-4 mr-1" />
                         Assess
                       </Button>
                     </Link>

                     {canEdit && (
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon">
                             <MoreVertical className="w-4 h-4" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => { setEditingRecord(record); setShowForm(true); }}>
                             <Pencil className="w-4 h-4 mr-2" />
                             Edit
                           </DropdownMenuItem>
                           <DropdownMenuItem 
                             onClick={() => setDeleteRecord(record)}
                             className="text-red-600"
                           >
                             <Trash2 className="w-4 h-4 mr-2" />
                             Delete
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                     )}
                   </div>
                 </div>
               </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="font-semibold text-slate-900 mb-2">No records found</h3>
              <p className="text-slate-500 mb-4">
                {search || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first vendor, supplier, or client'}
              </p>
              {canEdit && !search && filterType === 'all' && filterStatus === 'all' && (
                <Button 
                  onClick={() => { setEditingRecord(null); setShowForm(true); }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Record
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRecord ? 'Edit Record' : 'Add New Record'}
              </DialogTitle>
              <DialogDescription>
                {editingRecord 
                  ? 'Update the counterparty information below'
                  : 'Enter the details of your vendor, supplier, or client'}
              </DialogDescription>
            </DialogHeader>
            <CounterpartyForm
              initialData={editingRecord}
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditingRecord(null); }}
              loading={saving}
            />
            {editingRecord && (
              <div className="mt-6">
                <DocumentUploader
                  documents={documents.filter(d => d.counterparty_id === editingRecord.id)}
                  counterpartyId={editingRecord.id}
                  orgId={user.org_id}
                  onDocumentsChange={(newDocs) => {
                    setDocuments(prev => [
                      ...prev.filter(d => d.counterparty_id !== editingRecord.id),
                      ...newDocs
                    ]);
                  }}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteRecord} onOpenChange={() => setDeleteRecord(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Record</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteRecord?.name}"? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}