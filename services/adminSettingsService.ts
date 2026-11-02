// services/adminSettingsService.ts
import pool from '../lib/mysql'; // Assuming your MySQL connection pool is in this file
import { AdminSettings, AdminSettingsFormData, DEFAULT_SETTINGS } from '@/types/adminSettings';
import { deepMerge } from '@/lib/utils'; // A utility for deep merging objects

/**
 * Fetches admin settings from the database.
 * @returns A promise that resolves to the admin settings object.
 */
export async function getAdminSettings(): Promise<AdminSettings> {
  const sql = `SELECT * FROM admin_settings WHERE id = ? LIMIT 1`;
  const [rows] = await pool.query(sql, ['main']);
  
  const dbSettings = rows[0]?.data ? JSON.parse(rows[0].data) : {};
  
  // Merge database settings with defaults
  const mergedSettings = deepMerge(DEFAULT_SETTINGS, dbSettings) as AdminSettings;
  return mergedSettings;
}

/**
 * Saves admin settings to the database.
 * @param formData - The form data to be converted and saved.
 * @returns A promise that resolves to the updated settings object.
 */
export async function saveAdminSettings(formData: AdminSettingsFormData): Promise<AdminSettings> {
  // Convert form data to the settings format
  const newSettings = formDataToSettings(formData); // You need to implement this conversion
  
  const sql = `
    INSERT INTO admin_settings (id, data)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE data = VALUES(data)
  `;
  const params = ['main', JSON.stringify(newSettings)];
  
  await pool.query(sql, params);
  
  return newSettings;
}

// You will need to implement this helper function.
// It converts the form data format to the AdminSettings format.
const formDataToSettings = (formData: AdminSettingsFormData): AdminSettings => {
    // This is a placeholder. You need to implement the full conversion logic.
    // Use your existing logic from the original hook.
    // For now, let's assume it does a simple mapping.
    const newSettings = DEFAULT_SETTINGS; // Start with a default copy
    newSettings.app.name = formData.appName;
    // ... add more mappings here
    return newSettings;
};