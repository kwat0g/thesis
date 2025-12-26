# Architecture Explanation

## Purpose

This document provides senior architect-level explanations for the key architectural decisions made in the Internal Manufacturing ERP System. Each decision is justified based on system requirements, operational constraints, and engineering best practices.

---

## Layered Architecture

### Decision

The system employs a layered architecture with clear separation of concerns:

```
Presentation Layer (UI)
    ↓
API Layer (HTTP Routes)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access)
    ↓
Database Layer (MySQL)
```

### Rationale

**1. Separation of Concerns**

Each layer has a distinct responsibility:
- **Presentation:** User interface and user experience
- **API:** Request handling, authentication, authorization
- **Service:** Business logic, validation, workflow orchestration
- **Repository:** SQL query construction, data mapping
- **Database:** Data persistence, constraints, transactions

This separation enables:
- Independent testing of each layer
- Changes to one layer without affecting others
- Clear boundaries for code organization
- Easier onboarding for new developers

**2. Testability**

Layered architecture facilitates testing:
- UI can be tested independently (component tests)
- API can be tested with mock services (integration tests)
- Services can be tested with mock repositories (unit tests)
- Repositories can be tested with test database (data access tests)

**3. Maintainability**

Clear layers improve maintainability:
- Business logic centralized in service layer
- Data access logic centralized in repository layer
- Changes to database schema isolated to repository layer
- Changes to business rules isolated to service layer

**4. Security**

Layered architecture enforces security:
- Authentication at API layer (mandatory checkpoint)
- Authorization at API layer (permission verification)
- Validation at service layer (business rule enforcement)
- Constraints at database layer (final safety net)

Multiple layers provide defense in depth.

**5. Reusability**

Services can be called from multiple API routes:
- Same service logic for web UI and future mobile app
- Same repository logic for all services
- No duplication of business logic
- Consistent behavior across entry points

### Alternative Considered: Flat Architecture

**Why Rejected:**
- Business logic scattered across codebase
- Difficult to test in isolation
- Changes ripple across entire application
- Security enforcement inconsistent
- Code duplication likely

### Conclusion

Layered architecture provides the right balance of separation, testability, maintainability, and security for an enterprise ERP system. The clear boundaries between layers make the system easier to understand, test, and evolve.

---

## Monolithic Architecture

### Decision

The system is deployed as a single monolithic application rather than distributed microservices.

### Rationale

**1. Transaction Consistency Requirements**

Manufacturing operations require strong ACID guarantees across multiple entities. Consider a goods receipt:

```
Transaction Scope:
- Create goods_receipts record
- Create goods_receipt_items records (5 items)
- Create inventory_transactions records (5 transactions)
- Update inventory_balances (5 updates)
- Update purchase_orders status (1 update)

Total: 17 database operations that must succeed or fail together
```

**Monolithic Advantage:**
- Single database transaction
- Native ACID guarantees
- Immediate consistency
- Simple rollback on error

**Microservices Challenge:**
- Distributed transaction (2PC or Saga pattern)
- Eventual consistency
- Complex compensation logic
- Higher failure probability

For manufacturing ERP, immediate consistency is non-negotiable. Inventory balances must be accurate in real-time. Monolithic architecture provides this naturally.

**2. Data Coupling**

ERP modules are inherently tightly coupled:

```
Production Order → requires → Inventory Balance
Inventory Balance → updated by → Goods Receipt
Goods Receipt → references → Purchase Order
Purchase Order → references → MRP Calculation
MRP Calculation → references → Production Order
```

This circular dependency is natural in ERP. Attempting to separate these into microservices creates artificial boundaries that must be bridged with:
- Inter-service communication overhead
- Data duplication
- Synchronization complexity
- Eventual consistency issues

**3. Performance**

Monolithic architecture provides superior performance:

**Database Joins:**
```sql
SELECT 
  po.po_number,
  s.supplier_name,
  i.item_code,
  ib.quantity
FROM purchase_orders po
JOIN suppliers s ON po.supplier_id = s.id
JOIN purchase_order_items poi ON po.id = poi.po_id
JOIN items i ON poi.item_id = i.id
JOIN inventory_balances ib ON i.id = ib.item_id;
```

**Monolithic:** Single database query, efficient join
**Microservices:** Multiple service calls, manual join in application code, N+1 query problem

**Network Latency:**
- Monolithic: Function call (nanoseconds)
- Microservices: HTTP call (milliseconds)

For internal ERP with LAN deployment, network latency is unnecessary overhead.

**4. Deployment Simplicity**

**Monolithic:**
- Single deployment artifact
- One application to monitor
- One log stream to analyze
- Simple backup and restore
- Straightforward rollback

**Microservices:**
- Multiple deployment artifacts
- Service discovery required
- Distributed tracing needed
- Complex monitoring
- Coordinated deployments
- Version compatibility management

For internal ERP with small operations team, deployment simplicity is valuable.

**5. Team Size and Expertise**

Microservices require:
- DevOps expertise (Kubernetes, service mesh)
- Distributed systems knowledge
- Multiple CI/CD pipelines
- Service orchestration
- Monitoring and observability tools

Monolithic requires:
- Traditional web application deployment
- Single CI/CD pipeline
- Standard monitoring
- Familiar debugging tools

For typical manufacturing company IT team, monolithic architecture aligns with available expertise.

**6. Operational Simplicity**

**Failure Scenarios:**

Monolithic:
- Application crashes → Restart application
- Database crashes → Restore database
- Clear failure domain

Microservices:
- Service A crashes → Cascading failures possible
- Network partition → Partial system failure
- Service B slow → Timeout handling required
- Complex failure modes

**7. Development Velocity**

**Monolithic:**
- Changes span multiple modules → Single commit
- Refactoring across modules → IDE support
- Debugging across modules → Single debugger
- Testing integration → Straightforward

**Microservices:**
- Changes span services → Coordinated deployment
- Refactoring across services → Manual coordination
- Debugging across services → Distributed tracing
- Testing integration → Complex test environment

### When Microservices Would Be Appropriate

Microservices make sense when:
1. **Independent scaling required:** Different modules have vastly different load (not true for internal ERP)
2. **Polyglot persistence needed:** Different modules need different databases (not required)
3. **Team independence desired:** Large teams working on separate services (not applicable)
4. **External-facing components:** Customer/supplier portals separate from core ERP (future consideration)

### Conclusion

Monolithic architecture is the correct choice for internal manufacturing ERP. It provides superior transaction consistency, better performance, simpler operations, and aligns with team capabilities. The tight coupling inherent in ERP operations makes microservices an architectural mismatch that introduces complexity without corresponding benefits.

---

## MySQL Database

### Decision

MySQL with InnoDB storage engine is used as the database management system.

### Rationale

**1. ACID Compliance**

Manufacturing ERP requires strict ACID guarantees:

**Atomicity:** Multi-table operations must be atomic
- Goods receipt updates 6 tables atomically
- Production output updates 5 tables atomically
- Payroll release updates 3 tables atomically

MySQL InnoDB provides:
- Full transaction support
- Automatic rollback on failure
- Write-ahead logging (WAL)
- Crash recovery

**Consistency:** Database must maintain valid state
- Foreign key constraints enforced
- Check constraints validated
- Unique constraints maintained
- Referential integrity guaranteed

**Isolation:** Concurrent transactions don't interfere
- Row-level locking
- MVCC (Multi-Version Concurrency Control)
- READ COMMITTED isolation level
- Deadlock detection and resolution

**Durability:** Committed transactions survive crashes
- Transaction log (binlog)
- Doublewrite buffer
- Automatic crash recovery
- Data flushed to disk

**2. Relational Data Model**

ERP data is inherently relational:

```
Items → BOM Components → Items (recursive)
Purchase Orders → Purchase Order Items → Items
Goods Receipts → Purchase Orders
Inventory Transactions → Items → Warehouses
Production Orders → Items → Work Orders
```

Relational database is natural fit:
- Foreign keys enforce relationships
- Joins retrieve related data efficiently
- Normalization reduces redundancy
- Schema clearly documents structure

**3. Performance Characteristics**

For OLTP workload (Online Transaction Processing):

**Read Performance:**
- Indexed lookups: O(log n)
- Join optimization: Query planner
- Query cache: Repeated queries
- Connection pooling: Reuse connections

**Write Performance:**
- Row-level locking: High concurrency
- InnoDB buffer pool: Memory caching
- Group commit: Batch writes
- Asynchronous I/O: Non-blocking

**Concurrency:**
- Multiple users reading simultaneously
- Multiple users writing different rows
- Minimal lock contention
- Automatic deadlock resolution

**4. Operational Maturity**

MySQL provides mature operational tools:

**Backup:**
- mysqldump for logical backups
- Binary log for point-in-time recovery
- Percona XtraBackup for hot backups
- Well-documented procedures

**Monitoring:**
- SHOW STATUS for metrics
- Performance Schema for instrumentation
- Slow query log for optimization
- Third-party tools (Percona Monitoring)

**Replication:**
- Master-slave replication
- Master-master replication
- Group replication
- Proven reliability

**5. Resource Efficiency**

MySQL is efficient for moderate-scale deployments:
- Lower memory footprint than PostgreSQL
- Good performance on commodity hardware
- Suitable for single-server deployment
- Scales vertically (more RAM, faster disk)

For typical manufacturing facility (100-500 users), single MySQL server is sufficient.

**6. Team Familiarity**

MySQL has broad industry adoption:
- Large talent pool
- Extensive documentation
- Active community
- Familiar to most developers

This reduces:
- Training requirements
- Hiring difficulty
- Support costs
- Knowledge transfer risk

### Alternative Considered: PostgreSQL

**PostgreSQL Advantages:**
- More SQL standard compliant
- Advanced features (window functions, CTEs, JSON)
- Better query optimizer for complex queries
- Table inheritance

**Why MySQL Chosen:**
- Simpler administration
- Lower resource requirements
- Broader industry familiarity
- Sufficient features for ERP workload
- PostgreSQL advantages not required

### Alternative Considered: NoSQL (MongoDB)

**Why Rejected:**
- Eventual consistency unacceptable for ERP
- No foreign key enforcement
- Weak transaction support (historically)
- Relational data model is natural fit
- Complex joins difficult
- Schema-less not beneficial (stable schema)

### Conclusion

MySQL provides the right balance of ACID compliance, relational data model, performance, operational maturity, and team familiarity for internal manufacturing ERP. Its proven reliability and comprehensive feature set make it the appropriate choice.

---

## JWT Authentication

### Decision

JSON Web Tokens (JWT) are used for authentication with 8-hour expiration.

### Rationale

**1. Stateless Authentication**

JWT enables stateless authentication:
- No server-side session storage
- No session table in database
- No session synchronization across servers
- Scales horizontally without shared state

**Token Structure:**
```json
{
  "userId": 42,
  "username": "john.doe",
  "role": "PURCHASING_MANAGER",
  "permissions": ["PURCH.CREATE_PR", "PURCH.APPROVE_PR"],
  "exp": 1735228800
}
```

Token contains all necessary information for authorization. No database lookup required for permission checks.

**2. Performance**

Stateless authentication improves performance:
- No session table queries
- No cache lookups
- Faster API response times
- Reduced database load

For high-concurrency ERP (multiple users, frequent API calls), this matters.

**3. Cryptographic Integrity**

JWT signature prevents tampering:
- Token signed with secret key (HS256 algorithm)
- Any modification invalidates signature
- Server verifies signature on every request
- Client cannot forge tokens

**Security Guarantee:** User cannot elevate privileges by modifying token.

**4. Appropriate for LAN Environment**

JWT security concerns (token theft, replay attacks) are mitigated in LAN environment:

**Network Security:**
- Internal LAN (not public internet)
- Physical access control to network
- TLS encryption recommended
- Reduced attack surface

**Token Expiration:**
- 8-hour lifetime limits exposure
- Forces daily re-authentication
- Stolen token valid for limited time
- Acceptable risk for internal system

**Audit Logging:**
- All API calls logged with user ID
- IP address logged
- Anomaly detection possible
- Post-incident investigation supported

**5. Simplicity**

JWT is simpler than alternatives:

**vs. Session Cookies:**
- No server-side storage
- No session cleanup required
- No session fixation attacks
- No CSRF vulnerability (token in header, not cookie)

**vs. OAuth2:**
- No authorization server required
- No token refresh flow
- No third-party integration
- Appropriate for single application

**6. Token Expiration Strategy**

8-hour expiration balances security and usability:

**Security:**
- Short enough to limit stolen token exposure
- Long enough to avoid authentication fatigue
- Forces re-authentication daily
- Logout invalidates token client-side

**Usability:**
- Covers typical work shift (8-9 hours)
- Minimizes disruption to workflow
- Acceptable for internal users
- Re-login once per day reasonable

**7. No Refresh Tokens**

System intentionally does not use refresh tokens:

**Rationale:**
- Refresh tokens require server-side storage (defeats stateless design)
- 8-hour lifetime sufficient for daily operations
- Re-login once per day acceptable
- Simpler implementation
- Fewer security concerns

### Alternative Considered: Session Cookies

**Why Rejected:**
- Requires server-side session storage
- Requires session synchronization for multiple servers
- Vulnerable to CSRF attacks
- More complex to implement
- Stateful design less scalable

### Alternative Considered: OAuth2

**Why Rejected:**
- Designed for third-party authorization
- No third-party integrations in internal ERP
- Unnecessary complexity
- Requires authorization server
- Overkill for single application

### Conclusion

JWT authentication is appropriate for internal manufacturing ERP. It provides stateless authentication, cryptographic integrity, good performance, and simplicity. The 8-hour expiration balances security and usability for LAN-based deployment with known user population.

---

## Role-Based Access Control (RBAC)

### Decision

Three-layer RBAC enforcement: UI, API, and Service layers.

### Rationale

**1. Defense in Depth**

Multiple independent security layers:

**Layer 1: UI (User Experience)**
```typescript
{hasPermission('PROD.CREATE_ORDER') && (
  <button>Create Production Order</button>
)}
```
- Hides unauthorized actions
- Improves user experience
- Reduces support burden
- **Not a security control** (client-side, can be bypassed)

**Layer 2: API (Primary Security Boundary)**
```typescript
export async function POST(request: Request) {
  const user = await authenticate(request);
  if (!user) return 401;
  
  const hasPermission = await requirePermission(user.id, 'PROD.CREATE_ORDER');
  if (!hasPermission) return 403;
  
  // Execute business logic
}
```
- **Mandatory checkpoint** for all operations
- Cannot be bypassed
- Server-side enforcement
- All unauthorized attempts logged

**Layer 3: Service (Defense in Depth)**
```typescript
async function deleteProductionOrder(orderId: number, userId: number) {
  const hasPermission = await checkUserPermission(userId, 'PROD.DELETE_ORDER');
  if (!hasPermission) throw new Error('Insufficient permissions');
  
  // Additional business rules
}
```
- Additional validation for critical operations
- Business rule enforcement
- Defense against future API refactoring errors

**2. Permission Model**

Permissions are granular and action-specific:

```
Module.Action format:
- PROD.CREATE_ORDER
- PROD.APPROVE_ORDER
- PURCH.CREATE_PR
- PURCH.APPROVE_PR
- INV.ADJUST_INVENTORY
- HR.APPROVE_PAYROLL
```

**Advantages:**
- Fine-grained control
- Clear permission semantics
- Easy to audit
- Flexible assignment

**3. Role Assignment**

Permissions grouped into roles:

```
Role: PURCHASING_MANAGER
Permissions:
- PURCH.VIEW_PR
- PURCH.CREATE_PR
- PURCH.APPROVE_PR
- PURCH.VIEW_PO
- PURCH.CREATE_PO
- PURCH.APPROVE_PO
```

**Advantages:**
- Simplifies user management
- Aligns with organizational structure
- Reduces permission assignment errors
- Easier to audit

**4. Least Privilege Principle**

Users receive minimum necessary permissions:
- Production planners: Production module only
- Purchasing officers: Purchasing module only
- Warehouse staff: Inventory module only
- Accounting staff: Accounting module only

**Benefit:** Limits damage from compromised accounts or insider threats.

**5. Database-Driven Permissions**

Permissions stored in database, not hardcoded:

```sql
users → user_roles → roles → role_permissions → permissions
```

**Advantages:**
- Dynamic permission changes
- No code deployment for permission updates
- Audit trail of permission changes
- Centralized permission management

**6. Audit Logging**

All permission checks logged:
- Successful access: Logged for audit trail
- Failed access: Logged for security monitoring
- Permission changes: Logged for accountability

**Security Benefit:** Unauthorized access attempts detected and investigated.

### Rationale for Three Layers

**Why Not Just API Layer?**

API layer is sufficient for security, but:
- UI layer improves user experience
- Service layer provides defense in depth
- Multiple layers catch different error types
- Redundancy increases security confidence

**Cost:** Minimal (permission checks are fast)
**Benefit:** Significant (defense in depth, better UX)

### Conclusion

Three-layer RBAC provides robust access control with defense in depth. The API layer is the primary security boundary, while UI and service layers provide additional benefits for user experience and defense against implementation errors.

---

## Approval Workflows

### Decision

Multi-step approval workflows with segregation of duties enforcement.

### Rationale

**1. Segregation of Duties**

Fundamental fraud prevention principle: No single person completes entire transaction.

**Example: Purchase Request Workflow**
```
Create PR (Purchasing Officer)
    ↓
Submit PR (Purchasing Officer)
    ↓
Approve PR (Purchasing Manager) ← Different person
    ↓
Create PO (Purchasing Officer)
    ↓
Approve PO (Purchasing Manager) ← Different person
    ↓
Receive Goods (Warehouse Staff) ← Different department
```

**Enforcement:**
```typescript
if (pr.requestor_id === approverId) {
  throw new Error('Cannot approve your own purchase request');
}
```

**Benefit:** Requires collusion between multiple people for fraud, significantly increasing detection probability.

**2. Management Oversight**

Approvals provide management checkpoints:
- Review business justification
- Verify budget availability
- Check policy compliance
- Validate pricing and terms

**Benefit:** Prevents unauthorized or inappropriate transactions.

**3. Audit Trail**

Approval workflows create documented approval chains:

```
Created by: John Doe (ID: 15) at 2025-12-26 09:00:00
Submitted by: John Doe (ID: 15) at 2025-12-26 09:15:00
Approved by: Jane Smith (ID: 23) at 2025-12-26 10:30:00
```

**Benefit:** 
- Non-repudiation (approver cannot deny approval)
- Accountability (clear responsibility)
- Compliance (audit trail for regulators)

**4. Status-Based Workflow**

Workflows enforced through status transitions:

```
Draft → Submitted → Approved → Executed
```

**Rules:**
- Cannot skip statuses
- Cannot reverse statuses (except rejection)
- Status transitions validated at service layer
- All transitions logged

**Benefit:** Workflow integrity guaranteed by system, not just process documentation.

**5. Rejection Handling**

Approvers can reject with reason:
```typescript
async function rejectPurchaseRequest(prId: number, reason: string) {
  // Update status to rejected
  // Log rejection with reason
  // Notify requestor
}
```

**Benefit:** 
- Feedback to requestor
- Documentation of rejection rationale
- Audit trail complete

### Conclusion

Approval workflows enforce segregation of duties, provide management oversight, create audit trails, and prevent fraud. Status-based workflow implementation ensures integrity through system enforcement rather than relying on process compliance.

---

## Transaction Boundaries

### Decision

All multi-table operations use database transactions to ensure atomicity.

### Rationale

**1. Data Integrity**

Multi-table operations must be atomic:

**Example: Goods Receipt**
```typescript
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  
  // All operations must succeed together
  await createGoodsReceipt(connection, data);        // 1 insert
  await createReceiptItems(connection, items);       // 5 inserts
  await createInventoryTransactions(connection);     // 5 inserts
  await updateInventoryBalances(connection);         // 5 updates
  await updatePurchaseOrder(connection);             // 1 update
  
  await connection.commit();
} catch (error) {
  await connection.rollback();  // All operations undone
  throw error;
}
```

**Without Transaction:**
- Power failure after step 3 → Partial receipt recorded
- Application error after step 4 → Inventory inconsistent
- Database crash after step 5 → PO status not updated

**With Transaction:**
- All steps succeed together, or all fail together
- No partial state possible
- Data consistency guaranteed

**2. ACID Properties**

Transactions provide ACID guarantees:

**Atomicity:** All or nothing
- Either all operations commit, or all rollback
- No partial state

**Consistency:** Valid state transitions
- Database moves from one valid state to another
- All constraints satisfied

**Isolation:** Concurrent transactions don't interfere
- Row-level locking
- READ COMMITTED isolation level
- Prevents lost updates

**Durability:** Committed data survives crashes
- Write-ahead logging
- Transaction log
- Crash recovery

**3. Error Handling**

Transactions simplify error handling:

```typescript
try {
  await connection.beginTransaction();
  // Multiple operations
  await connection.commit();
} catch (error) {
  await connection.rollback();  // Automatic cleanup
  throw error;
}
```

**Benefit:** Single error handling path, automatic cleanup on failure.

**4. Concurrency Control**

Transactions provide concurrency control:

**Pessimistic Locking:**
```sql
SELECT quantity FROM inventory_balances WHERE id = 1 FOR UPDATE;
-- Row locked, other transactions wait
UPDATE inventory_balances SET quantity = quantity - 50 WHERE id = 1;
```

**Benefit:** Prevents concurrent updates from causing negative inventory or lost updates.

### Conclusion

Transaction boundaries protect data integrity by ensuring multi-table operations are atomic. ACID properties guarantee consistency even under concurrent access and system failures. This is fundamental to ERP data reliability.

---

## Audit Logs

### Decision

Comprehensive, immutable audit logging for all mutating operations.

### Rationale

**1. Accountability**

Every action traceable to specific user:

```typescript
await logAudit({
  userId: user.id,           // WHO
  action: 'CREATE',          // WHAT
  resourceType: 'production_order',
  resourceId: orderId,
  ipAddress: request.ip,     // WHERE
  timestamp: new Date()      // WHEN
});
```

**Benefit:** Non-repudiation - user cannot deny performing action.

**2. Compliance**

Audit logs support regulatory compliance:
- SOX: Financial transaction audit trail
- ISO 9001: Quality management traceability
- FDA 21 CFR Part 11: Electronic records (if applicable)

**3. Investigation**

Audit logs enable investigation:
- Fraud detection
- Error diagnosis
- Performance analysis
- User behavior analysis

**4. Immutability**

Audit logs are append-only:
- No UPDATE operations
- No DELETE operations
- No API endpoints for modification
- Database-level protection

**Benefit:** Audit trail cannot be tampered with.

**5. Completeness**

All mutating operations logged:
- CREATE, UPDATE, DELETE
- APPROVE, REJECT, SUBMIT
- RELEASE, COMPLETE, CANCEL

**Benefit:** No gaps in audit trail.

### Conclusion

Comprehensive audit logging enforces accountability, supports compliance, enables investigation, and provides legally defensible evidence. Immutability ensures audit trail integrity.

---

## Summary

The architectural decisions in this ERP system are driven by:
1. **Data integrity requirements** → Transactions, ACID, MySQL
2. **Security requirements** → Three-layer RBAC, JWT, audit logs
3. **Operational requirements** → Monolithic architecture, approval workflows
4. **Compliance requirements** → Audit trails, segregation of duties
5. **Team capabilities** → Familiar technologies, operational simplicity

Each decision is justified by system requirements and engineering best practices. The architecture provides a solid foundation for reliable, secure, and maintainable manufacturing ERP operations.

---

**Document Version:** 1.0  
**Last Updated:** December 26, 2025  
**Prepared For:** Thesis Defense Panel
