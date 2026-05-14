const { register, login } = require('./auth.service');
 
async function registerHandler(req, res) {
  try {
    const user = await register(req.body);
    res.status(201).json({ success: true, data: user, message: 'Account created' });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
}
 
async function loginHandler(req, res) {
  try {
    const result = await login(req.body);
    res.json({ success: true, data: result });
  } catch (err) { res.status(401).json({ success: false, message: err.message }); }
}
 
module.exports = { registerHandler, loginHandler };
