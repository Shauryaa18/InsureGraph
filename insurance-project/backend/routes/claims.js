
const express = require("express");
const router = express.Router();
const { getSession } = require("../config/db");

// ==========================================
// GET ALL CLAIMS
// ==========================================
router.get("/", async (req, res) => {
    const session = getSession();

    try {
        const result = await session.run(`
            MATCH (c:Claim)
            OPTIONAL MATCH (p:Policy)-[:HAS_CLAIM]->(c)
            OPTIONAL MATCH (c)-[:ASSIGNED_TO]->(a:Adjuster)
            RETURN c,
                   toFloat(c.claimAmount) AS amount,
                   p.policyNumber AS policyNumber,
                   a.name AS adjusterName
            ORDER BY c.claimId
        `);

        const claims = result.records.map(record => {
            const props = record.get("c").properties;
            const amount = record.get("amount");

            return {
                ...props,
                amount: amount === null ? 0 : amount,
                policyNumber: record.get("policyNumber") || null,
                adjusterName: record.get("adjusterName") || null
            };
        });

        res.json(claims);

    } catch (error) {
        console.error("Claims API Error:", error);

        res.status(500).json({
            error: "Failed to fetch claims",
            details: error.message
        });

    } finally {
        await session.close();
    }
});

// ==========================================
// GET ADJUSTERS
// ==========================================
router.get("/adjusters", async (req, res) => {
    const session = getSession();

    try {
        const result = await session.run(`
            MATCH (a:Adjuster)
            RETURN a
            ORDER BY a.adjusterId
        `);

        const adjusters = result.records.map(record => {
            return record.get("a").properties;
        });

        res.json(adjusters);

    } catch (error) {
        console.error("Adjusters Error:", error);

        res.status(500).json({
            error: "Failed to fetch adjusters",
            details: error.message
        });

    } finally {
        await session.close();
    }
});

// ==========================================
// ADD NEW CLAIM
// ==========================================
router.post("/", async (req, res) => {
    const session = getSession();

    try {
        const {
            claimId,
            claimNumber,
            policyId,
            adjusterId,
            claimDate,
            claimType,
            amount,
            status,
            description
        } = req.body;

        if (
            !claimId ||
            !claimNumber ||
            !policyId ||
            !adjusterId ||
            !claimDate ||
            !claimType ||
            amount === undefined ||
            amount === null ||
            amount === ""
        ) {
            return res.status(400).json({
                error: "All required claim fields must be provided"
            });
        }

        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount < 0) {
            return res.status(400).json({
                error: "Claim amount must be a valid non-negative number"
            });
        }

        // Verify Policy
        const policyCheck = await session.run(
            `MATCH (p:Policy {policyId: $policyId}) RETURN p`,
            { policyId }
        );

        if (policyCheck.records.length === 0) {
            return res.status(404).json({
                error: "Policy not found"
            });
        }

        // Verify Adjuster
        const adjusterCheck = await session.run(
            `MATCH (a:Adjuster {adjusterId: $adjusterId}) RETURN a`,
            { adjusterId }
        );

        if (adjusterCheck.records.length === 0) {
            return res.status(404).json({
                error: "Adjuster not found"
            });
        }

        // Verify duplicate claim
        const claimCheck = await session.run(
            `MATCH (c:Claim {claimId: $claimId}) RETURN c`,
            { claimId }
        );

        if (claimCheck.records.length > 0) {
            return res.status(409).json({
                error: "Claim ID already exists"
            });
        }

        // Create claim and relationships.
        // Store the amount under claimAmount to match existing data.
        const result = await session.run(`
            MATCH (p:Policy {policyId: $policyId})
            MATCH (a:Adjuster {adjusterId: $adjusterId})
            CREATE (c:Claim {
                claimId: $claimId,
                claimNumber: $claimNumber,
                claimDate: date($claimDate),
                claimType: $claimType,
                claimAmount: $amount,
                status: $status,
                description: $description
            })
            CREATE (p)-[:HAS_CLAIM]->(c)
            CREATE (c)-[:ASSIGNED_TO]->(a)
            RETURN c
        `, {
            claimId,
            claimNumber,
            policyId,
            adjusterId,
            claimDate,
            claimType,
            amount: numericAmount,
            status: status || "Pending",
            description: description || ""
        });

        res.status(201).json({
            message: "Claim created successfully",
            claim: result.records[0].get("c").properties
        });

    } catch (error) {
        console.error("Create Claim Error:", error);

        res.status(500).json({
            error: "Failed to create claim",
            details: error.message
        });

    } finally {
        await session.close();
    }
});

module.exports = router;
