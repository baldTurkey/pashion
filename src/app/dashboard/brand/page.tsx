import Link from "next/link";

export default function BrandOverviewPage() {
  return (
    <div>
      <h1 className="bv-page-title">Overview</h1>

      <div className="bv-grid">
        <div className="bv-card">
          <div className="bv-card-header">
            <h2 className="bv-card-title">Inventory</h2>
            <Link href="/dashboard/brand/inventory" className="bv-card-link">
              View all
            </Link>
          </div>
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

        <div className="bv-card">
          <div className="bv-card-header">
            <h2 className="bv-card-title">My listings</h2>
            <Link href="/dashboard" className="bv-card-link">
              View all
            </Link>
          </div>
          <table className="bv-table">
            <thead>
              <tr>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="bv-empty-row">No listings yet</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bv-card">
          <div className="bv-card-header">
            <h2 className="bv-card-title">Shows</h2>
            <Link href="/dashboard/shows" className="bv-card-link">
              View all
            </Link>
          </div>
          <table className="bv-table">
            <thead>
              <tr>
                <th>Live</th>
                <th>Drafts</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={2} className="bv-empty-row">
                  No shows yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bv-card">
          <div className="bv-card-header">
            <h2 className="bv-card-title">Orders</h2>
            <Link href="/dashboard/brand/orders" className="bv-card-link">
              View all
            </Link>
          </div>
          <table className="bv-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Item</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} className="bv-empty-row">
                  No orders yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}