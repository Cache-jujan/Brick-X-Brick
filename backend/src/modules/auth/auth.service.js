const prisma = require('../../config/db')

const syncUser = async (supabaseUser, name, role) => {
  const existing = await prisma.user.findUnique({
    where: { id: supabaseUser.id }
  })

  if (existing) return existing

  return await prisma.user.create({
    data: {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name,
      role
    }
  })
}

const getMe = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId }
  })
}

module.exports = { syncUser, getMe }