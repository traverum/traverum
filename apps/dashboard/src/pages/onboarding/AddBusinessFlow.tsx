import { BusinessDetails } from './BusinessDetails';

export default function AddBusinessFlow() {
  return (
    <BusinessDetails
      open={true}
      onOpenChange={(open) => {
        if (!open) window.history.back();
      }}
    />
  );
}
