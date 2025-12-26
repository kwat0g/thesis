# Failure & Recovery Strategy

## Purpose

This document defines how the manufacturing ERP system behaves under various failure scenarios and the recovery mechanisms in place to ensure data consistency, business continuity, and operational resilience.

---

## Failure Categories

### 1. Infrastructure Failures
- Power failure
- Network loss (LAN drop)
- Server hardware failure
- Database server crash

### 2. Application Failures
- Application server crash
- Memory exhaustion
- Unhandled exceptions
- Deadlock scenarios

### 3. Data Failures
- Transaction rollback
- Concurrent update conflicts
- Data corruption
- Constraint violations

---

## 1. Power Failure During Transaction

### Scenario

**Event Sequence:**
1. User initiates goods receipt transaction
2. Application begins multi-table update
3. Power failure occurs mid-transaction
4. Server shuts down abruptly

**Affected Operations:**
- Partially written database records
- Uncommitted transactions
- In-flight API requests
- User session state

### Recovery Mechanism

#### MySQL Transaction Guarantees

**Automatic Rollback:**
```
Transaction State: IN PROGRESS
Power Loss: IMMEDIATE
MySQL Action: AUTOMATIC ROLLBACK on restart
Result: NO PARTIAL DATA
```

**How It Works:**

1. **Write-Ahead Logging (WAL):**
   - MySQL writes to transaction log before data files
   - Transaction log survives power failure
   - Committed transactions in log are durable
   - Uncommitted transactions in log are rolled back

2. **Crash Recovery Process:**
   ```
   Server Restart
     ↓
   MySQL Starts
     ↓
   Read Transaction Log
     ↓
   Replay Committed Transactions
     ↓
   Rollback Uncommitted Transactions
     ↓
   Database Consistent
   ```

3. **InnoDB Storage Engine:**
   - ACID-compliant storage engine
   - Automatic crash recovery
   - Doublewrite buffer prevents partial page writes
   - Redo log ensures durability

**Application Behavior:**

```typescript
// Transaction in progress
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  await connection.query('INSERT INTO goods_receipts ...');
  await connection.query('INSERT INTO inventory_transactions ...');
  // POWER FAILURE HERE
  await connection.commit(); // Never reached
} catch (error) {
  await connection.rollback(); // Never reached
} finally {
  connection.release(); // Never reached
}
```

**Result:**
- Transaction never committed → Automatic rollback
- No partial data in database
- User must retry transaction after power restored

**User Experience:**
1. Power restored
2. User logs in again
3. User sees transaction not completed
4. User retries transaction
5. Transaction succeeds

**Data Integrity:** ✅ GUARANTEED
- No partial goods receipts
- No orphaned inventory transactions
- No inconsistent inventory balances

---

### Recovery Procedure

**Step 1: Verify Database Consistency**
```bash
# After server restart
mysql> CHECK TABLE goods_receipts;
mysql> CHECK TABLE inventory_transactions;
mysql> CHECK TABLE inventory_balances;
```

**Step 2: Verify Transaction Log**
```bash
# Check for uncommitted transactions
mysql> SHOW ENGINE INNODB STATUS;
# Look for "TRANSACTIONS" section
```

**Step 3: Resume Operations**
- No manual intervention required
- Users retry failed transactions
- System operates normally

**Recovery Time:** Immediate (automatic)

---

## 2. Network Loss (LAN Drop)

### Scenario

**Event Sequence:**
1. User working on ERP system
2. LAN connection drops
3. API requests fail
4. User cannot complete operations

**Affected Operations:**
- In-flight API requests
- Pending transactions
- Real-time data updates

### System Behavior

#### Client-Side Handling

**API Request Failure:**
```typescript
async function apiCall(endpoint: string, options: RequestInit) {
  try {
    const response = await fetch(endpoint, options);
    return response.json();
  } catch (error) {
    // Network error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network connection lost. Please check your connection.');
    }
    throw error;
  }
}
```

**User Experience:**
1. API call fails
2. Error message displayed: "Network connection lost"
3. User cannot proceed
4. User waits for network restoration
5. User retries operation

**No Offline Mode:**
- System requires LAN connectivity
- No local data caching
- No offline transaction queue
- All operations require database connection

**Why No Offline Mode:**
- Real-time inventory accuracy required
- Approval workflows require immediate validation
- Concurrent user coordination necessary
- Data consistency paramount

#### Server-Side Handling

**Connection Pool Behavior:**
```typescript
// Connection timeout
const pool = mysql.createPool({
  host: 'localhost',
  user: 'erp_user',
  password: 'password',
  database: 'manufacturing_erp',
  connectionLimit: 10,
  connectTimeout: 10000,  // 10 seconds
  acquireTimeout: 10000,  // 10 seconds
});
```

**Timeout Scenarios:**
1. **Connection Acquisition Timeout:**
   - Cannot get connection from pool
   - Error returned to client
   - User retries

2. **Query Timeout:**
   - Long-running query
   - Connection timeout
   - Transaction rolled back automatically

**Recovery:** Automatic when network restored

---

### Recovery Procedure

**Step 1: Network Restoration**
- IT team restores LAN connectivity
- No application restart required
- Connection pool automatically reconnects

**Step 2: User Notification**
- Users informed network is restored
- Users retry failed operations
- No data loss

**Step 3: Verify Operations**
- Check audit logs for failed operations
- Verify no partial transactions
- Resume normal operations

**Recovery Time:** Immediate upon network restoration

---

## 3. Partial Transaction Rollback

### Scenario

**Event Sequence:**
1. User initiates complex transaction (e.g., goods receipt)
2. First 3 operations succeed
3. 4th operation fails (e.g., constraint violation)
4. Transaction must be rolled back

**Example:**
```typescript
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  
  // Step 1: Create goods receipt (SUCCESS)
  await connection.query('INSERT INTO goods_receipts ...');
  
  // Step 2: Create receipt items (SUCCESS)
  await connection.query('INSERT INTO goods_receipt_items ...');
  
  // Step 3: Create inventory transactions (SUCCESS)
  await connection.query('INSERT INTO inventory_transactions ...');
  
  // Step 4: Update inventory balance (FAILURE - negative balance)
  await connection.query('UPDATE inventory_balances SET quantity = quantity - 1000 WHERE id = 1');
  // ERROR: Check constraint violation (quantity cannot be negative)
  
  await connection.commit(); // Never reached
} catch (error) {
  await connection.rollback(); // EXECUTED
  throw error;
}
```

### Recovery Mechanism

**Automatic Rollback:**
1. Error detected in transaction
2. `catch` block executes
3. `connection.rollback()` called
4. MySQL undoes all operations in transaction
5. Database returns to state before transaction began

**Result:**
- No goods receipt record
- No receipt items
- No inventory transactions
- No inventory balance changes
- Database consistent

**User Experience:**
1. Error message displayed: "Insufficient inventory balance"
2. User corrects issue (e.g., adjusts quantity)
3. User retries transaction
4. Transaction succeeds

**Data Integrity:** ✅ GUARANTEED
- All-or-nothing semantics
- No partial state
- Database constraints enforced

---

### Error Handling Strategy

**Service-Level Error Handling:**
```typescript
async function receiveGoods(data: GoodsReceiptData) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Validate before transaction
    await validateGoodsReceipt(data);
    
    // Execute transaction
    const receiptId = await createGoodsReceipt(connection, data);
    await createReceiptItems(connection, receiptId, data.items);
    await updateInventory(connection, data.items);
    await updatePurchaseOrder(connection, data.poId);
    
    await connection.commit();
    
    // Log success
    await logAudit({
      action: 'GOODS_RECEIPT_CREATED',
      resourceId: receiptId,
      success: true
    });
    
    return receiptId;
  } catch (error) {
    await connection.rollback();
    
    // Log failure
    await logAudit({
      action: 'GOODS_RECEIPT_FAILED',
      error: error.message,
      success: false
    });
    
    throw error;
  } finally {
    connection.release();
  }
}
```

**Error Categories:**

1. **Validation Errors:**
   - Caught before transaction begins
   - No rollback needed
   - User corrects and retries

2. **Constraint Violations:**
   - Caught during transaction
   - Automatic rollback
   - User corrects and retries

3. **System Errors:**
   - Database unavailable
   - Connection timeout
   - Automatic rollback
   - User retries later

---

## 4. Concurrent Update Conflicts

### Scenario

**Event Sequence:**
1. User A reads inventory balance: 100 units
2. User B reads same inventory balance: 100 units
3. User A issues 50 units → Balance: 50 units
4. User B issues 60 units → Balance: -10 units (INVALID)

**Problem:** Lost update, negative balance

### Prevention Mechanisms

#### Pessimistic Locking

**Row-Level Locking:**
```sql
-- User A's transaction
BEGIN;
SELECT quantity FROM inventory_balances WHERE id = 1 FOR UPDATE;
-- Row locked, User B must wait
UPDATE inventory_balances SET quantity = quantity - 50 WHERE id = 1;
COMMIT;
-- Row unlocked

-- User B's transaction (waits for User A)
BEGIN;
SELECT quantity FROM inventory_balances WHERE id = 1 FOR UPDATE;
-- Gets updated value: 50
UPDATE inventory_balances SET quantity = quantity - 60 WHERE id = 1;
-- ERROR: Check constraint violation (quantity < 0)
ROLLBACK;
```

**Implementation:**
```typescript
async function issueGoods(connection, itemId, quantity) {
  // Lock row for update
  const [balance] = await connection.query(
    'SELECT quantity FROM inventory_balances WHERE item_id = ? FOR UPDATE',
    [itemId]
  );
  
  if (balance.quantity < quantity) {
    throw new Error('Insufficient inventory');
  }
  
  await connection.query(
    'UPDATE inventory_balances SET quantity = quantity - ? WHERE item_id = ?',
    [quantity, itemId]
  );
}
```

**Result:**
- User A's transaction succeeds
- User B's transaction fails with clear error
- User B retries with correct available quantity
- No lost updates

#### Optimistic Locking (Alternative)

**Version-Based Locking:**
```sql
-- Add version column
ALTER TABLE inventory_balances ADD COLUMN version INT DEFAULT 0;

-- User A's transaction
BEGIN;
SELECT quantity, version FROM inventory_balances WHERE id = 1;
-- quantity: 100, version: 5

UPDATE inventory_balances 
SET quantity = 50, version = version + 1 
WHERE id = 1 AND version = 5;
-- 1 row affected
COMMIT;

-- User B's transaction
BEGIN;
SELECT quantity, version FROM inventory_balances WHERE id = 1;
-- quantity: 100, version: 5 (stale read)

UPDATE inventory_balances 
SET quantity = 40, version = version + 1 
WHERE id = 1 AND version = 5;
-- 0 rows affected (version changed to 6)
-- ERROR: Optimistic lock failure
ROLLBACK;
```

**When to Use:**
- Pessimistic: High contention, short transactions
- Optimistic: Low contention, long-running operations

**Current System:** Pessimistic locking (FOR UPDATE)

---

### Deadlock Scenarios

**Scenario:**
```
User A:
  BEGIN;
  UPDATE inventory_balances WHERE id = 1; -- Lock row 1
  UPDATE inventory_balances WHERE id = 2; -- Wait for row 2

User B:
  BEGIN;
  UPDATE inventory_balances WHERE id = 2; -- Lock row 2
  UPDATE inventory_balances WHERE id = 1; -- Wait for row 1

Result: DEADLOCK
```

**MySQL Deadlock Detection:**
- Automatic detection
- One transaction chosen as victim
- Victim transaction rolled back
- Other transaction proceeds

**Application Handling:**
```typescript
async function executeTransaction(operation) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      if (error.code === 'ER_LOCK_DEADLOCK') {
        attempt++;
        if (attempt < maxRetries) {
          // Wait and retry
          await sleep(100 * attempt); // Exponential backoff
          continue;
        }
      }
      throw error;
    }
  }
}
```

**Deadlock Prevention:**
1. **Consistent Lock Order:**
   - Always lock tables in same order
   - Always lock rows in same order (by ID)

2. **Short Transactions:**
   - Minimize lock holding time
   - Validate before transaction

3. **Retry Logic:**
   - Automatic retry on deadlock
   - Exponential backoff

---

## 5. Database Crash Recovery

### Scenario

**Event Sequence:**
1. Database server crashes (hardware failure, OOM, etc.)
2. MySQL process terminates
3. Uncommitted transactions lost
4. Database files may be inconsistent

### Recovery Process

#### Automatic Crash Recovery

**MySQL Startup Sequence:**
```
1. MySQL starts
2. InnoDB recovery begins
3. Read redo log (ib_logfile)
4. Replay committed transactions
5. Rollback uncommitted transactions
6. Rebuild indexes if needed
7. Database ready
```

**Recovery Steps:**

**Phase 1: Redo Log Analysis**
- Scan redo log for committed transactions
- Identify transactions to replay
- Identify transactions to rollback

**Phase 2: Redo Application**
- Replay committed transactions
- Apply changes to data files
- Ensure durability

**Phase 3: Undo Application**
- Rollback uncommitted transactions
- Remove partial changes
- Ensure consistency

**Phase 4: Verification**
- Check table integrity
- Rebuild indexes if needed
- Verify foreign keys

**Recovery Time:** Depends on transaction log size
- Small log: Seconds
- Large log: Minutes
- Typical: < 5 minutes

---

### Data Consistency Verification

**Post-Recovery Checks:**

```sql
-- Check table integrity
CHECK TABLE goods_receipts;
CHECK TABLE inventory_transactions;
CHECK TABLE inventory_balances;

-- Check InnoDB status
SHOW ENGINE INNODB STATUS;

-- Verify foreign key consistency
SELECT * FROM information_schema.INNODB_SYS_FOREIGN;

-- Check for orphaned records
SELECT gr.id FROM goods_receipts gr
LEFT JOIN purchase_orders po ON gr.po_id = po.id
WHERE po.id IS NULL;
```

**If Inconsistencies Found:**
1. Restore from backup
2. Replay transaction log
3. Verify consistency again

---

## 6. Backup & Restore Strategy

### Backup Types

#### 1. Full Backup (Daily)

**Schedule:** Daily at 2:00 AM
**Method:** mysqldump with --single-transaction
**Retention:** 30 days

**Backup Command:**
```bash
mysqldump \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --all-databases \
  --result-file=/backup/full_backup_$(date +%Y%m%d).sql
```

**Advantages:**
- Consistent snapshot
- No table locking (InnoDB)
- Complete database state

**Disadvantages:**
- Large file size
- Long backup time
- Point-in-time limited to backup time

#### 2. Binary Log Backup (Continuous)

**Method:** Binary log archiving
**Retention:** 7 days

**Configuration:**
```ini
[mysqld]
log-bin=/var/log/mysql/mysql-bin.log
expire_logs_days=7
max_binlog_size=100M
```

**Advantages:**
- Point-in-time recovery
- Minimal performance impact
- Continuous backup

**Disadvantages:**
- Requires full backup as base
- Log files accumulate

#### 3. Incremental Backup (Optional)

**Method:** Binary log segments
**Schedule:** Hourly
**Retention:** 24 hours

**Advantages:**
- Faster than full backup
- Smaller file size
- More frequent recovery points

---

### Restore Procedures

#### Scenario 1: Complete Database Loss

**Recovery Steps:**

1. **Restore Full Backup:**
```bash
mysql < /backup/full_backup_20251226.sql
```

2. **Apply Binary Logs:**
```bash
mysqlbinlog /var/log/mysql/mysql-bin.000001 | mysql
mysqlbinlog /var/log/mysql/mysql-bin.000002 | mysql
# Continue for all logs after backup
```

3. **Verify Consistency:**
```sql
CHECK TABLE goods_receipts;
CHECK TABLE inventory_balances;
-- Check all critical tables
```

4. **Resume Operations:**
- Notify users
- Verify recent transactions
- Monitor for issues

**Recovery Time Objective (RTO):** 2 hours
**Recovery Point Objective (RPO):** 24 hours (or less with binlog)

---

#### Scenario 2: Point-in-Time Recovery

**Use Case:** Accidental data deletion at 10:30 AM

**Recovery Steps:**

1. **Identify Recovery Point:**
```sql
-- Find last good transaction before deletion
SELECT * FROM audit_logs 
WHERE created_at < '2025-12-26 10:30:00'
ORDER BY created_at DESC LIMIT 10;
```

2. **Restore to Point-in-Time:**
```bash
# Restore full backup
mysql < /backup/full_backup_20251226.sql

# Apply binlogs up to 10:29:59
mysqlbinlog \
  --stop-datetime="2025-12-26 10:29:59" \
  /var/log/mysql/mysql-bin.* | mysql
```

3. **Verify Recovery:**
```sql
-- Check data is present
SELECT * FROM production_orders WHERE id = 12345;

-- Check deletion is not present
SELECT * FROM audit_logs 
WHERE action = 'DELETE' AND created_at >= '2025-12-26 10:30:00';
```

4. **Communicate Impact:**
- Transactions after 10:30 AM lost
- Users must re-enter data
- Document incident

---

### Backup Verification

**Monthly Backup Test:**

1. **Restore to Test Environment:**
```bash
mysql -h test-server < /backup/full_backup_latest.sql
```

2. **Verify Data Integrity:**
```sql
-- Row counts
SELECT COUNT(*) FROM production_orders;
SELECT COUNT(*) FROM inventory_balances;

-- Data consistency
SELECT * FROM inventory_balances WHERE quantity < 0;
SELECT * FROM purchase_orders WHERE status NOT IN ('draft', 'approved', ...);
```

3. **Test Application:**
- Login to test environment
- Perform sample transactions
- Verify functionality

4. **Document Results:**
- Backup size
- Restore time
- Any issues found

---

## 7. Data Consistency Guarantees (ACID)

### Atomicity Guarantee

**Definition:** All operations in transaction succeed or all fail

**Enforcement:**
- MySQL transaction mechanism
- Application-level transaction management
- Automatic rollback on error

**Verification:**
```sql
-- No orphaned records
SELECT gr.id FROM goods_receipts gr
LEFT JOIN goods_receipt_items gri ON gr.id = gri.receipt_id
WHERE gri.id IS NULL;
-- Should return 0 rows
```

---

### Consistency Guarantee

**Definition:** Database moves from one valid state to another

**Enforcement:**
- Foreign key constraints
- Check constraints
- Application-level validation
- Transaction ensures all constraints satisfied

**Verification:**
```sql
-- All foreign keys valid
SELECT * FROM goods_receipt_items gri
LEFT JOIN goods_receipts gr ON gri.receipt_id = gr.id
WHERE gr.id IS NULL;
-- Should return 0 rows

-- All check constraints satisfied
SELECT * FROM inventory_balances WHERE quantity < 0;
-- Should return 0 rows
```

---

### Isolation Guarantee

**Definition:** Concurrent transactions don't interfere

**Enforcement:**
- MySQL isolation level: READ COMMITTED
- Row-level locking
- MVCC (Multi-Version Concurrency Control)

**Verification:**
```sql
-- Check lock waits
SHOW ENGINE INNODB STATUS;
-- Look for "TRANSACTIONS" section
-- Monitor lock wait time
```

---

### Durability Guarantee

**Definition:** Committed transactions survive system failures

**Enforcement:**
- Write-ahead logging
- Transaction log (binlog)
- InnoDB doublewrite buffer
- Flush to disk on commit

**Verification:**
```sql
-- After crash recovery
SELECT COUNT(*) FROM audit_logs 
WHERE created_at > (SELECT MAX(created_at) FROM backup_log);
-- All transactions after last backup should be present
```

---

## Failure Recovery Checklist

### Immediate Response (< 5 minutes)

- [ ] Identify failure type
- [ ] Check system status
- [ ] Verify database is running
- [ ] Check application logs
- [ ] Notify users if needed

### Short-Term Recovery (< 1 hour)

- [ ] Restart failed services
- [ ] Verify database consistency
- [ ] Check recent transactions
- [ ] Test critical operations
- [ ] Monitor for recurring issues

### Long-Term Recovery (< 24 hours)

- [ ] Restore from backup if needed
- [ ] Apply transaction logs
- [ ] Verify all data present
- [ ] Document incident
- [ ] Implement preventive measures

---

**Last Updated:** December 26, 2025
**Maintained By:** ERP Operations Team
