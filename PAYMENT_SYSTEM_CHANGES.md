# Laboratory Payment System Restructuring

## Overview
Restructured the laboratory payment system to have a separate payment tracking mechanism instead of storing payment information directly in lab work records. This provides better monthly tracking and historical data management.

## Changes Made

### Backend Changes

#### 1. New Model: `LaboratoryPayment`
- **File**: `backend/app/models/laboratory_payment.py`
- **Purpose**: Track individual payments made to laboratories with dates
- **Fields**:
  - `id`: Primary key
  - `laboratory_id`: Foreign key to laboratories table
  - `amount`: Payment amount (Decimal)
  - `payment_date`: Date of payment
  - `notes`: Optional payment notes (max 500 chars)
  - `created_at`, `updated_at`: Timestamps
- **Relationships**: Links to `Laboratory` model

#### 2. Updated Model: `LabWork`
- **Removed fields**: 
  - `cost` (Numeric)
  - `amount_paid` (Numeric)
- These fields were removed as payments are now tracked separately per laboratory, not per lab work order

#### 3. Updated Model: `Laboratory`
- **Added relationship**: `payments` - one-to-many relationship with `LaboratoryPayment`

#### 4. New Schemas
- **File**: `backend/app/schemas/laboratory_payment.py`
- **Schemas**:
  - `LaboratoryPaymentBase`: Base schema with validation
  - `LaboratoryPaymentCreate`: For creating new payments
  - `LaboratoryPaymentUpdate`: For updating payments
  - `LaboratoryPaymentOut`: Output schema with laboratory name
  - `MonthlyPaymentSummary`: Summary of payments for a specific month
  - `LaboratoryPaymentStats`: Overall payment statistics (current month + all time)

#### 5. Updated Schemas
- **File**: `backend/app/schemas/lab_work.py`
- **Removed fields** from `LabWorkBase`, `LabWorkCreate`, `LabWorkUpdate`, `LabWorkOut`, `LabWorkList`:
  - `cost`
  - `amount_paid`
- **Removed schema**: `LaboratoryPaymentSummary` (moved to laboratory_payment.py)

#### 6. New Service: `laboratory_payment_service`
- **File**: `backend/app/services/laboratory_payment_service.py`
- **Functions**:
  - `create_payment()`: Create new payment
  - `get_payment_by_id()`: Retrieve payment by ID
  - `update_payment()`: Update existing payment
  - `delete_payment()`: Delete payment
  - `get_monthly_payments()`: Get all payments for a specific month with summary
  - `get_current_month_payments()`: Shortcut for current month
  - `get_payment_stats()`: Get overall statistics (current month + all time)
  - `get_all_payments_for_laboratory()`: Get all payments with optional date filtering

#### 7. New Router: `laboratory_payment`
- **File**: `backend/app/routers/laboratory_payment.py`
- **Prefix**: `/laboratory-payments`
- **Endpoints**:
  - `POST /laboratory-payments`: Create payment
  - `GET /laboratory-payments/{payment_id}`: Get payment by ID
  - `PUT /laboratory-payments/{payment_id}`: Update payment
  - `DELETE /laboratory-payments/{payment_id}`: Delete payment
  - `GET /laboratory-payments/laboratory/{laboratory_id}/monthly?year=YYYY&month=MM`: Get monthly payments
  - `GET /laboratory-payments/laboratory/{laboratory_id}/current-month`: Get current month payments
  - `GET /laboratory-payments/laboratory/{laboratory_id}/stats`: Get payment statistics

#### 8. Updated Service: `laboratory_service`
- **Removed function**: `get_laboratory_payment_summary()` - no longer needed as payments are tracked separately

#### 9. Updated Router: `laboratory`
- **Removed endpoint**: `GET /api/admin/laboratories/{lab_id}/payment-summary`

#### 10. Database Migration
- **File**: `backend/alembic/versions/38c62943c498_add_laboratory_payments_remove_labwork_.py`
- **Actions**:
  - Creates `laboratory_payments` table with indexes
  - Drops `cost` and `amount_paid` columns from `lab_work` table
  - Includes downgrade function to revert changes

### Frontend Changes

#### 1. Updated Types
- **File**: `frontend/src/types/index.ts`
- **New types**:
  - `LaboratoryPayment`: Single payment record
  - `LaboratoryPaymentCreate`: Create payment payload
  - `LaboratoryPaymentUpdate`: Update payment payload
  - `MonthlyPaymentSummary`: Monthly payment summary with payment list
  - `LaboratoryPaymentStats`: Payment statistics
- **Removed type**: `LaboratoryPaymentSummary` (old version based on lab work costs)
- **Updated types**: Removed `cost` and `amount_paid` from:
  - `LabWork`
  - `LabWorkListItem`
  - `LabWorkCreate`
  - `LabWorkUpdate`

#### 2. New API Service
- **File**: `frontend/src/services/laboratoryPaymentApi.ts`
- **Methods**:
  - `create()`: Create new payment
  - `getById()`: Get payment by ID
  - `update()`: Update payment
  - `delete()`: Delete payment
  - `getMonthlyPayments()`: Get payments for specific month
  - `getCurrentMonthPayments()`: Get current month payments
  - `getStats()`: Get payment statistics

#### 3. Updated API Service
- **File**: `frontend/src/services/laboratoryApi.ts`
- **Removed method**: `paymentSummary()` - no longer needed

#### 4. Completely Rewritten Page Component
- **File**: `frontend/src/pages/admin/LaboratoryDetailPage.tsx`
- **Major changes**:
  - **Removed**: Old payment summary banner based on lab work costs/payments
  - **Added**: New payment statistics banner showing current month and all-time totals
  - **Added**: New payments section with:
    - Month navigation (previous/next month)
    - Payment list table showing date, amount, and notes
    - Add/Edit/Delete payment functionality
    - Monthly total display
    - Automatic reset on the 1st of each month (previous months saved)
  - **Updated**: Lab work form - removed cost and amount_paid fields
  - **Updated**: Lab work table - removed payment-related columns
  - **Maintained**: Treatment summary and lab work management functionality

## Key Features

### 1. Monthly Payment Tracking
- Payments are organized by month and year
- Navigate between months to view historical payments
- Current month is clearly indicated
- Each month shows total amount and payment count

### 2. Payment History
- All previous months' payments are preserved
- No data loss on monthly rollover
- Query any month's payments via year/month parameters

### 3. Payment Statistics
- Current month total and count
- All-time total and count
- Displayed prominently at the top of laboratory detail page

### 4. Separation of Concerns
- Lab work records focus on work details (patient, type, teeth, status)
- Payments are tracked separately per laboratory
- Cleaner data model and easier to manage

## Migration Path

### Database Migration
1. Run the migration: `alembic upgrade head`
2. This will:
   - Create the `laboratory_payments` table
   - Remove `cost` and `amount_paid` from `lab_work` table
   - **Note**: Existing cost/payment data in lab_work will be lost. If you need to migrate this data, create a custom data migration script before running this migration.

### Manual Data Migration (If Needed)
If you have existing lab work payment data that needs to be preserved:
1. Before running the migration, create a script to:
   - Query all lab_work records with cost/amount_paid data
   - Group by laboratory_id and aggregate monthly
   - Insert into laboratory_payments table
2. Then run the migration

## API Changes Summary

### Removed Endpoints
- `GET /api/admin/laboratories/{lab_id}/payment-summary`

### New Endpoints
- `POST /laboratory-payments`
- `GET /laboratory-payments/{payment_id}`
- `PUT /laboratory-payments/{payment_id}`
- `DELETE /laboratory-payments/{payment_id}`
- `GET /laboratory-payments/laboratory/{laboratory_id}/monthly`
- `GET /laboratory-payments/laboratory/{laboratory_id}/current-month`
- `GET /laboratory-payments/laboratory/{laboratory_id}/stats`

## Benefits

1. **Better Organization**: Payments are separated from work orders
2. **Monthly Tracking**: Easy to see what was paid each month
3. **Historical Data**: All previous months are preserved
4. **Flexibility**: Can add multiple payments per month with different dates
5. **Cleaner Model**: Lab work focuses on work details, not financial tracking
6. **Scalability**: Easier to add payment-related features (payment methods, invoices, etc.)

## Testing Recommendations

1. **Backend**:
   - Test all payment CRUD operations
   - Test monthly payment queries
   - Test payment statistics calculation
   - Test lab work CRUD without payment fields

2. **Frontend**:
   - Test payment form (add/edit)
   - Test payment deletion
   - Test month navigation
   - Test payment statistics display
   - Test lab work form without payment fields
   - Verify lab work table displays correctly without payment columns

3. **Integration**:
   - Verify payment data persists correctly
   - Verify monthly summaries calculate correctly
   - Verify navigation between months works
   - Verify statistics update when payments are added/removed
