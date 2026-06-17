const axios = require('axios');
const { logApiCall } = require('../middleware/apiLogger');

const getAttendanceBase = () => process.env.ATTENDANCE_API_URL || 'http://localhost:8081';

const getInternalHeaders = () => ({
  'Content-Type': 'application/json',
  'x-api-key': process.env.ATTENDANCE_INTERNAL_API_KEY || 'kiaan_attendance_secret_2026',
});

const provisionAttendanceCompany = async (userData) => {
  const url = `${getAttendanceBase()}/api/internal/provision-company`;

  const body = {
    companyName: userData.companyName,
    email: userData.email,
    name: userData.name,
    password: userData.plainPassword,
    phone: userData.phone || null,
    planName: userData.plan || 'Basic'
  };

  try {
    const response = await logApiCall('POST', url, () =>
      axios.post(url, body, { headers: getInternalHeaders(), timeout: 10000 })
    );

    const { companyId, userId } = response.data;
    return { attendanceCompanyId: companyId, attendanceAdminId: userId };
  } catch (error) {
    console.error(
      '[ATTENDANCE_SERVICE] provisionAttendanceCompany failed (non-fatal):',
      error?.response?.data?.message || error.message
    );
    return null;
  }
};

const syncAttendanceStatus = async (attendanceCompanyId, email, status) => {
  if (!email) {
    console.log('[ATTENDANCE_SERVICE] No email — skipping status sync.');
    return false;
  }

  const url = `${getAttendanceBase()}/api/internal/toggle-status`;

  try {
    await logApiCall('POST', url, () =>
      axios.post(url, { email, status }, { headers: getInternalHeaders(), timeout: 8000 })
    );
    return true;
  } catch (error) {
    console.error(
      `[ATTENDANCE_SERVICE] syncAttendanceStatus failed for company ${email} (non-fatal):`,
      error?.response?.data?.message || error.message
    );
    return false;
  }
};

module.exports = {
  provisionAttendanceCompany,
  syncAttendanceStatus,
};
