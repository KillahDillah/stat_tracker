function Authenticate (req,res,next){
	const token = req.get('Authorization')

	const sql = `
		SELECT * 
		FROM users
		WHERE token = ?
	`
	conn.query(sql,[token], function(err,results,fields){
		if (results.length > 0){
			next()
		} else {
			res.status(401).json({
				message: "Not Authorized"
			})	
		}
	})
}

module.exports = Authenticate