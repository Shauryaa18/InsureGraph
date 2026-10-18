const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { driver } = require("./config/db");

const claimsRoutes = require("./routes/claims");
const policiesRoutes = require("./routes/policies");
const fraudRoutes = require("./routes/fraud");
const customersRoutes = require("./routes/customers");
const dashboardRoutes = require("./routes/dashboard");
const graphRoutes = require("./routes/graph");
const app = express();

app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
    res.json({
        message: "Insurance API is running"
    });
});

// Neo4j connection test
app.get("/api/test", async (req, res) => {
    try {
        await driver.verifyConnectivity();

        res.json({
            message: "Neo4j Connected Successfully"
        });

    } catch (error) {
        console.log("NEO4J ERROR:");
        console.log(error);

        res.status(500).json({
            error: error.message
        });
    }
});

// Claims API
app.use("/api/claims", claimsRoutes);

// Policies API
app.use("/api/policies", policiesRoutes);

// Fraud Detection API
app.use("/api/fraud", fraudRoutes);

// Customers API
app.use("/api/customers", customersRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/graph", graphRoutes);
// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});