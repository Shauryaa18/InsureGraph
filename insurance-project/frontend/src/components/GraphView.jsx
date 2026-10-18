import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Network } from "vis-network";
import { 
    Search, 
    RefreshCw, 
    Maximize2, 
    Sliders, 
    ExternalLink, 
    Info, 
    Sparkles, 
    Layers, 
    Check, 
    Copy,
    Share2,
    Database,
    AlertTriangle
} from "lucide-react";

const NODE_COLORS = {
    Customer: { background: "#10b981", border: "#059669", font: "#ffffff" },
    Policy: { background: "#4f46e5", border: "#3730a3", font: "#ffffff" },
    PolicyType: { background: "#8b5cf6", border: "#6d28d9", font: "#ffffff" },
    Claim: { background: "#ef4444", border: "#b91c1c", font: "#ffffff" },
    Agent: { background: "#06b6d4", border: "#0891b2", font: "#ffffff" },
    Adjuster: { background: "#f97316", border: "#c2410c", font: "#ffffff" },
    Dependent: { background: "#14b8a6", border: "#0f766e", font: "#ffffff" },
    Payment: { background: "#22c55e", border: "#15803d", font: "#ffffff" },
    Bank: { background: "#3b82f6", border: "#1d4ed8", font: "#ffffff" },
    PaymentMethod: { background: "#ec4899", border: "#be185d", font: "#ffffff" },
    ClaimDocument: { background: "#64748b", border: "#334155", font: "#ffffff" },
    Inspection: { background: "#eab308", border: "#a16207", font: "#ffffff" },
    Default: { background: "#94a3b8", border: "#64748b", font: "#ffffff" }
};

export default function GraphView({ initialFocusNode = null }) {
    const containerRef = useRef(null);
    const networkRef = useRef(null);

    const [graphData, setGraphData] = useState({ nodes: [], edges: [], summary: {} });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedNode, setSelectedNode] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilters, setActiveFilters] = useState(new Set());
    const [physicsEnabled, setPhysicsEnabled] = useState(true);
    const [copiedCypher, setCopiedCypher] = useState(false);

    // Fetch Graph Data
    const loadGraph = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get("http://localhost:5000/api/graph");
            setGraphData(res.data);
            // Default: all groups active
            if (res.data.summary?.nodeCounts) {
                setActiveFilters(new Set(Object.keys(res.data.summary.nodeCounts)));
            }
        } catch (err) {
            console.error("Failed to load Neo4j graph:", err);
            setError("Failed to load graph from Neo4j. Check backend server and Neo4j connectivity.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGraph();
    }, []);

    // Build & Update Vis Network
    useEffect(() => {
        if (!containerRef.current || graphData.nodes.length === 0) return;

        // Filter nodes based on active filters
        const filteredNodes = graphData.nodes
            .filter(n => activeFilters.size === 0 || activeFilters.has(n.group))
            .map(n => {
                const colorConfig = NODE_COLORS[n.group] || NODE_COLORS.Default;
                return {
                    id: n.id,
                    label: n.label,
                    title: `${n.group}: ${n.label}${n.subtitle ? `\n${n.subtitle}` : ""}`,
                    group: n.group,
                    color: {
                        background: colorConfig.background,
                        border: colorConfig.border,
                        highlight: {
                            background: colorConfig.border,
                            border: "#ffffff"
                        }
                    },
                    font: {
                        color: "#1e293b",
                        size: 12,
                        face: "Inter, system-ui, sans-serif",
                        strokeWidth: 2,
                        strokeColor: "#ffffff"
                    },
                    borderWidth: 2,
                    shadow: {
                        enabled: true,
                        color: "rgba(0,0,0,0.12)",
                        size: 6,
                        x: 2,
                        y: 2
                    },
                    shape: "dot",
                    size: n.group === "Customer" ? 24 : n.group === "Policy" ? 22 : n.group === "Claim" ? 20 : 16
                };
            });

        const activeNodeIds = new Set(filteredNodes.map(n => n.id));

        // Filter edges to only those connecting active nodes
        const filteredEdges = graphData.edges
            .filter(e => activeNodeIds.has(e.from) && activeNodeIds.has(e.to))
            .map(e => ({
                id: e.id,
                from: e.from,
                to: e.to,
                label: e.label,
                font: {
                    size: 9,
                    color: "#64748b",
                    align: "middle",
                    background: "rgba(255, 255, 255, 0.85)"
                },
                arrows: {
                    to: { enabled: true, scaleFactor: 0.6 }
                },
                color: {
                    color: "#cbd5e1",
                    highlight: "#4f46e5",
                    hover: "#6366f1"
                },
                smooth: {
                    type: "continuous",
                    roundness: 0.2
                },
                width: 1.5
            }));

        const options = {
            physics: {
                enabled: physicsEnabled,
                barnesHut: {
                    gravitationalConstant: -4000,
                    centralGravity: 0.3,
                    springLength: 95,
                    springConstant: 0.04,
                    damping: 0.09
                },
                stabilization: {
                    enabled: true,
                    iterations: 150
                }
            },
            interaction: {
                hover: true,
                tooltipDelay: 120,
                hideEdgesOnDrag: false,
                navigationButtons: false,
                zoomView: true
            }
        };

        const network = new Network(containerRef.current, { nodes: filteredNodes, edges: filteredEdges }, options);
        networkRef.current = network;

        network.on("click", (params) => {
            if (params.nodes.length > 0) {
                const clickedNodeId = params.nodes[0];
                const nodeObj = graphData.nodes.find(n => n.id === clickedNodeId);
                if (nodeObj) {
                    // Find connected neighbors
                    const connectedEdges = graphData.edges.filter(
                        e => e.from === clickedNodeId || e.to === clickedNodeId
                    );
                    const neighborIds = connectedEdges.map(e => (e.from === clickedNodeId ? e.to : e.from));
                    const neighbors = graphData.nodes.filter(n => neighborIds.includes(n.id));

                    setSelectedNode({
                        ...nodeObj,
                        connectedEdges,
                        neighbors
                    });
                }
            } else {
                setSelectedNode(null);
            }
        });

        // If an initial focus node was requested (e.g. from customer modal)
        if (initialFocusNode) {
            const target = graphData.nodes.find(n => 
                n.properties?.customerId === initialFocusNode || n.id === initialFocusNode || n.label === initialFocusNode
            );
            if (target) {
                setTimeout(() => {
                    network.focus(target.id, {
                        scale: 1.4,
                        animation: { duration: 800, easingFunction: "easeInOutQuad" }
                    });
                    network.selectNodes([target.id]);
                    const connectedEdges = graphData.edges.filter(
                        e => e.from === target.id || e.to === target.id
                    );
                    const neighborIds = connectedEdges.map(e => (e.from === target.id ? e.to : e.from));
                    const neighbors = graphData.nodes.filter(n => neighborIds.includes(n.id));
                    setSelectedNode({ ...target, connectedEdges, neighbors });
                }, 400);
            }
        }

        return () => {
            network.destroy();
        };
    }, [graphData, activeFilters, physicsEnabled]);

    // Search and focus node
    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchTerm.trim() || !networkRef.current) return;

        const term = searchTerm.trim().toLowerCase();
        const found = graphData.nodes.find(n => 
            n.label.toLowerCase().includes(term) ||
            n.id.toLowerCase().includes(term) ||
            Object.values(n.properties || {}).some(v => String(v).toLowerCase().includes(term))
        );

        if (found) {
            networkRef.current.focus(found.id, {
                scale: 1.4,
                animation: { duration: 600, easingFunction: "easeInOutQuad" }
            });
            networkRef.current.selectNodes([found.id]);
            const connectedEdges = graphData.edges.filter(
                e => e.from === found.id || e.to === found.id
            );
            const neighborIds = connectedEdges.map(e => (e.from === found.id ? e.to : e.from));
            const neighbors = graphData.nodes.filter(n => neighborIds.includes(n.id));
            setSelectedNode({ ...found, connectedEdges, neighbors });
        }
    };

    const toggleFilter = (group) => {
        const next = new Set(activeFilters);
        if (next.has(group)) {
            next.delete(group);
        } else {
            next.add(group);
        }
        setActiveFilters(next);
    };

    const handleFit = () => {
        if (networkRef.current) {
            networkRef.current.fit({ animation: { duration: 500 } });
        }
    };

    const handleCopyCypher = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedCypher(true);
        setTimeout(() => setCopiedCypher(false), 2000);
    };

    const groups = Object.keys(graphData.summary?.nodeCounts || {});

    return (
        <div className="graph-explorer-page">
            {/* Header */}
            <div className="graph-header">
                <div>
                    <div className="badge-pill neo4j-badge">
                        <Database size={13} />
                        <span>Neo4j AuraDB Active Instance</span>
                    </div>
                    <h1>Knowledge Graph Explorer</h1>
                    <p>Live interactive visualization of insurance entities and graph relationships in Neo4j</p>
                </div>

                <div className="graph-header-actions">
                    <a 
                        href="https://console.neo4j.io/projects/c4dce804-93ff-4651-8f45-75a5d4c07bb0/instances" 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn-neo4j"
                    >
                        <ExternalLink size={15} />
                        Open Neo4j Aura Console
                    </a>
                    <button className="btn-secondary-icon" onClick={loadGraph} title="Refresh graph from Neo4j">
                        <RefreshCw size={16} />
                    </button>
                    <button className="btn-secondary-icon" onClick={handleFit} title="Fit to screen">
                        <Maximize2 size={16} />
                    </button>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="graph-controls-bar">
                <form className="graph-search-form" onSubmit={handleSearch}>
                    <Search size={16} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search nodes by name, ID (e.g., C001, POL1001, Rahul, Karan)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className="search-btn">Focus Node</button>
                </form>

                <div className="graph-toggles">
                    <button 
                        className={`toggle-chip ${physicsEnabled ? "active" : ""}`}
                        onClick={() => setPhysicsEnabled(!physicsEnabled)}
                        title="Toggle physics simulation"
                    >
                        <Sliders size={14} />
                        Physics: {physicsEnabled ? "On" : "Paused"}
                    </button>
                    <span className="stats-pill">
                        <strong>{graphData.summary?.totalNodes || 0}</strong> Nodes &bull; <strong>{graphData.summary?.totalEdges || 0}</strong> Relations
                    </span>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="graph-filter-chips">
                <span className="filter-label"><Layers size={13} /> Filter Types:</span>
                {groups.map(group => {
                    const color = NODE_COLORS[group] || NODE_COLORS.Default;
                    const isActive = activeFilters.has(group);
                    return (
                        <button
                            key={group}
                            onClick={() => toggleFilter(group)}
                            className={`group-filter-chip ${isActive ? "active" : "inactive"}`}
                            style={{
                                borderColor: color.background,
                                backgroundColor: isActive ? color.background : "transparent",
                                color: isActive ? "#ffffff" : "#475569"
                            }}
                        >
                            <span 
                                className="dot" 
                                style={{ backgroundColor: isActive ? "#ffffff" : color.background }}
                            />
                            {group} ({graphData.summary.nodeCounts[group]})
                        </button>
                    );
                })}
            </div>

            {/* Main Graph Viewport */}
            <div className="graph-viewport-wrapper">
                {loading && (
                    <div className="graph-loading-overlay">
                        <div className="spinner"></div>
                        <p>Loading Knowledge Graph from Neo4j Aura...</p>
                    </div>
                )}

                {error && (
                    <div className="graph-error-overlay">
                        <AlertTriangle size={36} color="#ef4444" />
                        <h3>Error Connecting to Graph</h3>
                        <p>{error}</p>
                        <button className="primary-btn" onClick={loadGraph}>Retry Connection</button>
                    </div>
                )}

                <div ref={containerRef} className="vis-network-container" />

                {/* Node Details Inspector Sidebar */}
                {selectedNode && (
                    <div className="node-inspector-panel">
                        <div className="inspector-header">
                            <div className="inspector-badge" style={{ backgroundColor: NODE_COLORS[selectedNode.group]?.background || "#6366f1" }}>
                                {selectedNode.group}
                            </div>
                            <button className="close-inspector-btn" onClick={() => setSelectedNode(null)}>&times;</button>
                        </div>
                        <h3>{selectedNode.label}</h3>
                        {selectedNode.subtitle && <p className="inspector-sub">{selectedNode.subtitle}</p>}

                        <div className="inspector-section">
                            <h4>Properties</h4>
                            <div className="properties-table">
                                {Object.entries(selectedNode.properties || {}).map(([key, val]) => (
                                    <div className="prop-row" key={key}>
                                        <span className="prop-key">{key}:</span>
                                        <span className="prop-val">{typeof val === "object" ? JSON.stringify(val) : String(val)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selectedNode.neighbors?.length > 0 && (
                            <div className="inspector-section">
                                <h4>Connected Entities ({selectedNode.neighbors.length})</h4>
                                <div className="neighbor-chips">
                                    {selectedNode.neighbors.map(nb => (
                                        <button 
                                            key={nb.id}
                                            className="neighbor-chip"
                                            onClick={() => {
                                                if (networkRef.current) {
                                                    networkRef.current.focus(nb.id, { scale: 1.4, animation: true });
                                                    networkRef.current.selectNodes([nb.id]);
                                                    const connectedEdges = graphData.edges.filter(
                                                        e => e.from === nb.id || e.to === nb.id
                                                    );
                                                    const neighborIds = connectedEdges.map(e => (e.from === nb.id ? e.to : e.from));
                                                    const neighbors = graphData.nodes.filter(n => neighborIds.includes(n.id));
                                                    setSelectedNode({ ...nb, connectedEdges, neighbors });
                                                }
                                            }}
                                        >
                                            <span 
                                                className="dot" 
                                                style={{ backgroundColor: NODE_COLORS[nb.group]?.background || "#94a3b8" }}
                                            />
                                            <span className="neighbor-text">{nb.label} ({nb.group})</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Neo4j Aura Quick Information & Cypher Helper */}
            <div className="neo4j-info-card">
                <div className="neo4j-info-header">
                    <div className="aura-icon-box">⚡</div>
                    <div>
                        <h3>Neo4j AuraDB Connection Details</h3>
                        <p>Cloud Graph Database connected and synchronized with InsureGraph</p>
                    </div>
                </div>

                <div className="aura-details-grid">
                    <div className="aura-item">
                        <span className="sub-label">Instance URI</span>
                        <code>neo4j+s://20058a6b.databases.neo4j.io</code>
                    </div>
                    <div className="aura-item">
                        <span className="sub-label">Database Name</span>
                        <code>20058a6b</code>
                    </div>
                    <div className="aura-item">
                        <span className="sub-label">Direct Aura Console</span>
                        <a 
                            href="https://console.neo4j.io/projects/c4dce804-93ff-4651-8f45-75a5d4c07bb0/instances" 
                            target="_blank" 
                            rel="noreferrer"
                            className="console-link"
                        >
                            Open Console Project &rarr;
                        </a>
                    </div>
                </div>

                <div className="cypher-helper-row">
                    <div className="cypher-snippet">
                        <span className="cypher-tag">Cypher Query</span>
                        <code>{"MATCH (c:Customer)-[:HAS_POLICY]->(p:Policy)-[:HAS_CLAIM]->(cl:Claim) RETURN c, p, cl"}</code>
                    </div>
                    <button 
                        className="btn-outline-copy"
                        onClick={() => handleCopyCypher("MATCH (c:Customer)-[:HAS_POLICY]->(p:Policy)-[:HAS_CLAIM]->(cl:Claim) RETURN c, p, cl")}
                    >
                        {copiedCypher ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        {copiedCypher ? "Copied!" : "Copy Cypher"}
                    </button>
                </div>
            </div>
        </div>
    );
}
