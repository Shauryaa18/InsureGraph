const express = require("express");
const router = express.Router();

const { getSession } = require("../config/db");

// ======================================================
// GET NEXT RECOMMENDED IDS
// ======================================================
router.get("/next-ids", async (req, res) => {
    const session = getSession();

    try {
        const custResult = await session.run(`MATCH (c:Customer) RETURN c.customerId AS id`);
        const polResult = await session.run(`MATCH (p:Policy) RETURN p.policyId AS id, p.policyNumber AS num`);
        const clmResult = await session.run(`MATCH (c:Claim) RETURN c.claimId AS id, c.claimNumber AS num`);

        const getNextId = (records, prefix, idField = "id") => {
            let maxNum = 0;
            records.forEach(r => {
                const val = r.get(idField);
                if (val && typeof val === "string") {
                    const match = val.match(/\d+/);
                    if (match) {
                        const num = parseInt(match[0], 10);
                        if (num > maxNum) maxNum = num;
                    }
                }
            });
            const next = maxNum + 1;
            return `${prefix}${String(next).padStart(3, "0")}`;
        };

        const getNextCode = (records, prefix, field = "num", start = 1001) => {
            let maxNum = start - 1;
            records.forEach(r => {
                const val = r.get(field);
                if (val && typeof val === "string") {
                    const match = val.match(/\d+/);
                    if (match) {
                        const num = parseInt(match[0], 10);
                        if (num > maxNum) maxNum = num;
                    }
                }
            });
            const next = Math.max(maxNum + 1, start);
            return `${prefix}${next}`;
        };

        const nextCustomerId = getNextId(custResult.records, "C");
        const nextPolicyId = getNextId(polResult.records, "P");
        const nextClaimId = getNextId(clmResult.records, "CL");
        const nextPolicyNumber = getNextCode(polResult.records, "POL", "num", 1001);
        const nextClaimNumber = getNextCode(clmResult.records, "CLM", "num", 1001);

        res.json({
            nextCustomerId,
            nextPolicyId,
            nextClaimId,
            nextPolicyNumber,
            nextClaimNumber
        });

    } catch (error) {
        console.error("Next IDs Error:", error);
        res.status(500).json({ error: "Failed to compute next IDs" });
    } finally {
        await session.close();
    }
});

// ======================================================
// GET ALL CUSTOMERS
// ======================================================
router.get("/", async (req, res) => {
    const session = getSession();

    try {
        const result = await session.run(`
            MATCH (c:Customer)
            OPTIONAL MATCH (c)-[:HAS_POLICY]->(p:Policy)
            OPTIONAL MATCH (p)-[:HAS_CLAIM]->(cl:Claim)
            RETURN c, count(DISTINCT p) AS policyCount, count(DISTINCT cl) AS claimCount
            ORDER BY c.customerId
        `);

        const customers = result.records.map(record => {
            const props = record.get("c").properties;
            return {
                ...props,
                policyCount: record.get("policyCount").toNumber ? record.get("policyCount").toNumber() : record.get("policyCount"),
                claimCount: record.get("claimCount").toNumber ? record.get("claimCount").toNumber() : record.get("claimCount")
            };
        });

        res.json(customers);

    } catch (error) {
        console.error("Customers API Error:", error);

        res.status(500).json({
            error: "Failed to fetch customers"
        });

    } finally {
        await session.close();
    }
});

// ======================================================
// CREATE CUSTOMER ONLY (QUICK ADD)
// ======================================================
router.post("/", async (req, res) => {
    const session = getSession();

    try {
        const {
            customerId,
            name,
            dob,
            gender,
            phone,
            email,
            address
        } = req.body;

        if (!customerId || !name || !dob || !gender || !phone || !email || !address) {
            return res.status(400).json({
                error: "All customer fields are required (Customer ID, Name, DOB, Gender, Phone, Email, Address)"
            });
        }

        const existing = await session.run(`
            MATCH (c:Customer {customerId: $customerId})
            RETURN c
        `, { customerId });

        if (existing.records.length > 0) {
            return res.status(409).json({
                error: `Customer ID '${customerId}' already exists. Please choose a different ID.`
            });
        }

        const result = await session.run(`
            CREATE (c:Customer {
                customerId: $customerId,
                name: $name,
                dob: date($dob),
                gender: $gender,
                phone: $phone,
                email: $email,
                address: $address
            })
            RETURN c
        `, {
            customerId,
            name,
            dob,
            gender,
            phone,
            email,
            address
        });

        res.status(201).json({
            message: "Customer created successfully",
            customer: result.records[0].get("c").properties
        });

    } catch (error) {
        console.error("Create Customer Error:", error);
        res.status(500).json({
            error: "Failed to create customer",
            details: error.message
        });
    } finally {
        await session.close();
    }
});

// ======================================================
// GET COMPLETE CUSTOMER GRAPH
// ======================================================
router.get("/:customerId", async (req, res) => {
    const session = getSession();

    try {
        const customerId = req.params.customerId;

        const result = await session.run(`
            MATCH (c:Customer {customerId: $customerId})

            OPTIONAL MATCH (c)-[:HAS_DEPENDENT]->(dep:Dependent)

            OPTIONAL MATCH (c)-[:HAS_POLICY]->(p:Policy)
            OPTIONAL MATCH (p)-[:OF_TYPE]->(pt:PolicyType)
            OPTIONAL MATCH (p)-[:SOLD_BY]->(a:Agent)

            OPTIONAL MATCH (p)-[:HAS_CLAIM]->(cl:Claim)
            OPTIONAL MATCH (cl)-[:ASSIGNED_TO]->(ad:Adjuster)
            OPTIONAL MATCH (cl)-[:HAS_DOCUMENT]->(d:ClaimDocument)
            OPTIONAL MATCH (cl)-[:HAS_INSPECTION]->(i:Inspection)
            OPTIONAL MATCH (cl)-[:HAS_PAYMENT]->(pay:Payment)
            OPTIONAL MATCH (pay)-[:PAID_BY]->(pm:PaymentMethod)
            OPTIONAL MATCH (pay)-[:THROUGH_BANK]->(b:Bank)

            RETURN
                c AS customer,
                collect(DISTINCT dep) AS dependents,
                collect(DISTINCT p) AS policies,
                collect(DISTINCT pt) AS policyTypes,
                collect(DISTINCT a) AS agents,
                collect(DISTINCT cl) AS claims,
                collect(DISTINCT ad) AS adjusters,
                collect(DISTINCT d) AS documents,
                collect(DISTINCT i) AS inspections,
                collect(DISTINCT pay) AS payments,
                collect(DISTINCT pm) AS paymentMethods,
                collect(DISTINCT b) AS banks
        `, {
            customerId
        });

        if (result.records.length === 0) {
            return res.status(404).json({
                error: "Customer not found"
            });
        }

        const record = result.records[0];

        const cleanNodes = (nodes) => {
            return nodes
                .filter(node => node && node.properties)
                .map(node => node.properties);
        };

        res.json({
            customer: record.get("customer").properties,
            dependents: cleanNodes(record.get("dependents")),
            policies: cleanNodes(record.get("policies")),
            policyTypes: cleanNodes(record.get("policyTypes")),
            agents: cleanNodes(record.get("agents")),
            claims: cleanNodes(record.get("claims")),
            adjusters: cleanNodes(record.get("adjusters")),
            documents: cleanNodes(record.get("documents")),
            inspections: cleanNodes(record.get("inspections")),
            payments: cleanNodes(record.get("payments")),
            paymentMethods: cleanNodes(record.get("paymentMethods")),
            banks: cleanNodes(record.get("banks"))
        });

    } catch (error) {
        console.error("Customer Graph API Error:", error);

        res.status(500).json({
            error: "Failed to fetch customer graph"
        });

    } finally {
        await session.close();
    }
});

// ======================================================
// ADD COMPLETE / FLEXIBLE CUSTOMER
// (Customer + Optional Policy + Optional Claim)
// ======================================================
router.post("/complete", async (req, res) => {
    const session = getSession();

    try {
        const {
            // CUSTOMER
            customerId,
            name,
            dob,
            gender,
            phone,
            email,
            address,

            // POLICY (Optional)
            policyId,
            policyNumber,
            policyTypeId,
            agentId,
            startDate,
            endDate,
            premiumAmount,
            coverageAmount,
            policyStatus,

            // CLAIM (Optional)
            claimId,
            claimNumber,
            adjusterId,
            claimDate,
            claimType,
            claimAmount,
            claimStatus,
            description

        } = req.body;

        // Customer validation
        if (!customerId || !name || !dob || !gender || !phone || !email || !address) {
            return res.status(400).json({
                error: "All customer fields are required"
            });
        }

        // Check if customer already exists
        const customerCheck = await session.run(`
            MATCH (c:Customer {customerId: $customerId})
            RETURN c
        `, { customerId });

        if (customerCheck.records.length > 0) {
            return res.status(409).json({
                error: `Customer ID '${customerId}' already exists`
            });
        }

        // Check if Policy is included
        const hasPolicy = Boolean(policyId && policyNumber);
        if (hasPolicy) {
            if (!policyTypeId || !agentId || !startDate || !endDate || premiumAmount === undefined || coverageAmount === undefined) {
                return res.status(400).json({
                    error: "All policy fields are required when adding a policy"
                });
            }

            const polCheck = await session.run(`MATCH (p:Policy {policyId: $policyId}) RETURN p`, { policyId });
            if (polCheck.records.length > 0) {
                return res.status(409).json({ error: `Policy ID '${policyId}' already exists` });
            }

            const typeCheck = await session.run(`MATCH (pt:PolicyType {typeId: $policyTypeId}) RETURN pt`, { policyTypeId });
            if (typeCheck.records.length === 0) {
                return res.status(404).json({ error: `Policy type '${policyTypeId}' not found` });
            }

            const agentCheck = await session.run(`MATCH (a:Agent {agentId: $agentId}) RETURN a`, { agentId });
            if (agentCheck.records.length === 0) {
                return res.status(404).json({ error: `Agent '${agentId}' not found` });
            }
        }

        // Check if Claim is included
        const hasClaim = Boolean(claimId && claimNumber);
        if (hasClaim) {
            if (!hasPolicy) {
                return res.status(400).json({
                    error: "Cannot attach a claim without an associated policy"
                });
            }

            if (!adjusterId || !claimDate || !claimType || claimAmount === undefined) {
                return res.status(400).json({
                    error: "All claim fields are required when adding a claim"
                });
            }

            const claimCheck = await session.run(`MATCH (c:Claim {claimId: $claimId}) RETURN c`, { claimId });
            if (claimCheck.records.length > 0) {
                return res.status(409).json({ error: `Claim ID '${claimId}' already exists` });
            }

            const adjusterCheck = await session.run(`MATCH (a:Adjuster {adjusterId: $adjusterId}) RETURN a`, { adjusterId });
            if (adjusterCheck.records.length === 0) {
                return res.status(404).json({ error: `Adjuster '${adjusterId}' not found` });
            }
        }

        // Execute Transaction
        let query = `
            CREATE (c:Customer {
                customerId: $customerId,
                name: $name,
                dob: date($dob),
                gender: $gender,
                phone: $phone,
                email: $email,
                address: $address
            })
        `;

        const params = {
            customerId,
            name,
            dob,
            gender,
            phone,
            email,
            address
        };

        if (hasPolicy) {
            query += `
                CREATE (p:Policy {
                    policyId: $policyId,
                    policyNumber: $policyNumber,
                    startDate: date($startDate),
                    endDate: date($endDate),
                    premiumAmount: toFloat($premiumAmount),
                    coverageAmount: toFloat($coverageAmount),
                    status: $policyStatus
                })
                WITH c, p
                MATCH (pt:PolicyType {typeId: $policyTypeId})
                MATCH (a:Agent {agentId: $agentId})
                CREATE (c)-[:HAS_POLICY]->(p)
                CREATE (p)-[:OF_TYPE]->(pt)
                CREATE (p)-[:SOLD_BY]->(a)
            `;

            Object.assign(params, {
                policyId,
                policyNumber,
                startDate,
                endDate,
                premiumAmount,
                coverageAmount,
                policyStatus: policyStatus || "Active",
                policyTypeId,
                agentId
            });

            if (hasClaim) {
                query += `
                    CREATE (cl:Claim {
                        claimId: $claimId,
                        claimNumber: $claimNumber,
                        claimDate: date($claimDate),
                        claimType: $claimType,
                        amount: toFloat($claimAmount),
                        status: $claimStatus,
                        description: $description
                    })
                    WITH c, p, cl
                    MATCH (ad:Adjuster {adjusterId: $adjusterId})
                    CREATE (p)-[:HAS_CLAIM]->(cl)
                    CREATE (cl)-[:ASSIGNED_TO]->(ad)
                    RETURN c, p, cl
                `;

                Object.assign(params, {
                    claimId,
                    claimNumber,
                    claimDate,
                    claimType,
                    claimAmount,
                    claimStatus: claimStatus || "Pending",
                    description: description || "",
                    adjusterId
                });
            } else {
                query += ` RETURN c, p, null AS cl `;
            }
        } else {
            query += ` RETURN c, null AS p, null AS cl `;
        }

        const result = await session.run(query, params);
        const record = result.records[0];

        res.status(201).json({
            message: hasClaim
                ? "Customer, policy and claim added successfully"
                : hasPolicy
                    ? "Customer and policy enrolled successfully"
                    : "Customer profile created successfully",
            customer: record.get("c").properties,
            policy: record.get("p") ? record.get("p").properties : null,
            claim: record.get("cl") ? record.get("cl").properties : null
        });

    } catch (error) {
        console.error("Complete Customer Error:", error);
        res.status(500).json({
            error: "Failed to add customer record",
            details: error.message
        });
    } finally {
        await session.close();
    }
});

module.exports = router;