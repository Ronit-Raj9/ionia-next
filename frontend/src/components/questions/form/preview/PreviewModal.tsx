import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { QuestionFormData } from '../../utils/types';
import QuestionPreview from './QuestionPreview';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: QuestionFormData;
  onConfirm: () => void;
  isSubmitting: boolean;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  formData,
  onConfirm,
  isSubmitting
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview Question</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <QuestionPreview formData={formData} />
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 border-t pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Edit Question
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Confirm & Submit'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewModal; 