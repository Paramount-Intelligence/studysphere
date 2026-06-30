import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { appendSubmissionToSheet, fetchSubmissionsFromSheet } from "@/lib/sheets";

// Configure SMTP Transporter using environment variables
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("SMTP email credentials are not configured. Email notifications will be simulated in server logs.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(port || "587"),
    secure: port === "465",
    auth: { user, pass }
  });
}

// Render HTML Template for emails
function renderHtmlEmail({ title, intro, details, listHeader, listItems, footer }) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #020b13; color: #eef4ff; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #081420; border: 1px solid rgba(0, 175, 185, 0.15); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          .header { background: linear-gradient(135deg, #0e5d75 0%, #00afb9 100%); padding: 32px 24px; text-align: center; }
          .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.01em; }
          .body { padding: 32px 24px; line-height: 1.6; }
          .intro { font-size: 15px; color: #7fa0bc; margin-bottom: 24px; }
          .table-container { margin: 20px 0; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; }
          .list-header { font-size: 16px; font-weight: 800; color: #ffffff; margin: 24px 0 12px; border-left: 3px solid #00afb9; padding-left: 10px; }
          .footer { background: #01060a; padding: 20px 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); font-size: 12px; color: #3d5668; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="body">
            <div class="intro">${intro}</div>
            
            <div class="table-container">
              <table style="width: 100%; border-collapse: collapse;">
                ${details.map((d, index) => {
    const isLast = index === details.length - 1;
    const borderStyle = isLast ? "" : "border-bottom: 1px solid rgba(255,255,255,0.05);";
    return `
                    <tr>
                      <td style="padding: 10px 0; font-weight: 700; color: #34d399; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; width: 40%; vertical-align: middle; ${borderStyle}">${d.label}</td>
                      <td style="padding: 10px 0; color: #ffffff; font-size: 14px; font-weight: 500; text-align: right; vertical-align: middle; ${borderStyle}">${d.value}</td>
                    </tr>
                  `;
  }).join('')}
              </table>
            </div>

            ${listItems && listItems.length > 0 ? `
              <div class="list-header">${listHeader}</div>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                ${listItems.map(item => `
                  <tr style="margin-bottom: 12px; display: block;">
                    <td style="padding: 14px 16px; background: rgba(0, 175, 185, 0.04); border: 1px solid rgba(0, 175, 185, 0.15); border-radius: 8px; display: block; width: 100%; box-sizing: border-box;">
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="vertical-align: middle;">
                            <div style="font-weight: 700; color: #ffffff; font-size: 14px; margin-bottom: 4px; line-height: 1.3;">${item.title}</div>
                            <div style="font-size: 12px; color: #7fa0bc; line-height: 1.2;">${item.desc}</div>
                          </td>
                          <td style="text-align: right; vertical-align: middle; width: 120px; font-weight: 800; color: #1ce5f2; font-size: 14.5px; white-space: nowrap; padding-left: 10px;">
                            ${item.price}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                `).join('')}
              </table>
            ` : ''}
          </div>
          <div class="footer">
            ${footer}
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data.name || !data.email || !data.phone) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const newInquiry = {
      id: Date.now().toString(),
      ...data
    };

    // Save to Google Sheet
    try {
      const sheetLogged = await appendSubmissionToSheet(newInquiry);
      if (!sheetLogged) {
        console.error("Google Sheets append returned false (verify sheet ID, credentials, and 'Submissions' tab exist)");
      }
    } catch (sheetErr) {
      console.error("Google Sheets submission write error:", sheetErr.message);
    }

    // Attempt SMTP Email sending asynchronously
    try {
      const transporter = createTransporter();
      if (transporter) {
        const fromEmail = process.env.SMTP_FROM || transporter.options.auth.user;
        const isAdminRequest = data.level === "B2B Partner Request";

        if (isAdminRequest) {
          // 1. Send Agency Request notification to Administrator (info@azconsultant.com)
          const adminHtml = renderHtmlEmail({
            title: "New B2B Agency Partnership Request",
            intro: "A new agency rep has submitted a partnership request to the AZ Consultant sub-agent network.",
            details: [
              { label: "Agency Name", value: data.program || "N/A" },
              { label: "Director Name", value: data.name },
              { label: "Email Address", value: data.email },
              { label: "Phone / Whatsapp", value: data.phone },
              { label: "Operational Region", value: data.message.match(/Operational Country: (.*?)\n/)?.[1] || "N/A" },
              { label: "Annual Volume", value: data.message.match(/Student Volume: (.*?)\n/)?.[1] || "N/A" }
            ],
            footer: "AZ Consultant Admissions Portal • Istanbul, Turkey"
          });

          await transporter.sendMail({
            from: `"AZ Consultant Admissions" <${fromEmail}>`,
            to: "info@azconsultant.com",
            subject: `B2B Agency Request: ${data.program || data.name}`,
            html: adminHtml
          });

          // 2. Send receipt confirmation email to Agency Applicant
          const agencyHtml = renderHtmlEmail({
            title: "Application Received - AZ Consultant B2B",
            intro: `Dear ${data.name}, thank you for applying to the AZ Consultant Partner Network. Our agency support managers are reviewing your details.`,
            details: [
              { label: "Registered Rep", value: data.name },
              { label: "Agency Details", value: data.program || "N/A" },
              { label: "Network Status", value: "Under Review" }
            ],
            footer: "AZ Consultant Admissions Desk • B-104, Bina No. 12, Hilal Konutları, Safa Caddesi, Pendik, Istanbul"
          });

          await transporter.sendMail({
            from: `"AZ Consultant Admissions" <${fromEmail}>`,
            to: data.email,
            subject: "Partnership Application Received - AZ Consultant",
            html: agencyHtml
          });

        } else {
          // 3. Send Student Matching confirmation to Student
          const studentHtml = renderHtmlEmail({
            title: "Your Course Matching Report",
            intro: `Dear ${data.name}, here is the digital summary of matching programs compiled by the AZ Consultant eligibility tool. Our admissions counselors will email you guidance on transcript translation and visa requirements shortly.`,
            details: [
              { label: "Applicant Name", value: data.name },
              { label: "Target Degree", value: data.level },
              { label: "GPA Scale", value: data.gpa || "N/A" },
              { label: "Language Test Status", value: data.english || "N/A" },
              { label: "Max Budget limit", value: data.tuitionBudget || "N/A" }
            ],
            listHeader: "Your Recommended Programs",
            listItems: data.matches || [],
            footer: "AZ Consultant Admissions Desk • B-104, Bina No. 12, Hilal Konutları, Safa Caddesi, Şehli Mahallesi, Pendik, Istanbul"
          });

          await transporter.sendMail({
            from: `"AZ Consultant Admissions" <${fromEmail}>`,
            to: data.email,
            subject: "Turkish University Match Report - AZ Consultant",
            html: studentHtml
          });

          // 4. Send Lead Notification to Administrator
          const leadHtml = renderHtmlEmail({
            title: "New Student Eligibility Lead",
            intro: "A prospective student has calculated course matches on the eligibility tool.",
            details: [
              { label: "Student Name", value: data.name },
              { label: "Email Address", value: data.email },
              { label: "Phone", value: data.phone },
              { label: "Degree Level", value: data.level },
              { label: "GPA Score", value: data.gpa || "N/A" },
              { label: "Language Status", value: data.english || "N/A" },
              { label: "Tuition Budget", value: data.tuitionBudget || "N/A" },
              { label: "Preferences & Score Card", value: data.message }
            ],
            listHeader: "Calculated Matching Programs",
            listItems: data.matches || [],
            footer: "AZ Consultant Lead Capture Portal"
          });

          await transporter.sendMail({
            from: `"AZ Consultant Leads" <${fromEmail}>`,
            to: "info@azconsultant.com",
            subject: `Student Match Lead: ${data.name} (${data.level})`,
            html: leadHtml
          });
        }
      }
    } catch (mailErr) {
      // Log error but do not fail the POST request
      console.error("Nodemailer SMTP failed to send emails:", mailErr);
    }

    return NextResponse.json({ success: true, inquiry: newInquiry });
  } catch (error) {
    console.error("Error saving inquiry", error);
    return NextResponse.json({
      error: "Server error occurred.",
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (authHeader !== expectedPassword) {
      return NextResponse.json({ error: "Unauthorized access. Invalid credentials." }, { status: 401 });
    }

    const sheetInquiries = await fetchSubmissionsFromSheet();
    return NextResponse.json(sheetInquiries);
  } catch (error) {
    console.error("Error reading inquiries from Google Sheets:", error);
    return NextResponse.json({
      error: "Failed to read inquiries from Google Sheets.",
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
