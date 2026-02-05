import { useState } from 'react';
import { BusinessTypeSelection } from './BusinessTypeSelection';
import { BusinessDetails } from './BusinessDetails';

type BusinessType = 'supplier' | 'hotel' | 'hybrid';

export default function AddBusinessFlow() {
  const [showTypeSelection, setShowTypeSelection] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedType, setSelectedType] = useState<BusinessType | null>(null);

  const handleTypeSelect = (type: BusinessType) => {
    setSelectedType(type);
    setShowTypeSelection(false);
    setShowDetails(true);
  };

  const handleBack = () => {
    setShowDetails(false);
    setShowTypeSelection(true);
  };

  const handleClose = () => {
    setShowTypeSelection(false);
    setShowDetails(false);
  };

  return (
    <>
      <BusinessTypeSelection
        open={showTypeSelection}
        onOpenChange={(open) => {
          if (!open) {
            // If closing type selection, go back to dashboard
            window.history.back();
          }
        }}
        onSelect={handleTypeSelect}
      />
      {selectedType && (
        <BusinessDetails
          open={showDetails}
          onOpenChange={(open) => {
            if (!open) {
              // If closing details, go back to type selection or dashboard
              if (showTypeSelection) {
                setShowDetails(false);
              } else {
                window.history.back();
              }
            }
          }}
          businessType={selectedType}
          onBack={handleBack}
        />
      )}
    </>
  );
}
