import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Building2, Users, FileText, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ENTITY_TYPES = [
  { value: 'pte_ltd', label: 'Private Limited (Pte Ltd)' },
  { value: 'sole_proprietor', label: 'Sole Proprietor' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llp', label: 'Limited Liability Partnership (LLP)' },
  { value: 'public', label: 'Public Company' },
  { value: 'others', label: 'Others' }
];

const COUNTERPARTY_TYPES = [
  { value: 'supplier', label: 'Supplier' },
  { value: 'client', label: 'Client' }
];

export default function CounterpartyForm({ initialData, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    types: initialData?.types || [],
    uen: initialData?.uen || '',
    uen_status: initialData?.uen_status || 'pending',
    entity_type: initialData?.entity_type || '',
    start_date: initialData?.start_date || '',
    registered_address: initialData?.registered_address || '',
    primary_contact_name: initialData?.primary_contact_name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    notes: initialData?.notes || '',
    status: initialData?.status || 'active',
    ownership_locale: initialData?.ownership_locale || 'unknown',
    directors_count: initialData?.directors_count || '',
    shareholders_count: initialData?.shareholders_count || '',
    shareholding_complexity: initialData?.shareholding_complexity || 'unknown',
    governance_changes: initialData?.governance_changes || 'unknown',
    ubo_clarity: initialData?.ubo_clarity || 'unknown'
  });

  const [errors, setErrors] = useState({});

  const validateUEN = (uen) => {
    if (!uen) return true;
    // Basic UEN format: 8-10 characters, alphanumeric
    const uenRegex = /^[0-9]{8,9}[A-Z]$/i;
    const oldUenRegex = /^[A-Z]{1,2}[0-9]{6,7}[A-Z]$/i;
    return uenRegex.test(uen) || oldUenRegex.test(uen) || uen.toUpperCase() === 'PENDING';
  };

  const handleTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.types.length === 0) {
      newErrors.types = 'Select at least one type';
    }

    if (formData.uen && !validateUEN(formData.uen)) {
      newErrors.uen = 'Invalid UEN format';
    }

    if (formData.start_date) {
      const startDate = new Date(formData.start_date);
      if (startDate > new Date()) {
        newErrors.start_date = 'Date cannot be in the future';
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        directors_count: formData.directors_count ? parseInt(formData.directors_count) : null,
        shareholders_count: formData.shareholders_count ? parseInt(formData.shareholders_count) : null
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="ownership" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Ownership
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Company Details</CardTitle>
              <CardDescription>Basic information about the counterparty</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Counterparty Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., ABC Trading Pte Ltd"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label>Counterparty Type *</Label>
                <div className="flex flex-wrap gap-4">
                  {COUNTERPARTY_TYPES.map(type => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.value}
                        checked={formData.types.includes(type.value)}
                        onCheckedChange={() => handleTypeToggle(type.value)}
                      />
                      <Label htmlFor={type.value} className="text-sm font-normal cursor-pointer">
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.types && <p className="text-xs text-red-500">{errors.types}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="uen">UEN (Unique Entity Number)</Label>
                  <Input
                    id="uen"
                    value={formData.uen}
                    onChange={(e) => setFormData({ ...formData, uen: e.target.value.toUpperCase() })}
                    placeholder="e.g., 201234567A or PENDING"
                    className={errors.uen ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-slate-500">Enter "PENDING" if not yet available</p>
                  {errors.uen && <p className="text-xs text-red-500">{errors.uen}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entity_type">Entity Type</Label>
                  <Select
                    value={formData.entity_type}
                    onValueChange={(value) => setFormData({ ...formData, entity_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Incorporation / Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className={errors.start_date ? 'border-red-500' : ''}
                  />
                  {errors.start_date && <p className="text-xs text-red-500">{errors.start_date}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registered_address">Registered Address</Label>
                <Textarea
                  id="registered_address"
                  value={formData.registered_address}
                  onChange={(e) => setFormData({ ...formData, registered_address: e.target.value })}
                  placeholder="Full registered address"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary_contact_name">Primary Contact Name</Label>
                <Input
                  id="primary_contact_name"
                  value={formData.primary_contact_name}
                  onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                  placeholder="Contact person name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@company.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+65 XXXX XXXX"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ownership" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ownership & Control</CardTitle>
              <CardDescription>Information about company ownership structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ownership Locale</Label>
                  <Select
                    value={formData.ownership_locale}
                    onValueChange={(value) => setFormData({ ...formData, ownership_locale: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sg_majority">Majority SG Citizen/PR</SelectItem>
                      <SelectItem value="mixed">Mixed Ownership</SelectItem>
                      <SelectItem value="foreign_majority">Majority Foreign</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Citizenship of majority shareholders</p>
                </div>

                <div className="space-y-2">
                  <Label>Shareholding Complexity</Label>
                  <Select
                    value={formData.shareholding_complexity}
                    onValueChange={(value) => setFormData({ ...formData, shareholding_complexity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple (≤3 shareholders)</SelectItem>
                      <SelectItem value="moderate">Moderate (4–10 shareholders)</SelectItem>
                      <SelectItem value="complex">Complex (&gt;10 or multi-layer)</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="directors_count">Number of Directors</Label>
                  <Input
                    id="directors_count"
                    type="number"
                    min="0"
                    value={formData.directors_count}
                    onChange={(e) => setFormData({ ...formData, directors_count: e.target.value })}
                    placeholder="e.g., 2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shareholders_count">Number of Shareholders</Label>
                  <Input
                    id="shareholders_count"
                    type="number"
                    min="0"
                    value={formData.shareholders_count}
                    onChange={(e) => setFormData({ ...formData, shareholders_count: e.target.value })}
                    placeholder="e.g., 3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frequent Changes (Last 12 months)?</Label>
                  <Select
                    value={formData.governance_changes}
                    onValueChange={(value) => setFormData({ ...formData, governance_changes: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Directors, shareholders, or address changes</p>
                </div>

                <div className="space-y-2">
                  <Label>UBO Clarity</Label>
                  <Select
                    value={formData.ubo_clarity}
                    onValueChange={(value) => setFormData({ ...formData, ubo_clarity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clear">Clear</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="unclear">Unclear</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Ultimate Beneficial Owner identification</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes & Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes about this counterparty..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          {(!formData.uen || formData.uen === 'PENDING') && (
            <Alert variant="warning" className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                UEN is missing or pending. This record will be marked as incomplete for assessment purposes.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {initialData ? 'Update Record' : 'Create Record'}
        </Button>
      </div>
    </form>
  );
}