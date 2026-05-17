const { createProject, getProjects } = require('./projects.service')

const create = async (req, res) => {
  try {
    const { name, description, clientName, budget, startDate, endDate, items } = req.body
    if (!name || !budget || !startDate)
      return res.status(400).json({ error: 'name, budget and startDate are required' })

    const project = await createProject(req.dbUser.id, {
      name, description, clientName, budget, startDate, endDate, items
    })
    res.status(201).json(project)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const list = async (req, res) => {
  try {
    const projects = await getProjects(req.dbUser.id, req.dbUser.role)
    res.json(projects)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { create, list }