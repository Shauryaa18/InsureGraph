# InsureGraph — Insurance Claims Management System Using Neo4j

A functional insurance management mini-project demonstrating a **Graph Database Architecture** using Neo4j to represent and explore relationships between customers, insurance policies, claims, agents, and adjusters.

---

## 1. System Overview

**InsureGraph** is an insurance management application that combines a modern web interface with a graph database to manage insurance information and explore complex relationships.

- **Database (Neo4j):** Stores insurance entities as graph nodes and their connections as relationships, enabling relationship-based queries using Cypher.
- **Backend (Node.js + Express):** Provides RESTful APIs for retrieving and managing insurance data and communicating with Neo4j.
- **Frontend (React + JavaScript):** Provides a responsive interface for managing customers, policies, claims, and viewing insurance data.
- **HTTP Client (Axios):** Connects the React frontend to the Express backend.
- **Graph Analytics:** Supports exploring connections among customers, policies, claims, agents, and adjusters. Fraud detection features can help identify suspicious relationships when implemented in the application.

### Key Objectives

- Demonstrate graph database concepts using a practical application.
- Model insurance entities and their relationships.
- Perform CRUD operations through a web interface.
- Execute Cypher queries to retrieve connected data.
- Demonstrate how graph databases can support insurance claims analysis.

---

## 2. Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend | React, JavaScript, CSS | User interface |
| Backend | Node.js, Express.js | REST API and business logic |
| Database | Neo4j | Graph storage and relationship queries |
| Query Language | Cypher | Graph creation, retrieval, and updates |
| HTTP Client | Axios | Frontend-backend communication |
| Database Hosting | Neo4j AuraDB or local Neo4j | Graph database hosting |

---

## 3. Core Features

### 1. Dashboard
Provides a central interface for accessing insurance management modules and viewing available information.

### 2. Customer Management
- Add new customers.
- View customer information.
- Retrieve customers using their IDs.
- Store contact details and other customer attributes.

### 3. Policy Management
- Store insurance policy details.
- Associate customers with their policies.
- Maintain policy numbers, premiums, coverage amounts, dates, and status.

### 4. Claims Management
- Maintain insurance claim information.
- Associate claims with relevant policies.
- Store claim amounts and claim-related details.

### 5. Graph Explorer
- View nodes and relationships in Neo4j.
- Explore connections between customers, policies, and claims.
- Execute Cypher queries to inspect the database.

### 6. Fraud Detection and Relationship Analysis
Use graph relationships to investigate potentially suspicious claim patterns and unusual connections. Actual detection results depend on the queries and rules implemented in the application.

---

## 4. Graph Database Design

Unlike a traditional relational database, Neo4j represents data using **nodes, relationships, and properties**.

Example graph model:

```text
(Customer)-[:HAS_POLICY]->(Policy)
(Policy)-[:OF_TYPE]->(PolicyType)
(Policy)-[:SOLD_BY]->(Agent)
(Policy)-[:HAS_CLAIM]->(Claim)
(Claim)-[:ASSIGNED_TO]->(Adjuster)
(Claim)-[:HAS_DOCUMENT]->(ClaimDocument)
```

### Example Node Types

- `Customer`
- `Policy`
- `PolicyType`
- `Agent`
- `Claim`
- `Adjuster`
- `ClaimDocument`

### Example Properties

**Customer**
- customerId
- name
- email
- phone

**Policy**
- policyId
- policyNumber
- premiumAmount
- coverageAmount
- startDate
- endDate
- status

**Claim**
- claimId
- claimAmount

The actual properties depend on the schema implemented in the project.

---

## 5. Directory Structure

The following is an illustrative structure. Adjust the paths to match your actual project files.

```text
InsureGraph/
├── backend/
│   ├── routes/
│   │   └── customers.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   ├── package.json
│   └── index.html
│
├── .gitignore
└── README.md
```

---

## 6. Quickstart: Running Locally

### Prerequisites

Install the following:

- Node.js and npm
- Neo4j AuraDB account or a running local Neo4j database
- Git
- Visual Studio Code (recommended)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Shauryaa18/InsureGraph.git
cd InsureGraph
```

### Step 2: Configure the Backend

Open the backend directory:

```bash
cd backend
npm install
```

Create a `.env` file using the configuration expected by your backend code.

Example:

```env
NEO4J_URI=your_neo4j_connection_uri
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_database_password
PORT=5000
```

Use the actual variable names expected by your application. Never commit real database credentials.

### Step 3: Start the Backend

From the backend directory, run the command matching your project setup:

```bash
node server.js
```

The backend should start on port `5000` if configured with that port.

### Step 4: Start the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, typically:

http://localhost:5173

### Step 5: Verify the Database

Open your Neo4j Browser or AuraDB Query interface and execute:

```cypher
MATCH (n)
RETURN n
LIMIT 100;
```

To inspect connected nodes:

```cypher
MATCH (a)-[r]->(b)
RETURN a, r, b
LIMIT 100;
```

These queries help visualize the graph when the database contains nodes and relationships.

---

## 7. API Demonstration

The customer API includes the following endpoints, subject to the routes implemented in the backend.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/customers` | Retrieve customers |
| GET | `/api/customers/:customerId` | Retrieve a customer by ID |
| POST | `/api/customers` | Create a customer |

### Example: Retrieve Customers

```http
GET /api/customers
```

### Example: Create a Customer

```http
POST /api/customers
Content-Type: application/json
```

Example request body:

```json
{
  "customerId": "C006",
  "name": "Sample Customer",
  "dob": "1998-05-15",
  "gender": "Other",
  "phone": "9876543210",
  "email": "sample@example.com",
  "address": "Chennai"
}
```

Use this example only if the listed fields match your backend's validation rules.

---

## 8. Laboratory Demonstration Guide

### Part A: Web Application Demonstration

1. Start Neo4j and verify the database connection.
2. Run the Express backend.
3. Start the React frontend.
4. Open the application in your browser.
5. Demonstrate the dashboard and customer management interface.
6. Add a sample customer and verify that the record is stored.
7. Demonstrate policy and claims modules where implemented.
8. Open Neo4j Browser to visualize the graph and its relationships.

### Part B: Cypher Demonstrations

**1. Display all nodes**

```cypher
MATCH (n)
RETURN n
LIMIT 100;
```

**2. Display all relationships**

```cypher
MATCH (a)-[r]->(b)
RETURN a, r, b
LIMIT 100;
```

**3. Count nodes by label**

```cypher
MATCH (n)
UNWIND labels(n) AS label
RETURN label, count(*) AS total
ORDER BY total DESC;
```

**4. Find policies belonging to customers**

```cypher
MATCH (c:Customer)-[:HAS_POLICY]->(p:Policy)
RETURN c, p;
```

**5. Find claims associated with policies**

```cypher
MATCH (p:Policy)-[:HAS_CLAIM]->(cl:Claim)
RETURN p.policyNumber, cl.claimAmount;
```

These queries assume the example labels, relationships, and properties match your database.

---

## 9. Graph Database vs Relational Database

| Dimension | Relational Database | Neo4j Graph Database |
|---|---|---|
| Data model | Tables, rows, columns | Nodes, relationships, properties |
| Relationships | Foreign keys and joins | Explicit graph relationships |
| Query language | SQL | Cypher |
| Best suited for | Structured transactional data | Highly connected data |
| Relationship traversal | Often requires joins | Direct relationship traversal |
| Insurance application | Customer and policy records | Connected customers, policies, claims, and agents |

Neo4j is particularly useful when analysing multiple connected entities, such as identifying relationships among policies and claims.

---

## 10. Security and Configuration

- Store database credentials in environment variables.
- Keep `.env` files out of version control.
- Validate and sanitize API inputs.
- Use appropriate database access permissions.
- Do not publish real customer or insurance claim information in demonstration data.

---

## 11. Future Enhancements

- Advanced graph-based fraud detection.
- Policy renewal reminders.
- Claim status tracking and analytics.
- Authentication and role-based access control.
- Interactive graph visualization.
- Automated tests for backend endpoints.
- Deployment of the frontend, backend, and database.

---

## 12. License and Academic Attribution

Developed as an academic mini-project demonstrating graph database design, Cypher queries, REST API integration, and web-based insurance management.

**Project:** InsureGraph  
**Domain:** Insurance Management and Claims Analysis  
**Database:** Neo4j  
**Backend:** Node.js and Express.js  
**Frontend:** React and JavaScript
git add README.md