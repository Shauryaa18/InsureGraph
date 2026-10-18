const neo4j = require("neo4j-driver");
require("dotenv").config();

const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(
        process.env.NEO4J_USERNAME,
        process.env.NEO4J_PASSWORD
    )
);

function getSession() {
    return driver.session({
        database: process.env.NEO4J_DATABASE
    });
}

module.exports = {
    driver,
    getSession
};