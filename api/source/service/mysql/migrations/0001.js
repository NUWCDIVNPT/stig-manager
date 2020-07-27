const Importer = require('./lib/mysql-import.js')
const config = require('../../../utils/config')
const path = require('path')
const fs = require('fs')

module.exports = {
    up: async (pool) => {
        let migrationName = path.basename(__filename, '.js')
        console.log(`Running migration ${migrationName} UP`)
        const importer = new Importer({
            host: config.database.host,
            port: config.database.port,
            user: config.database.username,
            password: config.database.password,                         
            database: config.database.schema                         
        })
        let dir = path.join(__dirname, 'sql', migrationName, 'up')
        let files = await fs.promises.readdir(dir)
        for (file of files) {
            console.log(`Running MySQL script ${file}...`)
            await importer.import(path.join(dir, file))
        }
    },
    down: async(pool)=> {
        let migrationName = path.basename(__filename, '.js')
        console.log(`Running migration ${migrationName} DOWN`)
        await pool.query(`DROP DATABASE IF EXISTS stigman`)
    }
}