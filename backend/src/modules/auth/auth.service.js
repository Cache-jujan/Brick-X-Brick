const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/db');
const { createAuditLog } = require('../../middleware/auditLog');
 
async function register({ name, email, password, role }) {
  if (await prisma.user.findUnique({ where: { email } }))
    throw new Error('Email already registered');
  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role },
    select: { id: true, name: true, email: true, role: true }
  });
  await createAuditLog({ userId: user.id, action: 'REGISTER', entity: 'User', entityId: user.id });
  return user;
}
 
async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password)))
    throw new Error('Invalid email or password');
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  await createAuditLog({ userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}
 
module.exports = { register, login };
