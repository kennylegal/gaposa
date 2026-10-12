# Gaposa v2.2

University health management. Nurse intake → doctor consult → pharmacist dispense.

## v2.2 changes
- Server-side student lookup (typeahead) and profile endpoint
- Dashboard aggregates on the server (single call)
- Visit/Rx/Lab responses embed student info (no local cache needed)
- Store no longer bulk-loads students in API mode

## Roles
| Role | Can |
|---|---|
| Admin | Everything |
| Doctor | Consult visits awaiting doctor, prescribe, order labs, read students |
| Nurse | Intake (vitals + complaint), read, order labs |
| Pharmacist | Dispense, cancel, manage inventory |
| Receptionist | Manage students |

## Run
\`\`\`bash
bash Gaposa/run.sh                    # backend on :8000
cd Gaposa/frontend && python3 -m http.server 5500
\`\`\`

Logins: admin/admin123, doctor/doctor123, nurse/nurse123, pharmacist/pharma123, receptionist/reception123.

## API mode
Set \`API_ENABLED = true\` in \`frontend/js/api.js\`.
