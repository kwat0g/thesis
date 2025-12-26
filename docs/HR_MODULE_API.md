# HR Module - API Documentation

## Overview

The HR Module manages employee records, daily attendance tracking, and basic payroll processing. It includes biometric attendance import capability, attendance summaries, and a three-tier payroll approval workflow (HR prepares → Accounting reviews → President/VP/GM releases).

**Base URLs**: 
- `/api/hr/attendance` - Attendance Management
- `/api/hr/payroll/periods` - Payroll Periods
- `/api/hr/payroll/records` - Payroll Records

**Authentication**: All requests require `Authorization: Bearer <token>` header

---

## Status Lifecycles

### Payroll Period Lifecycle

```
OPEN → CALCULATED → APPROVED → RELEASED → CLOSED
         (HR)      (Accounting)  (Exec)
```

**Payroll Period Status Definitions**:
- **open**: Initial state, can add/edit records
- **calculated**: HR has calculated payroll for all employees
- **approved**: Accounting has reviewed and approved
- **released**: Executive (President/VP/GM) has released for payment
- **closed**: Final state, all payments marked as paid

**Approval Workflow**:
1. **HR** prepares and calculates payroll (`open` → `calculated`)
2. **Accounting** reviews and approves (`calculated` → `approved`)
3. **President/VP/GM** finalizes and releases (`approved` → `released`)
4. **System** closes period after payment (`released` → `closed`)

---

## Attendance API

### 1. Get Attendance Records (List)

**GET** `/api/hr/attendance`

Get paginated list of attendance records.

**Required Permission**: `HR.VIEW_ATTENDANCE`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `employeeId` (optional): Filter by employee
- `fromDate` (optional): Filter by date from (YYYY-MM-DD)
- `toDate` (optional): Filter by date to (YYYY-MM-DD)
- `status` (optional): Filter by status (present, absent, late, half_day, on_leave)
- `source` (optional): Filter by source (manual, biometric_import)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employeeId": 10,
      "attendanceDate": "2024-12-26",
      "shiftId": 1,
      "timeIn": "2024-12-26T08:00:00.000Z",
      "timeOut": "2024-12-26T17:00:00.000Z",
      "hoursWorked": 8.0,
      "overtimeHours": 1.0,
      "status": "present",
      "source": "manual",
      "notes": null,
      "createdAt": "2024-12-26T08:05:00.000Z",
      "updatedAt": "2024-12-26T17:05:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 2. Record Attendance

**POST** `/api/hr/attendance`

Record daily attendance for an employee.

**Required Permission**: `HR.RECORD_ATTENDANCE`

**Request Body**:
```json
{
  "employeeId": 10,
  "attendanceDate": "2024-12-26",
  "shiftId": 1,
  "timeIn": "2024-12-26T08:00:00.000Z",
  "timeOut": "2024-12-26T17:00:00.000Z",
  "status": "present",
  "source": "manual",
  "notes": "Regular attendance"
}
```

**Optional Fields**:
- `hoursWorked`: Auto-calculated if timeIn/timeOut provided
- `overtimeHours`: Auto-calculated if timeIn/timeOut provided

**Auto-Calculation**:
- Standard hours = min(total hours, 8)
- Overtime hours = max(0, total hours - 8)

**Business Rules**:
- Employee must be active
- No duplicate attendance for same employee and date
- Cannot record for inactive employees

### 3. Get Attendance by ID

**GET** `/api/hr/attendance/:id`

**Required Permission**: `HR.VIEW_ATTENDANCE`

### 4. Update Attendance

**PUT** `/api/hr/attendance/:id`

**Required Permission**: `HR.UPDATE_ATTENDANCE`

**Business Rules**:
- Cannot update biometric-imported records
- Hours auto-recalculated if timeIn/timeOut changed

### 5. Delete Attendance

**DELETE** `/api/hr/attendance/:id`

**Required Permission**: `HR.DELETE_ATTENDANCE`

**Business Rules**:
- Cannot delete biometric-imported records

### 6. Get Employee Attendance

**GET** `/api/hr/attendance/employee/:employeeId`

Get all attendance records for a specific employee.

**Required Permission**: `HR.VIEW_ATTENDANCE`

**Query Parameters**:
- `fromDate`, `toDate`: Date range filter
- `status`: Status filter

### 7. Get Attendance Summary

**GET** `/api/hr/attendance/employee/:employeeId/summary`

Get attendance summary for an employee.

**Required Permission**: `HR.VIEW_ATTENDANCE`

**Query Parameters** (Required):
- `fromDate`: Start date (YYYY-MM-DD)
- `toDate`: End date (YYYY-MM-DD)

**Response**:
```json
{
  "success": true,
  "data": {
    "totalDays": 22,
    "presentDays": 20,
    "absentDays": 1,
    "lateDays": 1,
    "totalHours": 160.0,
    "totalOvertimeHours": 12.0
  }
}
```

### 8. Import Biometric Attendance

**POST** `/api/hr/attendance/import`

Batch import attendance from biometric system.

**Required Permission**: `HR.IMPORT_ATTENDANCE`

**Request Body**:
```json
{
  "importedFrom": "Biometric System v2.0",
  "records": [
    {
      "employeeId": 10,
      "attendanceDate": "2024-12-26",
      "timeIn": "2024-12-26T08:05:00.000Z",
      "timeOut": "2024-12-26T17:10:00.000Z",
      "notes": "Auto-imported"
    },
    {
      "employeeId": 11,
      "attendanceDate": "2024-12-26",
      "timeIn": "2024-12-26T08:00:00.000Z",
      "timeOut": "2024-12-26T17:00:00.000Z"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "imported": 2,
    "skipped": 0,
    "errors": []
  },
  "message": "Biometric attendance imported successfully"
}
```

**Business Rules**:
- Skips existing records (no duplicates)
- Skips inactive employees
- Auto-calculates hours
- Sets source as `biometric_import`
- Imported records are read-only

---

## Payroll Periods API

### 1. Get Payroll Periods (List)

**GET** `/api/hr/payroll/periods`

**Required Permission**: `HR.VIEW_PAYROLL`

**Query Parameters**:
- `status`: Filter by status
- `fromDate`, `toDate`: Filter by period start date

### 2. Create Payroll Period

**POST** `/api/hr/payroll/periods`

**Required Permission**: `HR.CREATE_PAYROLL`

**Request Body**:
```json
{
  "periodStart": "2024-12-01",
  "periodEnd": "2024-12-31",
  "paymentDate": "2025-01-05"
}
```

**Auto-Generated**:
- `periodCode`: PAY-YYYYMM (e.g., PAY-202412)

**Business Rules**:
- Period end must be after start
- Payment date must be on or after period end
- No duplicate periods for same month

### 3. Get Period by ID

**GET** `/api/hr/payroll/periods/:id`

**Required Permission**: `HR.VIEW_PAYROLL`

### 4. Calculate Payroll

**POST** `/api/hr/payroll/periods/:id/calculate`

Calculate payroll for all active employees (HR prepares).

**Required Permission**: `HR.CALCULATE_PAYROLL`

**Business Rules**:
- Can only calculate `open` periods
- Creates/updates records for all active employees
- Calculates based on attendance data

**Calculation Logic**:
- Daily Rate = Basic Salary / 22 working days
- Hourly Rate = Daily Rate / 8 hours
- Gross Pay = Present Days × Daily Rate
- Overtime Pay = Overtime Hours × Hourly Rate × 1.25
- Net Pay = Gross Pay + Overtime Pay + Allowances - Deductions

**Response**:
```json
{
  "success": true,
  "data": {
    "period": {},
    "created": 50,
    "updated": 0
  },
  "message": "Payroll calculated successfully"
}
```

### 5. Approve Payroll

**POST** `/api/hr/payroll/periods/:id/approve`

Approve payroll (Accounting reviews).

**Required Permission**: `HR.APPROVE_PAYROLL`

**Business Rules**:
- Can only approve `calculated` periods
- Cannot approve payroll you prepared (self-approval prevention)
- Changes status to `approved`

### 6. Release Payroll

**POST** `/api/hr/payroll/periods/:id/release`

Release payroll for payment (President/VP/GM finalizes).

**Required Permission**: `HR.RELEASE_PAYROLL`

**Business Rules**:
- Can only release `approved` periods
- Cannot release payroll you prepared or approved
- Changes status to `released`
- Updates all records to `approved` status

### 7. Close Payroll

**POST** `/api/hr/payroll/periods/:id/close`

Close payroll period after payment.

**Required Permission**: `HR.CLOSE_PAYROLL`

**Business Rules**:
- Can only close `released` periods
- Changes status to `closed`
- Updates all records to `paid` status

### 8. Get Period Records

**GET** `/api/hr/payroll/periods/:id/records`

Get all payroll records for a period.

**Required Permission**: `HR.VIEW_PAYROLL`

### 9. Get Period Summary

**GET** `/api/hr/payroll/periods/:id/summary`

Get payroll summary for a period.

**Required Permission**: `HR.VIEW_PAYROLL`

**Response**:
```json
{
  "success": true,
  "data": {
    "totalEmployees": 50,
    "totalAmount": 2500000.00,
    "totalBasic": 2000000.00,
    "totalOvertime": 300000.00,
    "totalAllowances": 250000.00,
    "totalDeductions": 50000.00
  }
}
```

---

## Payroll Records API

### 1. Get Payroll Record by ID

**GET** `/api/hr/payroll/records/:id`

**Required Permission**: `HR.VIEW_PAYROLL`

### 2. Update Payroll Record

**PUT** `/api/hr/payroll/records/:id`

Update individual payroll record.

**Required Permission**: `HR.UPDATE_PAYROLL`

**Request Body**:
```json
{
  "basicSalary": 50000.00,
  "overtimePay": 5000.00,
  "allowances": 3000.00,
  "deductions": 500.00,
  "notes": "Adjusted for bonus"
}
```

**Business Rules**:
- Can only update records in `open` or `calculated` periods
- Cannot update in `approved`, `released`, or `closed` periods
- Net pay auto-calculated
- Period total auto-updated

---

## Business Rules Summary

**Attendance**:
- One record per employee per date
- Auto-calculates hours from time-in/time-out
- Biometric imports are read-only
- Only active employees

**Payroll**:
- Three-tier approval workflow
- Self-approval prevention at each level
- Segregation of duties (preparer ≠ approver ≠ releaser)
- Auto-calculation based on attendance
- Cannot modify after approval

---

## RBAC Permissions

**Attendance**:
- `HR.VIEW_ATTENDANCE`
- `HR.RECORD_ATTENDANCE`
- `HR.UPDATE_ATTENDANCE`
- `HR.DELETE_ATTENDANCE`
- `HR.IMPORT_ATTENDANCE`

**Payroll**:
- `HR.VIEW_PAYROLL`
- `HR.CREATE_PAYROLL`
- `HR.CALCULATE_PAYROLL` (HR role)
- `HR.APPROVE_PAYROLL` (Accounting role)
- `HR.RELEASE_PAYROLL` (Executive role)
- `HR.UPDATE_PAYROLL`
- `HR.CLOSE_PAYROLL`

---

## Error Responses

Standard error format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP Status Codes:
- `400`: Bad Request (validation error, business rule violation)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error
