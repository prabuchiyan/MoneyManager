# 💰 Money Management App – Technical Specification

## 📌 Overview
A single-user, offline-first mobile application to manage:
- Income
- Expenses
- Budgets
- Bills
- Multiple money sources

---

## 🏗️ Tech Stack
- React Native (Expo)
- SQLite (expo-sqlite)
- React Navigation

---

## 🧱 Data Model

### Categories
- id (PK)
- name
- type (income / expense)
- icon
- is_active
- created_at

### Sources
- id (PK)
- name
- type
- initial_balance
- is_active

### Transactions (Core)
- id (PK)
- type (income / expense)
- amount
- category_id (FK)
- source_id (FK)
- date
- notes
- bill_id (optional)
- created_at

### Budgets
- id
- category_id (optional)
- monthly_limit
- month (YYYY-MM)

### Bills
- id
- name
- amount
- due_date
- is_recurring
- recurrence_type
- category_id
- is_paid
- linked_transaction_id

---

## 🔄 Business Logic

### Balance Calculation
Balance = Initial Balance + Income - Expenses

### Budget Calculation
Remaining Budget = Monthly Limit - Expenses

### Bill Payment
- Mark bill as paid
- Create expense transaction
- Link transaction to bill

---

## 📱 Features

### Categories
- Add / Edit / Delete (soft delete)

### Sources
- Manage accounts
- Show computed balance

### Transactions
- Add / Edit / Delete
- Filter & search

### Budgets
- Monthly tracking
- Highlight exceeded

### Bills
Build a modern Bills Management feature for a personal finance app with smart tracking, reminders, and automation.

Database Schema:
Design a bills table with the following fields:

Bills:
- id (primary key)
- name (text)
- amount (number)
- due_date (date)
- status (enum: pending, paid, overdue, skipped)
- is_recurring (boolean)
- recurrence_type (daily, weekly, monthly, yearly)
- recurrence_interval (integer, e.g. every 2 months)
- recurrence_end_date (date, nullable)
- category_id (foreign key)
- source_id (foreign key, nullable)
- reminder_days_before (integer, default 1–3)
- last_reminded_at (datetime, nullable)
- auto_pay (boolean, default false)
- notes (text, optional)
- attachment_url (text, optional)
- linked_transaction_id (foreign key, nullable)
- paid_at (datetime, nullable)
- created_at (datetime)
- updated_at (datetime)
- deleted_at (soft delete, nullable)

Core Functional Logic:
1. Bill Status Automation
    pending → default
    overdue → if due_date < today and not paid
    paid → when marked paid
    skipped → user manually skips
2. Recurring Bills Engine
    Automatically generate next bill when:
    bill is recurring AND
    due date is reached/passed
    Use:
      recurrence_type
      recurrence_interval
      Stop when recurrence_end_date is reached
3. Payment Handling
    When user marks bill as paid:
    Update status = paid
    Set paid_at = current timestamp
    Optionally create a transaction record
    Store linked_transaction_id
4. Reminder System
    Trigger reminders:
    reminder_days_before days before due_date
    Avoid duplicate reminders using last_reminded_at
    📱 UI / UX Requirements
    🧩 Bills Dashboard

Display summary at top:
  Total bills this month
  Total paid
  Overdue amount
  Upcoming (next 7 days)  
  Bills List (Card UI)

Each bill card should show:
Name
Amount
Due date
Status badge:
  🔴 Overdue
  🟡 Due Soon
  🟢 Paid
Quick actions:
  Mark Paid
  Skip
  Edit

Smart Color System
  Overdue → Red
  Due soon (≤3 days) → Orange
  Paid → Green
  Future → Grey

View Modes
  Toggle between:
  List View

Calendar View (monthly due tracking)
  User Interactions
    Swipe right → Mark Paid
    Swipe left → Skip/Delete
    Tap → Open detailed view

Smart UX Features
  Auto-create transaction when bill is paid
  Highlight upcoming bills (next 3–7 days)
  Show overdue alerts clearly

Filters & Sorting
  Filters:
    Status (pending, paid, overdue)
    Category
  Sorting:
    Due date
    Amount

Insights (Optional Advanced)
  Monthly fixed bill total
  Upcoming dues in next 5–7 days
  Highest bill category
  Spending trends on recurring bills

Tech Expectations
  Build using React Native (for mobile UI)
  Use clean component-based architecture
  Optimize for performance (FlatList, memoization)
  Ensure scalable backend logic for recurrence + reminders

Goal
  Deliver a clean, intuitive, and intelligent bills system that:
    Minimizes manual tracking
    Clearly shows financial obligations
    Automates recurring workflows
    Feels modern like a fintech app

## 📊 Reports
- Total balance
- Category-wise spending
- Monthly trends

---

## 📂 Folder Structure
```
/src
  /components
  /screens
  /database
  /services
  /utils
```

---

## ⚠️ Rules
- Do NOT store balance
- Always calculate dynamically
- Maintain relational integrity

---

## 🚀 Build Instruction (AI Prompt)

Build a React Native (Expo) offline-first money management app using SQLite.
Implement transactions, categories, sources, budgets, and bills.
Ensure validation, relationships, and UI screens are complete.
