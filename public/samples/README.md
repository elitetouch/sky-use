# Booking "View Sample" images

Drop the sample photos shown in the Book a Shipment → Items "View Sample"
popups here, using these exact filenames:

| Slot              | File                       | Suggested image                     |
| ----------------- | -------------------------- | ----------------------------------- |
| Parcel Items      | `parcel-items.jpg`         | Parcel contents arranged in a grid  |
| Proof of Purchase | `proof-of-purchase.jpg`    | Photo of shop receipts              |
| Proof of Weight   | `proof-of-weight.jpg`      | Sealed box on a weighing scale      |

Notes:
- JPG or PNG. Keep them reasonably small (ideally < 300 KB) so the popup loads fast.
- If a file is missing, the popup shows a built-in illustration instead, so
  nothing breaks — add the files whenever ready.
- Referenced from `src/components/dashboard/BookShipmentForm.tsx` (`SAMPLE_IMAGES`).
