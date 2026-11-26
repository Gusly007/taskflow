// Closes the modal when navigating anywhere else (back to the list after saving, a sidebar link...).
// In a client-side navigation, a slot that matches no route keeps showing its last page, so the
// modal would stay open: every other URL has to match this empty page.
export default function CloseModal() {
  return null;
}
