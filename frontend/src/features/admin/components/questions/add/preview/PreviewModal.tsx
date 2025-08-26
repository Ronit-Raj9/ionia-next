import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { X } from 'lucide-react';
import { QuestionFormData } from '../../utils/types';
import QuestionPreview from './QuestionPreview';

interface PreviewModalProps {
  formData: QuestionFormData;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  formData,
  onClose
}) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <DialogTitle className="text-2xl font-bold">Question Preview</DialogTitle>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500">Please review all details carefully before submission</p>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="py-2 px-2">
          <QuestionPreview formData={formData} />
        </div>

        <div className="flex items-center justify-end gap-4 mt-8 border-t pt-5">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2.5 text-base"
          >
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewModal; 