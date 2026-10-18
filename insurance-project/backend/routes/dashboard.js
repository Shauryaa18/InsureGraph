const express = require("express");
const router = express.Router();
const { getSession } = require("../config/db");

router.get("/", async (req, res) => {
    const session = getSession();

    try {
        // Basic entity counts
        const countQuery = await session.run(`
            OPTIONAL MATCH (c:Customer) WITH count(c) AS customers
            OPTIONAL MATCH (p:Policy) WITH customers, count(p) AS policies
            OPTIONAL MATCH (cl:Claim) WITH customers, policies, count(cl) AS claims
            OPTIONAL MATCH (pay:Payment) WITH customers, policies, claims, count(pay) AS payments
            OPTIONAL MATCH (a:Agent) WITH customers, policies, claims, payments, count(a) AS agents
            OPTIONAL MATCH (ad:Adjuster) WITH customers, policies, claims, payments, agents, count(ad) AS adjusters
            RETURN customers, policies, claims, payments, agents, adjusters
        `);

        // Financial totals
        const financialQuery = await session.run(`
            OPTIONAL MATCH (p:Policy)
            WITH sum(p.premiumAmount) AS totalPremium, sum(p.coverageAmount) AS totalCoverage
            OPTIONAL MATCH (c:Claim)
            WITH totalPremium, totalCoverage, sum(c.amount) AS totalClaims
            OPTIONAL MATCH (app:Claim {status: 'Approved'})
            RETURN
                coalesce(totalPremium, 0) AS totalPremium,
                coalesce(totalCoverage, 0) AS totalCoverage,
                coalesce(totalClaims, 0) AS totalClaims,
                coalesce(sum(app.amount), 0) AS totalApprovedClaims
        `);

        // Claims status breakdown
        const claimsStatusQuery = await session.run(`
            MATCH (c:Claim)
            RETURN c.status AS status, count(c) AS count, sum(c.amount) AS totalAmount
        `);

        // Claims type breakdown
        const claimsTypeQuery = await session.run(`
            MATCH (c:Claim)
            RETURN c.claimType AS type, count(c) AS count
        `);

        // Policy types distribution
        const policyTypesQuery = await session.run(`
            MATCH (pt:PolicyType)
            OPTIONAL MATCH (p:Policy)-[:OF_TYPE]->(pt)
            RETURN pt.typeId AS typeId, pt.typeName AS typeName, count(p) AS count
            ORDER BY count DESC
        `);

        // Recent claims with associated customer
        const recentClaimsQuery = await session.run(`
            MATCH (c:Claim)
            OPTIONAL MATCH (p:Policy)-[:HAS_CLAIM]->(c)
            OPTIONAL MATCH (cust:Customer)-[:HAS_POLICY]->(p)
            OPTIONAL MATCH (c)-[:ASSIGNED_TO]->(a:Adjuster)
            RETURN
                c.claimId AS claimId,
                c.claimNumber AS claimNumber,
                c.claimType AS claimType,
                c.amount AS amount,
                c.status AS status,
                c.claimDate AS claimDate,
                cust.name AS customerName,
                cust.customerId AS customerId,
                p.policyNumber AS policyNumber,
                a.name AS adjusterName
            ORDER BY c.claimId DESC
            LIMIT 5
        `);

        // Recent customers
        const recentCustomersQuery = await session.run(`
            MATCH (cust:Customer)
            OPTIONAL MATCH (cust)-[:HAS_POLICY]->(p:Policy)
            RETURN
                cust.customerId AS customerId,
                cust.name AS name,
                cust.email AS email,
                cust.phone AS phone,
                cust.address AS address,
                count(p) AS policyCount
            ORDER BY cust.customerId DESC
            LIMIT 5
        `);

        // Shared adjuster fraud count
        const fraudSharedQuery = await session.run(`
            MATCH (c1:Claim)-[:ASSIGNED_TO]->(a:Adjuster)<-[:ASSIGNED_TO]-(c2:Claim)
            WHERE c1.claimId < c2.claimId
            RETURN count(DISTINCT a) AS sharedAdjustersCount
        `);

        const toNum = (val) => (val && typeof val.toNumber === "function" ? val.toNumber() : Number(val || 0));

        const countRec = countQuery.records[0];
        const finRec = financialQuery.records[0];

        const claimsStatus = {};
        claimsStatusQuery.records.forEach(r => {
            const st = r.get("status") || "Unknown";
            claimsStatus[st] = {
                count: toNum(r.get("count")),
                totalAmount: toNum(r.get("totalAmount"))
            };
        });

        const claimsByType = {};
        claimsTypeQuery.records.forEach(r => {
            const tp = r.get("type") || "Other";
            claimsByType[tp] = toNum(r.get("count"));
        });

        const policyTypes = policyTypesQuery.records.map(r => ({
            typeId: r.get("typeId"),
            typeName: r.get("typeName"),
            count: toNum(r.get("count"))
        }));

        const recentClaims = recentClaimsQuery.records.map(r => {
            const dateVal = r.get("claimDate");
            let dateStr = "";
            if (dateVal && dateVal.year) {
                const y = toNum(dateVal.year);
                const m = String(toNum(dateVal.month)).padStart(2, "0");
                const d = String(toNum(dateVal.day)).padStart(2, "0");
                dateStr = `${y}-${m}-${d}`;
            } else if (typeof dateVal === "string") {
                dateStr = dateVal;
            }
            return {
                claimId: r.get("claimId"),
                claimNumber: r.get("claimNumber"),
                claimType: r.get("claimType"),
                amount: toNum(r.get("amount")),
                status: r.get("status"),
                claimDate: dateStr,
                customerName: r.get("customerName"),
                customerId: r.get("customerId"),
                policyNumber: r.get("policyNumber"),
                adjusterName: r.get("adjusterName")
            };
        });

        const recentCustomers = recentCustomersQuery.records.map(r => ({
            customerId: r.get("customerId"),
            name: r.get("name"),
            email: r.get("email"),
            phone: r.get("phone"),
            address: r.get("address"),
            policyCount: toNum(r.get("policyCount"))
        }));

        const sharedAdjustersCount = fraudSharedQuery.records[0] ? toNum(fraudSharedQuery.records[0].get("sharedAdjustersCount")) : 0;

        res.json({
            // Core counts (backward compatible with original frontend)
            customers: toNum(countRec.get("customers")),
            policies: toNum(countRec.get("policies")),
            claims: toNum(countRec.get("claims")),
            payments: toNum(countRec.get("payments")),
            agents: toNum(countRec.get("agents")),
            adjusters: toNum(countRec.get("adjusters")),

            // Extended stats
            financials: {
                totalPremium: toNum(finRec.get("totalPremium")),
                totalCoverage: toNum(finRec.get("totalCoverage")),
                totalClaims: toNum(finRec.get("totalClaims")),
                totalApprovedClaims: toNum(finRec.get("totalApprovedClaims"))
            },
            claimsStatus,
            claimsByType,
            policyTypes,
            recentClaims,
            recentCustomers,
            fraudAlerts: {
                sharedAdjustersCount
            }
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({
            error: "Failed to load dashboard statistics",
            details: error.message
        });
    } finally {
        await session.close();
    }
});

module.exports = router;