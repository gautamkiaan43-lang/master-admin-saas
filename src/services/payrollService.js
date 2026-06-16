/**
 * Payroll Service — Super Admin Backend
 *
 * Encapsulates all HTTP communication from Super Admin → Payroll backend.
 * This is the ONLY place in the Super Admin codebase that knows the Payroll URL.
 *
 * All calls use the internal API key for authentication (no JWT needed).
 *
 * Environment variables required:
 *   PAYROLL_API_URL          : e.g. http://localhost:5001
 *   PAYROLL_INTERNAL_API_KEY : must match Payroll backend's INTERNAL_API_KEY
 */

const axios = require('axios');
const { logApiCall } = require('../middleware/apiLogger');

const getPayrollBase = () => process.env.PAYROLL_API_URL || 'http://localhost:5001';

const getInternalHeaders = () => ({
  'Content-Type': 'application/json',
  'x-internal-api-key': process.env.PAYROLL_INTERNAL_API_KEY || '',
});

/**
 * Provision a new company in the Payroll system.
 *
 * Called when a company registers in Super Admin with softwareName === 'Payroll Software'.
 *
 * @param {Object} userData - The registered user's data from Super Admin
 * @param {string} userData.companyName
 * @param {string} userData.email
 * @param {string} userData.name
 * @param {string} userData.plainPassword - plain text password (hashed separately in Payroll)
 * @param {string} [userData.phone]
 * @returns {Promise<{ payrollCompanyId: number, payrollAdminId: number }|null>}
 *          Returns null on failure (fail-silently mode)
 */
const provisionPayrollCompany = async (userData) => {
  const url = `${getPayrollBase()}/api/internal/provision-company`;

  const body = {
    company_name: userData.companyName,
    admin_email: userData.email,
    admin_name: userData.name,
    admin_password: userData.plainPassword,
    admin_phone: userData.phone || null,
  };

  try {
    const response = await logApiCall('POST', url, () =>
      axios.post(url, body, { headers: getInternalHeaders(), timeout: 10000 })
    );

    const { payrollCompanyId, payrollAdminId } = response.data.data;

    return { payrollCompanyId, payrollAdminId };
  } catch (error) {
    const errMsg = error?.response?.data?.message || error.message;
    console.error('[PAYROLL_SERVICE] provisionPayrollCompany failed:', errMsg);
    throw new Error(errMsg);
  }
};

/**
 * Sync a company's status from Super Admin → Payroll.
 *
 * Called when Super Admin activates, deactivates, or blocks a company.
 *
 * @param {number} payrollCompanyId - The Payroll company ID stored in Super Admin DB
 * @param {string} status - 'active' | 'suspended' | 'inactive'
 * @returns {Promise<boolean>} true if synced successfully, false on failure
 */
const syncCompanyStatus = async (payrollCompanyId, status) => {
  if (!payrollCompanyId) {
    console.log('[PAYROLL_SERVICE] No payrollCompanyId — skipping status sync.');
    return false;
  }

  const url = `${getPayrollBase()}/api/internal/companies/${payrollCompanyId}/status`;

  try {
    await logApiCall('PUT', url, () =>
      axios.put(url, { status }, { headers: getInternalHeaders(), timeout: 8000 })
    );

    return true;
  } catch (error) {
    // Fail silently — Super Admin status change still takes effect locally
    console.error(
      `[PAYROLL_SERVICE] syncCompanyStatus failed for company ${payrollCompanyId} (non-fatal):`,
      error?.response?.data?.message || error.message
    );
    return false;
  }
};

const syncTicketReply = async (ticketNumber, replyData) => {
  const url = `${getPayrollBase()}/api/internal/support/sync`;
  try {
    await logApiCall('POST', url, () =>
      axios.post(url, { action: 'reply', ticketNumber, reply: replyData }, { headers: getInternalHeaders(), timeout: 8000 })
    );
    return true;
  } catch (error) {
    console.error(
      `[PAYROLL_SERVICE] syncTicketReply failed for ticket ${ticketNumber}:`,
      error?.response?.data?.message || error.message
    );
    return false;
  }
};

const syncTicketStatus = async (ticketNumber, status, priority) => {
  const url = `${getPayrollBase()}/api/internal/support/sync`;
  try {
    await logApiCall('POST', url, () =>
      axios.post(url, { action: 'status', ticketNumber, status, priority }, { headers: getInternalHeaders(), timeout: 8000 })
    );
    return true;
  } catch (error) {
    console.error(
      `[PAYROLL_SERVICE] syncTicketStatus failed for ticket ${ticketNumber}:`,
      error?.response?.data?.message || error.message
    );
    return false;
  }
};

module.exports = {
  provisionPayrollCompany,
  syncCompanyStatus,
  syncTicketReply,
  syncTicketStatus,
};
