# Limitations and Future Work

## Purpose

This document clearly delineates the intentional scope limitations of the Internal Manufacturing ERP System and identifies potential future enhancements. It is critical to distinguish between intentional design decisions and areas for future development.

---

## Part A: Intentional Limitations

These are deliberate scope boundaries based on system requirements and target use case. They are NOT deficiencies but conscious design decisions.

### 1. No Customer Portal

**Limitation:**
The system does not provide a customer-facing portal for order placement, order tracking, or invoice viewing.

**Rationale:**
- System designed for internal manufacturing operations only
- Customer interactions handled through separate sales/CRM system
- Manufacturing ERP focuses on production execution, not customer engagement
- Customer portal would require different security model (external users)
- Customer portal would require different architecture (public internet exposure)

**Business Context:**
Manufacturing companies typically use dedicated CRM or e-commerce platforms for customer interactions. The manufacturing ERP focuses on internal operations: production planning, material procurement, inventory management, and financial settlement.

**Not a Deficiency Because:**
- Customer portal is a separate system domain
- Different security requirements (external vs internal users)
- Different scalability requirements (potentially millions of customers vs hundreds of employees)
- Different technology stack may be appropriate (e.g., separate web application)

---

### 2. No Supplier Portal

**Limitation:**
The system does not provide a supplier-facing portal for purchase order viewing, delivery confirmation, or invoice submission.

**Rationale:**
- Supplier interactions handled through traditional channels (email, phone, EDI)
- Supplier portal would require external user authentication
- Supplier portal would require different security model
- Purchase orders sent to suppliers via email or printed documents
- Invoices received via email or paper and entered by accounting staff

**Business Context:**
Many manufacturing companies, especially small to medium enterprises, do not provide supplier portals. Purchase orders are sent via email, deliveries are confirmed physically, and invoices are received via email or mail.

**Not a Deficiency Because:**
- Supplier portal is a separate system domain
- Traditional procurement processes are still common in manufacturing
- EDI integration (if needed) can be added as separate module
- Current process is sufficient for typical manufacturing facility

---

### 3. No Cost Accounting Module

**Limitation:**
The system does not calculate product costs, standard costs, variance analysis, or profitability by product.

**Rationale:**
- Cost accounting is complex and company-specific
- Different costing methods (standard, actual, activity-based)
- Requires extensive configuration and setup
- Focus on operational ERP, not financial ERP
- Cost data can be calculated externally using system data

**What the System Provides:**
- Material costs captured in purchase orders
- Labor hours captured in work orders and payroll
- Overhead data available (machine hours, utilities)
- All raw data available for external cost calculation

**Not a Deficiency Because:**
- Cost accounting often handled in separate financial system
- Manufacturing ERP provides operational data
- Financial ERP or spreadsheets calculate costs
- Separation of operational and financial systems is common

---

### 4. No Government Tax Computation

**Limitation:**
The system does not calculate VAT, sales tax, withholding tax, or other government-mandated taxes.

**Rationale:**
- Tax rules are country-specific and frequently changing
- Tax calculation requires specialized knowledge
- Tax compliance often handled by dedicated accounting software
- Payroll taxes calculated externally or by payroll service provider
- Focus on operational transactions, not tax compliance

**What the System Provides:**
- Gross amounts for all transactions
- Data export for tax calculation
- Integration points for tax software

**Not a Deficiency Because:**
- Tax calculation is specialized domain
- Tax software (e.g., QuickBooks, SAP FI) handles this
- Manufacturing ERP provides transaction data
- Tax compliance handled by accounting department with specialized tools

---

### 5. No Multi-Currency Support

**Limitation:**
The system operates in a single currency. All transactions recorded in base currency.

**Rationale:**
- Target use case is domestic manufacturing facility
- Single-country operations
- All suppliers and customers in same country
- Multi-currency adds significant complexity
- Exchange rate management requires specialized functionality

**Business Context:**
Many manufacturing facilities operate domestically with single currency. International transactions (if any) are handled manually with currency conversion done externally.

**Not a Deficiency Because:**
- Single-currency is appropriate for domestic operations
- Multi-currency is separate feature set
- Can be added if international operations expand
- Current scope matches target use case

---

### 6. No Multi-Language Support

**Limitation:**
The system user interface is in English only. No internationalization (i18n) or localization (l10n).

**Rationale:**
- Target users are employees of single facility
- Common language within organization
- Multi-language support adds development complexity
- Translation maintenance overhead
- Not required for single-country operations

**Not a Deficiency Because:**
- Single-language appropriate for single-facility operations
- Multi-language is separate feature set
- Can be added if operations expand internationally
- Current scope matches target use case

---

### 7. No Mobile Application

**Limitation:**
The system is web-based but not optimized for mobile devices. No native mobile apps for iOS or Android.

**Rationale:**
- Manufacturing operations performed at workstations
- Shop floor terminals are fixed workstations
- Mobile access not critical for internal operations
- Responsive web design provides basic mobile access
- Native mobile apps require separate development effort

**What the System Provides:**
- Web-based access from any device with browser
- Responsive design for basic mobile viewing
- LAN access from tablets if needed

**Not a Deficiency Because:**
- Manufacturing ERP primarily used at fixed workstations
- Shop floor operations use terminals, not mobile devices
- Mobile apps are separate development effort
- Web access sufficient for occasional mobile use

---

### 8. No Offline Mode

**Limitation:**
The system requires continuous LAN connectivity. No offline operation capability.

**Rationale:**
- Real-time data consistency required
- Inventory accuracy depends on immediate updates
- Approval workflows require connectivity
- Concurrent user coordination requires database access
- LAN environment provides reliable connectivity

**Why Offline Mode is Inappropriate:**
- Eventual consistency unacceptable for inventory
- Conflict resolution complex for concurrent updates
- Audit trail gaps during offline period
- Transaction integrity difficult to guarantee

**Not a Deficiency Because:**
- LAN-based deployment provides reliable connectivity
- Manufacturing facility has stable network infrastructure
- Offline mode would compromise data integrity
- Real-time operations are core requirement

---

### 9. No Advanced Analytics or Business Intelligence

**Limitation:**
The system provides operational dashboards but not advanced analytics, data mining, predictive analytics, or business intelligence.

**Rationale:**
- Focus on operational ERP, not analytics
- BI tools are separate specialized systems
- Analytics require different technology stack
- Data warehouse typically separate from operational database
- BI tools (e.g., Tableau, Power BI) can connect to ERP database

**What the System Provides:**
- Real-time operational dashboards
- KPIs for production, inventory, quality, purchasing
- Basic reports and queries
- Data export for external analysis

**Not a Deficiency Because:**
- BI is separate system domain
- Operational ERP provides transactional data
- BI tools consume ERP data for analysis
- Separation of operational and analytical systems is best practice

---

### 10. No Advanced Planning and Scheduling (APS)

**Limitation:**
The system provides basic MRP but not advanced planning and scheduling with optimization algorithms, finite capacity scheduling, or constraint-based planning.

**Rationale:**
- APS is specialized domain requiring complex algorithms
- APS systems are separate specialized software
- Basic MRP sufficient for many manufacturing facilities
- Advanced scheduling requires optimization expertise
- Focus on operational execution, not planning optimization

**What the System Provides:**
- Material requirements planning (MRP)
- Production order scheduling (manual)
- Work order creation and tracking
- Basic capacity visibility

**Not a Deficiency Because:**
- APS is specialized domain (e.g., SAP APO, Oracle APS)
- Many manufacturers use basic MRP successfully
- Advanced scheduling can be added as separate module
- Current functionality matches typical SME requirements

---

## Part B: Future Enhancements (Out of Current Scope)

These are potential future developments that would extend system capabilities. They are explicitly OUT OF SCOPE for the current thesis but represent logical evolution paths.

### 1. Business Intelligence and Analytics Module

**Description:**
Advanced analytics, data visualization, predictive analytics, and business intelligence dashboards.

**Potential Features:**
- Data warehouse integration
- OLAP cubes for multi-dimensional analysis
- Predictive maintenance using machine learning
- Demand forecasting
- Production optimization recommendations
- Interactive dashboards with drill-down
- Ad-hoc reporting and query builder

**Technical Approach:**
- Separate BI database (data warehouse)
- ETL processes to extract data from operational database
- BI tools (Tableau, Power BI, or custom)
- Machine learning models for predictions

**Business Value:**
- Better decision-making through data insights
- Proactive maintenance reduces downtime
- Improved demand forecasting reduces inventory
- Optimization increases efficiency

**Why Out of Scope:**
- Requires different technology stack
- Requires data science expertise
- Separate system domain
- Operational ERP is prerequisite

---

### 2. Cost Accounting and Profitability Analysis

**Description:**
Comprehensive cost accounting module with standard costing, actual costing, variance analysis, and product profitability.

**Potential Features:**
- Standard cost maintenance
- Actual cost calculation (material + labor + overhead)
- Cost variance analysis (standard vs actual)
- Product profitability by item
- Cost center accounting
- Activity-based costing (ABC)
- Cost allocation rules
- Profitability reports

**Technical Approach:**
- Cost accounting tables and calculations
- Integration with production and purchasing data
- Periodic cost rollup processes
- Variance calculation algorithms

**Business Value:**
- Understand true product costs
- Identify cost reduction opportunities
- Make informed pricing decisions
- Improve profitability

**Why Out of Scope:**
- Complex domain requiring accounting expertise
- Company-specific costing methods
- Requires extensive configuration
- Often handled in financial ERP

---

### 3. Multi-Plant and Multi-Company Support

**Description:**
Support for multiple manufacturing plants, multiple legal entities, and inter-plant transfers.

**Potential Features:**
- Multi-plant inventory management
- Inter-plant transfers
- Consolidated reporting across plants
- Plant-specific configurations
- Multi-company accounting
- Inter-company transactions
- Centralized master data with plant-specific data

**Technical Approach:**
- Add plant_id and company_id to all tables
- Plant-specific security and access control
- Inter-plant transfer transactions
- Consolidated reporting queries

**Business Value:**
- Support business growth (multiple facilities)
- Centralized visibility across plants
- Optimize inventory across facilities
- Standardize processes across organization

**Why Out of Scope:**
- Current target is single-plant operations
- Adds significant complexity
- Requires different data model
- Future enhancement when business expands

---

### 4. IoT and Machine Integration

**Description:**
Integration with shop floor machines, sensors, and IoT devices for real-time data collection.

**Potential Features:**
- Automatic production output recording from machines
- Real-time machine status monitoring
- Predictive maintenance based on sensor data
- Automatic quality measurements
- Energy consumption monitoring
- OEE (Overall Equipment Effectiveness) calculation
- Machine downtime tracking

**Technical Approach:**
- IoT gateway for machine connectivity
- MQTT or OPC-UA protocols
- Real-time data streaming
- Time-series database for sensor data
- Integration with ERP via APIs

**Business Value:**
- Eliminate manual data entry
- Real-time visibility into production
- Predictive maintenance reduces downtime
- Improve OEE through data-driven insights

**Why Out of Scope:**
- Requires IoT infrastructure
- Requires machine connectivity (not all machines support)
- Specialized domain
- Significant investment required

---

### 5. Advanced Quality Management (QMS)

**Description:**
Comprehensive quality management system with statistical process control, CAPA, and compliance management.

**Potential Features:**
- Statistical Process Control (SPC) charts
- Corrective and Preventive Action (CAPA) management
- Audit management (internal and external)
- Document control and version management
- Training management and certification tracking
- Calibration management for measuring equipment
- Complaint management
- Regulatory compliance tracking

**Technical Approach:**
- QMS-specific tables and workflows
- Statistical calculations for SPC
- Document management system
- Workflow engine for CAPA

**Business Value:**
- Improve product quality
- Reduce defects and rework
- Ensure regulatory compliance
- Systematic continuous improvement

**Why Out of Scope:**
- Specialized QMS domain
- Requires quality engineering expertise
- Often separate QMS software (e.g., ETQ, MasterControl)
- Current system provides basic quality control

---

### 6. Supply Chain Management (SCM)

**Description:**
Extended supply chain management including demand planning, supplier collaboration, and logistics.

**Potential Features:**
- Demand planning and forecasting
- Supplier performance management
- Supplier collaboration portal
- Logistics and transportation management
- Warehouse management system (WMS)
- Advanced inventory optimization
- Supply chain visibility and tracking

**Technical Approach:**
- SCM-specific modules
- External supplier portal
- Integration with logistics providers
- Advanced algorithms for optimization

**Business Value:**
- Optimize inventory levels
- Improve supplier relationships
- Reduce logistics costs
- Improve on-time delivery

**Why Out of Scope:**
- Specialized SCM domain
- Often separate SCM software (e.g., SAP SCM, Oracle SCM)
- Current system provides basic procurement
- Significant development effort

---

### 7. Customer Relationship Management (CRM)

**Description:**
CRM module for managing customer interactions, sales opportunities, and customer service.

**Potential Features:**
- Customer contact management
- Sales opportunity tracking
- Quote management
- Sales order management
- Customer service and support tickets
- Customer portal for order tracking
- Marketing campaign management

**Technical Approach:**
- CRM-specific tables and workflows
- Customer portal (external users)
- Integration with manufacturing ERP
- Email and communication tracking

**Business Value:**
- Improve customer satisfaction
- Increase sales effectiveness
- Better customer service
- Integrated view of customer and operations

**Why Out of Scope:**
- Separate system domain (CRM vs ERP)
- Different user base (sales vs operations)
- Often separate CRM software (e.g., Salesforce, HubSpot)
- Manufacturing ERP focuses on operations

---

### 8. Mobile Applications

**Description:**
Native mobile applications for iOS and Android for shop floor and field operations.

**Potential Features:**
- Mobile work order execution
- Mobile inventory transactions
- Mobile quality inspections
- Mobile approval workflows
- Barcode scanning
- Photo capture for documentation
- Offline mode with sync

**Technical Approach:**
- Native mobile apps (React Native, Flutter, or native)
- Mobile-optimized APIs
- Offline data storage and sync
- Mobile-specific UI/UX

**Business Value:**
- Improve shop floor productivity
- Reduce data entry errors (barcode scanning)
- Enable field operations
- Real-time data capture

**Why Out of Scope:**
- Separate development effort
- Requires mobile expertise
- Web-based access sufficient for current needs
- Future enhancement for mobility

---

### 9. Advanced Reporting and Document Generation

**Description:**
Advanced report designer, custom report builder, and automated document generation.

**Potential Features:**
- Drag-and-drop report designer
- Custom report builder for end users
- Scheduled report generation and distribution
- Export to multiple formats (PDF, Excel, CSV)
- Automated document generation (PO, invoices, packing slips)
- Email distribution of reports
- Report templates and libraries

**Technical Approach:**
- Reporting engine (e.g., JasperReports, Crystal Reports)
- Report designer UI
- Template management system
- Scheduled job execution

**Business Value:**
- Empower users to create custom reports
- Reduce IT dependency for reporting
- Automate routine reporting tasks
- Improve information distribution

**Why Out of Scope:**
- Significant development effort
- Current system provides basic reports
- Can be added incrementally
- Not critical for core operations

---

### 10. Integration Platform

**Description:**
Integration platform for connecting with external systems (ERP, CRM, e-commerce, EDI).

**Potential Features:**
- API gateway for external integrations
- EDI integration for supplier/customer transactions
- E-commerce integration for online orders
- Accounting system integration (QuickBooks, Xero)
- Third-party logistics integration
- Payment gateway integration
- Webhook support for event notifications

**Technical Approach:**
- RESTful APIs for external access
- Integration middleware (e.g., MuleSoft, Dell Boomi)
- Message queue for asynchronous processing
- Data transformation and mapping

**Business Value:**
- Eliminate manual data entry between systems
- Real-time data synchronization
- Extend ERP capabilities through integrations
- Support business ecosystem

**Why Out of Scope:**
- Requires integration expertise
- Depends on external systems available
- Can be added as needed
- Core ERP functionality is prerequisite

---

## Summary

### Intentional Limitations (By Design)

The following are NOT deficiencies but conscious scope decisions:
1. No customer portal (separate system domain)
2. No supplier portal (traditional processes sufficient)
3. No cost accounting (handled externally)
4. No tax computation (specialized domain)
5. No multi-currency (domestic operations)
6. No multi-language (single facility)
7. No mobile apps (web access sufficient)
8. No offline mode (data integrity priority)
9. No advanced analytics (separate BI system)
10. No APS (basic MRP sufficient)

### Future Enhancements (Out of Current Scope)

Potential future developments:
1. Business intelligence and analytics
2. Cost accounting and profitability
3. Multi-plant and multi-company
4. IoT and machine integration
5. Advanced quality management
6. Supply chain management
7. Customer relationship management
8. Mobile applications
9. Advanced reporting
10. Integration platform

### Scope Clarity

**What the System IS:**
- Comprehensive operational manufacturing ERP
- Internal operations focus
- Single-plant, single-currency, single-language
- LAN-based with real-time data integrity
- Complete audit trail and compliance support

**What the System IS NOT:**
- Business intelligence platform
- Customer-facing system
- Supplier collaboration platform
- Financial accounting system
- Tax compliance software
- Multi-national ERP
- IoT platform
- Mobile-first application

### Academic Contribution

The thesis demonstrates:
- Complete manufacturing ERP implementation
- Sound architectural decisions
- Data integrity through transactions
- Security through RBAC and audit trails
- Real-world applicability

The intentional limitations are appropriate for the target use case and do not diminish the academic or practical value of the work.

---

**Document Version:** 1.0  
**Last Updated:** December 26, 2025  
**Prepared For:** Thesis Defense Panel
