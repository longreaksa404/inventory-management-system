# 📦 Inventory Management System (IMS) - Backend

**A production-ready, high-integrity backend service built with Django & DRF.**

This system is designed around **real-world business workflows**, ensuring data consistency across multiple warehouses, managing complex order lifecycles, and maintaining a strict audit trail of every stock movement.

---

## 🔗 Live Production Environment
* **Admin Dashboard:** [https://inventory-management-backend-g3e7.onrender.com/admin/](https://inventory-management-backend-g3e7.onrender.com/admin/)
* **Interactive Docs:** [Swagger UI](https://inventory-management-backend.onrender.com/swagger/) | [Redoc](https://inventory-management-backend.onrender.com/redoc/)
* **API Versioning:** Use `/api/v1/` before all endpoints (e.g., `/api/v1/accounts/login/`).
---

## 🏗️ Architectural Highlights

### 1. Data Integrity & Transactions
Inventory systems fail if stock levels go out of sync. I implemented **atomic database transactions** to ensure that stock deduction and transaction logging either succeed together or fail together—preventing "ghost" inventory.

### 2. Scalable RBAC (Role-Based Access Control)
Instead of simple boolean flags, the system uses a structured role system managed via a custom User model:
* **Admins:** Full system control.
* **Managers:** Warehouse and stock oversight.
* **Staff:** Operational tasks (orders, stock updates).

### 3. Async-First Background Tasks
To keep the API responsive, heavy operations are designed for **Celery & Redis**:
* **Email Notifications:** Dispatched via background workers.
* **Stock Alerts:** Automated checks for low-stock items via Celery Beat.
* **Audit Logging:** System-wide triggers for tracking every change.

---

## 🛠 Tech Stack & Infrastructure
* **Django 5.2 & DRF:** Chosen for the robust ORM and mature security features required for high-stakes inventory data.
* **Cloud Hosting:** Deployed on **Render** using a managed Web Service and automated build pipelines.
* **PostgreSQL:** Production database managed by Render, ensuring ACID compliance for stock movements.
* **Upstash Redis:** Cloud-native Redis instance used as the message broker for Celery tasks.
* **Pytest:** Comprehensive suite covering Unit, Integration, and Async logic.



---

## 📊 Business Logic Flow

```mermaid
graph TD
    A[Customer Order] --> B{RBAC Check}
    B -- Authorized --> C[Transaction Start]
    C --> D[Stock Availability Check]
    D -- In Stock --> E[Deduct Stock & Create Audit Trail]
    E --> F[Commit Transaction]
    F --> G[Async: Trigger Email via Celery]
    D -- Out of Stock --> H[Rollback & Return Error]
```

---

## 🚀 Key Features

- **Multi-Warehouse Tracking** - Real-time stock visibility across different geographical locations.  
- **Order Lifecycle Management** - Strict state transitions for Purchase and Sales orders.  
- **Audit Trails** - Permanent history of stock movements (who, what, when, and where).  
- **Automated Documentation** - Fully typed Swagger and Redoc support.

## ⚙️ Engineering & Setup

### Local Development

1. Clone & setup environment:
```bash
git clone https://github.com/longreaksa404/inventory-management-backend.git
cd inventory-management-backend
cp .env.example .env  # Configure your DB and Redis URLs
```

2. Install dependencies and run migrations:
```bash
pip install -r requirements.txt
python manage.py migrate
```

3. Run tests:
```bash
pytest  # Runs 35+ tests including domain logic and async task verification
```

### Deployment Configuration
The project is configured for seamless deployment on **Render** using a custom `build.sh` script that handles:

* **Automatic dependency installation:** Uses `pip` to install requirements from `requirements.txt`.
* **Database migrations:** Automatically runs `python manage.py migrate` to keep the production schema in sync.
* **Static file collection:** Executes `collectstatic` for serving the Django Admin and API documentation CSS/JS.
* **Automated superuser provisioning:** Uses environment variables to safely create or update the admin account during the first deploy.

  
## 🎯 Project Purpose

This repository serves as a demonstration of production-level backend engineering. It focuses on solving hard problems that matter to real systems - handling race conditions, ensuring data consistency, and providing fine-grained security - and is intended as a foundation for small-to-medium enterprise (SME) inventory systems.
