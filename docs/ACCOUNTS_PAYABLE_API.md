# Accounts Payable (AP) Module - API Documentation

## Overview

The Accounts Payable Module manages supplier invoices, payment tracking, and aging reports. It integrates with the Purchasing module (POs) and Supplier master data to track outstanding payables, payment status, and due dates.

**Base URLs**: 
- `/api/accounting/ap/invoices` - AP Invoices
- `/api/accounting/ap/payments` - AP Payments

**Authentication**: All requests require `Authorization: Bearer <token>` header

---

## Status Lifecycles

### AP Invoice Lifecycle

```
PENDING → APPROVED → PARTIALLY_PAID → PAID
   ↓                       ↓
OVERDUE (auto-set when past due date)
```

**Invoice Status Definitions**:
- **pending**: Awaiting approval
- **approved**: Approved for payment
- **partially_paid**: Some payments made, balance remaining
- **paid**: Fully paid, no balance
- **overdue**: Past due date and not fully paid (auto-updated)

---

## AP Invoices API

### 1. Get Invoices (List)

**GET** `/api/accounting/ap/invoices`

Get paginated list of AP invoices.

**Required Permission**: `AP.VIEW_INVOICES`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `supplierId` (optional): Filter by supplier
- `status` (optional): Filter by status
- `fromDate` (optional): Filter by invoice date from (YYYY-MM-DD)
- `toDate` (optional): Filter by invoice date to (YYYY-MM-DD)
- `overdue` (optional): Filter overdue invoices (true/false)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "invoiceNumber": "INV-20241226-1430",
      "supplierInvoiceNumber": "SUP-2024-1234",
      "supplierId": 5,
      "poId": 25,
      "invoiceDate": "2024-12-20",
      "dueDate": "2025-01-20",
      "totalAmount": 150000.00,
      "paidAmount": 0.00,
      "balance": 150000.00,
      "status": "approved",
      "paymentTerms": "Net 30",
      "notes": null,
      "createdAt": "2024-12-20T14:30:00.000Z",
      "updatedAt": "2024-12-21T09:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### 2. Create Invoice

**POST** `/api/accounting/ap/invoices`

Create a new AP invoice.

**Required Permission**: `AP.CREATE_INVOICE`

**Request Body**:
```json
{
  "supplierId": 5,
  "poId": 25,
  "supplierInvoiceNumber": "SUP-2024-1234",
  "invoiceDate": "2024-12-20",
  "dueDate": "2025-01-20",
  "totalAmount": 150000.00,
  "paymentTerms": "Net 30",
  "notes": "Invoice for raw materials"
}
```

**Business Rules**:
- Supplier must be active
- If PO provided, must be approved/sent/received
- PO supplier must match invoice supplier
- Total amount must be > 0
- Due date must be >= invoice date

### 3. Get Invoice by ID

**GET** `/api/accounting/ap/invoices/:id`

**Required Permission**: `AP.VIEW_INVOICES`

### 4. Approve Invoice

**POST** `/api/accounting/ap/invoices/:id/approve`

Approve invoice for payment.

**Required Permission**: `AP.APPROVE_INVOICE`

**Business Rules**:
- Only pending invoices can be approved
- Changes status from `pending` to `approved`

### 5. Create Invoice from PO

**POST** `/api/accounting/ap/invoices/from-po`

Create invoice directly from an approved purchase order.

**Required Permission**: `AP.CREATE_INVOICE`

**Request Body**:
```json
{
  "poId": 25,
  "supplierInvoiceNumber": "SUP-2024-1234",
  "invoiceDate": "2024-12-20",
  "dueDate": "2025-01-20",
  "notes": "Invoice for PO-20241215-1200"
}
```

**Automatic Actions**:
- Copies supplier from PO
- Copies total amount from PO
- Copies payment terms from PO
- Validates PO is approved/sent/received

### 6. Get Overdue Invoices

**GET** `/api/accounting/ap/invoices/overdue`

Get all invoices past their due date.

**Required Permission**: `AP.VIEW_INVOICES`

**Automatic Actions**:
- Updates invoice status to `overdue` if past due date

### 7. Get Aging Report

**GET** `/api/accounting/ap/invoices/aging`

Get AP aging report with invoices grouped by age.

**Required Permission**: `AP.VIEW_REPORTS`

**Response**:
```json
{
  "success": true,
  "data": {
    "current": {
      "invoices": [],
      "count": 5,
      "total": 250000.00
    },
    "days30": {
      "invoices": [],
      "count": 3,
      "total": 120000.00
    },
    "days60": {
      "invoices": [],
      "count": 2,
      "total": 80000.00
    },
    "days90Plus": {
      "invoices": [],
      "count": 1,
      "total": 50000.00
    },
    "grandTotal": 500000.00
  }
}
```

**Aging Buckets**:
- **current**: Due date >= today
- **days30**: 1-30 days overdue
- **days60**: 31-60 days overdue
- **days90Plus**: 61+ days overdue

### 8. Get Invoices by Supplier

**GET** `/api/accounting/ap/invoices/supplier/:supplierId`

Get all invoices for a specific supplier.

**Required Permission**: `AP.VIEW_INVOICES`

### 9. Get Supplier Balance

**GET** `/api/accounting/ap/invoices/supplier/:supplierId/balance`

Get supplier balance summary.

**Required Permission**: `AP.VIEW_REPORTS`

**Response**:
```json
{
  "success": true,
  "data": {
    "supplierId": 5,
    "totalInvoices": 12,
    "totalInvoiced": 1500000.00,
    "totalPaid": 1200000.00,
    "totalOutstanding": 300000.00,
    "overdueInvoices": 2,
    "totalOverdue": 80000.00
  }
}
```

---

## AP Payments API

### 1. Get Payments (List)

**GET** `/api/accounting/ap/payments`

**Required Permission**: `AP.VIEW_PAYMENTS`

**Query Parameters**:
- `page`, `pageSize`: Pagination
- `invoiceId`: Filter by invoice
- `paymentMethod`: Filter by method (cash, check, bank_transfer, other)
- `fromDate`, `toDate`: Filter by payment date range

### 2. Create Payment

**POST** `/api/accounting/ap/payments`

Record a payment against an invoice.

**Required Permission**: `AP.CREATE_PAYMENT`

**Request Body**:
```json
{
  "invoiceId": 1,
  "paymentDate": "2024-12-26",
  "paymentAmount": 50000.00,
  "paymentMethod": "bank_transfer",
  "referenceNumber": "TXN-2024-5678",
  "notes": "Partial payment"
}
```

**Business Rules**:
- Invoice must be approved (not pending)
- Invoice must not be fully paid
- Payment amount must be > 0
- Payment amount cannot exceed invoice balance

**Automatic Actions**:
- Updates invoice `paidAmount`
- Updates invoice `balance`
- Updates invoice status:
  - `partially_paid` if balance > 0
  - `paid` if balance = 0

### 3. Get Payment by ID

**GET** `/api/accounting/ap/payments/:id`

**Required Permission**: `AP.VIEW_PAYMENTS`

### 4. Get Payments by Invoice

**GET** `/api/accounting/ap/payments/invoice/:invoiceId`

Get all payments for a specific invoice.

**Required Permission**: `AP.VIEW_PAYMENTS`

### 5. Get Invoice Payment History

**GET** `/api/accounting/ap/payments/invoice/:invoiceId/history`

Get comprehensive payment history for an invoice.

**Required Permission**: `AP.VIEW_PAYMENTS`

**Response**:
```json
{
  "success": true,
  "data": {
    "invoice": {
      "id": 1,
      "invoiceNumber": "INV-20241220-1430",
      "totalAmount": 150000.00,
      "paidAmount": 100000.00,
      "balance": 50000.00,
      "status": "partially_paid"
    },
    "payments": [
      {
        "id": 1,
        "paymentNumber": "PAY-20241226-0900",
        "paymentDate": "2024-12-26",
        "paymentAmount": 50000.00,
        "paymentMethod": "bank_transfer",
        "referenceNumber": "TXN-2024-5678"
      },
      {
        "id": 2,
        "paymentNumber": "PAY-20241227-1000",
        "paymentDate": "2024-12-27",
        "paymentAmount": 50000.00,
        "paymentMethod": "bank_transfer",
        "referenceNumber": "TXN-2024-5679"
      }
    ],
    "paymentCount": 2,
    "totalPaid": 100000.00,
    "remainingBalance": 50000.00
  }
}
```

### 6. Get Payment Summary

**GET** `/api/accounting/ap/payments/summary`

Get payment summary with breakdown by method.

**Required Permission**: `AP.VIEW_REPORTS`

**Query Parameters**:
- `fromDate`, `toDate`: Filter by payment date range

**Response**:
```json
{
  "success": true,
  "data": {
    "totalPayments": 25,
    "totalAmount": 2500000.00,
    "byMethod": {
      "cash": 100000.00,
      "check": 500000.00,
      "bank_transfer": 1800000.00,
      "other": 100000.00
    },
    "payments": []
  }
}
```

---

## Business Rules

1. **Invoice Management**:
   - Auto-generates unique invoice numbers (INV-YYYYMMDD-HHMM)
   - Can create from PO or manually
   - Must be approved before payment
   - Auto-updates to `overdue` when past due date

2. **Payment Processing**:
   - Auto-generates unique payment numbers (PAY-YYYYMMDD-HHMM)
   - Multiple payments allowed per invoice
   - Cannot exceed invoice balance
   - Auto-updates invoice status based on balance

3. **Aging & Reporting**:
   - Aging buckets: Current, 30, 60, 90+ days
   - Supplier balance tracking
   - Payment method breakdown

4. **Integration**:
   - Links to Purchase Orders
   - Links to Supplier master data
   - Validates supplier is active

---

## RBAC Permissions

- `AP.VIEW_INVOICES` - View invoices
- `AP.CREATE_INVOICE` - Create invoices
- `AP.APPROVE_INVOICE` - Approve invoices
- `AP.VIEW_PAYMENTS` - View payments
- `AP.CREATE_PAYMENT` - Create payments
- `AP.VIEW_REPORTS` - View aging and summary reports

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
