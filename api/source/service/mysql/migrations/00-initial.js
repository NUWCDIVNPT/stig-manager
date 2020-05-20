const Importer = require('./lib/mysql-import.js')
const config = require('../../../utils/config')
const path = require('path')
const fs = require('fs')

module.exports = {
    up: async (pool) => {
        const importer = new Importer({
            host: config.database.host,
            port: config.database.port,
            user: config.database.username,
            password: config.database.password                         
        })
        let dir = path.join(__dirname, '../init')
        let files = await fs.promises.readdir(dir)
        for (file of files) {
            console.log(`Running MySQL script ${file}...`)
            await importer.import(path.join(dir, file))
        }
    },
    down: async(pool)=> {
        await pool.query(`DROP DATABASE IF EXISTS stigman`)
    }
}