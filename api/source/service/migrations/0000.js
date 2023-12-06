const Importer = require('./lib/mysql-import.js')
const logger = require('../../utils/logger')
const path = require('path')
const fs = require('fs')

module.exports = {
    up: async (pool) => {
        const migrationName = path.basename(__filename, '.js')
        try {
            logger.writeInfo('mysql', 'migration', {status: 'start', direction: 'up', name: migrationName })
            const importer = new Importer(pool)
            const dir = path.join(__dirname, 'sql', migrationName, 'up')
            const files = await fs.promises.readdir(dir)
            for (const file of files) {
                logger.writeInfo('mysql', 'migration', {status: 'running', name: migrationName, file })
                await importer.import(path.join(dir, file))
            }    
        }
        catch (e) {
            logger.writeError('mysql', 'migration', {status: 'error', name: migrationName, message: e.message})
            throw (e)
        }
    },
    down: async(pool)=> {
        try {
            const migrationName = path.basename(__filename, '.js')
            logger.writeInfo('mysql', 'migration', {status: 'start', direction: 'down', name: migrationName })
            const importer = new Importer(pool)
            const dir = path.join(__dirname, 'sql', migrationName, 'down')
            const files = await fs.promises.readdir(dir)
            for (const file of files) {
                logger.writeInfo('mysql', 'migration', {status: 'running', name: migrationName, file })
                await importer.import(path.join(dir, file))
            }
        }
        catch (e) {
            logger.writeError('mysql', 'migration', {status: 'error', name: migrationName, message: e.message})
            throw (e)
        }
    }
}