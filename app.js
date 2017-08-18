const express = require('express')
const app = express()
const path = require('path')
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser')
const config = require('config')
const mysql = require('mysql')
const uuid = require('uuid')
const bcrypt = require('bcrypt')
const Authenticate = require ('./middleware/auth')

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
app.engine('mustache', mustacheExpress())
app.set('views', './views')
app.set('view engine', 'mustache')
app.use(express.static(path.join(__dirname, 'static')))


// before you use this, make sure to update the default.json file in /config
const conn = mysql.createConnection({
  host: config.get('db.host'),
  database: config.get('db.database'),
  user: config.get('db.user'),
  password: config.get('db.password')
})


app.get('/', function(req,res,next){
	res.render('index')
})

app.get('/securepath', Authenticate, function(req,res,next){
	res.json({
		message: "Bueno"
	})
})

app.post("/token", function(req,res,next){
	const username = req.body.username
	const password = req.body.password

	const sql = `
		SELECT password 
		FROM users
		WHERE username = ?
	`

	conn.query (sql, [username], function(err,results,fields){
		if (err){
			res.json(err)
		}
		const hashedPassword = results[0].password
		if (password == hashedPassword) {
			const token = uuid ()

				const tokenUpdateSQL = `
					UPDATE users
					SET token = ?
					WHERE username = ?
				`
				conn.query(tokenUpdateSQL, [token, username], function(err,results,fields){
					res.json({
						token:token
					})
				})			
		} else {
			res.status(401).json({
				message:"Invalid username and password"
			})
		}
	})
})

app.post("/register", function(req,res,next){
	const username = req.body.username
	const password = req.body.password
	const token = uuid()

	const sql = `
	INSERT INTO users (username, password, token)
	VALUES (?, ?,?)
	`
	bcrypt.hash(password, 10).then(function(hashedPassword){
		conn.query(sql, [username, hashedPassword, token], function(err,results,fields){
			res.json({
				message: "Success!",
				token:token
			})
		})
	})
})


app.get ("/activities", function (req,res,next){
	const sql = `
		SELECT *
		FROM activities a
		ORDER BY a.id DESC
	`
	conn.query(sql,function(err,results,fields){
		res.json(results)
	})
})

app.post ("/activities", function (req,res,next){
	const sql = `
		INSERT INTO activities (name)
		VALUES (?)
	`
	conn.query(sql,[name], function(err,results,fields){
		res.json(results)
	})
})

app.get("/activities/:id", function(req,res,next){

	const sql = `
		SELECT s.*, a.sport
		FROM stats s
		JOIN activities a ON s.activity_id = a.id
		WHERE a.id = ?
	`
	conn.query(sql, [req.params.id], function(err,results,fields){
		if (err){
			res.json(err)
		} else {
			results[0].date = formatDate(results[0].date)
			res.json(results[0]);
		}
	})
})
function formatDate(uglyDate){
	let prettyDate = (uglyDate.getMonth()+1) + "/" + uglyDate.getDate() + "/" + uglyDate.getFullYear()
	return prettyDate
}

app.put("/activities/:id", function(req,res,next){
	const sql = `
		UPDATE activities
		SET sport = ?
		WHERE id = ?
	`
	conn.query (sql, [req.params.id], function(err,results,fields){
		res.json({
			message:"updated"
		})
	})
})

app.delete("/activities/:id", function(req,res,next){
	const sql = `
		DELETE FROM activities
		WHERE id = ?
	`

	conn.query(sql,[req.params.id], function(err,results,fields){
		if (err){
			res.json(err)
		} else {
			const sql2 = `
				DELETE FROM stats
				WHERE activity_id = ?
			`
			conn.query(sql2,[req.params.id], function(err,results,fields){
				if (err){
					res.json(err)
				} else {
					res.json({
						message:"deleted"
					})
				}
			})
		}
	})
})

app.post("/activities/:id/stats", function(req,res,next){
	const date = req.body.date
	const rounds = req.body.rounds

	const sql = `
		INSERT INTO stats (date,rounds, activity_id)
		VALUES (?,?,?)
	`
	conn.query(sql,[date, rounds, req.params.id], function(err,results,fields){
		if (err){
			res.json(err)
		} else {
			res.json(results)
		}
	})
})

app.delete("/stats/:id", function(req,res,next){
	const date = req.body.date

	const sql = `
	DELETE FROM stats
	WHERE date = ?
	`
	conn.query (sql,[date, req.params.id], function(err,results,fields){
		if (err){
			res.json(err)
		} else {
			res.json({
				message:"deleted"
			})
		}
	})
})

app.listen(3000, function(){
  console.log("App running on port 3000")
})
