var sqlite3 = require('sqlite3').verbose();
var DBG = true // @TODO set that to false before going to production

function Database() {
	this.db = null
	this.dName = null
}