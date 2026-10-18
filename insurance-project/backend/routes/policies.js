
const express = require("express");
const router = express.Router();
const { getSession } = require("../config/db");

// ==========================================
// GET ALL POLICIES
// ==========================================
router.get("/", async (req, res) => {
    const session = getSession();

    try {
        const result = await session.run(`
            MATCH (p:Policy)
            RETURN p
            ORDER BY p.policyId
        `);

        const policies = result.records.map(record => {
            const props = record.get("p").properties;

            return {
                ...props,
                premiumAmount: Number(props.premiumAmount ?? 0),
                coverageAmount: Number(props.coverageAmount ?? 0),
                startDate: props.startDate?.toString() ?? null,
                endDate: props.endDate?.toString() ?? null
            };
        });

        res.json(policies);

    } catch (error) {
        console.error("Policies API Error:", error);

        res.status(500).json({
            error: "Failed to fetch policies",
            details: error.message
        });

    } finally {
        await session.close();
    }
});

// ==========================================
// GET POLICY TYPES
// ==========================================
router.get("/types", async (req, res) => {
    const session = getSession();

    try {
        const result = await session.run(`
            MATCH (pt:PolicyType)
            RETURN pt
            ORDER BY pt.typeId
        `);

        const types = result.records.map(record => {
            return record.get("pt").properties;
        });

        res.json(types);

    } catch (error) {
        console.error("Policy Types Error:", error);

        res.status(500).json({
            error: "Failed to fetch policy types",
            details: error.message
        });

    } finally {
        await session.close();
    }
});

// ==========================================
// GET AGENTS
// ==========================================
router.get("/agents", async (req, res) => {
    const session = getSession();

    try {
        const result = await session.run(`
            MATCH (a:Agent)
            RETURN a
            ORDER BY a.agentId
        `);

        const agents = result.records.map(record => {
            return record.get("a").properties;
        });

        res.json(agents);

    } catch (error) {
        console.error("Agents Error:", error);

        res.status(500).json({
            error: "Failed to fetch agents",
            details: error.message
        });

    } finally {
        await session.close();
    }
});

// ==========================================
// ADD NEW POLICY
// ==========================================
router.post("/", async (req, res) => {
    const session = getSession();

    try {
        const {
            policyId,
            policyNumber,
            customerId,
            policyTypeId,
            agentId,
            startDate,
            endDate,
            premiumAmount,
            coverageAmount,
            status
        } = req.body;

        // Check required fields
        if (
            !policyId ||
            !policyNumber ||
            !customerId ||
            !policyTypeId ||
            !agentId ||
            !startDate ||
            !endDate ||
            premiumAmount === undefined ||
            premiumAmount === null ||
            premiumAmount === "" ||
            coverageAmount === undefined ||
            coverageAmount === null ||
            coverageAmount === "" ||
            !status
        ) {
            return res.status(400).json({
                error: "All policy fields are required"
            });
        }

        const premium = Number(premiumAmount);
        const coverage = Number(coverageAmount);

        if (
            !Number.isFinite(premium) ||
            !Number.isFinite(coverage) ||
            premium < 0 ||
            coverage < 0
        ) {
            return res.status(400).json({
                error: "Premium and coverage must be valid non-negative numbers"
            });
        }

        // Verify Customer
        const customerResult = await session.run(`
            MATCH (c:Customer {customerId: $customerId})
            RETURN c
        `, { customerId });

        if (customerResult.records.length === 0) {
            return res.status(404).json({
                error: "Customer not found"
            });
        }

        // Verify Policy Type
        const policyTypeResult = await session.run(`
            MATCH (pt:PolicyType {typeId: $policyTypeId})
            RETURN pt
        `, { policyTypeId });

        if (policyTypeResult.records.length === 0) {
            return res.status(404).json({
                error: "Policy type not found"
            });
        }

        // Verify Agent
        const agentResult = await session.run(`
            MATCH (a:Agent {agentId: $agentId})
            RETURN a
        `, { agentId });

        if (agentResult.records.length === 0) {
            return res.status(404).json({
                error: "Agent not found"
            });
        }

        // Check duplicate Policy ID
        const existingPolicy = await session.run(`
            MATCH (p:Policy {policyId: $policyId})
            RETURN p
        `, { policyId });

        if (existingPolicy.records.length > 0) {
            return res.status(409).json({
                error: "Policy ID already exists"
            });
        }

        // Create Policy and relationships
        const result = await session.run(`
            MATCH (c:Customer {customerId: $customerId})
            MATCH (pt:PolicyType {typeId: $policyTypeId})
            MATCH (a:Agent {agentId: $agentId})

            CREATE (p:Policy {
                policyId: $policyId,
                policyNumber: $policyNumber,
                startDate: date($startDate),
                endDate: date($endDate),
                premiumAmount: $premiumAmount,
                coverageAmount: $coverageAmount,
                status: $status
            })

            CREATE (c)-[:HAS_POLICY]->(p)
            CREATE (p)-[:OF_TYPE]->(pt)
            CREATE (p)-[:SOLD_BY]->(a)

            RETURN p
        `, {
            policyId,
            policyNumber,
            customerId,
            policyTypeId,
            agentId,
            startDate,
            endDate,
            premiumAmount: premium,
            coverageAmount: coverage,
            status
        });

        const props = result.records[0].get("p").properties;

        const policy = {
            ...props,
            premiumAmount: Number(props.premiumAmount ?? 0),
            coverageAmount: Number(props.coverageAmount ?? 0),
            startDate: props.startDate?.toString() ?? null,
            endDate: props.endDate?.toString() ?? null
        };

        res.status(201).json({
            message: "Policy added successfully",
            policy
        });

    } catch (error) {
        console.error("Add Policy Error:", error);

        res.status(500).json({
            error: "Failed to add policy",
            details: error.message
        });

    } finally {
        await session.close();
    }
});

module.exports = router;
