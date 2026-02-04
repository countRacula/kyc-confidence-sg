import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Trash2, Loader2, ExternalLink } from "lucide-react";
import { base44 } from '@/api/base44Client';

export default function DocumentUploader({ documents = [], counterpartyId, orgId, onDocumentsChange }) {
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('other');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const newDoc = await base44.entities.Document.create({
        org_id: orgId,
        counterparty_id: counterpartyId,
        file_url: file_url,
        file_name: file.name,
        file_type: docType
      });

      onDocumentsChange([...documents, newDoc]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (docId) => {
    try {
      await base44.entities.Document.delete(docId);
      onDocumentsChange(documents.filter(d => d.id !== docId));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const getDocTypeLabel = (type) => {
    switch (type) {
      case 'acra_profile': return 'ACRA Biz Profile';
      case 'financial_statement': return 'Financial Statement';
      default: return 'Other Document';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Documents</CardTitle>
        <CardDescription>Upload supporting documents (ACRA profile, financials, etc.)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="acra_profile">ACRA Biz Profile</SelectItem>
              <SelectItem value="financial_statement">Financial Statement</SelectItem>
              <SelectItem value="other">Other Document</SelectItem>
            </SelectContent>
          </Select>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 sm:flex-none"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload File
          </Button>
        </div>

        {documents.length > 0 && (
          <div className="space-y-2">
            {documents.map(doc => (
              <div 
                key={doc.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{doc.file_name}</p>
                    <p className="text-xs text-slate-500">{getDocTypeLabel(doc.file_type)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {documents.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            No documents uploaded yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}