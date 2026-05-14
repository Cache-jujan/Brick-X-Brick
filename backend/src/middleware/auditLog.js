const prisma = require('../config/db');
 
async function createAuditLog({ userId, action, entity, entityId, oldValue, newValue }) {
  try {
    await prisma.auditLog.create({ data: { userId, action, entity, entityId, oldValue, newValue } });
  } catch (err) {
    console.error('Audit log error:', err);
    // Never throw — audit failure should not break the main action
  }
}
 
module.exports = { createAuditLog };
