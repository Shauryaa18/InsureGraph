import React from "react";
import { 
    Users, 
    ShieldCheck, 
    AlertTriangle, 
    CreditCard, 
    UserCheck, 
    Search, 
    ArrowUpRight, 
    Plus, 
    Database, 
    Activity, 
    ExternalLink,
    ChevronRight,
    TrendingUp,
    CheckCircle,
    Clock,
    FileText
} from "lucide-react";

export default function DashboardView({ 
    dashboard, 
    onNavigate, 
    onSelectCustomer, 
    onOpenCustomerModal 
}) {
    const financials = dashboard.financials || {
        totalPremium: 0,
        totalCoverage: 0,
        totalClaims: 0,
        totalApprovedClaims: 0
    };

    const claimsStatus = dashboard.claimsStatus || {};
    const policyTypes = dashboard.policyTypes || [];
    const recentClaims = dashboard.recentClaims || [];
    const recentCustomers = dashboard.recentCustomers || [];
    const sharedAdjustersCount = dashboard.fraudAlerts?.sharedAdjustersCount || 0;

    return (
        <div className="dashboard-page">
            {/* Top Hero Banner */}
            <div className="dashboard-hero">
                <div className="hero-left">
                    <div className="status-indicator-pill">
                        <span className="pulse-dot"></span>
                        <span>Neo4j AuraDB Connected</span>
                        <span className="divider">&bull;</span>
                        <span className="db-name">DB: 20058a6b</span>
                    </div>
                    <h1>Insurance Graph Intelligence</h1>
                    <p>
                        Real-time knowledge graph analytics, automated claims monitoring, 
                        and relationship-driven fraud intelligence.
                    </p>
                </div>

                <div className="hero-quick-actions">
                    <button 
                        className="btn-hero-primary"
                        onClick={() => onNavigate("add-customer")}
                    >
                        <Plus size={16} />
                        Add New Customer
                    </button>
                    <button 
                        className="btn-hero-secondary"
                        onClick={() => onNavigate("graph")}
                    >
                        <Database size={16} />
                        Explore Knowledge Graph
                    </button>
                    <a 
                        href="https://console.neo4j.io/projects/c4dce804-93ff-4651-8f45-75a5d4c07bb0/instances" 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn-hero-ghost"
                    >
                        <ExternalLink size={15} />
                        Aura Console
                    </a>
                </div>
            </div>

            {/* KPI Stat Cards Grid */}
            <div className="kpi-grid">
                <div className="kpi-card" onClick={() => onNavigate("customers")}>
                    <div className="kpi-icon-wrapper kpi-emerald">
                        <Users size={22} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Total Customers</span>
                        <div className="kpi-value-row">
                            <h2>{dashboard.customers || 0}</h2>
                            <span className="kpi-trend positive">+100% Graph Bound</span>
                        </div>
                        <p className="kpi-footer">Active profiles in Neo4j</p>
                    </div>
                </div>

                <div className="kpi-card" onClick={() => onNavigate("policies")}>
                    <div className="kpi-icon-wrapper kpi-indigo">
                        <ShieldCheck size={22} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Active Policies</span>
                        <div className="kpi-value-row">
                            <h2>{dashboard.policies || 0}</h2>
                            <span className="kpi-trend neutral">₹{(financials.totalPremium || 0).toLocaleString()} Premium</span>
                        </div>
                        <p className="kpi-footer">₹{(financials.totalCoverage || 0).toLocaleString()} Total Exposure</p>
                    </div>
                </div>

                <div className="kpi-card" onClick={() => onNavigate("claims")}>
                    <div className="kpi-icon-wrapper kpi-rose">
                        <AlertTriangle size={22} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Total Claims</span>
                        <div className="kpi-value-row">
                            <h2>{dashboard.claims || 0}</h2>
                            <span className="kpi-badge-warning">{dashboard.claims || 0} Monitored</span>
                        </div>
                        <p className="kpi-footer">Under active inspection</p>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon-wrapper kpi-teal">
                        <CreditCard size={22} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Settled Payments</span>
                        <div className="kpi-value-row">
                            <h2>{dashboard.payments || 0}</h2>
                            <span className="kpi-trend positive">Verified</span>
                        </div>
                        <p className="kpi-footer">Bank-routed transactions</p>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon-wrapper kpi-cyan">
                        <UserCheck size={22} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Field Network</span>
                        <div className="kpi-value-row">
                            <h2>{(dashboard.agents || 0) + (dashboard.adjusters || 0)}</h2>
                            <span className="kpi-sub-count">{dashboard.agents || 0} Ag / {dashboard.adjusters || 0} Adj</span>
                        </div>
                        <p className="kpi-footer">Agents & Claims Adjusters</p>
                    </div>
                </div>

                <div className="kpi-card kpi-alert-card" onClick={() => onNavigate("fraud")}>
                    <div className="kpi-icon-wrapper kpi-amber">
                        <Activity size={22} />
                    </div>
                    <div className="kpi-content">
                        <span className="kpi-label">Fraud Risk Radar</span>
                        <div className="kpi-value-row">
                            <h2>{sharedAdjustersCount}</h2>
                            <span className="kpi-trend alert">Suspicious Collusion</span>
                        </div>
                        <p className="kpi-footer">Shared Adjuster flags</p>
                    </div>
                </div>
            </div>

            {/* Visual Analytics Middle Section */}
            <div className="analytics-two-col">
                {/* Policy Portfolio Distribution */}
                <div className="chart-panel-card">
                    <div className="panel-header">
                        <div>
                            <h3>Policy Portfolio Distribution</h3>
                            <p>Active policy products categorized by risk class</p>
                        </div>
                        <button className="btn-text-action" onClick={() => onNavigate("policies")}>
                            View Policies &rarr;
                        </button>
                    </div>

                    <div className="portfolio-bars-list">
                        {policyTypes.length > 0 ? (
                            policyTypes.map(pt => {
                                const total = dashboard.policies || 1;
                                const pct = Math.round((pt.count / total) * 100);
                                return (
                                    <div className="portfolio-bar-item" key={pt.typeId}>
                                        <div className="bar-label-row">
                                            <strong>{pt.typeName}</strong>
                                            <span>{pt.count} policies ({pct}%)</span>
                                        </div>
                                        <div className="progress-track">
                                            <div 
                                                className="progress-fill" 
                                                style={{ 
                                                    width: `${Math.max(pct, 12)}%`,
                                                    backgroundColor: pt.typeId === "PT001" ? "#8b5cf6" : pt.typeId === "PT002" ? "#06b6d4" : "#10b981"
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="empty-subtext">No policy type data loaded.</p>
                        )}
                    </div>

                    {/* Financial Summary Meter */}
                    <div className="financial-exposure-box">
                        <div className="exposure-stat">
                            <span className="sub-label">Total Premium Volume</span>
                            <strong>₹{(financials.totalPremium || 0).toLocaleString()}</strong>
                        </div>
                        <div className="exposure-divider"></div>
                        <div className="exposure-stat">
                            <span className="sub-label">Gross Underwritten Coverage</span>
                            <strong>₹{(financials.totalCoverage || 0).toLocaleString()}</strong>
                        </div>
                    </div>
                </div>

                {/* Claims Status Pipeline */}
                <div className="chart-panel-card">
                    <div className="panel-header">
                        <div>
                            <h3>Claims Adjudication Pipeline</h3>
                            <p>Lifecycle status of reported claims</p>
                        </div>
                        <button className="btn-text-action" onClick={() => onNavigate("claims")}>
                            All Claims &rarr;
                        </button>
                    </div>

                    <div className="pipeline-grid">
                        <div className="pipeline-step-box step-review">
                            <div className="step-top">
                                <Clock size={16} />
                                <span>Under Review</span>
                            </div>
                            <h3>{claimsStatus["Under Review"]?.count || 1}</h3>
                            <span className="step-amount">Active Audit</span>
                        </div>

                        <div className="pipeline-step-box step-pending">
                            <div className="step-top">
                                <AlertTriangle size={16} />
                                <span>Pending</span>
                            </div>
                            <h3>{claimsStatus["Pending"]?.count || 1}</h3>
                            <span className="step-amount">Awaiting Docs</span>
                        </div>

                        <div className="pipeline-step-box step-approved">
                            <div className="step-top">
                                <CheckCircle size={16} />
                                <span>Approved</span>
                            </div>
                            <h3>{claimsStatus["Approved"]?.count || 1}</h3>
                            <span className="step-amount">Settlement Ready</span>
                        </div>
                    </div>

                    {/* Fraud Radar Banner */}
                    <div className="fraud-spotlight-banner">
                        <div className="spotlight-left">
                            <div className="pulse-warning">⚠️</div>
                            <div>
                                <h4>Graph Collision Alert: Shared Adjusters Detected</h4>
                                <p>Adjuster AD001 (Karan Mehta) is handling multiple interconnected claims across policies.</p>
                            </div>
                        </div>
                        <button className="btn-spotlight-action" onClick={() => onNavigate("fraud")}>
                            Inspect Collusion &rarr;
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Activity Split Tables */}
            <div className="recent-activity-grid">
                {/* Recent Claims */}
                <div className="activity-panel-card">
                    <div className="panel-header">
                        <div>
                            <h3>Recent Claims Activity</h3>
                            <p>Latest insurance claim submissions</p>
                        </div>
                        <button className="btn-text-action" onClick={() => onNavigate("claims")}>
                            View All &rarr;
                        </button>
                    </div>

                    <div className="table-wrapper-compact">
                        <table className="compact-table">
                            <thead>
                                <tr>
                                    <th>Claim</th>
                                    <th>Customer</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentClaims.length > 0 ? (
                                    recentClaims.map(cl => (
                                        <tr key={cl.claimId}>
                                            <td>
                                                <strong>{cl.claimNumber || cl.claimId}</strong>
                                            </td>
                                            <td>{cl.customerName || "—"}</td>
                                            <td>
                                                <span className="type-tag">{cl.claimType || "General"}</span>
                                            </td>
                                            <td>
                                                <strong>₹{Number(cl.amount || 0).toLocaleString()}</strong>
                                            </td>
                                            <td>
                                                <span className={`status-pill status-${(cl.status || "pending").toLowerCase().replace(" ", "-")}`}>
                                                    {cl.status || "Pending"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="empty-cell">No claims reported.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Customers */}
                <div className="activity-panel-card">
                    <div className="panel-header">
                        <div>
                            <h3>Registered Customers</h3>
                            <p>Recently onboarded policyholders</p>
                        </div>
                        <button className="btn-text-action" onClick={() => onNavigate("customers")}>
                            View All &rarr;
                        </button>
                    </div>

                    <div className="table-wrapper-compact">
                        <table className="compact-table">
                            <thead>
                                <tr>
                                    <th>Customer ID</th>
                                    <th>Name</th>
                                    <th>Contact</th>
                                    <th>Policies</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentCustomers.length > 0 ? (
                                    recentCustomers.map(cust => (
                                        <tr key={cust.customerId}>
                                            <td>
                                                <span className="cust-id-pill">{cust.customerId}</span>
                                            </td>
                                            <td>
                                                <strong>{cust.name}</strong>
                                            </td>
                                            <td>
                                                <span className="contact-small">{cust.phone || cust.email}</span>
                                            </td>
                                            <td>
                                                <span className="badge-count">{cust.policyCount || 1} Active</span>
                                            </td>
                                            <td>
                                                <button 
                                                    className="btn-link-action"
                                                    onClick={() => onOpenCustomerModal(cust.customerId)}
                                                >
                                                    View 360&deg; &rarr;
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="empty-cell">No customers registered yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
