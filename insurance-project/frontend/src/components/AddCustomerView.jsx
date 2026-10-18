import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
    UserPlus, 
    ShieldCheck, 
    AlertCircle, 
    CheckCircle2, 
    Sparkles, 
    RefreshCw, 
    FileText, 
    User, 
    Calendar, 
    CreditCard,
    ArrowRight
} from "lucide-react";

const API = "http://localhost:5000/api";

export default function AddCustomerView({ onCustomerCreated, onNavigate }) {
    // Modes: "quick" (Customer only) | "with-policy" (Customer + Policy) | "complete" (Customer + Policy + Claim)
    const [enrollmentMode, setEnrollmentMode] = useState("with-policy");

    const [policyTypes, setPolicyTypes] = useState([]);
    const [agents, setAgents] = useState([]);
    const [adjusters, setAdjusters] = useState([]);

    const [nextIds, setNextIds] = useState({
        nextCustomerId: "C004",
        nextPolicyId: "P004",
        nextClaimId: "CL004",
        nextPolicyNumber: "POL1004",
        nextClaimNumber: "CLM1004"
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [createdCustomer, setCreatedCustomer] = useState(null);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        // Customer
        customerId: "",
        name: "",
        dob: "1995-06-15",
        gender: "Male",
        phone: "",
        email: "",
        address: "",

        // Policy
        policyId: "",
        policyNumber: "",
        policyTypeId: "",
        agentId: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        premiumAmount: "25000",
        coverageAmount: "500000",
        policyStatus: "Active",

        // Claim
        claimId: "",
        claimNumber: "",
        adjusterId: "",
        claimDate: new Date().toISOString().split("T")[0],
        claimType: "Medical",
        claimAmount: "45000",
        claimStatus: "Pending",
        description: ""
    });

    // Load Dropdown Data & Next IDs
    const loadDropdownData = async () => {
        try {
            const [typesRes, agentsRes, adjustersRes, idsRes] = await Promise.allSettled([
                axios.get(`${API}/policies/types`),
                axios.get(`${API}/policies/agents`),
                axios.get(`${API}/claims/adjusters`),
                axios.get(`${API}/customers/next-ids`)
            ]);

            if (typesRes.status === "fulfilled") {
                setPolicyTypes(typesRes.value.data || []);
                if (typesRes.value.data?.length > 0 && !formData.policyTypeId) {
                    setFormData(prev => ({ ...prev, policyTypeId: typesRes.value.data[0].typeId }));
                }
            }
            if (agentsRes.status === "fulfilled") {
                setAgents(agentsRes.value.data || []);
                if (agentsRes.value.data?.length > 0 && !formData.agentId) {
                    setFormData(prev => ({ ...prev, agentId: agentsRes.value.data[0].agentId }));
                }
            }
            if (adjustersRes.status === "fulfilled") {
                setAdjusters(adjustersRes.value.data || []);
                if (adjustersRes.value.data?.length > 0 && !formData.adjusterId) {
                    setFormData(prev => ({ ...prev, adjusterId: adjustersRes.value.data[0].adjusterId }));
                }
            }
            if (idsRes.status === "fulfilled") {
                const ids = idsRes.value.data;
                setNextIds(ids);
                setFormData(prev => ({
                    ...prev,
                    customerId: prev.customerId || ids.nextCustomerId || "C004",
                    policyId: prev.policyId || ids.nextPolicyId || "P004",
                    policyNumber: prev.policyNumber || ids.nextPolicyNumber || "POL1004",
                    claimId: prev.claimId || ids.nextClaimId || "CL004",
                    claimNumber: prev.claimNumber || ids.nextClaimNumber || "CLM1004"
                }));
            }
        } catch (err) {
            console.error("Failed to load reference data:", err);
        }
    };

    useEffect(() => {
        loadDropdownData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Auto-fill sample data for rapid testing
    const handleQuickFill = () => {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setFormData(prev => ({
            ...prev,
            customerId: nextIds.nextCustomerId || `C00${randomNum % 100}`,
            name: "Ananya Deshmukh",
            dob: "1994-08-22",
            gender: "Female",
            phone: `9876${randomNum}`,
            email: `ananya.${randomNum}@example.com`,
            address: "42 Residency Road, Pune, Maharashtra",
            
            policyId: nextIds.nextPolicyId || `P00${randomNum % 100}`,
            policyNumber: nextIds.nextPolicyNumber || `POL${randomNum}`,
            premiumAmount: "32000",
            coverageAmount: "750000",
            policyStatus: "Active",
            policyTypeId: policyTypes[0]?.typeId || "PT001",
            agentId: agents[0]?.agentId || "A001",

            claimId: nextIds.nextClaimId || `CL00${randomNum % 100}`,
            claimNumber: nextIds.nextClaimNumber || `CLM${randomNum}`,
            adjusterId: adjusters[0]?.adjusterId || "AD001",
            claimType: "Accident",
            claimAmount: "65000",
            claimStatus: "Pending",
            description: "Minor road collision incident claim filed under personal vehicle rider."
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setError("");

        try {
            let res;
            if (enrollmentMode === "quick") {
                // Customer Only
                res = await axios.post(`${API}/customers`, {
                    customerId: formData.customerId,
                    name: formData.name,
                    dob: formData.dob,
                    gender: formData.gender,
                    phone: formData.phone,
                    email: formData.email,
                    address: formData.address
                });
            } else if (enrollmentMode === "with-policy") {
                // Customer + Policy (without claim)
                res = await axios.post(`${API}/customers/complete`, {
                    // Customer
                    customerId: formData.customerId,
                    name: formData.name,
                    dob: formData.dob,
                    gender: formData.gender,
                    phone: formData.phone,
                    email: formData.email,
                    address: formData.address,
                    // Policy
                    policyId: formData.policyId,
                    policyNumber: formData.policyNumber,
                    policyTypeId: formData.policyTypeId,
                    agentId: formData.agentId,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    premiumAmount: formData.premiumAmount,
                    coverageAmount: formData.coverageAmount,
                    policyStatus: formData.policyStatus
                });
            } else {
                // Complete: Customer + Policy + Claim
                res = await axios.post(`${API}/customers/complete`, formData);
            }

            setMessage(res.data.message || "Customer successfully registered in Neo4j database!");
            setCreatedCustomer(res.data.customer);

            if (onCustomerCreated) {
                onCustomerCreated();
            }

            // Refresh next IDs
            loadDropdownData();

        } catch (err) {
            console.error("Submission Error:", err);
            setError(
                err.response?.data?.error || 
                err.response?.data?.details || 
                "Failed to register customer. Please verify field inputs."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setCreatedCustomer(null);
        setMessage("");
        setError("");
        loadDropdownData();
    };

    return (
        <div className="add-customer-view">
            {/* Header */}
            <div className="page-header">
                <div>
                    <div className="badge-pill indigo-badge">
                        <UserPlus size={13} />
                        <span>Neo4j Graph Enrollment</span>
                    </div>
                    <h1>Add Customer & Enrollment</h1>
                    <p>Register new insurance customers, bind policies, and attach claims seamlessly into Neo4j</p>
                </div>

                <div className="header-actions">
                    <button 
                        type="button" 
                        className="btn-magic-fill"
                        onClick={handleQuickFill}
                        title="Auto-fill sample realistic data for instant testing"
                    >
                        <Sparkles size={15} />
                        Auto-Fill Sample Data
                    </button>
                </div>
            </div>

            {/* Mode Selector Tabs */}
            <div className="enrollment-mode-tabs">
                <button 
                    type="button" 
                    className={`mode-tab ${enrollmentMode === "quick" ? "active" : ""}`}
                    onClick={() => setEnrollmentMode("quick")}
                >
                    <User size={16} />
                    <div>
                        <strong>Quick Customer</strong>
                        <span>Customer Profile Only</span>
                    </div>
                </button>

                <button 
                    type="button" 
                    className={`mode-tab ${enrollmentMode === "with-policy" ? "active" : ""}`}
                    onClick={() => setEnrollmentMode("with-policy")}
                >
                    <ShieldCheck size={16} />
                    <div>
                        <strong>Customer + Policy</strong>
                        <span>Profile & Insurance Policy</span>
                    </div>
                </button>

                <button 
                    type="button" 
                    className={`mode-tab ${enrollmentMode === "complete" ? "active" : ""}`}
                    onClick={() => setEnrollmentMode("complete")}
                >
                    <CreditCard size={16} />
                    <div>
                        <strong>Complete Package</strong>
                        <span>Customer + Policy + Claim</span>
                    </div>
                </button>
            </div>

            {/* Success Banner */}
            {message && (
                <div className="success-banner">
                    <CheckCircle2 size={24} color="#10b981" />
                    <div className="success-banner-content">
                        <h4>Success! Record Created in Neo4j</h4>
                        <p>{message}</p>
                        {createdCustomer && (
                            <div className="success-actions">
                                <button 
                                    className="btn-sm-primary" 
                                    onClick={() => onNavigate("customers")}
                                >
                                    View in Customers List &rarr;
                                </button>
                                <button 
                                    className="btn-sm-secondary" 
                                    onClick={() => onNavigate("graph", createdCustomer.customerId)}
                                >
                                    Explore in Graph View &rarr;
                                </button>
                                <button 
                                    className="btn-sm-ghost" 
                                    onClick={handleReset}
                                >
                                    + Add Another Customer
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Error Banner */}
            {error && (
                <div className="error-banner">
                    <AlertCircle size={22} color="#ef4444" />
                    <div>
                        <strong>Registration Failed</strong>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="enrollment-form">
                {/* 1. CUSTOMER SECTION */}
                <div className="form-card">
                    <div className="form-card-header">
                        <div className="header-icon user-icon">
                            <User size={20} />
                        </div>
                        <div>
                            <h3>1. Customer Information</h3>
                            <p>Core customer identification and contact details</p>
                        </div>
                        <span className="step-tag">Required</span>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Customer ID <span className="req">*</span></label>
                            <input 
                                type="text"
                                name="customerId"
                                value={formData.customerId}
                                onChange={handleChange}
                                placeholder="e.g. C004"
                                required
                            />
                            <span className="field-hint">Suggested: {nextIds.nextCustomerId || "C004"}</span>
                        </div>

                        <div className="form-group">
                            <label>Full Name <span className="req">*</span></label>
                            <input 
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter full name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Date of Birth <span className="req">*</span></label>
                            <input 
                                type="date"
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Gender <span className="req">*</span></label>
                            <select 
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                required
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Phone Number <span className="req">*</span></label>
                            <input 
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="10-digit mobile number"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email Address <span className="req">*</span></label>
                            <input 
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="customer@domain.com"
                                required
                            />
                        </div>

                        <div className="form-group span-2">
                            <label>Residential Address <span className="req">*</span></label>
                            <input 
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="City, State, Street address"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* 2. POLICY SECTION (Shown for "with-policy" and "complete") */}
                {(enrollmentMode === "with-policy" || enrollmentMode === "complete") && (
                    <div className="form-card">
                        <div className="form-card-header">
                            <div className="header-icon policy-icon">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h3>2. Policy Specification</h3>
                                <p>Insurance coverage parameters, linked agent, and policy classification</p>
                            </div>
                            <span className="step-tag">Policy Linked</span>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Policy ID <span className="req">*</span></label>
                                <input 
                                    type="text"
                                    name="policyId"
                                    value={formData.policyId}
                                    onChange={handleChange}
                                    placeholder="e.g. P004"
                                    required
                                />
                                <span className="field-hint">Suggested: {nextIds.nextPolicyId || "P004"}</span>
                            </div>

                            <div className="form-group">
                                <label>Policy Number <span className="req">*</span></label>
                                <input 
                                    type="text"
                                    name="policyNumber"
                                    value={formData.policyNumber}
                                    onChange={handleChange}
                                    placeholder="e.g. POL1004"
                                    required
                                />
                                <span className="field-hint">Suggested: {nextIds.nextPolicyNumber || "POL1004"}</span>
                            </div>

                            <div className="form-group">
                                <label>Policy Type <span className="req">*</span></label>
                                <select 
                                    name="policyTypeId"
                                    value={formData.policyTypeId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">-- Select Policy Type --</option>
                                    {policyTypes.map(t => (
                                        <option key={t.typeId} value={t.typeId}>
                                            {t.typeId} - {t.typeName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Assigned Agent <span className="req">*</span></label>
                                <select 
                                    name="agentId"
                                    value={formData.agentId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">-- Select Agent --</option>
                                    {agents.map(a => (
                                        <option key={a.agentId} value={a.agentId}>
                                            {a.agentId} - {a.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Start Date <span className="req">*</span></label>
                                <input 
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>End Date <span className="req">*</span></label>
                                <input 
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Annual Premium (₹) <span className="req">*</span></label>
                                <input 
                                    type="number"
                                    name="premiumAmount"
                                    value={formData.premiumAmount}
                                    onChange={handleChange}
                                    placeholder="₹ 25,000"
                                    min="0"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Total Coverage (₹) <span className="req">*</span></label>
                                <input 
                                    type="number"
                                    name="coverageAmount"
                                    value={formData.coverageAmount}
                                    onChange={handleChange}
                                    placeholder="₹ 500,000"
                                    min="0"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Policy Status</label>
                                <select 
                                    name="policyStatus"
                                    value={formData.policyStatus}
                                    onChange={handleChange}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. CLAIM SECTION (Shown for "complete" mode) */}
                {enrollmentMode === "complete" && (
                    <div className="form-card">
                        <div className="form-card-header">
                            <div className="header-icon claim-icon">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <h3>3. Initial Claim Filing</h3>
                                <p>File an initial incident claim assigned to an adjuster</p>
                            </div>
                            <span className="step-tag">Claim Attached</span>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Claim ID <span className="req">*</span></label>
                                <input 
                                    type="text"
                                    name="claimId"
                                    value={formData.claimId}
                                    onChange={handleChange}
                                    placeholder="e.g. CL004"
                                    required
                                />
                                <span className="field-hint">Suggested: {nextIds.nextClaimId || "CL004"}</span>
                            </div>

                            <div className="form-group">
                                <label>Claim Number <span className="req">*</span></label>
                                <input 
                                    type="text"
                                    name="claimNumber"
                                    value={formData.claimNumber}
                                    onChange={handleChange}
                                    placeholder="e.g. CLM1004"
                                    required
                                />
                                <span className="field-hint">Suggested: {nextIds.nextClaimNumber || "CLM1004"}</span>
                            </div>

                            <div className="form-group">
                                <label>Claim Date <span className="req">*</span></label>
                                <input 
                                    type="date"
                                    name="claimDate"
                                    value={formData.claimDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Claim Type <span className="req">*</span></label>
                                <select 
                                    name="claimType"
                                    value={formData.claimType}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Medical">Medical</option>
                                    <option value="Accident">Accident</option>
                                    <option value="Life">Life</option>
                                    <option value="Vehicle">Vehicle</option>
                                    <option value="Property">Property</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Claim Amount (₹) <span className="req">*</span></label>
                                <input 
                                    type="number"
                                    name="claimAmount"
                                    value={formData.claimAmount}
                                    onChange={handleChange}
                                    placeholder="₹ 50,000"
                                    min="0"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Assigned Adjuster <span className="req">*</span></label>
                                <select 
                                    name="adjusterId"
                                    value={formData.adjusterId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">-- Select Adjuster --</option>
                                    {adjusters.map(ad => (
                                        <option key={ad.adjusterId} value={ad.adjusterId}>
                                            {ad.adjusterId} - {ad.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Claim Status</label>
                                <select 
                                    name="claimStatus"
                                    value={formData.claimStatus}
                                    onChange={handleChange}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Under Review">Under Review</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>

                            <div className="form-group span-2">
                                <label>Incident Description <span className="req">*</span></label>
                                <textarea 
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Provide detailed description of incident or medical condition..."
                                    rows="3"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Action Controls */}
                <div className="form-bottom-actions">
                    <button 
                        type="button" 
                        className="btn-cancel"
                        onClick={() => onNavigate("customers")}
                    >
                        Cancel
                    </button>

                    <button 
                        type="submit" 
                        className="btn-submit-enrollment"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="spinner-sm"></div>
                                Writing to Neo4j...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={18} />
                                {enrollmentMode === "quick" 
                                    ? "Commit Customer Profile" 
                                    : enrollmentMode === "with-policy" 
                                        ? "Register Customer & Policy" 
                                        : "Complete Full Enrollment"}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
