import React, { useState } from "react";
import { 
    AlertTriangle, 
    Search, 
    Filter, 
    Calendar, 
    User, 
    FileText, 
    ExternalLink,
    AlertCircle
} from "lucide-react";

export default function ClaimsView({ claims, onNavigateToGraph }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

    const filteredClaims = claims.filter(cl => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
            (cl.claimId && cl.claimId.toLowerCase().includes(term)) ||
            (cl.claimNumber && cl.claimNumber.toLowerCase().includes(term)) ||
            (cl.policyNumber && cl.policyNumber.toLowerCase().includes(term)) ||
            (cl.adjusterName && cl.adjusterName.toLowerCase().includes(term)) ||
            (cl.description && cl.description.toLowerCase().includes(term));

        const matchesType = 
            typeFilter === "all" || 
            (cl.claimType && cl.claimType.toLowerCase() === typeFilter.toLowerCase());

        return matchesSearch && matchesType;
    });

    const totalClaimAmount = claims.reduce((acc, c) => acc + Number(c.amount || 0), 0);

    return (
        <div className="view-content-page">
            <div className="page-header">
                <div>
                    <div className="badge-pill rose-badge">
                        <AlertTriangle size={13} />
                        <span>Adjudication & Claims</span>
                    </div>
                    <h1>Claims Management</h1>
                    <p>Audit insurance claims, adjuster assignments, and resolution statuses</p>
                </div>

                <div className="header-stat-summary">
                    <div className="summary-chip">
                        <span className="chip-label">Total Claims Count</span>
                        <strong>{claims.length} Filed</strong>
                    </div>
                    <div className="summary-chip">
                        <span className="chip-label">Total Claim Volume</span>
                        <strong>₹{totalClaimAmount.toLocaleString()}</strong>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="table-controls-card">
                <div className="search-bar-wrapper">
                    <Search size={18} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search claims by claim ID, number, adjuster, description..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-group-right">
                    <div className="select-wrapper">
                        <Filter size={14} className="select-icon" />
                        <select 
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Claim Types</option>
                            <option value="medical">Medical</option>
                            <option value="accident">Accident</option>
                            <option value="life">Life</option>
                            <option value="vehicle">Vehicle</option>
                        </select>
                    </div>
                    <span className="table-count-badge">
                        {filteredClaims.length} of {claims.length} Claims
                    </span>
                </div>
            </div>

            {/* Claims Table */}
            <div className="table-card-container">
                <table className="enterprise-table">
                    <thead>
                        <tr>
                            <th>Claim ID</th>
                            <th>Claim Number</th>
                            <th>Type</th>
                            <th>Claim Amount</th>
                            <th>Filing Date</th>
                            <th>Assigned Adjuster</th>
                            <th>Status</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClaims.length > 0 ? (
                            filteredClaims.map(cl => (
                                <tr key={cl.claimId}>
                                    <td>
                                        <span className="id-tag">{cl.claimId}</span>
                                    </td>
                                    <td>
                                        <strong>{cl.claimNumber}</strong>
                                    </td>
                                    <td>
                                        <span className="type-badge-pill">{cl.claimType || "General"}</span>
                                    </td>
                                    <td>
                                        <strong className="amount-highlight">
                                            ₹{Number(cl.amount || 0).toLocaleString()}
                                        </strong>
                                    </td>
                                    <td>
                                        <div className="date-cell">
                                            <Calendar size={13} />
                                            <span>
                                                {typeof cl.claimDate === "string" ? cl.claimDate : "—"}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="contact-row">
                                            <User size={13} />
                                            <span>{cl.adjusterName || "Assigned"}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-pill status-${(cl.status || "pending").toLowerCase().replace(" ", "-")}`}>
                                            {cl.status || "Pending"}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="desc-truncate" title={cl.description}>
                                            {cl.description || "—"}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn-action-ghost"
                                            onClick={() => onNavigateToGraph(cl.claimNumber || cl.claimId)}
                                            title="View Claim in Graph"
                                        >
                                            <ExternalLink size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" className="empty-table-state">
                                    <AlertCircle size={32} color="#94a3b8" />
                                    <p>No claims matching search criteria.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
