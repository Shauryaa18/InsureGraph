import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

import DashboardView from "./components/DashboardView";
import CustomersView from "./components/CustomersView";
import PoliciesView from "./components/PoliciesView";
import ClaimsView from "./components/ClaimsView";
import FraudView from "./components/FraudView";
import GraphView from "./components/GraphView";
import AddCustomerView from "./components/AddCustomerView";
import CustomerModal from "./components/CustomerModal";

import { 
    LayoutDashboard, 
    Share2, 
    Users, 
    FileText, 
    AlertTriangle, 
    ShieldAlert, 
    UserPlus, 
    ExternalLink, 
    Database, 
    CheckCircle2,
    Menu,
    X
} from "lucide-react";

const API = "http://localhost:5000/api";

function App() {
    const [page, setPage] = useState("dashboard");
    const [graphFocusNode, setGraphFocusNode] = useState(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);

    const [dashboard, setDashboard] = useState({});
    const [customers, setCustomers] = useState([]);
    const [policies, setPolicies] = useState([]);
    const [claims, setClaims] = useState([]);
    const [fraud, setFraud] = useState([]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const loadDashboard = async () => {
        try {
            const res = await axios.get(`${API}/dashboard`);
            setDashboard(res.data);
        } catch (err) {
            console.error("Dashboard Load Error:", err);
        }
    };

    const loadCustomers = async () => {
        try {
            const res = await axios.get(`${API}/customers`);
            setCustomers(res.data);
        } catch (err) {
            console.error("Customers Load Error:", err);
        }
    };

    const loadPolicies = async () => {
        try {
            const res = await axios.get(`${API}/policies`);
            setPolicies(res.data);
        } catch (err) {
            console.error("Policies Load Error:", err);
        }
    };

    const loadClaims = async () => {
        try {
            const res = await axios.get(`${API}/claims`);
            setClaims(res.data);
        } catch (err) {
            console.error("Claims Load Error:", err);
        }
    };

    const loadFraud = async () => {
        try {
            const res = await axios.get(`${API}/fraud/shared-adjuster`);
            setFraud(res.data);
        } catch (err) {
            console.error("Fraud Load Error:", err);
        }
    };

    const loadAll = async () => {
        await Promise.allSettled([
            loadDashboard(),
            loadCustomers(),
            loadPolicies(),
            loadClaims(),
            loadFraud()
        ]);
    };

    useEffect(() => {
        loadAll();
    }, []);

    const handleNavigate = (targetPage, focusNode = null) => {
        if (focusNode) {
            setGraphFocusNode(focusNode);
        }
        setPage(targetPage);
        setMobileMenuOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="app-layout">
            {/* Sidebar Navigation */}
            <aside className={`app-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
                <div className="sidebar-brand">
                    <div className="brand-logo-icon">
                        <Share2 size={22} color="#ffffff" />
                    </div>
                    <div className="brand-text">
                        <h2>InsureGraph</h2>
                        <span>Neo4j Claims Intelligence</span>
                    </div>
                    <button 
                        className="mobile-close-btn"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="sidebar-db-status">
                    <span className="status-indicator"></span>
                    <div className="status-text">
                        <strong>Neo4j AuraDB</strong>
                        <span>Connected &bull; 20058a6b</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <button 
                        className={`nav-item ${page === "dashboard" ? "active" : ""}`}
                        onClick={() => handleNavigate("dashboard")}
                    >
                        <LayoutDashboard size={18} />
                        <span>Dashboard</span>
                    </button>

                    <button 
                        className={`nav-item nav-item-highlight ${page === "graph" ? "active" : ""}`}
                        onClick={() => handleNavigate("graph")}
                    >
                        <Share2 size={18} />
                        <span>Knowledge Graph</span>
                        <span className="nav-badge">Neo4j</span>
                    </button>

                    <button 
                        className={`nav-item ${page === "customers" ? "active" : ""}`}
                        onClick={() => handleNavigate("customers")}
                    >
                        <Users size={18} />
                        <span>Customers</span>
                        <span className="count-pill">{customers.length}</span>
                    </button>

                    <button 
                        className={`nav-item ${page === "policies" ? "active" : ""}`}
                        onClick={() => handleNavigate("policies")}
                    >
                        <FileText size={18} />
                        <span>Policies</span>
                        <span className="count-pill">{policies.length}</span>
                    </button>

                    <button 
                        className={`nav-item ${page === "claims" ? "active" : ""}`}
                        onClick={() => handleNavigate("claims")}
                    >
                        <AlertTriangle size={18} />
                        <span>Claims</span>
                        <span className="count-pill">{claims.length}</span>
                    </button>

                    <button 
                        className={`nav-item ${page === "fraud" ? "active" : ""}`}
                        onClick={() => handleNavigate("fraud")}
                    >
                        <ShieldAlert size={18} />
                        <span>Fraud Detection</span>
                        {fraud.length > 0 && (
                            <span className="badge-warning-dot">!</span>
                        )}
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <button 
                        className="btn-add-customer-side"
                        onClick={() => handleNavigate("add-customer")}
                    >
                        <UserPlus size={16} />
                        <span>+ Add Customer</span>
                    </button>

                    <a 
                        href="https://console.neo4j.io/projects/c4dce804-93ff-4651-8f45-75a5d4c07bb0/instances" 
                        target="_blank" 
                        rel="noreferrer"
                        className="aura-console-shortcut"
                    >
                        <Database size={13} />
                        <span>Neo4j Aura Console</span>
                        <ExternalLink size={12} className="ext-icon" />
                    </a>
                </div>
            </aside>

            {/* Mobile Top Header */}
            <div className="mobile-header">
                <button 
                    className="hamburger-btn"
                    onClick={() => setMobileMenuOpen(true)}
                >
                    <Menu size={22} />
                </button>
                <div className="mobile-brand">
                    <Share2 size={18} color="#4f46e5" />
                    <span>InsureGraph</span>
                </div>
                <button 
                    className="mobile-add-btn"
                    onClick={() => handleNavigate("add-customer")}
                >
                    <UserPlus size={16} />
                </button>
            </div>

            {/* Main Application Area */}
            <main className="app-main-content">
                {page === "dashboard" && (
                    <DashboardView 
                        dashboard={dashboard} 
                        onNavigate={handleNavigate}
                        onSelectCustomer={(id) => setSelectedCustomerId(id)}
                        onOpenCustomerModal={(id) => setSelectedCustomerId(id)}
                    />
                )}

                {page === "graph" && (
                    <GraphView initialFocusNode={graphFocusNode} />
                )}

                {page === "customers" && (
                    <CustomersView 
                        customers={customers} 
                        onOpenCustomerModal={(id) => setSelectedCustomerId(id)}
                        onNavigateToAddCustomer={() => handleNavigate("add-customer")}
                        onNavigateToGraph={(id) => handleNavigate("graph", id)}
                    />
                )}

                {page === "policies" && (
                    <PoliciesView 
                        policies={policies} 
                        onNavigateToGraph={(id) => handleNavigate("graph", id)}
                    />
                )}

                {page === "claims" && (
                    <ClaimsView 
                        claims={claims} 
                        onNavigateToGraph={(id) => handleNavigate("graph", id)}
                    />
                )}

                {page === "fraud" && (
                    <FraudView 
                        fraudCases={fraud} 
                        onNavigateToGraph={(id) => handleNavigate("graph", id)}
                    />
                )}

                {page === "add-customer" && (
                    <AddCustomerView 
                        onCustomerCreated={loadAll} 
                        onNavigate={handleNavigate} 
                    />
                )}
            </main>

            {/* Customer 360° Profile Modal */}
            {selectedCustomerId && (
                <CustomerModal 
                    customerId={selectedCustomerId} 
                    onClose={() => setSelectedCustomerId(null)}
                    onNavigateToGraph={(id) => handleNavigate("graph", id)}
                />
            )}
        </div>
    );
}

export default App;