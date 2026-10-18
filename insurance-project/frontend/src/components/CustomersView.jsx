import React, { useState } from "react";
import { 
    Users, 
    Search, 
    UserPlus, 
    ExternalLink, 
    Phone, 
    Mail, 
    MapPin, 
    ShieldCheck, 
    AlertCircle,
    Calendar
} from "lucide-react";

export default function CustomersView({ 
    customers, 
    onOpenCustomerModal, 
    onNavigateToAddCustomer,
    onNavigateToGraph 
}) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredCustomers = customers.filter(c => {
        const term = searchTerm.toLowerCase();
        return (
            (c.name && c.name.toLowerCase().includes(term)) ||
            (c.customerId && c.customerId.toLowerCase().includes(term)) ||
            (c.phone && c.phone.includes(term)) ||
            (c.email && c.email.toLowerCase().includes(term)) ||
            (c.address && c.address.toLowerCase().includes(term))
        );
    });

    return (
        <div className="view-content-page">
            <div className="page-header">
                <div>
                    <div className="badge-pill emerald-badge">
                        <Users size={13} />
                        <span>Policyholders Directory</span>
                    </div>
                    <h1>Customers Directory</h1>
                    <p>Manage policyholder demographics, contact records, and active graph linkages</p>
                </div>

                <div className="header-actions">
                    <button 
                        className="primary-btn"
                        onClick={onNavigateToAddCustomer}
                    >
                        <UserPlus size={16} />
                        + Add Customer
                    </button>
                </div>
            </div>

            {/* Search and Quick Filters */}
            <div className="table-controls-card">
                <div className="search-bar-wrapper">
                    <Search size={18} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search customers by name, ID, phone, or email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
                            &times;
                        </button>
                    )}
                </div>
                <div className="table-count-badge">
                    Showing <strong>{filteredCustomers.length}</strong> of <strong>{customers.length}</strong> Customers
                </div>
            </div>

            {/* Customers Table */}
            <div className="table-card-container">
                <table className="enterprise-table">
                    <thead>
                        <tr>
                            <th>Customer ID</th>
                            <th>Full Name</th>
                            <th>Demographics</th>
                            <th>Contact Information</th>
                            <th>Location</th>
                            <th>Active Policies</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map(cust => (
                                <tr key={cust.customerId}>
                                    <td>
                                        <span className="cust-id-pill">{cust.customerId}</span>
                                    </td>
                                    <td>
                                        <div className="customer-cell-name">
                                            <strong>{cust.name}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="sub-detail-cell">
                                            <span>{cust.gender || "—"}</span>
                                            <span className="text-muted">
                                                {typeof cust.dob === "string" ? cust.dob : "—"}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="contact-cell">
                                            <div className="contact-row">
                                                <Phone size={13} />
                                                <span>{cust.phone || "—"}</span>
                                            </div>
                                            <div className="contact-row">
                                                <Mail size={13} />
                                                <span>{cust.email || "—"}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="contact-row">
                                            <MapPin size={13} />
                                            <span>{cust.address || "—"}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge-count">
                                            <ShieldCheck size={13} />
                                            {cust.policyCount || 1} Policies
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons-cell">
                                            <button 
                                                className="btn-action-primary"
                                                onClick={() => onOpenCustomerModal(cust.customerId)}
                                                title="View 360° Profile"
                                            >
                                                View 360&deg;
                                            </button>
                                            <button 
                                                className="btn-action-ghost"
                                                onClick={() => onNavigateToGraph(cust.customerId)}
                                                title="View in Neo4j Graph"
                                            >
                                                <ExternalLink size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="empty-table-state">
                                    <AlertCircle size={32} color="#94a3b8" />
                                    <p>No customers match the search criteria "{searchTerm}".</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
