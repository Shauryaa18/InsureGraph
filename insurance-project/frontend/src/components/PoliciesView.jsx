import React, { useState } from "react";
import { 
    ShieldCheck, 
    Search, 
    Calendar, 
    AlertCircle, 
    ArrowUpRight,
    Filter
} from "lucide-react";

export default function PoliciesView({ policies, onNavigateToGraph }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredPolicies = policies.filter(p => {
        const matchesSearch = 
            (p.policyId && p.policyId.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.policyNumber && p.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = 
            statusFilter === "all" || 
            (p.status && p.status.toLowerCase() === statusFilter.toLowerCase());

        return matchesSearch && matchesStatus;
    });

    const totalPremium = policies.reduce((acc, p) => acc + Number(p.premiumAmount || 0), 0);
    const totalCoverage = policies.reduce((acc, p) => acc + Number(p.coverageAmount || 0), 0);

    return (
        <div className="view-content-page">
            <div className="page-header">
                <div>
                    <div className="badge-pill indigo-badge">
                        <ShieldCheck size={13} />
                        <span>Underwritten Contracts</span>
                    </div>
                    <h1>Insurance Policies</h1>
                    <p>Track active coverage terms, premium schedules, and policy statuses</p>
                </div>

                <div className="header-stat-summary">
                    <div className="summary-chip">
                        <span className="chip-label">Total Premium</span>
                        <strong>₹{totalPremium.toLocaleString()}</strong>
                    </div>
                    <div className="summary-chip">
                        <span className="chip-label">Total Coverage</span>
                        <strong>₹{totalCoverage.toLocaleString()}</strong>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="table-controls-card">
                <div className="search-bar-wrapper">
                    <Search size={18} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search by policy ID, policy number..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-group-right">
                    <div className="select-wrapper">
                        <Filter size={14} className="select-icon" />
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active Only</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <span className="table-count-badge">
                        {filteredPolicies.length} of {policies.length} Policies
                    </span>
                </div>
            </div>

            {/* Policies Table */}
            <div className="table-card-container">
                <table className="enterprise-table">
                    <thead>
                        <tr>
                            <th>Policy ID</th>
                            <th>Policy Number</th>
                            <th>Premium Amount</th>
                            <th>Total Coverage</th>
                            <th>Effective Dates</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPolicies.length > 0 ? (
                            filteredPolicies.map(policy => (
                                <tr key={policy.policyId}>
                                    <td>
                                        <span className="id-tag">{policy.policyId}</span>
                                    </td>
                                    <td>
                                        <strong>{policy.policyNumber}</strong>
                                    </td>
                                    <td>
                                        <span className="amount-highlight">
                                            ₹{Number(policy.premiumAmount || 0).toLocaleString()}
                                        </span>
                                    </td>
                                    <td>
                                        <strong className="coverage-highlight">
                                            ₹{Number(policy.coverageAmount || 0).toLocaleString()}
                                        </strong>
                                    </td>
                                    <td>
                                        <div className="date-cell">
                                            <Calendar size={13} />
                                            <span>
                                                {policy.startDate ? `${policy.startDate} → ${policy.endDate}` : "—"}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-pill status-${(policy.status || "active").toLowerCase()}`}>
                                            {policy.status || "Active"}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn-action-ghost"
                                            onClick={() => onNavigateToGraph(policy.policyNumber || policy.policyId)}
                                            title="View in Knowledge Graph"
                                        >
                                            <ArrowUpRight size={15} />
                                            Graph
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="empty-table-state">
                                    <AlertCircle size={32} color="#94a3b8" />
                                    <p>No policies match criteria.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
