# Panel Demo Script

## Purpose

This document provides a step-by-step script for demonstrating the Internal Manufacturing ERP System during thesis defense. The demo is designed to showcase key system capabilities within 10-15 minutes while highlighting architectural decisions and business value.

---

## Demo Overview

**Objective:** Demonstrate end-to-end manufacturing flow from production order to payment

**Duration:** 10-15 minutes

**Key Points to Highlight:**
- Approval workflows and segregation of duties
- Real-time inventory updates
- Transaction integrity
- Audit trail completeness
- Role-based access control

**Demo Flow:**
1. Login and Dashboard Overview (2 minutes)
2. Production Order Creation and Approval (2 minutes)
3. MRP Execution and Purchase Request (2 minutes)
4. Goods Receipt and Inventory Update (2 minutes)
5. Production Execution (2 minutes)
6. Quality Inspection (1 minute)
7. Accounts Payable Processing (2 minutes)
8. Audit Trail Review (2 minutes)

---

## Pre-Demo Preparation

### System State Setup

**Before the demo, ensure:**
- Database is in clean state with sample data
- Test users are created with appropriate roles
- Sample items, suppliers, and BOMs are configured
- No pending approvals or incomplete transactions
- Browser is logged out

**Test User Accounts:**
- Username: `planner` / Password: `demo123` / Role: Production Planner
- Username: `prod_manager` / Password: `demo123` / Role: Production Manager
- Username: `purchasing` / Password: `demo123` / Role: Purchasing Officer
- Username: `purch_manager` / Password: `demo123` / Role: Purchasing Manager
- Username: `warehouse` / Password: `demo123` / Role: Warehouse Staff
- Username: `accounting` / Password: `demo123` / Role: Accounting Staff

**Sample Data Required:**
- Item: "Plastic Bottle 500ml" (finished good)
- Item: "PET Resin" (raw material, in BOM)
- Supplier: "ABC Plastics Co."
- Machine: "Injection Molding Machine #1"
- Warehouse: "Main Warehouse"

### Browser Setup

- Open browser in incognito/private mode
- Clear cache and cookies
- Bookmark key pages for quick navigation
- Have two browser windows ready (for role switching)
- Ensure stable internet/LAN connection

### Backup Plan

- Have screenshots ready if system is slow
- Have video recording as fallback
- Print key screens if projector fails
- Have database backup ready for quick restore

---

## Demo Script

### Part 1: Login and Dashboard Overview (2 minutes)

**Action:**
1. Navigate to `http://localhost:3000`
2. Login as `planner` / `demo123`

**What to Say:**
> "This is the Internal Manufacturing ERP System designed for a manufacturing facility. I'm logging in as a Production Planner. The system uses JWT authentication with role-based access control."

**Action:**
3. Point to dashboard showing production metrics

**What to Say:**
> "The dashboard provides real-time KPIs: production orders by status, inventory levels, and quality metrics. Notice the pending approvals section - this demonstrates the approval workflow architecture."

**What to Show:**
- Production orders count by status
- Inventory shortage alerts
- Pending approvals (if any)
- Recent notifications

**What NOT to Do:**
- Do not click into every dashboard widget
- Do not explain every metric in detail
- Do not navigate away from dashboard yet

**Time Check:** 2 minutes elapsed

---

### Part 2: Production Order Creation and Approval (2 minutes)

**Action:**
1. Navigate to Production → Production Orders
2. Click "Create Production Order"

**What to Say:**
> "Let me demonstrate the production planning process. I'm creating a production order for 10,000 plastic bottles."

**Action:**
3. Fill in form:
   - Item: "Plastic Bottle 500ml"
   - Quantity: 10000
   - Priority: High
   - Planned Start Date: Tomorrow
   - Planned End Date: 3 days from now
4. Click "Save as Draft"

**What to Say:**
> "The order is created in draft status. Notice the validation - the system enforces positive quantities, valid dates, and active items. This is the first layer of data integrity."

**Action:**
5. Click "Submit for Approval"
6. Show confirmation message

**What to Say:**
> "Now I'm submitting for approval. The system enforces segregation of duties - I cannot approve my own production order. This prevents single-person fraud."

**Action:**
7. Logout
8. Login as `prod_manager` / `demo123`
9. Navigate to Production → Pending Approvals
10. Click on the submitted production order
11. Click "Approve"

**What to Say:**
> "As Production Manager, I can now approve this order. Notice the audit trail shows who created it and when. The approval is logged with my user ID and timestamp. This creates accountability and a legally defensible audit trail."

**What to Show:**
- Status change from draft → submitted → approved
- Audit log entries (if visible)
- Approver is different from creator

**What NOT to Do:**
- Do not try to approve as the same user (will fail)
- Do not explain every field in the form
- Do not create multiple production orders

**Time Check:** 4 minutes elapsed

---

### Part 3: MRP Execution and Purchase Request (2 minutes)

**Action:**
1. Navigate to MRP → Execute MRP
2. Click "Execute MRP Run"

**What to Say:**
> "The MRP module calculates material requirements. It reads the Bill of Materials, checks inventory balances, and identifies shortages. This is a complex calculation involving multiple tables."

**Action:**
3. Wait for MRP to complete (should be fast)
4. Show MRP results: "1 Purchase Request generated"
5. Navigate to Purchasing → Purchase Requests
6. Click on the generated PR

**What to Say:**
> "MRP identified a shortage of PET Resin and automatically generated a purchase request. Notice the PR references the production order that triggered it. This demonstrates cross-module integration."

**What to Show:**
- MRP calculation results
- Generated PR in draft status
- PR details showing item, quantity, required date
- Link to originating production order

**What NOT to Do:**
- Do not explain MRP algorithm in detail
- Do not manually create additional PRs
- Do not approve the PR yet (save for later if time)

**Time Check:** 6 minutes elapsed

---

### Part 4: Goods Receipt and Inventory Update (2 minutes)

**Action:**
1. Logout and login as `warehouse` / `demo123`
2. Navigate to Inventory → Goods Receipts
3. Click "Create Goods Receipt"

**What to Say:**
> "Now I'm demonstrating the goods receipt process. The warehouse staff receives materials from suppliers and records them in the system."

**Action:**
4. Fill in form:
   - Purchase Order: Select an existing approved PO
   - Receipt Date: Today
   - Items: Enter received quantities
5. Click "Create Receipt"

**What to Say:**
> "This is a critical transaction. When I click Create, the system atomically updates six tables: goods receipt, receipt items, inventory transactions, inventory balances, and purchase order status. This is wrapped in a database transaction - either all succeed or all fail. This guarantees data integrity."

**Action:**
6. Show success message
7. Navigate to Inventory → Inventory Balances
8. Show updated balance for received item

**What to Say:**
> "Notice the inventory balance updated immediately. This is real-time inventory management. The system maintains perpetual inventory with every transaction logged for audit purposes."

**What to Show:**
- Goods receipt created
- Inventory balance increased
- PO status updated (if visible)
- Transaction atomicity (mention, don't show code)

**What NOT to Do:**
- Do not show database tables or SQL
- Do not create multiple receipts
- Do not explain transaction code in detail

**Time Check:** 8 minutes elapsed

---

### Part 5: Production Execution (2 minutes)

**Action:**
1. Logout and login as `planner` / `demo123`
2. Navigate to Production → Work Orders
3. Click "Create Work Order" from approved production order

**What to Say:**
> "With materials available, production can begin. I'm creating a work order which is the shop floor execution document."

**Action:**
4. Fill in form:
   - Production Order: Select the approved order
   - Machine: "Injection Molding Machine #1"
   - Operator: Select an employee
   - Planned Quantity: 10000
5. Click "Create Work Order"
6. Click "Start Work Order"

**What to Say:**
> "The work order is now in progress. The operator will issue materials and record production output."

**Action:**
7. Click "Issue Materials"
8. Select materials and quantities
9. Click "Issue"

**What to Say:**
> "Material issue is another transactional operation. Inventory decreases, and the transaction is logged. The system validates that materials are available before allowing the issue."

**Action:**
10. Click "Record Output"
11. Enter:
    - Good Quantity: 9800
    - Scrap Quantity: 200
    - Rework Quantity: 0
12. Click "Record"

**What to Say:**
> "Production output is recorded. Notice I'm tracking good units and scrap separately. This enables yield analysis and quality metrics."

**What to Show:**
- Work order creation
- Material issue (inventory decrease)
- Production output (inventory increase)
- Status transitions

**What NOT to Do:**
- Do not complete the entire work order (time constraint)
- Do not show every validation rule
- Do not navigate to multiple work orders

**Time Check:** 10 minutes elapsed

---

### Part 6: Quality Inspection (1 minute)

**Action:**
1. Navigate to Quality → Inspections
2. Click "Create Inspection"
3. Select the goods receipt or work order
4. Enter inspection results: Pass
5. Click "Save"

**What to Say:**
> "Quality control is integrated throughout the process. Inspections are performed on incoming materials, in-process production, and finished goods. Failed inspections trigger non-conformance reports and prevent defective materials from being used."

**What to Show:**
- Inspection creation
- Pass/fail disposition
- Link to inspected entity (receipt or work order)

**What NOT to Do:**
- Do not create NCR (time constraint)
- Do not explain entire quality process
- Do not show multiple inspections

**Time Check:** 11 minutes elapsed

---

### Part 7: Accounts Payable Processing (2 minutes)

**Action:**
1. Logout and login as `accounting` / `demo123`
2. Navigate to Accounting → AP Invoices
3. Click "Create Invoice"

**What to Say:**
> "Now I'm demonstrating the financial settlement process. Accounting receives the supplier invoice and enters it in the system."

**Action:**
4. Fill in form:
   - Supplier: Select supplier
   - Purchase Order: Select the PO from earlier
   - Invoice Number: "INV-2025-001"
   - Invoice Date: Today
   - Due Date: 30 days from today
   - Amount: (auto-filled from PO)
5. Click "Create Invoice"

**What to Say:**
> "The system performs a three-way match: Purchase Order, Goods Receipt, and Invoice. This ensures we only pay for what we ordered and received. Any discrepancies are flagged for investigation."

**Action:**
6. Click "Submit for Approval"
7. Show invoice in submitted status

**What to Say:**
> "Again, segregation of duties. The person who enters the invoice cannot approve it. This prevents payment fraud."

**What to Show:**
- Invoice creation
- Three-way match validation
- Approval workflow
- Invoice status

**What NOT to Do:**
- Do not approve the invoice (would need to switch users)
- Do not process payment (time constraint)
- Do not explain payment processing in detail

**Time Check:** 13 minutes elapsed

---

### Part 8: Audit Trail Review (2 minutes)

**Action:**
1. Navigate to System → Audit Logs (if available in UI)
   OR mention audit logs are in database

**What to Say:**
> "Every action we performed is logged in the audit trail. Let me show you the audit log for the production order we created."

**Action:**
2. Filter audit logs by resource type: "production_order"
3. Show entries:
   - Created by: planner
   - Submitted by: planner
   - Approved by: prod_manager

**What to Say:**
> "Notice the audit trail shows WHO did WHAT and WHEN. The logs are immutable - they cannot be modified or deleted. This provides non-repudiation and legal defensibility. If there's a dispute or investigation, we have complete traceability."

**What to Show:**
- Audit log entries for production order
- User IDs, timestamps, actions
- Old/new values (if visible)
- Immutability (mention, don't demonstrate)

**Action:**
4. Return to dashboard

**What to Say:**
> "This completes the end-to-end flow from production planning through execution to financial settlement. The system demonstrates several key architectural principles:
> 
> 1. **Transaction Integrity:** Multi-table operations are atomic using database transactions
> 2. **Segregation of Duties:** Approval workflows prevent single-person fraud
> 3. **Audit Trail:** Complete traceability for accountability and compliance
> 4. **Role-Based Access Control:** Three-layer enforcement prevents unauthorized access
> 5. **Real-Time Data:** Inventory and status updates are immediate
> 
> The monolithic architecture with MySQL provides ACID guarantees that are essential for manufacturing ERP. The layered design separates concerns while maintaining data integrity."

**Time Check:** 15 minutes elapsed

---

## Fallback Plan

### If System is Slow or Unresponsive

**Option 1: Use Screenshots**
- Have screenshots of each step prepared
- Walk through screenshots instead of live demo
- Explain what would happen at each step

**Option 2: Use Video Recording**
- Have pre-recorded video of demo
- Play video and narrate
- Pause at key points to explain

**Option 3: Database Queries**
- Show database tables directly
- Run SQL queries to show data
- Explain how application uses the data

### If Demo Fails Completely

**Fallback Presentation:**
1. Show architecture diagram (if available)
2. Explain system flow verbally
3. Show code snippets for key features
4. Show documentation (this thesis)
5. Answer questions about design decisions

### If Specific Feature Fails

**Skip and Explain:**
- "Due to time constraints, let me explain this feature instead of demonstrating it."
- Describe what would happen
- Show relevant documentation
- Move to next demo step

---

## Common Panel Questions During Demo

### Q: "Can you show me the code for the transaction?"

**Answer:**
> "The transaction code is in the service layer. Let me explain the logic: We acquire a database connection, begin a transaction, execute multiple operations, and commit. If any operation fails, we rollback. This ensures atomicity."

**Action:** Offer to show code after demo if time permits.

---

### Q: "How do you prevent SQL injection?"

**Answer:**
> "We use parameterized queries throughout the system. All database access goes through the repository layer which uses prepared statements. User input is never concatenated into SQL strings."

**Action:** Mention this is standard practice, not shown in demo.

---

### Q: "What happens if two users try to issue the same inventory simultaneously?"

**Answer:**
> "The database uses row-level locking. The first transaction locks the inventory balance row with SELECT FOR UPDATE. The second transaction waits until the first commits. This prevents negative inventory and lost updates."

**Action:** Explain pessimistic locking strategy.

---

### Q: "Can you show me the audit log in the database?"

**Answer:**
> "Yes, the audit_logs table contains all actions. Each entry has user_id, action, resource_type, resource_id, old_value, new_value, and timestamp. The table has no UPDATE or DELETE operations - it's append-only."

**Action:** Offer to show database table if appropriate.

---

### Q: "How do you handle concurrent approvals?"

**Answer:**
> "Status transitions are validated at the service layer. If two managers try to approve the same request simultaneously, the first transaction succeeds and changes the status. The second transaction sees the updated status and rejects the approval attempt."

**Action:** Explain optimistic concurrency control.

---

## Post-Demo Discussion Points

### Key Achievements to Highlight

1. **Complete ERP Coverage:**
   - Production planning and execution
   - Material procurement
   - Inventory management
   - Quality control
   - Financial settlement
   - Human resources

2. **Architectural Soundness:**
   - Layered architecture for separation of concerns
   - Monolithic for transaction integrity
   - MySQL for ACID guarantees
   - JWT for stateless authentication
   - RBAC for access control

3. **Data Integrity:**
   - Database transactions for atomicity
   - Foreign key constraints for referential integrity
   - Service-level validation for business rules
   - Comprehensive audit logging

4. **Security:**
   - Three-layer RBAC enforcement
   - Segregation of duties in workflows
   - Immutable audit trail
   - Non-repudiation through logging

5. **Real-World Applicability:**
   - Based on actual manufacturing processes
   - Approval workflows match industry practice
   - Compliance-ready (ISO 9001, SOX-like controls)
   - Scalable for typical manufacturing facility

---

## Demo Timing Summary

| Section | Duration | Cumulative |
|---------|----------|------------|
| Login and Dashboard | 2 min | 2 min |
| Production Order Creation | 2 min | 4 min |
| MRP Execution | 2 min | 6 min |
| Goods Receipt | 2 min | 8 min |
| Production Execution | 2 min | 10 min |
| Quality Inspection | 1 min | 11 min |
| Accounts Payable | 2 min | 13 min |
| Audit Trail Review | 2 min | 15 min |
| **Total** | **15 min** | |

**Buffer:** 5 minutes for questions during demo

---

## Final Checklist

**Before Demo:**
- [ ] Database in clean state with sample data
- [ ] Test users created and verified
- [ ] Browser in incognito mode
- [ ] Bookmarks set for key pages
- [ ] Screenshots prepared as backup
- [ ] Video recording ready as fallback
- [ ] Projector and audio tested
- [ ] Network connection verified

**During Demo:**
- [ ] Speak clearly and at moderate pace
- [ ] Pause for panel to observe screens
- [ ] Highlight key architectural points
- [ ] Stay within 15-minute time limit
- [ ] Be prepared for interruptions/questions
- [ ] Maintain professional demeanor

**After Demo:**
- [ ] Offer to show additional features if time permits
- [ ] Offer to show code if requested
- [ ] Offer to show database schema if requested
- [ ] Be ready for technical deep-dive questions

---

**Document Version:** 1.0  
**Last Updated:** December 26, 2025  
**Prepared For:** Thesis Defense Panel
