import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
    X, 
    User, 
    ShieldCheck, 
    AlertTriangle, 
    CreditCard, 
    Users, 
    Phone, 
    Mail, 
    MapPin, 
    Calendar, 
    ExternalLink,
    Building2,
    FileText
} from "lucide-react";

export default function CustomerModal({ customerId, onClose, onNavigateToGraph }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!customerId) return;
        const fetchGraph = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`http://localhost:5000/api/customers/${customerId}`);
                setData(res.data);
            } catch (err) {
                console.error("Failed to load customer profile:", err);
                setError(err.response?.data?.error || "Failed to load customer profile");
            } finally {
                setLoading(false);
            }
        };
        fetchGraph();
    }, [customerId]);

    if (!customerId) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title-row">
                        <div className="modal-avatar">
                            <User size={24} color="#ffffff" />
                        </div>
                        <div>
                            <h2>{data?.customer?.name || "Customer Profile"}</h2>
                            <span className="customer-id-tag">ID: {customerId}</span>
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button 
                            className="btn-outline-sm"
                            onClick={() => {
                                onNavigateToGraph(customerId);
                                onClose();
                            }}
                            title="Explore customer relationships in Neo4j Graph"
                        >
                            <ExternalLink size={14} />
                            View in Graph
                        </button>
                        <button className="modal-close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="modal-body">
                    {loading && (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading customer profile from Neo4j...</p>
                        </div>
                    )}

                    {error && (
                        <div className="error-box">
                            {error}
                        </div>
                    )}

                    {data && (
                        <>
                            {/* Contact & Demographics */}
                            <div className="profile-section-card">
                                <h3>Customer Information</h3>
                                <div className="info-chips-grid">
                                    <div className="info-chip">
                                        <Phone size={15} className="chip-icon" />
                                        <div>
                                            <span className="chip-label">Phone</span>
                                            <strong>{data.customer.phone || "—"}</strong>
                                        </div>
                                    </div>
                                    <div className="info-chip">
                                        <Mail size={15} className="chip-icon" />
                                        <div>
                                            <span className="chip-label">Email</span>
                                            <strong>{data.customer.email || "—"}</strong>
                                        </div>
                                    </div>
                                    <div className="info-chip">
                                        <MapPin size={15} className="chip-icon" />
                                        <div>
                                            <span className="chip-label">Address</span>
                                            <strong>{data.customer.address || "—"}</strong>
                                        </div>
                                    </div>
                                    <div className="info-chip">
                                        <Calendar size={15} className="chip-icon" />
                                        <div>
                                            <span className="chip-label">DOB / Gender</span>
                                            <strong>
                                                {typeof data.customer.dob === "string" ? data.customer.dob : "—"} ({data.customer.gender || "—"})
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Policies */}
                            <div className="profile-section-card">
                                <div className="section-heading">
                                    <ShieldCheck size={18} color="#4f46e5" />
                                    <h3>Policies ({data.policies?.length || 0})</h3>
                                </div>
                                {data.policies?.length > 0 ? (
                                    <div className="card-list">
                                        {data.policies.map((p, idx) => (
                                            <div className="detail-item-card" key={p.policyId || idx}>
                                                <div className="item-header">
                                                    <strong>{p.policyNumber || p.policyId}</strong>
                                                    <span className={`status-pill status-${(p.status || "active").toLowerCase()}`}>
                                                        {p.status || "Active"}
                                                    </span>
                                                </div>
                                                <div className="item-stats">
                                                    <div>
                                                        <span className="sub-label">Premium:</span>
                                                        <span>₹{Number(p.premiumAmount || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div>
                                                        <span className="sub-label">Coverage:</span>
                                                        <span>₹{Number(p.coverageAmount || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div>
                                                        <span className="sub-label">Period:</span>
                                                        <span>{p.startDate ? `${p.startDate} to ${p.endDate}` : "—"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="empty-notice">No policies associated with this customer.</p>
                                )}
                            </div>

                            {/* Claims */}
                            <div className="profile-section-card">
                                <div className="section-heading">
                                    <AlertTriangle size={18} color="#ef4444" />
                                    <h3>Claims ({data.claims?.length || 0})</h3>
                                </div>
                                {data.claims?.length > 0 ? (
                                    <div className="card-list">
                                        {data.claims.map((cl, idx) => (
                                            <div className="detail-item-card" key={cl.claimId || idx}>
                                                <div className="item-header">
                                                    <strong>{cl.claimNumber || cl.claimId}</strong>
                                                    <span className={`status-pill status-${(cl.status || "pending").toLowerCase().replace(" ", "-")}`}>
                                                        {cl.status || "Pending"}
                                                    </span>
                                                </div>
                                                <div className="item-stats">
                                                    <div>
                                                        <span className="sub-label">Type:</span>
                                                        <span>{cl.claimType || "Standard"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="sub-label">Amount:</span>
                                                        <span className="highlight-amount">₹{Number(cl.amount || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                {cl.description && (
                                                    <p className="item-desc">
                                                        <FileText size={13} style={{ display: "inline", marginRight: 4 }} />
                                                        {cl.description}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="empty-notice">No claims filed by this customer.</p>
                                )}
                            </div>

                            {/* Connected Nodes: Dependents & Payments */}
                            <div className="two-col-grid">
                                <div className="profile-section-card">
                                    <div className="section-heading">
                                        <Users size={16} color="#0d9488" />
                                        <h4>Dependents ({data.dependents?.length || 0})</h4>
                                    </div>
                                    {data.dependents?.length > 0 ? (
                                        <ul className="simple-list">
                                            {data.dependents.map((dep, i) => (
                                                <li key={dep.dependentId || i}>
                                                    <strong>{dep.name}</strong> 
                                                    <span className="sub-text">({dep.relation || "Dependent"})</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="empty-notice">No dependents registered.</p>
                                    )}
                                </div>

                                <div className="profile-section-card">
                                    <div className="section-heading">
                                        <CreditCard size={16} color="#22c55e" />
                                        <h4>Payments & Banking</h4>
                                    </div>
                                    {data.payments?.length > 0 ? (
                                        <ul className="simple-list">
                                            {data.payments.map((pay, i) => (
                                                <li key={pay.paymentId || i}>
                                                    <strong>Payment #{pay.paymentId}</strong>: ₹{Number(pay.amount || 0).toLocaleString()}
                                                    {pay.paymentDate && <span className="sub-text"> on {pay.paymentDate}</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="empty-notice">No payment records found.</p>
                                    )}
                                    {data.banks?.length > 0 && (
                                        <div className="bank-tag">
                                            <Building2 size={13} />
                                            <span>Bank: {data.banks.map(b => b.bankName || b.bankId).join(", ")}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
