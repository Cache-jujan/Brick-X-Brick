const { syncUser, getMe } = require('./auth.service')

const sync = async (req, res) => {
  try {
    const { name, role } = req.body
    if (!name || !role) 
      return res.status(400).json({ error: 'name and role are required' })

    const user = await syncUser(req.user, name, role)
    res.status(200).json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const me = async (req, res) => {
  try {
    const user = await getMe(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { sync, me }