const oracledb = require('oracledb')
const path = require('path')
const { promises: fs } = require('fs')

let _this = this

module.exports = {
  up: async () => {
    let connection, result
    try {
      let migrationName = path.basename(__filename, '.js')
      console.log(`Running migration ${migrationName} UP`)
      let dir = path.join(__dirname, 'sql', migrationName, 'up')
      let files = await fs.readdir(dir)
      connection = await oracledb.getConnection()
      for (file of files) {
        let data = await fs.readFile(path.join(dir, file), 'utf8')
        console.log(`Running Oracle script ${file}...`)
        let ddls = data.split(/;\n/)
        let x
        for (x = 0, l = ddls.length; x < l; x++) {
          try {
            if (ddls[x].length > 0) {
              result = await connection.execute(ddls[x])
            }
          }
          catch (err) {
            console.log(`${ddls[x]} : ${err.message}`)
          }
        }
      }
    }
    catch (err) {
      console.log(err)
    }
    finally {
      if (typeof connection !== 'undefined') {
        await connection.close()
      }
    }
  },
  down: async () => {
    let migrationName = path.basename(__filename, '.js')
    console.log(`No migration ${migrationName} DOWN`)
  }
}