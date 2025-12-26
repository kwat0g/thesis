# Master Data Module - API Documentation

## Overview

The Master Data Module provides API endpoints for managing core reference data used throughout the ERP system. All endpoints require JWT authentication and appropriate RBAC permissions.

**Base URL**: `/api/master-data`

**Authentication**: All requests require `Authorization: Bearer <token>` header

---

## 1. Departments API

### GET /api/master-data/departments

Get paginated list of departments.

**Required Permission**: `MASTER.VIEW_DEPARTMENTS`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `isActive` (optional): Filter by active status (true/false)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "deptCode": "PROD",
      "deptName": "Production",
      "description": "Manufacturing and production operations",
      "managerId": 5,
      "isActive": true,
      "createdAt": "2024-12-26T10:00:00.000Z",
      "updatedAt": "2024-12-26T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### POST /api/master-data/departments

Create a new department.

**Required Permission**: `MASTER.MANAGE_DEPARTMENTS`

**Request Body**:
```json
{
  "deptCode": "PROD",
  "deptName": "Production",
  "description": "Manufacturing and production operations",
  "managerId": 5
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "deptCode": "PROD",
    "deptName": "Production",
    "description": "Manufacturing and production operations",
    "managerId": 5,
    "isActive": true,
    "createdAt": "2024-12-26T10:00:00.000Z",
    "updatedAt": "2024-12-26T10:00:00.000Z"
  },
  "message": "Department created successfully"
}
```

### GET /api/master-data/departments/:id

Get department by ID.

**Required Permission**: `MASTER.VIEW_DEPARTMENTS`

**Response**: Same as single department object

### PUT /api/master-data/departments/:id

Update department.

**Required Permission**: `MASTER.MANAGE_DEPARTMENTS`

**Request Body**:
```json
{
  "deptName": "Production Department",
  "description": "Updated description",
  "managerId": 6
}
```

### DELETE /api/master-data/departments/:id

Delete department.

**Required Permission**: `MASTER.MANAGE_DEPARTMENTS`

**Response**:
```json
{
  "success": true,
  "data": null,
  "message": "Department deleted successfully"
}
```

---

## 2. Employees API

### GET /api/master-data/employees

Get paginated list of employees.

**Required Permission**: `MASTER.VIEW_EMPLOYEES`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `isActive` (optional): Filter by active status (true/false)
- `departmentId` (optional): Filter by department
- `employmentStatus` (optional): Filter by employment status

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employeeCode": "EMP001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com",
      "phone": "+1234567890",
      "departmentId": 1,
      "position": "Production Supervisor",
      "hireDate": "2024-01-15",
      "employmentStatus": "active",
      "salary": 50000,
      "isActive": true,
      "createdAt": "2024-12-26T10:00:00.000Z",
      "updatedAt": "2024-12-26T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### POST /api/master-data/employees

Create a new employee.

**Required Permission**: `MASTER.MANAGE_EMPLOYEES`

**Request Body**:
```json
{
  "employeeCode": "EMP001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "phone": "+1234567890",
  "departmentId": 1,
  "position": "Production Supervisor",
  "hireDate": "2024-01-15",
  "employmentStatus": "active",
  "salary": 50000
}
```

### GET /api/master-data/employees/:id

Get employee by ID.

**Required Permission**: `MASTER.VIEW_EMPLOYEES`

### PUT /api/master-data/employees/:id

Update employee.

**Required Permission**: `MASTER.MANAGE_EMPLOYEES`

### DELETE /api/master-data/employees/:id

Delete employee.

**Required Permission**: `MASTER.MANAGE_EMPLOYEES`

---

## 3. Items API

### GET /api/master-data/items

Get paginated list of items.

**Required Permission**: `MASTER.VIEW_ITEMS`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `isActive` (optional): Filter by active status (true/false)
- `itemType` (optional): Filter by item type (raw_material, component, finished_good, consumable)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "itemCode": "RM-001",
      "itemName": "Plastic Resin Type A",
      "description": "High-grade plastic resin",
      "itemType": "raw_material",
      "uomId": 1,
      "reorderLevel": 1000,
      "reorderQuantity": 5000,
      "unitCost": 2.50,
      "isActive": true,
      "createdAt": "2024-12-26T10:00:00.000Z",
      "updatedAt": "2024-12-26T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 500,
    "totalPages": 25
  }
}
```

### POST /api/master-data/items

Create a new item.

**Required Permission**: `MASTER.MANAGE_ITEMS`

**Request Body**:
```json
{
  "itemCode": "RM-001",
  "itemName": "Plastic Resin Type A",
  "description": "High-grade plastic resin",
  "itemType": "raw_material",
  "uomId": 1,
  "reorderLevel": 1000,
  "reorderQuantity": 5000,
  "unitCost": 2.50
}
```

**Item Types**:
- `raw_material`: Raw materials for production
- `component`: Semi-finished components
- `finished_good`: Final products
- `consumable`: Consumable supplies

### GET /api/master-data/items/:id

Get item by ID.

**Required Permission**: `MASTER.VIEW_ITEMS`

### PUT /api/master-data/items/:id

Update item.

**Required Permission**: `MASTER.MANAGE_ITEMS`

### DELETE /api/master-data/items/:id

Delete item.

**Required Permission**: `MASTER.MANAGE_ITEMS`

---

## 4. Suppliers API

### GET /api/master-data/suppliers

Get paginated list of suppliers.

**Required Permission**: `MASTER.VIEW_SUPPLIERS`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `isActive` (optional): Filter by active status (true/false)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "supplierCode": "SUP001",
      "supplierName": "ABC Materials Inc.",
      "contactPerson": "Jane Smith",
      "email": "jane@abcmaterials.com",
      "phone": "+1234567890",
      "address": "123 Industrial Ave, City, State 12345",
      "paymentTerms": "Net 30",
      "isActive": true,
      "createdAt": "2024-12-26T10:00:00.000Z",
      "updatedAt": "2024-12-26T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### POST /api/master-data/suppliers

Create a new supplier.

**Required Permission**: `MASTER.MANAGE_SUPPLIERS`

**Request Body**:
```json
{
  "supplierCode": "SUP001",
  "supplierName": "ABC Materials Inc.",
  "contactPerson": "Jane Smith",
  "email": "jane@abcmaterials.com",
  "phone": "+1234567890",
  "address": "123 Industrial Ave, City, State 12345",
  "paymentTerms": "Net 30"
}
```

### GET /api/master-data/suppliers/:id

Get supplier by ID.

**Required Permission**: `MASTER.VIEW_SUPPLIERS`

### PUT /api/master-data/suppliers/:id

Update supplier.

**Required Permission**: `MASTER.MANAGE_SUPPLIERS`

### DELETE /api/master-data/suppliers/:id

Delete supplier.

**Required Permission**: `MASTER.MANAGE_SUPPLIERS`

---

## 5. Machines API

### GET /api/master-data/machines

Get paginated list of machines.

**Required Permission**: `MASTER.VIEW_MACHINES`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `isActive` (optional): Filter by active status (true/false)
- `status` (optional): Filter by status (available, in_use, maintenance, breakdown)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "machineCode": "MCH-001",
      "machineName": "Injection Molding Machine #1",
      "machineType": "Injection Molding",
      "departmentId": 1,
      "capacityPerHour": 500,
      "status": "available",
      "isActive": true,
      "createdAt": "2024-12-26T10:00:00.000Z",
      "updatedAt": "2024-12-26T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 30,
    "totalPages": 2
  }
}
```

### POST /api/master-data/machines

Create a new machine.

**Required Permission**: `MASTER.MANAGE_MACHINES`

**Request Body**:
```json
{
  "machineCode": "MCH-001",
  "machineName": "Injection Molding Machine #1",
  "machineType": "Injection Molding",
  "departmentId": 1,
  "capacityPerHour": 500,
  "status": "available"
}
```

**Machine Status**:
- `available`: Ready for use
- `in_use`: Currently in production
- `maintenance`: Under scheduled maintenance
- `breakdown`: Broken down, needs repair

### GET /api/master-data/machines/:id

Get machine by ID.

**Required Permission**: `MASTER.VIEW_MACHINES`

### PUT /api/master-data/machines/:id

Update machine.

**Required Permission**: `MASTER.MANAGE_MACHINES`

### DELETE /api/master-data/machines/:id

Delete machine.

**Required Permission**: `MASTER.MANAGE_MACHINES`

---

## 6. Molds API

### GET /api/master-data/molds

Get paginated list of molds.

**Required Permission**: `MASTER.VIEW_MOLDS`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `isActive` (optional): Filter by active status (true/false)
- `status` (optional): Filter by status (available, in_use, maintenance, repair)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "moldCode": "MLD-001",
      "moldName": "Product A Mold",
      "moldType": "4-Cavity",
      "cavityCount": 4,
      "status": "available",
      "totalShots": 150000,
      "maxShots": 1000000,
      "isActive": true,
      "createdAt": "2024-12-26T10:00:00.000Z",
      "updatedAt": "2024-12-26T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 20,
    "totalPages": 1
  }
}
```

### POST /api/master-data/molds

Create a new mold.

**Required Permission**: `MASTER.MANAGE_MOLDS`

**Request Body**:
```json
{
  "moldCode": "MLD-001",
  "moldName": "Product A Mold",
  "moldType": "4-Cavity",
  "cavityCount": 4,
  "status": "available",
  "totalShots": 0,
  "maxShots": 1000000
}
```

**Mold Status**:
- `available`: Ready for use
- `in_use`: Currently in production
- `maintenance`: Under scheduled maintenance
- `repair`: Under repair

### GET /api/master-data/molds/:id

Get mold by ID.

**Required Permission**: `MASTER.VIEW_MOLDS`

### PUT /api/master-data/molds/:id

Update mold.

**Required Permission**: `MASTER.MANAGE_MOLDS`

### DELETE /api/master-data/molds/:id

Delete mold.

**Required Permission**: `MASTER.MANAGE_MOLDS`

---

## 7. Units of Measure API

### GET /api/master-data/uom

Get paginated list of units of measure.

**Required Permission**: `MASTER.VIEW_ITEMS`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `isActive` (optional): Filter by active status (true/false)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "uomCode": "KG",
      "uomName": "Kilogram",
      "description": "Weight in kilograms",
      "isActive": true,
      "createdAt": "2024-12-26T10:00:00.000Z",
      "updatedAt": "2024-12-26T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

### POST /api/master-data/uom

Create a new unit of measure.

**Required Permission**: `MASTER.MANAGE_ITEMS`

**Request Body**:
```json
{
  "uomCode": "KG",
  "uomName": "Kilogram",
  "description": "Weight in kilograms"
}
```

### GET /api/master-data/uom/:id

Get unit of measure by ID.

**Required Permission**: `MASTER.VIEW_ITEMS`

### PUT /api/master-data/uom/:id

Update unit of measure.

**Required Permission**: `MASTER.MANAGE_ITEMS`

### DELETE /api/master-data/uom/:id

Delete unit of measure.

**Required Permission**: `MASTER.MANAGE_ITEMS`

---

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Permission denied: MASTER.VIEW_DEPARTMENTS"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Department not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "Department code 'PROD' already exists"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Audit Logging

All CREATE, UPDATE, and DELETE operations are automatically logged in the `audit_logs` table with:
- User ID
- Action type
- Module name
- Record type and ID
- Old and new values
- Timestamp
- IP address and user agent

---

## Testing Examples

### Using cURL

**Login**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Get Departments**:
```bash
curl -X GET "http://localhost:3000/api/master-data/departments?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Create Department**:
```bash
curl -X POST http://localhost:3000/api/master-data/departments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deptCode": "PROD",
    "deptName": "Production",
    "description": "Manufacturing operations"
  }'
```

**Update Department**:
```bash
curl -X PUT http://localhost:3000/api/master-data/departments/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deptName": "Production Department",
    "description": "Updated description"
  }'
```

**Delete Department**:
```bash
curl -X DELETE http://localhost:3000/api/master-data/departments/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Implementation Notes

1. **All endpoints enforce RBAC** - Users must have appropriate permissions
2. **All mutations are audited** - CREATE, UPDATE, DELETE operations logged
3. **Validation is enforced** - Required fields, unique constraints, data types
4. **Pagination is supported** - All list endpoints support pagination
5. **Filtering is available** - Common filters like isActive, status, type
6. **Soft delete recommended** - Use deactivation instead of hard delete where possible
7. **Foreign key integrity** - Database enforces referential integrity
8. **Timestamps are automatic** - created_at and updated_at managed by database

---

**End of Master Data API Documentation**
