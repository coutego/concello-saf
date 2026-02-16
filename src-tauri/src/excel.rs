use std::path::Path;
use xlsxwriter::format::FormatColor;
use xlsxwriter::{Format, Workbook};

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

pub fn export_annual_report<P: AsRef<Path>>(
    db: &Database,
    path: P,
    year: i32,
) -> Result<(), Box<dyn std::error::Error>> {
    let workbook = Workbook::new(path.as_ref().to_str().unwrap())?;

    let mut header_format = Format::new();
    header_format.set_bold();
    header_format.set_bg_color(FormatColor::Custom(0x1A6B5A));
    header_format.set_font_color(FormatColor::Custom(0xFFFFFF));

    let mut title_format = Format::new();
    title_format.set_bold();
    title_format.set_font_size(14.0);

    let mut sheet = workbook.add_worksheet(Some(&format!("Actividade {}", year)))?;

    // Title
    sheet.write_string(
        0,
        0,
        &format!("Informe de Actividade Anual - {}", year),
        Some(&title_format),
    )?;
    sheet.write_string(
        1,
        0,
        &format!(
            "SAF Concello de Barreiros - Xerado o {}",
            chrono::Local::now().format("%d/%m/%Y")
        ),
        None,
    )?;

    // Get all loans for the year
    let loans = db.get_loans()?;
    let year_loans: Vec<_> = loans
        .iter()
        .filter(|l| {
            let start_year = l
                .start_date
                .format("%Y")
                .to_string()
                .parse::<i32>()
                .unwrap_or(0);
            start_year == year
        })
        .collect();

    // Group by user - only users who had loans
    let mut user_loans: std::collections::HashMap<String, Vec<&crate::models::Loan>> =
        std::collections::HashMap::new();
    for loan in &year_loans {
        user_loans
            .entry(loan.user_id.clone())
            .or_default()
            .push(loan);
    }

    let mut row: u32 = 3;

    // Headers
    sheet.write_string(row, 0, "Usuaria/o", Some(&header_format))?;
    sheet.write_string(row, 1, "DNI", Some(&header_format))?;
    sheet.write_string(row, 2, "Data préstamo", Some(&header_format))?;
    sheet.write_string(row, 3, "Data devolución", Some(&header_format))?;
    sheet.write_string(row, 4, "Artigos", Some(&header_format))?;
    sheet.write_string(row, 5, "Estado", Some(&header_format))?;
    sheet.write_string(row, 6, "Notas", Some(&header_format))?;
    row += 1;

    // Sort users by name
    let mut sorted_users: Vec<_> = user_loans.iter().collect();
    sorted_users.sort_by(|a, b| {
        a.1.first()
            .map(|l| &l.user_name)
            .cmp(&b.1.first().map(|l| &l.user_name))
    });

    for (user_id, loans) in sorted_users {
        let user_name = loans.first().map(|l| l.user_name.as_str()).unwrap_or("?");
        let user_dni = db
            .get_user_by_id(user_id)
            .ok()
            .map(|u| u.dni)
            .unwrap_or_default();

        for loan in loans {
            let items_text = loan
                .items
                .iter()
                .map(|i| i.item_name.clone())
                .collect::<Vec<_>>()
                .join(", ");

            let status_text = match loan.status {
                LoanStatus::Active => "Activo",
                LoanStatus::Pending => "Pendente",
                LoanStatus::Returned => "Devolto",
                LoanStatus::Overdue => "Atrasado",
            };

            sheet.write_string(row, 0, user_name, None)?;
            sheet.write_string(row, 1, &user_dni, None)?;
            sheet.write_string(row, 2, &loan.start_date.to_string(), None)?;
            if let Some(end) = loan.actual_end_date {
                sheet.write_string(row, 3, &end.to_string(), None)?;
            }
            sheet.write_string(row, 4, &items_text, None)?;
            sheet.write_string(row, 5, status_text, None)?;
            if let Some(notes) = &loan.notes {
                sheet.write_string(row, 6, notes, None)?;
            }
            row += 1;
        }
    }

    // Summary row
    row += 1;
    let mut summary_format = Format::new();
    summary_format.set_bold();
    sheet.write_string(row, 0, "RESUMO:", Some(&summary_format))?;
    row += 1;
    sheet.write_string(
        row,
        0,
        &format!("Total préstamos no ano: {}", year_loans.len()),
        None,
    )?;
    row += 1;
    sheet.write_string(
        row,
        0,
        &format!("Usuarios/as atendidos/as: {}", user_loans.len()),
        None,
    )?;

    // Set column widths
    sheet.set_column(0, 0, 25.0, None)?;
    sheet.set_column(1, 1, 14.0, None)?;
    sheet.set_column(2, 3, 14.0, None)?;
    sheet.set_column(4, 4, 40.0, None)?;
    sheet.set_column(5, 5, 12.0, None)?;
    sheet.set_column(6, 6, 30.0, None)?;

    workbook.close()?;
    Ok(())
}

pub fn export_annual_report_pdf<P: AsRef<Path>>(
    db: &Database,
    path: P,
    year: i32,
) -> Result<(), Box<dyn std::error::Error>> {
    use printpdf::*;
    use std::collections::VecDeque;
    use std::fs::File;
    use std::io::BufWriter;

    let loans = db.get_loans()?;
    let year_loans: Vec<_> = loans
        .iter()
        .filter(|l| {
            l.start_date
                .format("%Y")
                .to_string()
                .parse::<i32>()
                .unwrap_or(0)
                == year
        })
        .collect();

    let mut user_loans: std::collections::HashMap<String, Vec<&crate::models::Loan>> =
        std::collections::HashMap::new();
    for loan in &year_loans {
        user_loans
            .entry(loan.user_id.clone())
            .or_default()
            .push(loan);
    }

    let (doc, page1, layer1) =
        PdfDocument::new("SAF Annual Report", Mm(210.0), Mm(297.0), "Layer 1");

    let helvetica = doc.add_builtin_font(BuiltinFont::Helvetica)?;
    let helvetica_bold = doc.add_builtin_font(BuiltinFont::HelveticaBold)?;
    let helvetica_oblique = doc.add_builtin_font(BuiltinFont::HelveticaOblique)?;

    let current_layer = doc.get_page(page1).get_layer(layer1);

    let margin_left = Mm(20.0);
    let _page_width = Mm(170.0);
    let mut y_pos = Mm(277.0);

    fn draw_user_section(
        layer: &PdfLayerReference,
        db: &Database,
        user_id: &str,
        user_name: &str,
        loans: &[&Loan],
        x: Mm,
        y: &mut Mm,
        font_bold: &IndirectFontRef,
        font: &IndirectFontRef,
        font_italic: &IndirectFontRef,
    ) -> bool {
        let min_y = Mm(30.0);

        if *y < Mm(80.0) {
            return true;
        }

        let user = db.get_user_by_id(user_id).ok();

        layer.use_text(
            "________________________________________________________________________________",
            8.0,
            x,
            *y,
            font,
        );
        *y -= Mm(6.0);

        layer.use_text(user_name, 12.0, x, *y, font_bold);
        *y -= Mm(6.0);

        if let Some(ref u) = user {
            let mut info_parts = Vec::new();
            if !u.dni.is_empty() {
                info_parts.push(format!("DNI: {}", u.dni));
            }
            if let Some(ref phone) = u.phone {
                if !phone.is_empty() {
                    info_parts.push(format!("Tel: {}", phone));
                }
            }
            if !u.address.is_empty() && u.address.len() < 35 {
                info_parts.push(u.address.clone());
            }
            if !info_parts.is_empty() {
                layer.use_text(&info_parts.join("   |   "), 8.0, x, *y, font_italic);
                *y -= Mm(5.0);
            }
        }

        *y -= Mm(2.0);

        let col_widths = [Mm(22.0), Mm(22.0), Mm(55.0), Mm(22.0), Mm(35.0), Mm(20.0)];
        let headers = ["Inicio", "Devol.", "Artigos", "Estado", "Notas", ""];
        let mut col_x = x;
        for (i, header) in headers.iter().enumerate() {
            layer.use_text(*header, 7.0, col_x, *y, font_bold);
            col_x += col_widths[i];
        }
        *y -= Mm(4.0);

        for loan in loans {
            if *y < min_y {
                return true;
            }

            let items_text: String = loan
                .items
                .iter()
                .map(|i| i.item_name.clone())
                .collect::<Vec<_>>()
                .join(", ");
            let items_display = if items_text.len() > 32 {
                format!("{}...", &items_text[..29])
            } else {
                items_text
            };

            let status_text = match loan.status {
                LoanStatus::Active => "Activo",
                LoanStatus::Pending => "Pendente",
                LoanStatus::Returned => "Devolto",
                LoanStatus::Overdue => "Atrasado",
            };
            let end_date = loan
                .actual_end_date
                .map(|d| d.format("%d/%m/%y").to_string())
                .unwrap_or_else(|| "-".to_string());

            let notes_display = loan
                .notes
                .as_ref()
                .map(|n| {
                    if n.len() > 18 {
                        format!("{}...", &n[..15])
                    } else {
                        n.clone()
                    }
                })
                .unwrap_or_default();

            let row_data: [String; 5] = [
                loan.start_date.format("%d/%m/%y").to_string(),
                end_date,
                items_display,
                status_text.to_string(),
                notes_display,
            ];

            let mut col_x = x;
            for (i, text) in row_data.iter().enumerate() {
                layer.use_text(text, 7.0, col_x, *y, font);
                col_x += col_widths[i];
            }
            *y -= Mm(4.0);
        }

        *y -= Mm(8.0);
        false
    }

    current_layer.use_text(
        "CONCELLO DE BARREIROS",
        18.0,
        margin_left,
        y_pos,
        &helvetica_bold,
    );
    y_pos -= Mm(7.0);
    current_layer.use_text(
        "Servizo de Axuda ao Fogar (SAF)",
        11.0,
        margin_left,
        y_pos,
        &helvetica,
    );
    y_pos -= Mm(3.0);
    current_layer.use_text(
        "________________________________________________________________________________",
        8.0,
        margin_left,
        y_pos,
        &helvetica,
    );
    y_pos -= Mm(10.0);

    current_layer.use_text(
        &format!("INFORME ANUAL DE ACTIVIDADE - {}", year),
        14.0,
        margin_left,
        y_pos,
        &helvetica_bold,
    );
    y_pos -= Mm(6.0);

    current_layer.use_text(
        &format!(
            "Data de xeración: {}",
            chrono::Local::now().format("%d/%m/%Y ás %H:%M")
        ),
        9.0,
        margin_left,
        y_pos,
        &helvetica_oblique,
    );
    y_pos -= Mm(12.0);

    current_layer.use_text("┌──────────────────────────────────────────────────────────────────────────────────────────┐", 8.0, margin_left, y_pos, &helvetica);
    y_pos -= Mm(5.0);
    current_layer.use_text(
        "│  RESUMO DO ANO",
        10.0,
        margin_left,
        y_pos,
        &helvetica_bold,
    );
    y_pos -= Mm(6.0);

    let total_items: usize = year_loans.iter().map(|l| l.items.len()).sum();
    let active_loans = year_loans
        .iter()
        .filter(|l| l.status == LoanStatus::Active)
        .count();
    let returned_loans = year_loans
        .iter()
        .filter(|l| l.status == LoanStatus::Returned)
        .count();

    let summary_text = format!(
        "│  Prestamos totais: {}   |   Usuarios/as: {}   |   Artigos: {}",
        year_loans.len(),
        user_loans.len(),
        total_items
    );
    current_layer.use_text(&summary_text, 9.0, margin_left, y_pos, &helvetica);
    y_pos -= Mm(5.0);

    let status_text = format!(
        "│  Activos: {}   |   Devoltos: {}   |   Outros: {}",
        active_loans,
        returned_loans,
        year_loans.len() - active_loans - returned_loans
    );
    current_layer.use_text(&status_text, 9.0, margin_left, y_pos, &helvetica);
    y_pos -= Mm(5.0);
    current_layer.use_text("└──────────────────────────────────────────────────────────────────────────────────────────┘", 8.0, margin_left, y_pos, &helvetica);
    y_pos -= Mm(12.0);

    current_layer.use_text(
        "DETALLE POR USUARIO/A",
        12.0,
        margin_left,
        y_pos,
        &helvetica_bold,
    );
    y_pos -= Mm(3.0);
    current_layer.use_text(
        "________________________________________________________________________________",
        8.0,
        margin_left,
        y_pos,
        &helvetica,
    );
    y_pos -= Mm(10.0);

    if year_loans.is_empty() {
        current_layer.use_text(
            "Non se rexistraron prestamos neste ano.",
            11.0,
            margin_left,
            y_pos,
            &helvetica_oblique,
        );
    } else {
        let mut sorted_users: Vec<_> = user_loans.iter().collect();
        sorted_users.sort_by(|a, b| {
            a.1.first()
                .map(|l| &l.user_name)
                .cmp(&b.1.first().map(|l| &l.user_name))
        });

        let mut users_to_process: VecDeque<_> = sorted_users.into_iter().collect();
        let mut current_layer_ref = current_layer.clone();
        let mut page_num = 1;

        while let Some((user_id, u_loans)) = users_to_process.pop_front() {
            let user_name = u_loans.first().map(|l| l.user_name.as_str()).unwrap_or("?");

            let needs_new_page = draw_user_section(
                &current_layer_ref,
                db,
                user_id,
                user_name,
                &u_loans,
                margin_left,
                &mut y_pos,
                &helvetica_bold,
                &helvetica,
                &helvetica_oblique,
            );

            if needs_new_page && !users_to_process.is_empty() {
                page_num += 1;
                let (new_page, new_layer) = doc.add_page(Mm(210.0), Mm(297.0), "Layer 1");
                current_layer_ref = doc.get_page(new_page).get_layer(new_layer);
                y_pos = Mm(277.0);

                current_layer_ref.use_text(
                    &format!("CONCELLO DE BARREIROS - SAF - {} (páx. {})", year, page_num),
                    8.0,
                    margin_left,
                    y_pos,
                    &helvetica_oblique,
                );
                y_pos -= Mm(5.0);
                current_layer_ref.use_text("________________________________________________________________________________", 8.0, margin_left, y_pos, &helvetica);
                y_pos -= Mm(12.0);

                users_to_process.push_front((user_id, u_loans));
            }
        }
    }

    y_pos = Mm(15.0);
    current_layer.use_text(
        "________________________________________________________________________________",
        8.0,
        margin_left,
        y_pos,
        &helvetica,
    );
    y_pos -= Mm(5.0);
    current_layer.use_text(
        "Concello de Barreiros - Servizo de Axuda ao Fogar",
        7.0,
        margin_left,
        y_pos,
        &helvetica_oblique,
    );

    doc.save(&mut BufWriter::new(File::create(path)?))?;
    Ok(())
}
