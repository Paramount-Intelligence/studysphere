import { google } from "googleapis";

function getAuthToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !privateKey) {
    return null;
  }

  // Handle newline escapes in private key string
  privateKey = privateKey.replace(/\\n/g, "\n");

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

// Fetch university courses dynamically from the Google Sheet
export async function fetchCoursesFromSheet() {
  const auth = getAuthToken();
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!auth || !sheetId) {
    throw new Error("Google Sheets environment credentials are not configured.");
  }

  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Courses!A:J"
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    return [];
  }

  // Parse headers: university | level | faculty | name | language | duration | fee | original_fee | discount_fee | campus
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const dataRows = rows.slice(1);

  return dataRows.map((row) => {
    const course = {};
    headers.forEach((header, index) => {
      let val = row[index] !== undefined ? row[index].trim() : "";
      
      // Parse numeric tuition values
      if (["fee", "original_fee", "discount_fee"].includes(header)) {
        if (val === "" || val.toLowerCase() === "null" || val.toLowerCase() === "n/a") {
          course[header] = null;
        } else {
          const parsed = Number(val.replace(/[^0-9.]/g, ""));
          course[header] = isNaN(parsed) ? null : parsed;
        }
      } else if (header === "duration") {
        const parsed = Number(val);
        course[header] = isNaN(parsed) ? null : parsed;
      } else {
        course[header] = val || null;
      }
    });
    return course;
  });
}

// Append assessment lead or sub-agent inquiry to sheet submissions tab
export async function appendSubmissionToSheet(data) {
  const auth = getAuthToken();
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!auth || !sheetId) {
    console.warn("Google Sheets credentials not set. Submission logging to Sheet skipped.");
    return false;
  }

  try {
    const sheets = google.sheets({ version: "v4", auth });
    
    // Rows columns mapping: id | date | type | name | email | phone | university | program | details
    const rowValues = [
      data.id || Date.now().toString(),
      new Date().toISOString(),
      data.level === "B2B Partner Request" ? "B2B Partner Application" : "Student Assessment",
      data.name,
      data.email,
      data.phone,
      data.level === "B2B Partner Request" ? "N/A" : data.university || "Any",
      data.program || "N/A",
      data.message || ""
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Submissions!A:I",
      valueInputOption: "RAW",
      requestBody: {
        values: [rowValues]
      }
    });

    return true;
  } catch (error) {
    console.error("Google Sheets API append row error:", error);
    return false;
  }
}

// Fetch inquiry submissions dynamically from the Google Sheet Submissions tab
export async function fetchSubmissionsFromSheet() {
  const auth = getAuthToken();
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!auth || !sheetId) {
    throw new Error("Google Sheets environment credentials are not configured.");
  }

  try {
    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Submissions!A:I"
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return [];
    }

    // Parse headers: id | date | type | name | email | phone | university | program | details
    const headers = rows[0].map(h => h.trim().toLowerCase());
    const dataRows = rows.slice(1);

    // Map to matching objects and reverse to show newest first
    return dataRows.map((row) => {
      const submission = {};
      headers.forEach((header, index) => {
        submission[header] = row[index] !== undefined ? row[index].trim() : "";
      });
      
      // Ensure fields match what admin/page.js expects:
      return {
        id: submission.id,
        date: submission.date,
        level: submission.type === "B2B Partner Application" ? "B2B Partner Request" : "Student Assessment",
        name: submission.name,
        email: submission.email,
        phone: submission.phone,
        university: submission.university || "Any",
        program: submission.program || "N/A",
        message: submission.details || ""
      };
    }).reverse();
  } catch (error) {
    console.error("Error reading submissions from Google Sheets:", error);
    throw error;
  }
}
