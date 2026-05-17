const { getUsersByRole } = require('./users.service')

const list = async (req, res) => {
  try {
    const { role } = req.query
    const users = await getUsersByRole(role)
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { list }