# Security Guarantees Documentation

## Purpose

This document provides architect-level explanations of why the current manufacturing ERP system is secure. It articulates the security design principles, defense mechanisms, and architectural decisions that collectively ensure system integrity, confidentiality, and accountability.

---

## Executive Summary

The manufacturing ERP system employs a **defense-in-depth** strategy with multiple overlapping security controls. Security is not a single feature but an architectural property achieved through:

1. **Layered authentication and authorization**
2. **Immutable audit trails**
3. **Service-level validation and business rule enforcement**
4. **Transaction integrity guarantees**
5. **Separation of duties through workflow design**
6. **Comprehensive logging and traceability**

---

## 1. JWT Authentication in LAN/Offline ERP Context

### Why JWT is Acceptable and Appropriate

#### Context-Specific Security Posture

**Threat Model Alignment:**
- **Internal LAN environment** reduces network-based attack surface
- **No public internet exposure** eliminates remote attack vectors
- **Physical access control** to workstations provides first line of defense
- **Known user population** (employees only) enables accountability

**JWT Advantages in This Context:**

1. **Stateless Authentication**
   - No server-side session storage required
   - Scales horizontally without session synchronization
   - Reduces database load (no session table queries)
   - Simplifies server architecture

2. **Self-Contained Authorization**
   - Token contains user ID, role, and permissions
   - No database lookup required for permission checks
   - Faster API response times
   - Reduces database contention

3. **Cryptographic Integrity**
   - Token signature prevents tampering
   - HS256 algorithm with strong secret (64+ characters recommended)
   - Any modification invalidates signature
   - Server-side verification on every request

4. **Expiration Control**
   - 8-hour token lifetime balances security and usability
   - Forces re-authentication daily
   - Limits window of opportunity for stolen tokens
   - Automatic logout for inactive sessions

**Why Not Session Cookies:**
- Cookies vulnerable to CSRF attacks
- JWT in Authorization header immune to CSRF
- Cookies require server-side session management
- JWT enables stateless API design

**Why Not OAuth2:**
- OAuth2 designed for third-party authorization
- No third-party integrations in internal ERP
- Unnecessary complexity for single-application system
- JWT provides sufficient security for internal use

---

### Token Expiration Strategy

**Design Rationale:**

```
Token Lifetime: 8 hours
Refresh Strategy: Manual re-login
Logout: Immediate token invalidation (client-side)
```

**Why 8 Hours:**
- Covers typical work shift (8-9 hours)
- Minimizes disruption to user workflow
- Short enough to limit stolen token exposure
- Long enough to avoid authentication fatigue

**Why No Refresh Tokens:**
- Refresh tokens add complexity
- Refresh tokens require server-side storage (defeats stateless design)
- 8-hour lifetime sufficient for daily operations
- Re-login once per day acceptable for internal system

**Token Invalidation on Logout:**
- Client removes token from localStorage
- Server has no token blacklist (stateless design)
- Token remains technically valid until expiration
- Risk mitigated by: short lifetime, audit logging, LAN environment

**Compromise Scenario Mitigation:**
- Stolen token valid for maximum 8 hours
- All actions logged with user ID and IP address
- Anomaly detection possible (unusual IP, unusual actions)
- User can report compromise immediately
- Admin can deactivate user account (future logins blocked)

---

### Session Hijacking Mitigation

**Multi-Layer Defense:**

1. **Transport Layer Security**
   - HTTPS/TLS recommended for production
   - Encrypts token in transit
   - Prevents network sniffing on LAN
   - Certificate validation prevents MITM attacks

2. **Token Storage Security**
   - Stored in localStorage (not cookies)
   - HttpOnly not applicable (not a cookie)
   - XSS protection via React's built-in escaping
   - No token in URL parameters (prevents logging)

3. **Token Binding (Implicit)**
   - Token contains user ID
   - All actions logged with user ID and IP address
   - IP address changes detectable
   - Anomaly detection possible

4. **Short Expiration Window**
   - 8-hour maximum validity
   - Limits attacker's time window
   - Forces re-authentication daily

5. **Audit Trail**
   - All API calls logged
   - Suspicious activity detectable
   - Post-incident investigation possible
   - User accountability enforced

**Why This is Sufficient:**
- LAN environment reduces interception risk
- Physical access control to network infrastructure
- Known user population enables behavioral analysis
- Audit trail provides detective control

---

## 2. Double-Lock RBAC Architecture

### Three-Layer Permission Enforcement

The system implements **defense in depth** for authorization:

```
Layer 1 (UI):     Hide/disable unauthorized actions
                  ↓
Layer 2 (API):    Verify permissions before execution
                  ↓
Layer 3 (Service): Validate permissions for sensitive operations
```

### Why Three Layers

#### Layer 1: UI-Level Enforcement

**Purpose:** User experience and guidance
**Mechanism:** `usePermissions()` hook, conditional rendering
**Security Value:** **LOW** (easily bypassed)

```typescript
{hasPermission('PROD.CREATE_ORDER') && (
  <button>Create Production Order</button>
)}
```

**Why Included:**
- Improves user experience (don't show what users can't do)
- Provides immediate feedback
- Reduces support burden (users don't attempt unauthorized actions)
- **NOT a security control** (client-side code can be modified)

#### Layer 2: API-Level Enforcement

**Purpose:** Primary security boundary
**Mechanism:** Permission verification in every API route
**Security Value:** **HIGH** (cannot be bypassed)

```typescript
export async function POST(request: Request) {
  const user = await authenticate(request);
  if (!user) return Response.json({...}, { status: 401 });
  
  const hasPermission = await requirePermission(user.id, 'PROD.CREATE_ORDER');
  if (!hasPermission) return Response.json({...}, { status: 403 });
  
  // Execute business logic
}
```

**Why This is Critical:**
- **Mandatory checkpoint** for all operations
- Cannot be bypassed via browser tools or API clients
- Server-side enforcement is authoritative
- All unauthorized attempts logged

**Enforcement Guarantees:**
- Every API route has authentication check
- Every API route has permission check
- No API route executes business logic without authorization
- 403 responses logged for security monitoring

#### Layer 3: Service-Level Enforcement

**Purpose:** Business rule enforcement and sensitive operations
**Mechanism:** Permission checks in service methods
**Security Value:** **MEDIUM** (defense in depth)

```typescript
async function deleteProductionOrder(orderId: number, userId: number) {
  const hasPermission = await checkUserPermission(userId, 'PROD.DELETE_ORDER');
  if (!hasPermission) throw new Error('Insufficient permissions');
  
  // Additional business rules
  const order = await getProductionOrder(orderId);
  if (order.status !== 'draft') {
    throw new Error('Cannot delete non-draft orders');
  }
  
  // Execute deletion
}
```

**Why Included:**
- Additional validation for critical operations
- Business rule enforcement (beyond permissions)
- Defense against future API refactoring errors
- Explicit documentation of security requirements

### Why Double-Lock (Actually Triple-Lock)

**Security Principle:** Never trust the client

**Attack Scenarios Prevented:**

1. **UI Manipulation:**
   - Attacker modifies React code to show hidden buttons
   - **Blocked by:** API-level permission check

2. **Direct API Calls:**
   - Attacker bypasses UI, calls API directly
   - **Blocked by:** API-level permission check

3. **Token Manipulation:**
   - Attacker modifies JWT to claim higher permissions
   - **Blocked by:** Signature verification, database-driven permissions

4. **API Refactoring Errors:**
   - Developer forgets permission check in new API route
   - **Partially blocked by:** Service-level validation (if called)
   - **Detected by:** Code review, security testing

**Why This Architecture is Secure:**
- Multiple independent checkpoints
- Failure of one layer doesn't compromise security
- API layer is authoritative (cannot be bypassed)
- Service layer provides defense in depth
- All layers log authorization attempts

---

## 3. Self-Approval Prevention Logic

### Business Rule: Separation of Duties

**Principle:** No user can approve their own requests

**Implementation Locations:**

1. **Service Layer (Primary):**
```typescript
async function approvePurchaseRequest(prId: number, approverId: number) {
  const pr = await getPurchaseRequest(prId);
  
  if (pr.requestor_id === approverId) {
    throw new Error('Cannot approve your own purchase request');
  }
  
  // Proceed with approval
}
```

2. **Database Query (Secondary):**
```sql
-- Approval queries exclude self-approvals
SELECT * FROM purchase_requests 
WHERE status = 'pending_approval' 
  AND requestor_id != ?
```

### Why This is Critical

**Fraud Prevention:**
- Prevents single-person fraud schemes
- Requires collusion (two people) for fraud
- Increases detection probability
- Creates accountability chain

**Audit Trail:**
- Requestor ID logged at creation
- Approver ID logged at approval
- Audit log shows two different users
- Violations immediately visible

**Enforcement Guarantees:**
- Service-level validation cannot be bypassed
- No API endpoint allows self-approval
- Database queries exclude self-approvals
- All approval attempts logged

### Separation of Duties Matrix

| Action | Role Required | Cannot Be Same As |
|--------|---------------|-------------------|
| Create PR | Purchasing Officer | - |
| Approve PR | Purchasing Manager | PR Creator |
| Create PO | Purchasing Officer | - |
| Approve PO | Purchasing Manager | PO Creator |
| Receive Goods | Warehouse Staff | PO Creator |
| Approve Invoice | Accounting Manager | Invoice Creator |
| Process Payment | Accounting Staff | Invoice Approver |
| Calculate Payroll | HR Staff | - |
| Approve Payroll | HR Manager | Payroll Calculator |

**Why This Prevents Fraud:**
- Single person cannot complete fraudulent transaction
- Requires collusion between roles
- Different departments involved (purchasing ≠ warehouse ≠ accounting)
- Audit trail shows multiple actors

---

## 4. Audit Logs: Legal Defensibility

### Why Audit Logs are Legally Defensible

#### Characteristics of Defensible Audit Logs

1. **Immutability**
   - No UPDATE or DELETE operations in application code
   - Append-only design
   - No API endpoints for modification
   - Database-level protection (user permissions)

2. **Completeness**
   - All mutating operations logged (CREATE, UPDATE, DELETE, APPROVE, etc.)
   - All authentication attempts logged
   - All authorization failures logged
   - No gaps in audit trail

3. **Integrity**
   - Cryptographic hash of log entries (if implemented)
   - Sequence numbers detect gaps
   - Timestamps prevent backdating
   - User ID prevents repudiation

4. **Retention**
   - Minimum 1 year for operational logs
   - 7 years for financial transaction logs
   - Archive strategy preserves old logs
   - Compliance with regulatory requirements

5. **Traceability**
   - User ID links to employee record
   - IP address identifies workstation
   - Timestamp establishes timeline
   - Action type describes what happened
   - Old/new values show what changed

#### Legal Standards Met

**Admissibility Criteria:**

1. **Relevance:** Audit logs directly relate to disputed transactions
2. **Authenticity:** Logs generated automatically by system
3. **Reliability:** System-generated, not manually created
4. **Best Evidence:** Original digital records, not copies
5. **Chain of Custody:** Archive process documented

**Regulatory Compliance:**

- **SOX (Sarbanes-Oxley):** Financial transaction audit trail
- **ISO 9001:** Quality management traceability
- **FDA 21 CFR Part 11:** Electronic records and signatures (if applicable)
- **GDPR:** Data access and modification logging (if applicable)

#### Non-Repudiation

**Definition:** User cannot deny performing an action

**How Achieved:**

1. **Authentication:** User logged in with credentials
2. **Authorization:** User had permission to perform action
3. **Action Logging:** Action recorded with user ID
4. **Timestamp:** Exact time recorded
5. **IP Address:** Workstation identified
6. **Immutability:** Log cannot be altered after creation

**Legal Significance:**
- User cannot claim "I didn't do it"
- User cannot claim "System error"
- User cannot claim "Someone else used my account"
- Audit log is prima facie evidence

#### Investigation Support

**Forensic Capabilities:**

1. **Timeline Reconstruction:**
   - All actions by user in chronological order
   - All actions on resource (e.g., specific PO)
   - All actions during time period

2. **Pattern Analysis:**
   - Unusual activity detection
   - Frequency analysis
   - Behavioral anomalies

3. **Correlation:**
   - Link related actions across modules
   - Trace transaction from creation to completion
   - Identify accomplices in fraud schemes

**Example Investigation Queries:**

```sql
-- All actions by user
SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at;

-- All changes to specific resource
SELECT * FROM audit_logs 
WHERE resource_type = 'purchase_order' AND resource_id = ?
ORDER BY created_at;

-- All failed authorization attempts
SELECT * FROM audit_logs 
WHERE success = false AND action LIKE '%UNAUTHORIZED%'
ORDER BY created_at DESC;

-- Suspicious pattern: self-approvals attempted
SELECT * FROM audit_logs 
WHERE action = 'APPROVE' 
  AND old_value->>'requestor_id' = user_id::text;
```

---

## 5. Service-Level Validation: Critical Defense Layer

### Why Service-Level Validation is Critical

**Architectural Principle:** Never trust input, even from authenticated users

#### Defense Against Multiple Threat Vectors

1. **API Bypass Attempts:**
   - Attacker calls API directly (bypassing UI validation)
   - Service layer validates all inputs
   - Invalid data rejected before database access

2. **Future API Changes:**
   - New API endpoints added
   - Developer forgets validation
   - Service layer provides fallback validation

3. **Internal API Calls:**
   - Service methods called by other services
   - Validation ensures consistency
   - Prevents cascading errors

4. **Business Rule Enforcement:**
   - Complex rules beyond simple type checking
   - Status transition validation
   - Cross-entity validation

#### Validation Layers

**Layer 1: Type Validation (TypeScript)**
```typescript
interface CreateProductionOrderRequest {
  itemId: number;
  quantity: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  plannedStartDate: string;
  plannedEndDate: string;
}
```
- Compile-time type checking
- Prevents type errors
- IDE support and autocomplete

**Layer 2: Runtime Validation (Service Layer)**
```typescript
async function createProductionOrder(data: CreateProductionOrderRequest) {
  validateRequired(data.itemId, 'Item ID');
  validatePositiveNumber(data.quantity, 'Quantity');
  validateEnum(data.priority, ['low', 'normal', 'high', 'urgent'], 'Priority');
  validateDateRange(data.plannedStartDate, data.plannedEndDate);
  
  // Business rule validation
  const item = await getItem(data.itemId);
  if (!item || !item.is_active) {
    throw new Error('Invalid or inactive item');
  }
  
  // Proceed with creation
}
```
- Runtime checks
- Business rule enforcement
- Database state validation

**Layer 3: Database Constraints**
```sql
CREATE TABLE production_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  status ENUM('draft', 'scheduled', 'in_progress', 'completed', 'cancelled'),
  FOREIGN KEY (item_id) REFERENCES items(id)
);
```
- Final safety net
- Prevents invalid data even if application bypassed
- Enforces referential integrity

### Why Three Validation Layers

**Defense in Depth:**
- Multiple independent checks
- Failure of one layer doesn't compromise data integrity
- Each layer catches different error types

**Error Detection:**
- Type errors caught at compile time (cheapest)
- Business rule violations caught at runtime (before database)
- Constraint violations caught at database (last resort)

**Performance:**
- Early validation prevents unnecessary database queries
- Type checking has zero runtime cost
- Service validation faster than database round-trip

---

## 6. Transaction Integrity and ACID Guarantees

### Why Transactions are Critical

**Problem:** Multi-table operations must be atomic

**Example Scenario:**
```
Goods Receipt:
1. Create goods_receipt record
2. Create goods_receipt_items records (multiple)
3. Create inventory_transactions records (multiple)
4. Update inventory_balances (multiple)
5. Update purchase_order status
6. Create audit_log entry
```

**Without Transaction:**
- Power failure after step 3 → Partial receipt recorded
- Database crash after step 4 → Inventory inconsistent
- Application error after step 5 → PO status not updated

**With Transaction:**
- All steps succeed together, or all fail together
- No partial state possible
- Data consistency guaranteed

### ACID Properties

#### Atomicity
**Guarantee:** All operations in transaction succeed or all fail

**Implementation:**
```typescript
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  
  // Multiple operations
  await connection.query('INSERT INTO goods_receipts ...');
  await connection.query('INSERT INTO goods_receipt_items ...');
  await connection.query('INSERT INTO inventory_transactions ...');
  await connection.query('UPDATE inventory_balances ...');
  await connection.query('UPDATE purchase_orders ...');
  
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

**Failure Scenarios:**
- Application crash → Automatic rollback
- Database crash → Automatic rollback
- Network failure → Automatic rollback
- Explicit error → Manual rollback

#### Consistency
**Guarantee:** Database moves from one valid state to another

**Enforcement:**
- Foreign key constraints
- Check constraints
- Application-level validation
- Transaction ensures all constraints satisfied

**Example:**
- Inventory balance never negative (check constraint)
- PO status matches receipt status (application logic)
- All transactions have corresponding balance updates (foreign keys)

#### Isolation
**Guarantee:** Concurrent transactions don't interfere

**MySQL Isolation Level:** READ COMMITTED (default)

**Implications:**
- Transaction sees committed data only
- No dirty reads
- Phantom reads possible (acceptable for ERP use case)
- Repeatable reads not guaranteed (acceptable)

**Concurrency Control:**
- Row-level locking
- Deadlock detection and resolution
- Optimistic locking for long-running operations (if needed)

#### Durability
**Guarantee:** Committed transactions survive system failures

**MySQL Implementation:**
- Write-ahead logging (WAL)
- Transaction log (binlog)
- Crash recovery on restart
- Data flushed to disk

**Backup Strategy:**
- Daily full backups
- Continuous binlog backups
- Point-in-time recovery possible
- Backup retention per policy

---

## 7. Comprehensive Security Posture

### Security by Design Principles

1. **Least Privilege:**
   - Users have minimum necessary permissions
   - Role-based access control
   - No default admin accounts

2. **Separation of Duties:**
   - No single person can complete fraudulent transaction
   - Approval workflows enforce checks
   - Different roles for different actions

3. **Defense in Depth:**
   - Multiple overlapping security controls
   - Failure of one layer doesn't compromise security
   - UI + API + Service + Database layers

4. **Fail Secure:**
   - Default deny (no permission = no access)
   - Errors don't expose sensitive information
   - Transaction rollback on failure

5. **Audit and Accountability:**
   - All actions logged
   - Non-repudiation through audit trail
   - User accountability enforced

6. **Secure by Default:**
   - Strong password requirements
   - Token expiration enforced
   - No default credentials
   - Minimal attack surface

### Security Testing Strategy

**Recommended Testing:**

1. **Penetration Testing:**
   - Attempt to bypass authentication
   - Attempt to escalate privileges
   - Attempt to manipulate transactions
   - Attempt to tamper with audit logs

2. **Code Review:**
   - Verify permission checks in all API routes
   - Verify validation in all service methods
   - Verify transaction usage for multi-table operations
   - Verify audit logging for all mutations

3. **Compliance Audit:**
   - Verify audit log completeness
   - Verify separation of duties enforcement
   - Verify data retention compliance
   - Verify access control effectiveness

---

## Conclusion

The manufacturing ERP system is secure because:

1. **Authentication is robust:** JWT with short expiration, appropriate for LAN environment
2. **Authorization is enforced:** Three-layer RBAC prevents bypass
3. **Business rules are validated:** Service-level validation prevents fraud
4. **Transactions are atomic:** ACID guarantees ensure data integrity
5. **Audit trail is complete:** All actions logged, legally defensible
6. **Separation of duties:** Workflow design prevents single-person fraud
7. **Defense in depth:** Multiple overlapping controls

Security is not a feature but an **architectural property** achieved through careful design, consistent implementation, and comprehensive testing.

---

**Last Updated:** December 26, 2025
**Maintained By:** ERP Security Architecture Team
