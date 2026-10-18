const express = require("express");
const router = express.Router();
const { getSession } = require("../config/db");

// Helper to sanitize Neo4j values to standard JSON
function sanitizeValue(val) {
    if (val === null || val === undefined) return val;
    if (typeof val === "object") {
        if (typeof val.toNumber === "function") {
            return val.toNumber();
        }
        if (val.year && val.month && val.day) {
            const y = val.year.toNumber ? val.year.toNumber() : val.year;
            const m = String(val.month.toNumber ? val.month.toNumber() : val.month).padStart(2, "0");
            const d = String(val.day.toNumber ? val.day.toNumber() : val.day).padStart(2, "0");
            return `${y}-${m}-${d}`;
        }
        if (Array.isArray(val)) {
            return val.map(sanitizeValue);
        }
        const cleaned = {};
        for (const [k, v] of Object.entries(val)) {
            cleaned[k] = sanitizeValue(v);
        }
        return cleaned;
    }
    return val;
}

function getNodeDisplayInfo(node) {
    const labels = node.labels || [];
    const props = sanitizeValue(node.properties || {});
    const primaryLabel = labels[0] || "Unknown";
    
    let label = primaryLabel;
    let subtitle = "";
    
    switch (primaryLabel) {
        case "Customer":
            label = props.name || props.customerId || "Customer";
            subtitle = props.customerId ? `ID: ${props.customerId}` : "";
            break;
        case "Policy":
            label = props.policyNumber || props.policyId || "Policy";
            subtitle = props.status ? `Status: ${props.status}` : "";
            break;
        case "PolicyType":
            label = props.typeName || props.typeId || "Policy Type";
            subtitle = props.typeId ? `Type: ${props.typeId}` : "";
            break;
        case "Claim":
            label = props.claimNumber || props.claimId || "Claim";
            subtitle = props.amount ? `₹${props.amount}` : (props.status || "");
            break;
        case "Agent":
            label = props.name || props.agentId || "Agent";
            subtitle = props.agentId ? `Agent ID: ${props.agentId}` : "";
            break;
        case "Adjuster":
            label = props.name || props.adjusterId || "Adjuster";
            subtitle = props.adjusterId ? `Adjuster: ${props.adjusterId}` : "";
            break;
        case "Dependent":
            label = props.name || props.dependentId || "Dependent";
            subtitle = props.relation || "Dependent";
            break;
        case "Payment":
            label = props.paymentId ? `Payment ${props.paymentId}` : "Payment";
            subtitle = props.amount ? `₹${props.amount}` : "";
            break;
        case "Bank":
            label = props.bankName || props.bankId || "Bank";
            subtitle = props.branch || "";
            break;
        case "PaymentMethod":
            label = props.methodType || props.methodId || "Payment Method";
            break;
        case "ClaimDocument":
            label = props.documentType || props.docId || "Document";
            break;
        case "Inspection":
            label = props.inspectionId ? `Inspect #${props.inspectionId}` : "Inspection";
            subtitle = props.result || "";
            break;
        default:
            label = props.name || props.title || props.id || primaryLabel;
    }

    return {
        id: node.elementId,
        label,
        subtitle,
        group: primaryLabel,
        labels,
        properties: props
    };
}

// ======================================================
// GET ENTIRE GRAPH
// ======================================================
router.get("/", async (req, res) => {
    const session = getSession();

    try {
        const result = await session.run(`
            MATCH (n)
            OPTIONAL MATCH (n)-[r]->(m)
            RETURN n, r, m
            LIMIT 500
        `);

        const nodeMap = new Map();
        const edges = [];
        const edgeSet = new Set();
        const nodeCounts = {};

        for (const record of result.records) {
            const n = record.get("n");
            if (n && !nodeMap.has(n.elementId)) {
                const nodeInfo = getNodeDisplayInfo(n);
                nodeMap.set(n.elementId, nodeInfo);
                nodeCounts[nodeInfo.group] = (nodeCounts[nodeInfo.group] || 0) + 1;
            }

            const m = record.get("m");
            if (m && !nodeMap.has(m.elementId)) {
                const nodeInfo = getNodeDisplayInfo(m);
                nodeMap.set(m.elementId, nodeInfo);
                nodeCounts[nodeInfo.group] = (nodeCounts[nodeInfo.group] || 0) + 1;
            }

            const r = record.get("r");
            if (r && !edgeSet.has(r.elementId)) {
                edgeSet.add(r.elementId);
                edges.push({
                    id: r.elementId,
                    from: r.startNodeElementId,
                    to: r.endNodeElementId,
                    label: r.type,
                    type: r.type,
                    properties: sanitizeValue(r.properties || {})
                });
            }
        }

        const nodes = Array.from(nodeMap.values());

        res.json({
            nodes,
            edges,
            summary: {
                totalNodes: nodes.length,
                totalEdges: edges.length,
                nodeCounts
            }
        });

    } catch (error) {
        console.error("Graph API Error:", error);
        res.status(500).json({
            error: "Failed to load graph data",
            details: error.message
        });
    } finally {
        await session.close();
    }
});

// ======================================================
// GET CUSTOMER SUBGRAPH (3 hops)
// ======================================================
router.get("/customer/:customerId", async (req, res) => {
    const session = getSession();
    const customerId = req.params.customerId;

    try {
        const result = await session.run(`
            MATCH (c:Customer {customerId: $customerId})
            CALL apoc.path.subgraphAll(c, {maxLevel: 3})
            YIELD nodes, relationships
            RETURN nodes, relationships
        `, { customerId }).catch(async () => {
            // Fallback if APOC is not enabled in database
            return await session.run(`
                MATCH path = (c:Customer {customerId: $customerId})-[*1..3]-(m)
                WITH c, collect(DISTINCT path) AS paths
                UNWIND paths AS p
                UNWIND nodes(p) AS n
                UNWIND relationships(p) AS r
                RETURN collect(DISTINCT n) AS nodes, collect(DISTINCT r) AS relationships
            `, { customerId });
        });

        const nodeMap = new Map();
        const edges = [];
        const edgeSet = new Set();
        const nodeCounts = {};

        if (result.records.length > 0) {
            const rawNodes = result.records[0].get("nodes") || [];
            const rawRelationships = result.records[0].get("relationships") || [];

            for (const n of rawNodes) {
                if (n && !nodeMap.has(n.elementId)) {
                    const nodeInfo = getNodeDisplayInfo(n);
                    nodeMap.set(n.elementId, nodeInfo);
                    nodeCounts[nodeInfo.group] = (nodeCounts[nodeInfo.group] || 0) + 1;
                }
            }

            for (const r of rawRelationships) {
                if (r && !edgeSet.has(r.elementId)) {
                    edgeSet.add(r.elementId);
                    edges.push({
                        id: r.elementId,
                        from: r.startNodeElementId,
                        to: r.endNodeElementId,
                        label: r.type,
                        type: r.type,
                        properties: sanitizeValue(r.properties || {})
                    });
                }
            }
        }

        const nodes = Array.from(nodeMap.values());

        res.json({
            customerId,
            nodes,
            edges,
            summary: {
                totalNodes: nodes.length,
                totalEdges: edges.length,
                nodeCounts
            }
        });

    } catch (error) {
        console.error("Customer Subgraph Error:", error);
        res.status(500).json({
            error: "Failed to load customer graph",
            details: error.message
        });
    } finally {
        await session.close();
    }
});

module.exports = router;
