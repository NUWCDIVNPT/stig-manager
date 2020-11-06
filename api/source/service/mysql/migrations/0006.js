const Importer = require('./lib/mysql-import.js')
const config = require('../../../utils/config')
const path = require('path')
const fs = require('fs')

module.exports = {
    up: async (pool) => {
        let migrationName = path.basename(__filename, '.js')
        console.log(`[DB] Running migration ${migrationName} UP`)
        const importer = new Importer(pool)
        let dir = path.join(__dirname, 'sql', migrationName, 'up')
        let files = await fs.promises.readdir(dir)
        for (file of files) {
            console.log(`[DB] Running MySQL script ${file}...`)
            await importer.import(path.join(dir, file))
        }
    },
    down: async(pool)=> {
        let migrationName = path.basename(__filename, '.js')
        console.log(`[DB] Running migration ${migrationName} DOWN`)
        const importer = new Importer(pool)
        let dir = path.join(__dirname, 'sql', migrationName, 'down')
        let files = await fs.promises.readdir(dir)
        for (file of files) {
            console.log(`[DB] Running MySQL script ${file}...`)
            await importer.import(path.join(dir, file))
        }
    }
}