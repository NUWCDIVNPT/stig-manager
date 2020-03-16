const oracledb = require('oracledb')
const config = require('../../utils/config')

module.exports.initializeDatabase = async function () {
    try {
        let pool = await oracledb.createPool({
            user: config.database.username,
            password: config.database.password,
            connectString: `${config.database.host}/orclpdb1.localdomain`
        })
        console.log('Connection pool created')
        process.on('SIGTERM', closePoolAndExit)
        process.on('SIGINT',  closePoolAndExit)
        return pool
    }
    catch (err) {
        throw err
    }

    async function closePoolAndExit() {
        console.log('\nTerminating');
        try {
          // Get the pool from the pool cache and close it when no
          // connections are in use, or force it closed after 10 seconds
          // If this hangs, you may need DISABLE_OOB=ON in a sqlnet.ora file
          await oracledb.getPool().close(10);
          console.log('Pool closed');
          process.exit(0);
        } catch(err) {
          console.error(err.message);
          process.exit(1);
        }
    }   
}

module.exports.getUserObject = async function (username) {
    let connection, sql, binds, options, result
    try {
        connection = await oracledb.getConnection()
        sql = `
            SELECT
            ud.id as "id",
            ud.cn as "cn",
            ud.name as "name",
            ud.dept as "dept",
            r.role as "role",
            ud.canAdmin as "canAdmin"
        from 
            user_data ud
            left join roles r on r.id=ud.roleId
        where
            UPPER(cn)=UPPER(:0)
        `
        binds = [username]
        options = {
          outFormat: oracledb.OUT_FORMAT_OBJECT   // query result format
        }
        result = await connection.execute(sql, binds, options)
        await connection.close()
        result.rows[0].canAdmin = result.rows[0].canAdmin == 1
        return (result.rows[0])
    }
    catch (err) {
        throw err
    }     
}

module.exports.objectBind = function (object, binds) {
    let sqlStubs = []
    for (const property in object) {
        sqlStubs.push(`${property} = :${property}`)
        binds.push(object[property])
    }
    return sqlStubs.join(',')
}