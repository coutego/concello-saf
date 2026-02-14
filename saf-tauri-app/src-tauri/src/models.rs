use chrono::{NaiveDate, NaiveDateTime};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub name: String,
    pub dni: String,
    pub address: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub notes: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateUserRequest {
    pub name: String,
    pub dni: String,
    pub address: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateUserRequest {
    pub name: Option<String>,
    pub dni: Option<String>,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Item {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub icon: String,
    pub total_stock: i32,
    pub available_stock: i32,
    pub notes: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateItemRequest {
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub icon: String,
    pub total_stock: i32,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateItemRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub category: Option<String>,
    pub icon: Option<String>,
    pub total_stock: Option<i32>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Loan {
    pub id: String,
    pub user_id: String,
    pub user_name: String,
    pub start_date: NaiveDate,
    pub expected_end_date: NaiveDate,
    pub actual_end_date: Option<NaiveDate>,
    pub status: LoanStatus,
    pub notes: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub items: Vec<LoanItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LoanStatus {
    Active,
    Pending,
    Returned,
    Overdue,
}

impl LoanStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            LoanStatus::Active => "active",
            LoanStatus::Pending => "pending",
            LoanStatus::Returned => "returned",
            LoanStatus::Overdue => "overdue",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoanItem {
    pub id: String,
    pub loan_id: String,
    pub item_id: String,
    pub item_name: String,
    pub quantity: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateLoanRequest {
    pub user_id: String,
    pub item_ids: Vec<String>,
    pub start_date: NaiveDate,
    pub expected_end_date: NaiveDate,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReturnLoanRequest {
    pub condition: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Event {
    pub id: String,
    pub event_type: String,
    pub data: serde_json::Value,
    pub created_at: NaiveDateTime,
    pub loan_id: Option<String>,
    pub user_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardStats {
    pub active_loans: i64,
    pub pending_returns: i64,
    pub overdue_loans: i64,
    pub total_items_available: i64,
    pub total_users: i64,
    pub recent_loans: Vec<Loan>,
    pub recent_events: Vec<Event>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupInfo {
    pub filename: String,
    pub size: u64,
    pub created_at: NaiveDateTime,
    pub path: String,
}
