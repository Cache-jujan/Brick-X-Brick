const prisma = require('../../config/db')

const getUsersByRole = async (role) => {
  return prisma.user.findMany({
    where: role ? { role } : {},
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    },
    orderBy: { name: 'asc' }
  })
}

module.exports = { getUsersByRole }