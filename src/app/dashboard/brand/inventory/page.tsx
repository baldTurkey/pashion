import Link from "next/link";

export default function InventoryPage() {
  return (
    <div>
      <h1 className="bv-page-title">Inventory</h1>

      <div className="bv-action-row">
        <Link href="/dashboard/brand/inventory/add" className="bv-btn bv-btn-primary">
          Add to inventory
        </Link>
        <Link href="/" className="bv-btn">
          Create listing
        </Link>
        <Link href="/dashboard/brand/inventory/drafts" className="bv-btn">
          Drafts
        </Link>
      </div>

      <div className="bv-card">
        <table className="bv-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2} className="bv-empty-row">
                No inventory yet
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}