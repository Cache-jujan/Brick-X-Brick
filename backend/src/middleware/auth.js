const supabase = require('../config/supabase')
const prisma = require('../config/db')

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Invalid token' })

  req.user = user
  next()
}

const requireRole = (roles) => async (req, res, next) => {
  const dbUser = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!dbUser || !roles.includes(dbUser.role))
    return res.status(403).json({ error: 'Forbidden' })

  req.dbUser = dbUser
  next()
}

module.exports = { verifyToken, requireRole }