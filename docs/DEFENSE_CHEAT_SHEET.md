# Defense Cheat Sheet

## Purpose

This is a concise reference for thesis defense, providing quick answers to anticipated panel questions. Use this for final review before defense.

---

## Core Architecture Decisions

### Why Monolithic Architecture?

**Answer in 30 seconds:**
Manufacturing ERP requires strong ACID guarantees across multiple entities. A goods receipt atomically updates 6 tables - this is natural in monolithic architecture with single database transaction. Microservices would require distributed transactions (2PC or Saga) with eventual consistency, which is unacceptable for real-time inventory accuracy. ERP modules are tightly coupled by nature - attempting to separate them creates artificial boundaries. Monolithic provides superior transaction consistency, better performance, simpler operations, and aligns with team capabilities.

**Keywords:** ACID, transaction consistency, tight coupling, operational simplicity

---

### Why MySQL?

**Answer in 30 seconds:**
MySQL with InnoDB provides full ACID compliance required for manufacturing ERP. It offers proven reliability, excellent OLTP performance, mature operational tools, and broad industry adoption. The relational model is natural fit for ERP data with foreign keys enforcing relationships. PostgreSQL advantages (advanced features, better optimizer) are not required for this workload. NoSQL is inappropriate due to eventual consistency and lack of foreign key enforcement.

**Keywords:** ACID, relational model, OLTP performance, proven reliability

---

### Why JWT Authentication?

**Answer in 30 seconds:**
JWT enables stateless authentication appropriate for LAN environment. Token contains user ID, role, and permissions - no database lookup needed for authorization checks. 8-hour expiration balances security and usability for work shift. LAN environment mitigates token theft risks. Cryptographic signature prevents tampering. Simpler than session cookies (no CSRF) and appropriate for single-application internal system (no OAuth2 complexity needed).

**Keywords:** Stateless, cryptographic integrity, LAN-appropriate, performance

---

### Why Layered Architecture?

**Answer in 30 seconds:**
Layered architecture provides separation of concerns: Presentation (UI), API (authentication/authorization), Service (business logic), Repository (data access), Database (persistence). Each layer has distinct responsibility enabling independent testing, maintainability, and security enforcement. Multiple layers provide defense in depth - API layer is primary security boundary, service layer provides business rule validation, database layer enforces constraints.

**Keywords:** Separation of concerns, defense in depth, testability, maintainability

---

## Data Integrity Guarantees

### How is Data Integrity Guaranteed?

**Answer in 30 seconds:**
Three mechanisms: (1) Database transactions ensure atomicity - multi-table operations succeed together or fail together, (2) Three-layer validation - TypeScript types, service-level validation, database constraints, (3) Foreign key constraints enforce referential integrity preventing orphaned records. All combined with comprehensive audit logging for traceability.

**Keywords:** ACID transactions, multi-layer validation, referential integrity, audit trail

---

### What Happens During Power Failure?

**Answer in 30 seconds:**
MySQL InnoDB uses write-ahead logging (WAL). Uncommitted transactions automatically rolled back on crash recovery. No partial data possible. Transaction log replayed on restart - committed transactions durable, uncommitted transactions undone. Doublewrite buffer prevents partial page writes. Database returns to consistent state automatically.

**Keywords:** Write-ahead logging, automatic rollback, crash recovery, durability

---

### How Do You Handle Concurrent Updates?

**Answer in 30 seconds:**
Pessimistic locking with SELECT FOR UPDATE. First transaction locks row, second waits. Prevents lost updates and negative inventory. MySQL provides automatic deadlock detection - one transaction chosen as victim and rolled back, other proceeds. Application implements retry logic with exponential backoff. Consistent lock ordering prevents most deadlocks.

**Keywords:** Pessimistic locking, row-level locking, deadlock detection, retry logic

---

## Fraud Prevention

### How Do You Prevent Fraud?

**Answer in 30 seconds:**
Multiple controls: (1) Segregation of duties - creator cannot approve own request, enforced at service level, (2) Approval workflows - all significant transactions require manager approval, (3) Immutable audit trail - all actions logged, cannot be modified, (4) Three-way match for payments - PO, goods receipt, invoice must match, (5) Role-based access control - three-layer enforcement prevents unauthorized access.

**Keywords:** Segregation of duties, approval workflows, audit trail, three-way match, RBAC

---

### How is Self-Approval Prevented?

**Answer in 30 seconds:**
Service-level validation: `if (requestor_id === approver_id) throw error`. Cannot be bypassed via API or UI manipulation. All approval attempts logged in audit trail. Database queries exclude self-approvals. Requires collusion between multiple people in different departments for fraud, significantly increasing detection probability.

**Keywords:** Service-level enforcement, cannot bypass, audit logging, collusion required

---

### What About Insider Threats?

**Answer in 30 seconds:**
Segregation of duties across departments: purchasing creates PO, warehouse receives goods, accounting processes payment - three different people/departments. Comprehensive audit logging enables detection through anomaly analysis. Regular reconciliation procedures (bank, inventory, payroll) detect discrepancies. Exception monitoring flags suspicious activities (excessive adjustments, unusual patterns).

**Keywords:** Cross-department segregation, audit analysis, reconciliation, exception monitoring

---

## Accountability

### How is Accountability Enforced?

**Answer in 30 seconds:**
Every action requires authenticated user - no anonymous operations. All actions logged with user ID, timestamp, IP address, and action details. Audit logs are immutable (append-only, no UPDATE/DELETE operations). Creates non-repudiation - user cannot deny performing action. Approval chains documented showing who created, submitted, and approved each transaction.

**Keywords:** Authentication required, immutable audit logs, non-repudiation, approval chains

---

### Are Audit Logs Legally Defensible?

**Answer in 30 seconds:**
Yes. Five characteristics: (1) Immutable - cannot be modified, (2) Complete - all actions logged, no gaps, (3) Traceable - user ID, timestamp, IP address, (4) Automatic - system-generated, not manual, (5) Retained - minimum 1 year operational, 7 years financial. Meets admissibility criteria: relevant, authentic, reliable, best evidence, chain of custody.

**Keywords:** Immutable, complete, traceable, admissible evidence, retention policy

---

## Real-World Applicability

### Why is This ERP Realistic for Manufacturing?

**Answer in 30 seconds:**
Based on actual manufacturing processes: production planning, MRP, procurement, receiving, production execution, quality control, financial settlement. Approval workflows match industry practice (segregation of duties). Status lifecycles reflect real operations (draft, submitted, approved, executed). Three-way match is standard accounting control. Audit trail supports ISO 9001 and SOX-like compliance. Scalable for typical facility (100-500 users).

**Keywords:** Industry-standard processes, compliance-ready, proven workflows, appropriate scale

---

### What Makes This Different from Academic Toy Projects?

**Answer in 30 seconds:**
Complete end-to-end coverage of manufacturing lifecycle. Real approval workflows with segregation of duties enforcement. Transaction integrity through database transactions. Comprehensive audit trail for compliance. Role-based access control with three-layer enforcement. Handles concurrent users with proper locking. Production-ready architecture (not prototype). Addresses real business problems (fraud prevention, data integrity, accountability).

**Keywords:** Complete coverage, production-ready, real workflows, compliance-ready, concurrent users

---

### How Does This Compare to Commercial ERP?

**Answer in 30 seconds:**
Covers core manufacturing ERP functionality comparable to SAP, Oracle, or Microsoft Dynamics for single-plant operations. Intentional scope limitations (no multi-plant, no cost accounting, no BI) are appropriate for target use case. Architecture principles same as commercial ERP: ACID transactions, RBAC, audit trails, approval workflows. Demonstrates understanding of enterprise software engineering. Suitable for small to medium manufacturing facilities.

**Keywords:** Core functionality complete, appropriate scope, enterprise principles, SME-appropriate

---

## Technical Deep Dive

### Explain Transaction Boundaries

**Answer in 30 seconds:**
Multi-table operations wrapped in database transactions. Example: Goods receipt updates goods_receipts, goods_receipt_items, inventory_transactions, inventory_balances, purchase_orders - 17 operations total. All succeed together or all fail together (atomicity). Connection acquired, BEGIN TRANSACTION, execute operations, COMMIT. On error: ROLLBACK, throw error. Connection released in finally block. Ensures data consistency.

**Keywords:** Multi-table atomicity, BEGIN/COMMIT/ROLLBACK, error handling, consistency

---

### Explain Three-Layer RBAC

**Answer in 30 seconds:**
Layer 1 (UI): Hide unauthorized actions, improves UX, not security control. Layer 2 (API): Verify permissions before execution, primary security boundary, cannot be bypassed. Layer 3 (Service): Validate sensitive operations, defense in depth, business rule enforcement. API layer is authoritative. Multiple layers catch different error types. Permission checks are fast, cost is minimal, benefit is significant.

**Keywords:** Defense in depth, API is primary boundary, cannot bypass, minimal cost

---

### How Do You Ensure Data Accuracy?

**Answer in 30 seconds:**
Three validation layers: (1) TypeScript types - compile-time checking, (2) Service layer - runtime validation, business rules, cross-entity checks, (3) Database constraints - foreign keys, check constraints, unique constraints. Plus reconciliation procedures (inventory cycle counts, bank reconciliation, payroll verification). Audit trail for corrections. Transaction atomicity prevents partial updates.

**Keywords:** Multi-layer validation, reconciliation, audit trail, transaction atomicity

---

## Compliance & Standards

### How Does This Align with ISO 9001?

**Answer in 30 seconds:**
ISO 9001 requires traceability, document control, nonconforming product control, and monitoring. System provides: complete traceability (production order to finished goods), document control (audit trail with versions), NCR management (quality module), and real-time KPIs (dashboard). Audit logs support internal audits. Status lifecycles enforce process control. Not certified but aligned with requirements.

**Keywords:** Traceability, document control, NCR, process control, audit support

---

### How Does This Support SOX-Like Controls?

**Answer in 30 seconds:**
SOX requires segregation of duties, access controls, change management, and audit trails. System provides: enforced segregation (creator ≠ approver), RBAC (three-layer enforcement), immutability (approved transactions read-only), and comprehensive audit logs. Three-way match for payments. All financial transactions logged. Not SOX-certified but implements SOX-like controls.

**Keywords:** Segregation of duties, access controls, immutability, audit trail, three-way match

---

## Common Challenges

### Why Not Microservices?

**Answer in 30 seconds:**
Microservices appropriate for loosely coupled domains with independent scaling needs. ERP modules are tightly coupled - production depends on inventory, inventory depends on purchasing, purchasing depends on MRP. Distributed transactions complex and unreliable. Network latency overhead. Operational complexity (service discovery, monitoring, deployment). Team size doesn't justify microservices. Monolithic provides better transaction consistency for this use case.

**Keywords:** Tight coupling, distributed transactions, operational complexity, inappropriate for ERP

---

### Why Not NoSQL?

**Answer in 30 seconds:**
NoSQL (MongoDB) has eventual consistency - unacceptable for inventory accuracy. No foreign key enforcement - risk of orphaned records. Weak transaction support (historically). Relational data model is natural fit for ERP. Complex joins required for reporting. Schema is stable (not schema-less benefits). NoSQL advantages (horizontal scaling, schema flexibility) not needed for internal ERP.

**Keywords:** Eventual consistency, no foreign keys, relational fit, stable schema

---

### What About Offline Mode?

**Answer in 30 seconds:**
Intentionally not supported. Real-time data consistency required - inventory accuracy depends on immediate updates. Concurrent user coordination requires database access. Approval workflows need current state. Audit trail gaps during offline period. Conflict resolution complex. LAN environment provides reliable connectivity. High availability strategy (redundant network, database replication) addresses outages instead of offline mode.

**Keywords:** Real-time consistency required, LAN-based, high availability, intentional decision

---

## Key Metrics

### System Scale

- **Users:** 100-500 concurrent users (typical manufacturing facility)
- **Transactions:** Thousands per day
- **Database:** Single MySQL server sufficient
- **Deployment:** LAN-based, single facility
- **Response Time:** < 200ms for typical operations

### Coverage

- **Modules:** 12 modules (Production, MRP, Purchasing, Inventory, Quality, HR, Accounting, Maintenance, Mold, Dashboard, Notifications, Master Data)
- **Entities:** 50+ database tables
- **Workflows:** 10+ approval workflows
- **Roles:** 15+ user roles
- **Permissions:** 60+ granular permissions

### Quality

- **Audit Coverage:** 100% of mutating operations
- **Transaction Coverage:** All multi-table operations
- **RBAC Enforcement:** Three layers (UI, API, Service)
- **Validation:** Three layers (TypeScript, Service, Database)

---

## Final Key Points

### What to Emphasize

1. **Complete ERP Coverage** - End-to-end manufacturing lifecycle
2. **Data Integrity** - ACID transactions, multi-layer validation
3. **Security** - Three-layer RBAC, segregation of duties
4. **Accountability** - Immutable audit trail, non-repudiation
5. **Real-World Applicability** - Industry-standard processes, compliance-ready

### What NOT to Say

- "It's just a prototype" (it's production-ready architecture)
- "It's a toy project" (it's complete ERP system)
- "I would do it differently now" (defend your decisions)
- "I didn't have time for..." (scope was intentional)
- "Commercial ERP is better" (different scale, same principles)

### Confidence Points

- Architecture decisions are sound and justified
- Data integrity is guaranteed through ACID transactions
- Security is enforced at multiple layers
- Audit trail is complete and legally defensible
- System is realistic and applicable to real manufacturing

### If Stuck on a Question

1. **Clarify:** "Could you clarify what aspect you're asking about?"
2. **Acknowledge:** "That's a good question about [topic]..."
3. **Answer:** Provide concise answer using keywords above
4. **Offer Detail:** "I can elaborate on [specific aspect] if helpful."

---

## Quick Reference Keywords

**Architecture:** Monolithic, layered, ACID, transaction consistency, separation of concerns

**Database:** MySQL, InnoDB, relational model, OLTP, foreign keys, constraints

**Security:** RBAC, three-layer enforcement, JWT, segregation of duties, defense in depth

**Data Integrity:** ACID transactions, multi-layer validation, referential integrity, atomicity

**Accountability:** Audit trail, immutable logs, non-repudiation, traceability

**Compliance:** ISO 9001, SOX-like controls, audit support, traceability

**Fraud Prevention:** Segregation of duties, approval workflows, three-way match, audit analysis

**Real-World:** Industry-standard, compliance-ready, production-ready, appropriate scale

---

**Document Version:** 1.0  
**Last Updated:** December 26, 2025  
**Prepared For:** Thesis Defense Panel

**Remember:** Be confident, be concise, defend your decisions with technical rationale.
