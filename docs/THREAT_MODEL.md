# Manufacturing ERP Threat Model

## Purpose

This document provides a formal threat analysis specific to an internal manufacturing ERP system operating in a LAN/offline environment. It identifies potential security threats, attack scenarios, and evaluates existing mitigations within the current system architecture.

---

## Threat Modeling Methodology

**Approach:** STRIDE-based analysis adapted for manufacturing ERP context
- **S**poofing Identity
- **T**ampering with Data
- **R**epudiation
- **I**nformation Disclosure
- **D**enial of Service
- **E**levation of Privilege

**Scope:** Internal LAN-based manufacturing ERP with no external-facing components

---

## Threat Categories

### 1. Authentication & Access Control Threats

#### Threat 1.1: Unauthorized Access via Stolen Credentials

**Attack Scenario:**
- Attacker obtains employee credentials (password written down, shoulder surfing, social engineering)
- Logs into ERP system from internal workstation
- Accesses sensitive data or performs unauthorized transactions

**Affected Modules:** All modules

**Existing Mitigations:**
- JWT-based authentication with 8-hour token expiration
- Password complexity requirements enforced at user creation
- Failed login attempt logging in audit_logs
- Account lockout after repeated failed attempts (configurable)
- Session invalidation on logout
- All authentication attempts logged with IP address and timestamp

**Residual Risk:** **MEDIUM**
- Risk remains if credentials are willingly shared or stolen
- Mitigation: User training, periodic password rotation policy
- Physical security of workstations reduces exposure

---

#### Threat 1.2: Session Hijacking

**Attack Scenario:**
- Attacker intercepts JWT token from network traffic (LAN sniffing)
- Uses stolen token to impersonate legitimate user
- Performs actions under victim's identity

**Affected Modules:** All modules

**Existing Mitigations:**
- JWT tokens stored in localStorage (not cookies, prevents CSRF)
- Short token expiration (8 hours)
- Token includes user ID, role, and permissions
- Token signature verification on every API request
- IP address logged with every action (anomaly detection possible)
- HTTPS enforcement recommended for production (TLS on LAN)

**Residual Risk:** **LOW** (in LAN environment)
- LAN environment reduces network interception risk
- Physical access control to network infrastructure
- Token expiration limits window of opportunity

---

#### Threat 1.3: Privilege Escalation

**Attack Scenario:**
- User with lower privileges attempts to access higher-privilege functions
- Modifies API requests to bypass UI restrictions
- Attempts to perform admin-only operations

**Affected Modules:** All modules

**Existing Mitigations:**
- **Double-lock RBAC enforcement:**
  - Layer 1: UI hides/disables unauthorized actions
  - Layer 2: API routes verify permissions before execution
  - Layer 3: Service layer validates user permissions for sensitive operations
- Permission checks use database-stored role assignments
- All permission checks logged in audit_logs
- 403 Forbidden responses for unauthorized attempts
- No client-side permission logic that can be bypassed

**Residual Risk:** **LOW**
- Three-layer enforcement prevents bypass
- Database-driven permissions cannot be manipulated client-side
- Audit trail captures all attempts

---

### 2. Approval Workflow Threats

#### Threat 2.1: Self-Approval Bypass

**Attack Scenario:**
- User creates a purchase request
- Attempts to approve their own request by manipulating API calls
- Circumvents separation of duties

**Affected Modules:** Purchasing, Production, HR (Payroll), Accounting

**Existing Mitigations:**
- Service-level validation: `if (requestor_id === approver_id) throw error`
- Approval actions require specific permissions (e.g., `PURCH.APPROVE_PR`)
- Audit logs record both requestor and approver IDs
- Status transitions enforce workflow (cannot skip approval)
- Database constraints prevent status manipulation

**Residual Risk:** **LOW**
- Service-level validation cannot be bypassed via API
- Audit trail makes violations immediately visible
- Role separation enforced at permission level

---

#### Threat 2.2: Approval Workflow Bypass via Status Manipulation

**Attack Scenario:**
- User attempts to directly change status from 'draft' to 'approved'
- Bypasses approval step by manipulating database or API
- Circumvents management oversight

**Affected Modules:** All transactional modules

**Existing Mitigations:**
- Status transition validation in service layer
- `validateStatusTransition()` enforces allowed transitions
- No direct status update endpoints (only action-specific endpoints)
- Database triggers could enforce status flow (if implemented)
- All status changes logged with user ID and timestamp
- Read-only status after certain transitions

**Residual Risk:** **LOW**
- Service layer validation prevents invalid transitions
- No API endpoints allow arbitrary status changes
- Audit trail captures all status modifications

---

### 3. Insider Threat Scenarios

#### Threat 3.1: HR Payroll Fraud

**Attack Scenario:**
- HR staff member inflates employee hours in attendance records
- Creates fictitious employees and processes payroll
- Manipulates payroll calculations to embezzle funds

**Affected Modules:** HR (Attendance, Payroll), Accounting (AP)

**Existing Mitigations:**
- **Attendance:**
  - Biometric import is read-only (source: 'biometric')
  - Manual attendance requires justification in remarks field
  - All attendance modifications logged with user ID
- **Payroll:**
  - Payroll calculation is deterministic (based on attendance + rates)
  - Payroll requires approval before release
  - Approver must be different from calculator
  - Payroll release creates AP invoice (dual verification)
  - All payroll actions logged in audit_logs
- **Employee Management:**
  - Employee creation requires manager approval
  - Deactivated employees excluded from payroll
  - Employee list reviewed monthly

**Residual Risk:** **MEDIUM**
- Collusion between HR staff and approver possible
- Mitigation: Regular payroll audits, spot checks
- Segregation of duties reduces single-point fraud

---

#### Threat 3.2: Purchasing Fraud (Kickbacks/Overbilling)

**Attack Scenario:**
- Purchasing officer creates inflated purchase orders
- Colludes with supplier for kickbacks
- Approves own purchase requests

**Affected Modules:** Purchasing, Accounting (AP)

**Existing Mitigations:**
- **Purchase Request Approval:**
  - PR requires manager approval
  - Self-approval prevented at service level
  - PR-to-PO conversion tracked
- **Purchase Order Approval:**
  - PO requires separate approval
  - Approval limits can be enforced (configurable)
  - PO sent to supplier creates audit trail
- **Goods Receipt Verification:**
  - Warehouse staff (different department) verifies receipt
  - Quality inspection validates items
  - Three-way match: PO → Goods Receipt → AP Invoice
- **Audit Trail:**
  - All PR/PO creation, approval, and modification logged
  - Supplier selection logged
  - Price changes logged

**Residual Risk:** **MEDIUM**
- Collusion between purchasing and warehouse possible
- Mitigation: Periodic vendor price audits, competitive bidding
- Segregation of duties (purchasing ≠ receiving ≠ payment)

---

#### Threat 3.3: Inventory Theft/Manipulation

**Attack Scenario:**
- Warehouse staff manipulates inventory records
- Issues goods without proper work order
- Adjusts inventory to hide theft
- Colludes with production to over-report scrap

**Affected Modules:** Inventory, Production

**Existing Mitigations:**
- **Goods Issue:**
  - Requires valid work order reference
  - Work order must be in 'in_progress' status
  - Quantity validation against work order requirements
  - All issues logged with user ID and timestamp
- **Inventory Adjustments:**
  - Requires manager permission (`INV.ADJUST_INVENTORY`)
  - Adjustment reason mandatory
  - All adjustments logged in audit_logs
  - Negative adjustments flagged for review
- **Physical Inventory:**
  - Periodic cycle counts compare physical vs system
  - Discrepancies investigated and documented
  - Count performed by different staff than daily operations
- **Production Output:**
  - Good/scrap/rework quantities recorded
  - Excessive scrap rates trigger alerts
  - Output compared to material issued (yield analysis)

**Residual Risk:** **MEDIUM**
- Physical theft difficult to prevent via software
- Mitigation: Physical security, cameras, cycle counts
- System provides audit trail for investigation

---

#### Threat 3.4: Accounting Fraud (AP Manipulation)

**Attack Scenario:**
- Accounting staff creates fictitious invoices
- Processes payments to fake suppliers
- Manipulates invoice amounts or payment records

**Affected Modules:** Accounting (AP)

**Existing Mitigations:**
- **Invoice Creation:**
  - AP invoices require PO reference (three-way match)
  - Invoices without PO require special approval
  - All invoice creation logged
- **Invoice Approval:**
  - Requires manager approval
  - Self-approval prevented
  - Approval limits enforced
- **Payment Processing:**
  - Payment requires separate approval
  - Payment amount cannot exceed invoice balance
  - Overpayment prevented at service level
  - All payments logged with bank reference
- **Vendor Management:**
  - Vendor creation requires approval
  - Vendor bank details changes logged
  - Periodic vendor list review

**Residual Risk:** **MEDIUM**
- Collusion between accounting staff and approver possible
- Mitigation: Bank reconciliation, vendor verification
- External audits provide additional oversight

---

### 4. Data Integrity Threats

#### Threat 4.1: Audit Log Tampering

**Attack Scenario:**
- Malicious user with database access deletes or modifies audit logs
- Covers tracks after fraudulent activity
- Destroys evidence of policy violations

**Affected Modules:** All modules (audit_logs table)

**Existing Mitigations:**
- **Database-Level Protection:**
  - Audit logs table has no UPDATE or DELETE operations in application
  - Only INSERT operations allowed
  - Database user permissions restrict direct table access
  - Audit logs stored in append-only fashion
- **Application-Level Protection:**
  - No API endpoints for modifying audit logs
  - No service methods for deleting audit logs
  - Archive process moves old logs, doesn't delete
- **Monitoring:**
  - Audit log gaps detected (sequence numbers)
  - Direct database access logged at OS level
  - Database audit trail (MySQL general log) captures all queries

**Residual Risk:** **LOW**
- Application cannot modify audit logs
- Database admin access required for tampering
- OS-level logging provides secondary audit trail
- Mitigation: Restrict database admin access, log forwarding to SIEM

---

#### Threat 4.2: Transaction Data Tampering

**Attack Scenario:**
- User modifies completed transactions
- Changes quantities, prices, or dates after approval
- Manipulates financial records

**Affected Modules:** All transactional modules

**Existing Mitigations:**
- **Status-Based Immutability:**
  - Transactions become read-only after submission
  - Service layer validates status before allowing updates
  - `if (status !== 'draft') throw error`
- **Audit Trail:**
  - All modifications logged with old/new values
  - Modification history preserved
  - User ID and timestamp recorded
- **Database Constraints:**
  - Foreign key constraints prevent orphaned records
  - Check constraints enforce data validity
  - Triggers could enforce additional rules

**Residual Risk:** **LOW**
- Application enforces immutability
- Audit trail makes tampering visible
- Database constraints provide additional protection

---

### 5. Denial of Service Threats

#### Threat 5.1: Resource Exhaustion via Bulk Operations

**Attack Scenario:**
- Malicious user creates thousands of records
- Executes expensive queries repeatedly
- Exhausts database connections or memory
- Degrades system performance for all users

**Affected Modules:** All modules

**Existing Mitigations:**
- **Rate Limiting:**
  - API rate limiting per user (configurable)
  - Maximum page size enforced (MAX_PAGE_SIZE=100)
  - Query timeout limits
- **Connection Pooling:**
  - Database connection pool with max limit
  - Connections released after use
  - Connection timeout prevents leaks
- **Pagination:**
  - All list endpoints paginated
  - Default page size: 20
  - Maximum page size: 100
- **Query Optimization:**
  - Indexed columns for common queries
  - Efficient SQL queries in repositories
  - No N+1 query patterns

**Residual Risk:** **LOW** (in LAN environment)
- LAN environment limits attack surface
- Physical access control to workstations
- User accountability via authentication

---

#### Threat 5.2: Database Deadlock Attacks

**Attack Scenario:**
- User initiates multiple concurrent transactions
- Causes database deadlocks
- Disrupts normal operations

**Affected Modules:** All transactional modules

**Existing Mitigations:**
- **Transaction Design:**
  - Short transaction duration
  - Consistent table access order
  - Minimal lock holding time
- **Deadlock Handling:**
  - Automatic deadlock detection by MySQL
  - Transaction rollback on deadlock
  - Retry logic in application (configurable)
- **Monitoring:**
  - Deadlock events logged
  - Performance monitoring alerts on high deadlock rate

**Residual Risk:** **LOW**
- MySQL handles deadlocks automatically
- Application retry logic ensures completion
- Consistent access patterns minimize deadlocks

---

### 6. LAN/Offline-Specific Threats

#### Threat 6.1: Physical Access to Server

**Attack Scenario:**
- Attacker gains physical access to server room
- Boots server from USB to bypass OS security
- Accesses database files directly
- Copies sensitive data

**Affected Modules:** All modules (database)

**Existing Mitigations:**
- **Physical Security:**
  - Server room access control (outside application scope)
  - Server room monitoring (outside application scope)
- **Database Encryption:**
  - Database connection encryption (TLS)
  - Encrypted backups (recommended)
  - Disk encryption (OS-level, recommended)
- **Access Control:**
  - Database user authentication
  - Minimal database user privileges
  - No default passwords

**Residual Risk:** **MEDIUM**
- Physical security is primary defense
- Application cannot prevent physical access
- Mitigation: Physical security measures, encryption at rest

---

#### Threat 6.2: Network Sniffing on LAN

**Attack Scenario:**
- Attacker connects to LAN
- Sniffs network traffic
- Captures JWT tokens or sensitive data in transit

**Affected Modules:** All modules

**Existing Mitigations:**
- **Transport Security:**
  - HTTPS/TLS recommended for production
  - JWT tokens in Authorization header (not URL)
  - No sensitive data in query parameters
- **Token Security:**
  - Short token expiration (8 hours)
  - Token invalidation on logout
  - No refresh tokens in localStorage
- **Network Segmentation:**
  - ERP on isolated VLAN (recommended)
  - Firewall rules restrict access (outside application scope)

**Residual Risk:** **LOW** (with TLS)
- TLS encryption prevents sniffing
- LAN environment reduces attack surface
- Physical access control to network

---

#### Threat 6.3: Offline Mode Data Manipulation

**Attack Scenario:**
- System operates offline (no network)
- User manipulates local data
- Syncs fraudulent data when online

**Affected Modules:** N/A (system is online-only)

**Existing Mitigations:**
- **System Design:**
  - System requires LAN connectivity
  - No offline mode implemented
  - All transactions require database connection
  - No local data caching for transactions

**Residual Risk:** **N/A**
- System does not support offline operation
- All transactions are real-time

---

### 7. Supply Chain & Integration Threats

#### Threat 7.1: Biometric Data Manipulation

**Attack Scenario:**
- Attacker manipulates biometric attendance import
- Injects false attendance records
- Inflates hours for payroll fraud

**Affected Modules:** HR (Attendance)

**Existing Mitigations:**
- **Import Validation:**
  - Biometric imports marked as source: 'biometric'
  - Biometric records are read-only
  - Import process validates data format
  - Duplicate detection prevents re-import
- **Audit Trail:**
  - All imports logged with user ID and timestamp
  - Import file hash stored (if implemented)
  - Original import data preserved
- **Reconciliation:**
  - Biometric vs manual attendance comparison
  - Anomaly detection (excessive hours)
  - Manager review of attendance summaries

**Residual Risk:** **LOW**
- Read-only biometric data prevents modification
- Audit trail enables investigation
- Reconciliation detects anomalies

---

## Threat Summary Matrix

| Threat Category | Threat Count | High Risk | Medium Risk | Low Risk |
|-----------------|--------------|-----------|-------------|----------|
| Authentication & Access | 3 | 0 | 1 | 2 |
| Approval Workflows | 2 | 0 | 0 | 2 |
| Insider Threats | 4 | 0 | 4 | 0 |
| Data Integrity | 2 | 0 | 0 | 2 |
| Denial of Service | 2 | 0 | 0 | 2 |
| LAN/Offline | 3 | 0 | 1 | 2 |
| Supply Chain | 1 | 0 | 0 | 1 |
| **TOTAL** | **17** | **0** | **6** | **11** |

---

## Risk Assessment Summary

### High Risk Threats: 0
No high-risk threats identified in current architecture.

### Medium Risk Threats: 6
1. Unauthorized access via stolen credentials
2. HR payroll fraud
3. Purchasing fraud (kickbacks)
4. Inventory theft/manipulation
5. Accounting fraud (AP manipulation)
6. Physical access to server

**Common Mitigation Strategy:**
- Segregation of duties
- Approval workflows
- Comprehensive audit logging
- Periodic audits and reconciliations
- Physical security measures
- User training and awareness

### Low Risk Threats: 11
All low-risk threats have strong technical mitigations in place.

---

## Residual Risk Acceptance

### Medium Risks Requiring Organizational Controls

The following medium-risk threats cannot be fully mitigated by software alone:

1. **Insider Fraud (HR, Purchasing, Accounting)**
   - **Acceptance Rationale:** Requires organizational controls
   - **Recommended Controls:**
     - Background checks for financial roles
     - Mandatory vacation policy (fraud detection)
     - Periodic internal audits
     - Whistleblower hotline
     - Segregation of duties enforcement
     - Dual approval for high-value transactions

2. **Physical Security**
   - **Acceptance Rationale:** Outside application scope
   - **Recommended Controls:**
     - Server room access control
     - Video surveillance
     - Disk encryption at rest
     - Secure backup storage

---

## Threat Model Maintenance

This threat model should be reviewed and updated:
- **Quarterly:** Review residual risks
- **Annually:** Full threat model refresh
- **On Change:** When new modules or features are added
- **Post-Incident:** After any security incident

---

**Last Updated:** December 26, 2025
**Next Review:** March 26, 2026
**Maintained By:** ERP Security Team
