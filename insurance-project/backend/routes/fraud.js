
const express = require("express");
const router = express.Router();

const { getSession } = require("../config/db");

// ==========================================
// FIND CLAIMS ASSIGNED TO THE SAME ADJUSTER
// ==========================================
router.get("/shared-adjuster", async (req, res) => {
    const session = getSession();

    try {
        const result = await session.run(`
            MATCH (c1:Claim)-[:ASSIGNED_TO]->(a:Adjuster)<-[:ASSIGNED_TO]-(c2:Claim)
            WHERE c1.claimId < c2.claimId

            RETURN
                c1.claimId AS claim1,
                c1.claimNumber AS claimNumber1,
                coalesce(
                    toFloat(c1.claimAmount),
                    toFloat(c1.amount),
                    toFloat(c1.claim_amount),
                    0
                ) AS amount1,
                c2.claimId AS claim2,
                c2.claimNumber AS claimNumber2,
                coalesce(
                    toFloat(c2.claimAmount),
                    toFloat(c2.amount),
                    toFloat(c2.claim_amount),
                    0
                ) AS amount2,
                a.adjusterId AS adjusterId,
                a.name AS adjusterName
            ORDER BY a.adjusterId
        `);

        const fraudCases = result.records.map(record => {
            const claim1 = record.get("claim1");
            const claim2 = record.get("claim2");
            const claimNum1 = record.get("claimNumber1");
            const claimNum2 = record.get("claimNumber2");

            const amount1 = record.get("amount1");
            const amount2 = record.get("amount2");

            return {
                claim1,
                claimNumber1: claimNum1,
                amount1: amount1 === null ? 0 : amount1,
                claim2,
                claimNumber2: claimNum2,
                amount2: amount2 === null ? 0 : amount2,
                claimIds: [claim1, claim2],
                claimNumbers: [claimNum1, claimNum2],
                adjusterId: record.get("adjusterId"),
                adjusterName: record.get("adjusterName")
            };
        });

        res.json(fraudCases);

    } catch (error) {
        console.error("Fraud Detection Error:", error);

        res.status(500).json({
            error: "Failed to detect shared adjusters",
            details: error.message
        });

    } finally {
        await session.close();
    }
});

// ==========================================
// CALCULATE FRAUD RISK SCORE FOR EVERY CLAIM
// ==========================================
router.get("/risk-score", async (req, res) => {
    const session = getSession();

    try {
        const result = await session.run(`
            MATCH (c:Claim)

            OPTIONAL MATCH (c)-[:ASSIGNED_TO]->(a:Adjuster)
            OPTIONAL MATCH (c)-[:HAS_PAYMENT]->(p:Payment)
            OPTIONAL MATCH (p)-[:THROUGH_BANK]->(b:Bank)

            WITH c, a, b,
                 coalesce(
                     toFloat(c.claimAmount),
                     toFloat(c.amount),
                     toFloat(c.claim_amount),
                     0
                 ) AS amount,

                 CASE
                     WHEN coalesce(
                         toFloat(c.claimAmount),
                         toFloat(c.amount),
                         toFloat(c.claim_amount),
                         0
                     ) >= 400000 THEN 40

                     WHEN coalesce(
                         toFloat(c.claimAmount),
                         toFloat(c.amount),
                         toFloat(c.claim_amount),
                         0
                     ) >= 200000 THEN 25

                     WHEN coalesce(
                         toFloat(c.claimAmount),
                         toFloat(c.amount),
                         toFloat(c.claim_amount),
                         0
                     ) >= 100000 THEN 15

                     ELSE 5
                 END AS amountScore

            OPTIONAL MATCH (other:Claim)-[:ASSIGNED_TO]->(a)
            WHERE other <> c

            WITH c, a, amount, amountScore,
                 CASE
                     WHEN count(DISTINCT other) > 0 THEN 30
                     ELSE 0
                 END AS adjusterScore

            RETURN
                c.claimId AS claimId,
                c.claimNumber AS claimNumber,
                amount AS claimAmount,
                c.status AS claimStatus,
                a.name AS adjusterName,

                coalesce(amountScore, 0) +
                coalesce(adjusterScore, 0) AS riskScore,

                CASE
                    WHEN coalesce(amountScore, 0) +
                         coalesce(adjusterScore, 0) >= 50
                    THEN 'HIGH'

                    WHEN coalesce(amountScore, 0) +
                         coalesce(adjusterScore, 0) >= 25
                    THEN 'MEDIUM'

                    ELSE 'LOW'
                END AS riskLevel

            ORDER BY riskScore DESC
        `);

        const toNum = (val) => {
            if (val === null || val === undefined) {
                return 0;
            }

            return typeof val.toNumber === "function"
                ? val.toNumber()
                : Number(val);
        };

        const riskScores = result.records.map(record => ({
            claimId: record.get("claimId"),
            claimNumber: record.get("claimNumber"),
            claimAmount: toNum(record.get("claimAmount")),
            claimStatus: record.get("claimStatus"),
            adjusterName: record.get("adjusterName") || "Unassigned",
            riskScore: toNum(record.get("riskScore")),
            riskLevel: record.get("riskLevel")
        }));

        res.json(riskScores);

    } catch (error) {
        console.error("Risk Score Error:", error);

        res.status(500).json({
            error: "Failed to calculate fraud risk score",
            details: error.message
        });

    } finally {
        await session.close();
    }
});

module.exports = router;
