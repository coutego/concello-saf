use std::path::Path;
use xlsxwriter::format::FormatColor;
use xlsxwriter::{Format, Workbook, XlsxError};

use crate::database::Database;
use crate::models::*;

pub fn export_loans_to_excel<P: AsRef<Path>>(
    db: &Database,
    path: P,
) -> Result<(), Box<dyn std::error::Error>> {
    let workbook = Workbook::new(path.as_ref().to_str().unwrap())?;

    // Create formats using new API
    let mut header_format = Format::new();
    header_format.set_bold();
    header_format.set_bg_color(FormatColor::Custom(0x4472C4));
    header_format.set_font_color(FormatColor::Custom(0xFFFFFF));

    let _date_format = Format::new();
    // date_format.set_num_format("yyyy-mm-dd");

    // Sheet 1: Préstamos
    let mut sheet1 = workbook.add_worksheet(Some("Préstamos"))?;

    // Headers
    sheet1.write_string(0, 0, "ID", Some(&header_format))?;
    sheet1.write_string(0, 1, "Usuario", Some(&header_format))?;
    sheet1.write_string(0, 2, "DNI", Some(&header_format))?;
    sheet1.write_string(0, 3, "Artigos", Some(&header_format))?;
    sheet1.write_string(0, 4, "Data Inicio", Some(&header_format))?;
    sheet1.write_string(0, 5, "Data Prevista", Some(&header_format))?;
    sheet1.write_string(0, 6, "Data Devolución", Some(&header_format))?;
    sheet1.write_string(0, 7, "Estado", Some(&header_format))?;
    sheet1.write_string(0, 8, "Notas", Some(&header_format))?;

    let loans = db.get_loans()?;

    for (i, loan) in loans.iter().enumerate() {
        let row = (i + 1) as u32;

        sheet1.write_string(row, 0, &loan.id, None)?;
        sheet1.write_string(row, 1, &loan.user_name, None)?;

        // Get user DNI
        if let Ok(user) = db.get_user_by_id(&loan.user_id) {
            sheet1.write_string(row, 2, &user.dni, None)?;
        }

        // Artigos
        let items_text = loan
            .items
            .iter()
            .map(|i| i.item_name.clone())
            .collect::<Vec<_>>()
            .join(", ");
        sheet1.write_string(row, 3, &items_text, None)?;

        sheet1.write_string(row, 4, &loan.start_date.to_string(), None)?;
        sheet1.write_string(row, 5, &loan.expected_end_date.to_string(), None)?;

        if let Some(actual) = loan.actual_end_date {
            let date_str: String = actual.to_string();
            sheet1.write_string(row, 6, &date_str, None)?;
        }

        let status_text = match loan.status {
            LoanStatus::Active => "Activo",
            LoanStatus::Pending => "Pendente",
            LoanStatus::Returned => "Devolto",
            LoanStatus::Overdue => "Atrasado",
        };
        sheet1.write_string(row, 7, status_text, None)?;

        if let Some(notes) = &loan.notes {
            sheet1.write_string(row, 8, notes, None)?;
        }
    }

    // Sheet 2: Usuarios
    let mut sheet2 = workbook.add_worksheet(Some("Usuarios"))?;

    sheet2.write_string(0, 0, "Nome", Some(&header_format))?;
    sheet2.write_string(0, 1, "DNI", Some(&header_format))?;
    sheet2.write_string(0, 2, "Dirección", Some(&header_format))?;
    sheet2.write_string(0, 3, "Teléfono", Some(&header_format))?;
    sheet2.write_string(0, 4, "Email", Some(&header_format))?;
    sheet2.write_string(0, 5, "Notas", Some(&header_format))?;

    let users = db.get_users()?;

    for (i, user) in users.iter().enumerate() {
        let row = (i + 1) as u32;

        sheet2.write_string(row, 0, &user.name, None)?;
        sheet2.write_string(row, 1, &user.dni, None)?;
        sheet2.write_string(row, 2, &user.address, None)?;

        if let Some(phone) = &user.phone {
            sheet2.write_string(row, 3, phone, None)?;
        }
        if let Some(email) = &user.email {
            sheet2.write_string(row, 4, email, None)?;
        }
        if let Some(notes) = &user.notes {
            sheet2.write_string(row, 5, notes, None)?;
        }
    }

    // Sheet 3: Inventario
    let mut sheet3 = workbook.add_worksheet(Some("Inventario"))?;

    sheet3.write_string(0, 0, "Nome", Some(&header_format))?;
    sheet3.write_string(0, 1, "Categoría", Some(&header_format))?;
    sheet3.write_string(0, 2, "Stock Total", Some(&header_format))?;
    sheet3.write_string(0, 3, "Dispoñible", Some(&header_format))?;
    sheet3.write_string(0, 4, "En Préstamo", Some(&header_format))?;
    sheet3.write_string(0, 5, "Descripción", Some(&header_format))?;

    let items = db.get_items()?;

    for (i, item) in items.iter().enumerate() {
        let row = (i + 1) as u32;

        sheet3.write_string(row, 0, &item.name, None)?;
        sheet3.write_string(row, 1, &item.category, None)?;
        sheet3.write_number(row, 2, item.total_stock as f64, None)?;
        sheet3.write_number(row, 3, item.available_stock as f64, None)?;
        sheet3.write_number(
            row,
            4,
            (item.total_stock - item.available_stock) as f64,
            None,
        )?;

        if let Some(desc) = &item.description {
            sheet3.write_string(row, 5, desc, None)?;
        }
    }

    workbook.close()?;

    Ok(())
}
