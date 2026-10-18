import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
    AlertOctagon, 
    ShieldAlert, 
    Users, 
    ExternalLink, 
    AlertTriangle, 
    CheckCircle,
    Info,
    TrendingUp
} from "lucide-react";

const API = "http://localhost:5000/api";

export default function FraudView({ fraudCases, onNavigateToGraph }) {
    const [riskScores, setRiskScores] = useState([]);
    const [loadingRisk, setLoadingRisk] = useState(true);

    useEffect(() => {
        const loadRiskScores = async () => {
            try {
                const res = await axios.get(`${API}/fraud/risk-score`);
                setRiskScores(res.data);
            } catch (err) {
                console.error("Failed to load fraud risk scores:", err);
            } finally {
                setLoadingRisk(false);
            }
        };
        loadRiskScores();
    }, []);

    const highRiskCount = riskScores.filter(r => r.riskLevel === "HIGH").length;
    const mediumRiskCount = riskScores.filter(r => r.riskLevel === "MEDIUM").length;

    return (
        <div className="view-content-page">
            <div className="page-header">
                <div>
                    <div className="badge-pill alert-badge">
                        <AlertOctagon size={13} />
                        <span>Neo4j Graph Pattern Analytics</span>
                    </div>
                    <h1>Fraud Detection & Risk Scoring</h1>
                    <p>Detect collusive adjuster relationships and anomalous claim risk scores across the graph</p>
                </div>

                <div className="header-stat-summary">
                    <div className="summary-chip alert-chip">
                        <span className="chip-label">Collusion Rings</span>
                        <strong>{fraudCases.length} Suspicious</strong>
                    </div>
                    <div className="summary-chip warning-chip">
                        <span className="chip-label">High Risk Claims</span>
                        <strong>{highRiskCount} Flagged</strong>
                    </div>
                </div>
            </div>

            {/* Shared Adjuster Collusion Section */}
            <div className="fraud-main-card">
                <div className="fraud-card-heading">
                    <div className="fraud-icon-box">
                        <ShieldAlert size={22} color="#dc2626" />
                    </div>
                    <div>
                        <h2>Shared Adjuster Collusion Patterns</h2>
                        <p>
                            Graph topology identifies adjusters simultaneously adjudicating multiple linked 
                            claims, presenting potential conflicts of interest or synthetic claim collusion.
                        </p>
                    </div>
                </div>

                {fraudCases.length === 0 ? (
                    <div className="clean-state-box">
                        <CheckCircle size={24} color="#10b981" />
                        <div>
                            <strong>No Collusion Rings Detected</strong>
                            <p>All adjusters have isolated, single-policy assignments in the current graph state.</p>
                        </div>
                    </div>
                ) : (
                    <div className="fraud-cases-grid">
                        {fraudCases.map((item, idx) => (
                            <div className="fraud-case-card" key={idx}>
                                <div className="case-card-header">
                                    <div className="adjuster-info">
                                        <Users size={16} color="#dc2626" />
                                        <div>
                                            <strong>{item.adjusterName}</strong>
                                            <span className="sub-id">Adjuster ID: {item.adjusterId}</span>
                                        </div>
                                    </div>
                                    <span className="risk-level-badge badge-high">High Risk</span>
                                </div>

                                <div className="collusion-body">
                                    <p className="collusion-text">
                                        Assigned to adjudicate multiple interrelated claims across distinct policies:
                                    </p>
                                    <div className="interconnected-claims">
                                        <div className="claim-box">
                                            <span className="claim-title">Primary Claim</span>
                                            <strong>{item.claimNumber1 || item.claim1}</strong>
                                            <span className="claim-sub">ID: {item.claim1}</span>
                                        </div>
                                        <div className="claim-connector">&harr;</div>
                                        <div className="claim-box">
                                            <span className="claim-title">Colluding Claim</span>
                                            <strong>{item.claimNumber2 || item.claim2}</strong>
                                            <span className="claim-sub">ID: {item.claim2}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="case-card-footer">
                                    <span className="risk-reason-text">Pattern: Co-assigned Claim Adjuster</span>
                                    <button 
                                        className="btn-inspect-graph"
                                        onClick={() => onNavigateToGraph(item.adjusterName || item.adjusterId)}
                                    >
                                        <ExternalLink size={13} />
                                        Inspect Cluster in Graph
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Claims Risk Score Table */}
            <div className="table-card-container mt-30">
                <div className="table-header-title-row">
                    <div>
                        <h3>Claim Risk Scoring Index</h3>
                        <p>Computed risk score based on claim volume and multi-claim adjuster density</p>
                    </div>
                </div>

                <table className="enterprise-table">
                    <thead>
                        <tr>
                            <th>Claim ID</th>
                            <th>Claim Number</th>
                            <th>Claim Amount</th>
                            <th>Assigned Adjuster</th>
                            <th>Risk Score</th>
                            <th>Calculated Risk Level</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {riskScores.length > 0 ? (
                            riskScores.map(score => (
                                <tr key={score.claimId}>
                                    <td>
                                        <span className="id-tag">{score.claimId}</span>
                                    </td>
                                    <td>
                                        <strong>{score.claimNumber}</strong>
                                    </td>
                                    <td>
                                        <span className="amount-highlight">
                                            ₹{Number(score.claimAmount || 0).toLocaleString()}
                                        </span>
                                    </td>
                                    <td>{score.adjusterName}</td>
                                    <td>
                                        <div className="score-meter-cell">
                                            <div className="score-bar-track">
                                                <div 
                                                    className="score-bar-fill" 
                                                    style={{ 
                                                        width: `${Math.min(score.riskScore, 100)}%`,
                                                        backgroundColor: score.riskLevel === "HIGH" ? "#ef4444" : score.riskLevel === "MEDIUM" ? "#f59e0b" : "#10b981"
                                                    }}
                                                />
                                            </div>
                                            <span className="score-num">{score.riskScore} / 100</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`risk-level-badge badge-${(score.riskLevel || "low").toLowerCase()}`}>
                                            {score.riskLevel}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-pill status-${(score.claimStatus || "pending").toLowerCase().replace(" ", "-")}`}>
                                            {score.claimStatus || "Pending"}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="empty-table-state">
                                    <p>Loading fraud risk scores...</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
