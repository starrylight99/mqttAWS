// *** Login Auth ***
function checkAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next()
	}
	res.redirect('/login')
}
function checkNotAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return res.redirect('/')
	}
	next()
}



// *** Role Auth ***
function authAccess() {
	return (req, res, next) => {
		if (req.user.role != ROLE.SUPERUSER){
			res.status(401)
			return res.send('Not allowed')
		}
		next()
	}
}
function authRole(role) {
	return (req, res, next) => {
		if (req.user.role !== role) {
			res.status(401)
			return res.send('Not allowed')
		}
		next()
	}
}

function createConn(req){
	if (typeof req.user.login == 'undefined'){
		// Future code for multiple mqttclient
	}
	return
}

function allowConn(req, res, next){
	req.user.activeConn = false

	return next()
}
function checkConn(req, res, next){
	/* if (req.user.activeConn) {
	res.status(400)
	return res.send('Too many requests')
	} else {
	req.user.activeConn = true

	return next()
	} */
}

function checkPost(req, res, next){
	if (Object.keys(req.body).length == 0) {
		return
	} else {
		return next()
	}
}
module.exports = {
	checkAuthenticated,
	checkNotAuthenticated,
	authRole,
	authAccess,
	createConn,
	checkConn,
	allowConn,
	checkPost,
}