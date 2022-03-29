'use strict';
const dbUtils = require('./utils')

let _this = this

/**
Generalized queries for asset(s).
**/
exports.queryAssets = async function (inProjection = [], inPredicates = {}, elevate = false, userObject) {
  let connection
  try {
    const context = userObject.privileges.globalAccess || elevate ? dbUtils.CONTEXT_ALL : dbUtils.CONTEXT_USER

    const columns = [
      'CAST(a.assetId as char) as assetId',
      'a.name',
      'a.fqdn',
      `json_object (
        'collectionId', CAST(c.collectionId as char),
        'name', c.name
      ) as "collection"`,
      'a.description',
      'a.ip',
      `coalesce(
        (select
          json_arrayagg(BIN_TO_UUID(cl.uuid,1))
        from
          collection_label_asset_map cla
          left join collection_label cl on cla.clId = cl.clId
        where
          cla.assetId = a.assetId),
        json_array()
      ) as labelIds`,
      'a.mac',
      'a.noncomputing',
      'a.metadata'
    ]
    let joins = [
      'asset a',
      'left join collection c on a.collectionId = c.collectionId',
      'left join collection_grant cg on c.collectionId = cg.collectionId',
      'left join stig_asset_map sa on a.assetId = sa.assetId',
      'left join current_rev cr on sa.benchmarkId = cr.benchmarkId',
      'left join user_stig_asset_map usa on sa.saId = usa.saId'
    ]

    // PROJECTIONS
    if (inProjection.includes('statusStats')) {
      columns.push(`json_object(
        'stigCount', COUNT(sa.benchmarkId),
        'stigAssignedCount', COUNT(distinct usa.saId),
        'ruleCount', SUM(cr.ruleCount),
        'acceptedCount', SUM(sa.acceptedManual) + SUM(sa.acceptedAuto),
        'rejectedCount', SUM(sa.rejectedManual) + SUM(sa.rejectedAuto),
        'submittedCount', SUM(submittedManual) + SUM(submittedAuto),
        'savedCount', SUM(savedManual) + SUM(savedAuto),
        'minTs', DATE_FORMAT(LEAST(MIN(minTs), MIN(maxTs)),'%Y-%m-%dT%H:%i:%sZ'),
        'maxTs', DATE_FORMAT(GREATEST(MAX(minTs), MAX(maxTs)),'%Y-%m-%dT%H:%i:%sZ')
        ) as "statusStats"`)
    }
    if (inProjection.includes('stigGrants')) {
      columns.push(`(select
        CASE WHEN COUNT(byStig.stigAssetUsers) > 0 THEN json_arrayagg(byStig.stigAssetUsers) ELSE json_array() END
      from
        (select
          json_object('benchmarkId', r.benchmarkId, 'users',
          -- empty array on null handling 
          case when count(r.users) > 0 then json_arrayagg(r.users) else json_array() end ) as stigAssetUsers
        from
        (select
          sa.benchmarkId,
          -- if no user, return null instead of object with null property values
          case when ud.userId is not null then
            json_object(
              'userId', CAST(ud.userId as char), 
              'username', ud.username
            ) 
          else NULL end as users
          FROM 
            stig_asset_map sa
            left join user_stig_asset_map usa on sa.saId = usa.saId
            left join user_data ud on usa.userId = ud.userId
          WHERE
          sa.assetId = a.assetId) as r
        group by r.benchmarkId) as byStig) as "stigGrants"`)
    }
    if ( inProjection.includes('reviewers')) {
      // This projection is only available for endpoint /stigs/{benchmarkId}/assets
      // Subquery relies on predicate :benchmarkId being set
      columns.push(`(select
          case when count(u.userId > 0) then json_arrayagg(
          -- if no user, return null instead of object with null property values
          case when u.userId is not null then json_object('userId', CAST(u.userId as char), 'username', u.username) else NULL end) 
          else json_array() end as reviewers
        FROM 
          stig_asset_map sa
          left join user_stig_asset_map usa on sa.saId = usa.saId
          left join user u on usa.userId = u.userId
        WHERE
          sa.assetId = a.assetId and sa.benchmarkId = :benchmarkId) as "reviewers"`)
    }
    if (inProjection.includes('stigs')) {
      //TODO: If benchmarkId is a predicate in main query, this incorrectly only shows that STIG
      // joins.push('left join current_rev cr on sa.benchmarkId=cr.benchmarkId')
      joins.push('left join stig st on cr.benchmarkId=st.benchmarkId')
      columns.push(`cast(
        concat('[', 
          coalesce (
            group_concat(distinct 
              case when cr.benchmarkId is not null then 
                json_object(
                  'benchmarkId', cr.benchmarkId, 
                  'lastRevisionStr', concat('V', cr.version, 'R', cr.release), 
                  'lastRevisionDate', date_format(cr.benchmarkDateSql,'%Y-%m-%d'),
                  'title', st.title,
                  'ruleCount', cr.ruleCount)
              else null end 
        order by cr.benchmarkId),
            ''),
        ']')
      as json) as "stigs"`)
    }

    // PREDICATES
    let predicates = {
      statements: [],
      binds: []
    }
    if (inPredicates.assetId) {
      predicates.statements.push('a.assetId = ?')
      predicates.binds.push(inPredicates.assetId)
    }
    if (inPredicates.labelIds?.length) {
      joins.push('left join collection_label_asset_map cla2 on a.assetId = cla2.assetId')
      predicates.statements.push('cla2.clId IN (select clId from collection_label where uuid IN ?)')
      const uuidBinds = inPredicates.labelIds.map( uuid => dbUtils.uuidToSqlString(uuid))
      predicates.binds.push([uuidBinds])
    }
    if ( inPredicates.name ) {
      let matchStr = '= ?'
      if ( inPredicates.nameMatch && inPredicates.nameMatch !== 'exact') {
        matchStr = 'LIKE ?'
        switch (inPredicates.nameMatch) {
          case 'startsWith':
            inPredicates.name = `${inPredicates.name}%`
            break
          case 'endsWith':
            inPredicates.name = `%${inPredicates.name}`
            break
          case 'contains':
            inPredicates.name = `%${inPredicates.name}%`
            break
        }
      }
      predicates.statements.push(`a.name ${matchStr}`)
      predicates.binds.push(inPredicates.name)
    }
    if (inPredicates.collectionId) {
      predicates.statements.push('a.collectionId = ?')
      predicates.binds.push(inPredicates.collectionId)
    }
    if (inPredicates.benchmarkId) {
      predicates.statements.push('sa.benchmarkId = ?')
      predicates.binds.push(inPredicates.benchmarkId)
    }
    if ( inPredicates.metadata ) {
      for (const pair of inPredicates.metadata) {
        const [key, value] = pair.split(':')
        predicates.statements.push('JSON_CONTAINS(a.metadata, ?, ?)')
        predicates.binds.push( `"${value}"`,  `$.${key}`)
      }
    }
    if (context == dbUtils.CONTEXT_USER) {
      predicates.statements.push('cg.userId = ?')
      predicates.statements.push('CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END')
      predicates.binds.push(userObject.userId)
    }

    // CONSTRUCT MAIN QUERY
    let sql = 'SELECT '
    sql+= columns.join(",\n")
    sql += ' FROM '
    sql+= joins.join(" \n")
    if (predicates.statements.length > 0) {
      sql += "\nWHERE " + predicates.statements.join("\n and ")
    }
    sql += ' group by a.assetId, a.name, a.fqdn, a.collectionId, a.description, a.ip, a.mac, a.noncomputing, c.collectionId, c.name'
    sql += ' order by a.name'
  
    connection = await dbUtils.pool.getConnection()
    let [rows] = await connection.query(sql, predicates.binds)
    return (rows)
  }
  catch (err) {
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}

exports.queryStigsByAsset = async function (inPredicates = {}, elevate = false, userObject) {
  let connection
  try {
    const context = userObject.privileges.globalAccess || elevate ? dbUtils.CONTEXT_ALL : dbUtils.CONTEXT_USER
    const columns = [
      'distinct cr.benchmarkId', 
      `concat('V', cr.version, 'R', cr.release) as lastRevisionStr`, 
      `date_format(cr.benchmarkDateSql,'%Y-%m-%d') as lastRevisionDate`,
      'cr.ruleCount as ruleCount',
      'st.title'
    ]
    let joins = [
      'asset a',
      'left join collection c on a.collectionId = c.collectionId',
      'left join collection_grant cg on c.collectionId = cg.collectionId',
      'left join stig_asset_map sa on a.assetId = sa.assetId',
      'left join user_stig_asset_map usa on sa.saId = usa.saId',
      'inner join current_rev cr on sa.benchmarkId=cr.benchmarkId',
      'left join stig st on cr.benchmarkId=st.benchmarkId'
    ]
    // PREDICATES
    let predicates = {
      statements: [],
      binds: []
    }
    if (inPredicates.assetId) {
      predicates.statements.push('a.assetId = ?')
      predicates.binds.push( inPredicates.assetId )
    }
    if (inPredicates.benchmarkId) {
      predicates.statements.push('cr.benchmarkId = ?')
      predicates.binds.push( inPredicates.benchmarkId )
    }
    if (context == dbUtils.CONTEXT_USER) {
      predicates.statements.push('cg.userId = ?')
      predicates.statements.push('CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END')
      predicates.binds.push( userObject.userId )
    }
    // CONSTRUCT MAIN QUERY
    let sql = 'SELECT '
    sql+= columns.join(",\n")
    sql += ' FROM '
    sql+= joins.join(" \n")
    if (predicates.statements.length > 0) {
      sql += "\nWHERE " + predicates.statements.join(" and ")
    }
    sql += ' order by cr.benchmarkId'
  
    connection = await dbUtils.pool.getConnection()
    let [rows] = await connection.query(sql, predicates.binds)
    return (rows)
  }
  catch (err) {
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}


exports.queryUsersByAssetStig = async function (inPredicates = {}, elevate = false, userObject) {
  let connection
  try {
    const context = userObject.privileges.globalAccess || elevate ? 'CONTEXT_ALL' : 'CONTEXT_USER'
    const columns = [
      'CAST(ud.userId as char) as userId',
      'ud.username'
    ]
    let joins = [
      'asset a',
      'inner join collection c on a.collectionId = c.collectionId',
      'inner join collection_grant cg on c.collectionId = cg.collectionId',
      'inner join stig_asset_map sa on a.assetId = sa.assetId',
      'inner join user_stig_asset_map usa on sa.saId = usa.saId',
      'inner join user_data ud on usa.userId = ud.userId',
    ]
    // PREDICATES
    let predicates = {
      statements: [],
      binds: []
    }
    if (inPredicates.assetId) {
      predicates.statements.push('a.assetId = ?')
      predicates.binds.push( inPredicates.assetId )
    }
    if (inPredicates.benchmarkId) {
      predicates.statements.push('sa.benchmarkId = ?')
      predicates.binds.push( inPredicates.benchmarkId )
    }
    if (inPredicates.userId) {
      predicates.statements.push('usa.userId = ?')
      predicates.binds.push( inPredicates.userId )
    }
    if (context === 'CONTEXT_USER') {
      predicates.statements.push('cg.userId = ?')
      predicates.statements.push('CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END')
      predicates.binds.push( userObject.userId )
    }
    // CONSTRUCT MAIN QUERY
    let sql = 'SELECT '
    sql+= columns.join(",\n")
    sql += ' FROM '
    sql+= joins.join(" \n")
    if (predicates.statements.length > 0) {
      sql += "\nWHERE " + predicates.statements.join(" and ")
    }
    sql += ' order by ud.userId'
  
    connection = await dbUtils.pool.getConnection()
    let [rows] = await connection.query(sql, predicates.binds)
    return (rows)
  }
  catch (err) {
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}

exports.addOrUpdateAsset = async function (writeAction, assetId, body, projection, transferring, userObject) {
  let connection
  try {
    // CREATE: assetId will be null
    // REPLACE/UPDATE: assetId is not null

    // Extract or initialize non-scalar properties to separate variables
    let binds
    let { stigs, labelIds, ...assetFields } = body

    // Convert boolean scalar values to database values (true=1 or false=0)
    if (assetFields.hasOwnProperty('noncomputing')) {
      assetFields.noncomputing = assetFields.noncomputing ? 1 : 0
    }
    if (assetFields.hasOwnProperty('metadata')) {
      assetFields.metadata = JSON.stringify(assetFields.metadata)
    }

    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    await connection.query('START TRANSACTION')

    // Process scalar properties
    binds = { ...assetFields}

    if (writeAction === dbUtils.WRITE_ACTION.CREATE) {
    // INSERT into assets
    let sqlInsert =
      `INSERT INTO
          asset
          (name, fqdn, ip, mac, description, collectionId, noncomputing, metadata)
        VALUES
          (:name, :fqdn, :ip, :mac, :description, :collectionId, :noncomputing, :metadata)`
      let [rows] = await connection.query(sqlInsert, binds)
      assetId = rows.insertId
    }
    else if (writeAction === dbUtils.WRITE_ACTION.UPDATE || writeAction === dbUtils.WRITE_ACTION.REPLACE) {
      if (Object.keys(binds).length > 0) {
        // UPDATE into assets
        let sqlUpdate =
          `UPDATE
              asset
            SET
              ?
            WHERE
              assetId = ?`
        await connection.query(sqlUpdate, [assetFields, assetId])
        if (transferring) {
          let sqlDeleteRestrictedUsers = 
            `DELETE user_stig_asset_map
            FROM user_stig_asset_map
            INNER JOIN stig_asset_map USING (saId)
            WHERE stig_asset_map.assetId = ?`
          await connection.query(sqlDeleteRestrictedUsers, [assetId])
          const sqlDeleteLabels = `DELETE FROM collection_label_asset_map WHERE assetId = ?`
          await connection.query(sqlDeleteLabels, [assetId])
        }
      }
    }
    else {
      throw('Invalid writeAction')
    }

    // Process stigs, spec requires for CREATE/REPLACE not for UPDATE
    if (stigs) {
      if (writeAction !== dbUtils.WRITE_ACTION.CREATE) {
        let sqlDeleteBenchmarks = `
          DELETE FROM 
            stig_asset_map
          WHERE 
            assetId = ?`
        if (stigs.length > 0) {
          sqlDeleteBenchmarks += ` and benchmarkId NOT IN ?`
        }
        // DELETE from stig_asset_map, which will cascade into user_stig_aset_map
        await connection.query(sqlDeleteBenchmarks, [ assetId, [stigs] ])
      }
      if (stigs.length > 0) {
        // Map bind values
        let stigAssetMapBinds = stigs.map( benchmarkId => [benchmarkId, assetId])
        // INSERT into stig_asset_map
        let sqlInsertBenchmarks = `
          INSERT IGNORE INTO 
            stig_asset_map (benchmarkId, assetId)
          VALUES
            ?`
        await connection.query(sqlInsertBenchmarks, [stigAssetMapBinds])
        await dbUtils.updateStatsAssetStig( connection, {
          assetId: assetId
        })
      }
    }

      // Process labelIds, spec requires for CREATE/REPLACE not for UPDATE
      if (labelIds) {
        if (writeAction !== dbUtils.WRITE_ACTION.CREATE) {
          let sqlDeleteLabels = `
            DELETE FROM 
              collection_label_asset_map
            WHERE 
              assetId = ?`
          await connection.query(sqlDeleteLabels, [ assetId ])
        }
        if (labelIds.length > 0) {      
          let uuidBinds = labelIds.map( uuid => dbUtils.uuidToSqlString(uuid))
          // INSERT into stig_asset_map
          let sqlInsertLabels = `
            INSERT INTO collection_label_asset_map (assetId, clId) 
              SELECT
                ?,
                clId
              FROM
                collection_label
              WHERE
                uuid IN (?)`
          await connection.query(sqlInsertLabels, [assetId, uuidBinds])
        }
      }
    // Commit the changes
    await connection.commit()
  }
  catch (err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }

  // Fetch the new or updated Asset for the response
  try {
    let row = await _this.getAsset(assetId, projection, false, userObject)
    return row
  }
  catch (err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }  
}

exports.queryChecklist = async function (inProjection, inPredicates, elevate, userObject) {

  //TODO: remove select distinct ruleId from rule_oval_map -- bad execution plan
  let connection
  try {
    let context
    if (userObject.accessLevel === 3 || elevate) {
      context = dbUtils.CONTEXT_ALL
    } else if (userObject.accessLevel === 2) {
      context = dbUtils.CONTEXT_DEPT
    } else {
      context = dbUtils.CONTEXT_USER
    }

    let columns = [
      'CAST(:assetId as char) as "assetId"',
      'r.ruleId',
      'r.title as "ruleTitle"',
      'g.groupId',
      'g.title as "groupTitle"',
      'r.severity',
      `cast(COUNT(scap.ruleId) > 0 as json) as "autoCheckAvailable"`,
      `result.api as "result"`,
      `cast(review.autoResult is true as json) as "autoResult"`,
      `status.api as "status"`
    ]
    let joins = [
      'current_rev rev',
      'left join rev_group_map rg on rev.revId = rg.revId',
      'left join `group` g on rg.groupId=g.groupId',
      'left join rev_group_rule_map rgr on rg.rgId=rgr.rgId',
      'left join rule r on rgr.ruleId=r.ruleId',
      // 'left join severity_cat_map sc on r.severity=sc.severity',
      'left join review on r.ruleId = review.ruleId and review.assetId = :assetId',
      'left join result on review.resultId=result.resultId',
      'left join status on review.statusId=status.statusId',
      'left join rule_oval_map scap on r.ruleId=scap.ruleId'
    ]
    // PREDICATES
    let predicates = {
      statements: [],
      binds: {}
    }
    if (inPredicates.assetId) {
      predicates.binds.assetId = inPredicates.assetId
    }
    if (inPredicates.benchmarkId) {
      predicates.statements.push('rev.benchmarkId = :benchmarkId')
      predicates.binds.benchmarkId = inPredicates.benchmarkId
    }
    if (inPredicates.revisionStr !== 'latest') {
      joins.splice(0, 1, 'revision rev')
      let results = /V(\d+)R(\d+(\.\d+)?)/.exec(inPredicates.revisionStr)
      let revId =  `${inPredicates.benchmarkId}-${results[1]}-${results[2]}`
      predicates.statements.push('rev.revId = :revId')
      predicates.binds.revId = revId
    }
    // CONSTRUCT MAIN QUERY
    let sql = 'SELECT '
    sql+= columns.join(",\n")
    sql += ' FROM '
    sql+= joins.join(" \n")
    if (predicates.statements.length > 0) {
      sql += "\nWHERE " + predicates.statements.join(" and ")
    }
    sql += `\ngroup by
      r.ruleId,
      r.title,
      g.groupId,
      g.title,
      r.severity,
      result.api ,
      review.autoResult ,
      status.api,
      review.ruleId,
      review.resultId,
      review.detail,
      review.comment
    `
    sql += `\norder by substring(g.groupId from 3) + 0`
  
    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    let formatted = connection.format(sql, predicates.binds)

    // let [rows] = await connection.query(sql, predicates.binds)
    let [rows] = await connection.query( sql, predicates.binds )
    return (rows)
  }
  catch (err) {
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}

exports.queryStigAssets = async function (inProjection = [], inPredicates = {}, elevate = false, userObject) {
  let connection
  try {
    const context = userObject.privileges.globalAccess || elevate ? dbUtils.CONTEXT_ALL : dbUtils.CONTEXT_USER
    const columns = [
      'DISTINCT CAST(a.assetId as char) as assetId',
      'a.name',
      `coalesce(
        (select
          json_arrayagg(BIN_TO_UUID(cl.uuid,1))
        from
          collection_label_asset_map cla
          left join collection_label cl on cla.clId = cl.clId
        where
          cla.assetId = a.assetId),
        json_array()
      ) as assetLabelIds`,
      'CAST(a.collectionId as char) as collectionId'
    ]
    let joins = [
      'collection c',
      'left join collection_grant cg on c.collectionId = cg.collectionId',
      'inner join asset a on c.collectionId = a.collectionId',
      'left join stig_asset_map sa on a.assetId = sa.assetId',
      'left join user_stig_asset_map usa on sa.saId = usa.saId'
    ]
    // PROJECTIONS
    if (inProjection.includes('restrictedUserAccess')) {
      joins.push('left join user_data ud on usa.userId = ud.userId')
      columns.push(`cast(
        concat('[', 
          coalesce (
            group_concat(distinct 
              case when ud.userId is not null then 
                json_object(
                  'userId', cast(ud.userId as char), 
                  'username', ud.username)
              else null end 
            order by ud.username),
            ''),
        ']')
      as json) as "restrictedUserAccess"`)
    }
    // PREDICATES
    let predicates = {
      statements: [],
      binds: []
    }
    if (inPredicates.collectionId) {
      // Mandatory by OpenAPI spec
      predicates.statements.push('c.collectionId = ?')
      predicates.binds.push( inPredicates.collectionId )
    }
    if (inPredicates.benchmarkId) {
      // Mandatory by OpenAPI spec
      predicates.statements.push('sa.benchmarkId = ?')
      predicates.binds.push( inPredicates.benchmarkId )
    }
    if (inPredicates.labelId?.length) {
      joins.push('left join collection_label_asset_map cla2 on a.assetId = cla2.assetId')
      predicates.statements.push('cla2.clId IN (select clId from collection_label where uuid IN ?)')
      const uuidBinds = inPredicates.labelId.map( uuid => dbUtils.uuidToSqlString(uuid))
      predicates.binds.push([uuidBinds])
    }
    if (context == dbUtils.CONTEXT_USER) {
      predicates.statements.push('cg.userId = ?')
      predicates.statements.push('CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END')
      predicates.binds.push( userObject.userId )
    }
    // CONSTRUCT MAIN QUERY
    let sql = 'SELECT '
    sql+= columns.join(",\n")
    sql += ' FROM '
    sql+= joins.join(" \n")
    if (predicates.statements.length > 0) {
      sql += "\nWHERE " + predicates.statements.join(" and ")
    }
    sql += ' group by a.assetId, a.name, a.collectionId'
    sql += ' order by a.name'
  
    connection = await dbUtils.pool.getConnection()
    let [rows] = await connection.query(sql, predicates.binds)
    return (rows)
  }
  catch (err) {
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}


exports.cklFromAssetStigs = async function cklFromAssetStigs (assetId, benchmarks, elevate, userObject) {
  let connection
  try {
    let revisionStrResolved // Will hold specific revision string value, as opposed to "latest" 
    let cklJs = {
      CHECKLIST: {
        ASSET: {
          ROLE: 'None',
          ASSET_TYPE: 'Computing',
          HOST_NAME: null,
          HOST_IP: null,
          HOST_MAC: null,
          HOST_GUID: null,
          HOST_FQDN: null,
          TECH_AREA: null,
          TARGET_KEY: '2777',
          WEB_OR_DATABASE: 'false',
          WEB_DB_SITE: null,
          WEB_DB_INSTANCE: null
        },
        STIGS: {
          iSTIG: []
        }
      }
    }

    let sqlGetAsset = "select name, fqdn, ip, mac, noncomputing, metadata from asset where assetId = ?"
    let sqlGetChecklist =`SELECT 
      g.groupId,
      r.severity,
      g.title as "groupTitle",
      r.ruleId,
      r.title as "ruleTitle",
      r.weight,
      r.version,
      r.vulnDiscussion,
      r.iaControls,
      r.falsePositives,
      r.falseNegatives,
      r.documentable,
      r.mitigations,
      r.potentialImpacts,
      r.thirdPartyTools,
      r.mitigationControl,
      r.responsibility,
      r.severityOverrideGuidance,
      result.ckl as "result",
      review.detail,
      review.comment,
      MAX(c.content) as "checkContent",
      MAX(fix.text) as "fixText",
      group_concat(rcc.cci ORDER BY rcc.cci) as "ccis"
    FROM
      revision rev 
      left join rev_group_map rg on rev.revId = rg.revId 
      left join \`group\` g on rg.groupId = g.groupId 

      left join rev_group_rule_map rgr on rg.rgId = rgr.rgId 
      left join rule r on rgr.ruleId = r.ruleId 
      left join severity_cat_map sc on r.severity = sc.severity 
      
      left join rule_cci_map rcc on rgr.ruleId = rcc.ruleId 

      left join rev_group_rule_check_map rgrc on rgr.rgrId = rgrc.rgrId
      left join \`check\` c on rgrc.checkId = c.checkId

      left join rev_group_rule_fix_map rgrf on rgr.rgrId = rgrf.rgrId
      left join fix on rgrf.fixId = fix.fixId

      left join review on r.ruleId = review.ruleId and review.assetId = ?
      left join result on review.resultId = result.resultId 
      left join status on review.statusId = status.statusId 

    WHERE
      rev.revId = ?
    GROUP BY
      g.groupId,
      r.severity,
      g.title,
      r.ruleId,
      r.title,
      r.weight,
      r.version,
      r.vulnDiscussion,
      r.iaControls,
      r.falsePositives,
      r.falseNegatives,
      r.documentable,
      r.mitigations,
      r.potentialImpacts,
      r.thirdPartyTools,
      r.mitigationControl,
      r.responsibility,
      r.severityOverrideGuidance,
      result.ckl,
      review.detail,
      review.comment
    order by
      substring(g.groupId from 3) + 0 asc
    `
    connection = await dbUtils.pool.getConnection()

    // ASSET
    let [resultGetAsset] = await connection.query(sqlGetAsset, [assetId])
    cklJs.CHECKLIST.ASSET.HOST_NAME = resultGetAsset[0].metadata.cklHostName ? resultGetAsset[0].metadata.cklHostName : resultGetAsset[0].name
    cklJs.CHECKLIST.ASSET.HOST_FQDN = resultGetAsset[0].fqdn
    cklJs.CHECKLIST.ASSET.HOST_IP = resultGetAsset[0].ip
    cklJs.CHECKLIST.ASSET.HOST_MAC = resultGetAsset[0].mac
    cklJs.CHECKLIST.ASSET.ASSET_TYPE = resultGetAsset[0].noncomputing ? 'Non-Computing' : 'Computing'
    cklJs.CHECKLIST.ASSET.ROLE = resultGetAsset[0].metadata.cklRole ?? 'None'
    cklJs.CHECKLIST.ASSET.TECH_AREA = resultGetAsset[0].metadata.cklTechArea ?? null
    cklJs.CHECKLIST.ASSET.WEB_OR_DATABASE = resultGetAsset[0].metadata.cklHostName ?  'true' : 'false'
    cklJs.CHECKLIST.ASSET.WEB_DB_SITE = resultGetAsset[0].metadata.cklWebDbSite ?? null
    cklJs.CHECKLIST.ASSET.WEB_DB_INSTANCE = resultGetAsset[0].metadata.cklWebDbInstance ?? null
    
    // CHECKLIST.STIGS.iSTIG.STIG_INFO.SI_DATA
    for (const benchmark of benchmarks) {
      const regex = /^(?<benchmarkId>\S+?)(-(?<revisionStr>V\d+R\d+(\.\d+)?))?$/
      const found = benchmark.match(regex)
      const revisionStr = found.groups.revisionStr || 'latest'
      revisionStrResolved = revisionStr
      const benchmarkId = found.groups.benchmarkId
      
      let sqlGetBenchmarkId
      if (revisionStr === 'latest') {
        sqlGetBenchmarkId = `select
          cr.benchmarkId, 
          s.title, 
          cr.revId, 
          cr.description, 
          cr.version, 
          cr.release, 
          cr.benchmarkDate
        from
          current_rev cr 
          left join stig s on cr.benchmarkId = s.benchmarkId
        where
          cr.benchmarkId = ?`
      }
      else {
        sqlGetBenchmarkId = `select
          r.benchmarkId,
          s.title,
          r.description,
          r.version,
          r.release,
          r.benchmarkDate
        from 
          stig s 
          left join revision r on s.benchmarkId=r.benchmarkId
        where
          r.revId = ?`  
      }
      // Calculate revId
      let resultGetBenchmarkId, revId
      if (revisionStr === 'latest') {
        ;[resultGetBenchmarkId] = await connection.query(sqlGetBenchmarkId, [benchmarkId])
        revId = resultGetBenchmarkId[0].revId
        revisionStrResolved = `V${resultGetBenchmarkId[0].version}R${resultGetBenchmarkId[0].release}`
      }
      else {
        let revParse = /V(\d+)R(\d+(\.\d+)?)/.exec(revisionStr)
        revId =  `${benchmarkId}-${revParse[1]}-${revParse[2]}`
        ;[resultGetBenchmarkId] = await connection.execute(sqlGetBenchmarkId, [revId])
      }
  
      let stig = resultGetBenchmarkId[0]
      let siDataRefs = [
        { SID_NAME: 'version', SID_DATA: stig.version },
        { SID_NAME: 'classification' },
        { SID_NAME: 'customname' },
        { SID_NAME: 'stigid', SID_DATA: stig.benchmarkId },
        { SID_NAME: 'description', SID_DATA: stig.description },
        { SID_NAME: 'filename', SID_DATA: 'stig-manager-oss' },
        { SID_NAME: 'releaseinfo', SID_DATA: `Release: ${stig.release} Benchmark Date: ${stig.benchmarkDate}`},
        { SID_NAME: 'title', SID_DATA: stig.title },
        { SID_NAME: 'uuid', SID_DATA: '391aad33-3cc3-4d9a-b5f7-0d7538b7b5a2' },
        { SID_NAME: 'notice', SID_DATA: 'terms-of-use' },
        { SID_NAME: 'source', }
      ]
      let iStigJs = {
        STIG_INFO:
          {
            SI_DATA: []
          },
        VULN: []
      }
      let siDataArray = iStigJs.STIG_INFO.SI_DATA
      for (const siDatum of siDataRefs) {
        siDataArray.push(siDatum)
      }
  
      // CHECKLIST.STIGS.iSTIG.STIG_INFO.VULN
      let [resultGetChecklist] = await connection.query(sqlGetChecklist, [assetId, revId])
  
      let stigDataRef = [
        ['Vuln_Num', 'groupId' ],
        ['Severity',  'severity' ],
        ['Group_Title',  'groupTitle' ],
        ['Rule_ID',  'ruleId' ],
        ['Rule_Ver',  'version' ],
        ['Rule_Title',  'ruleTitle' ],
        ['Vuln_Discuss',  'vulnDiscussion' ],
        ['IA_Controls',  'iaControls' ],
        ['Check_Content',  'checkContent' ],
        ['Fix_Text',  'fixText' ],
        ['False_Positives',  'falsePositives' ],
        ['False_Negatives',  'falseNegatives' ],
        ['Documentable', 'documentable' ],
        ['Mitigations', 'mitigations' ],
        ['Potential_Impact', 'potentialImpacts' ],
        ['Third_Party_Tools', 'thirdPartyTools' ],
        ['Mitigation_Control', 'mitigationControl' ],
        ['Responsibility', 'responsibility' ],
        ['Security_Override_Guidance', 'severityOverrideGuidance' ] 
        // STIGViewer bug requires using Security_Override_Guidance instead of Severity_Override_Guidance
      ]
  
      // let vulnArray = cklJs.CHECKLIST.STIGS.iSTIG.VULN
      let vulnArray = iStigJs.VULN
      for (const r of resultGetChecklist) {
        const vulnObj = {
          STIG_DATA: [],
          STATUS: r.result || 'Not_Reviewed',
          FINDING_DETAILS: r.detail,
          COMMENTS: r.comment,
          SEVERITY_OVERRIDE: null,
          SEVERITY_JUSTIFICATION: null
        }
        for (const stigDatum of stigDataRef) {
          vulnObj.STIG_DATA.push({
            VULN_ATTRIBUTE: stigDatum[0],
            ATTRIBUTE_DATA: r[stigDatum[1]]
          })
        }
        // STIGRef
        vulnObj.STIG_DATA.push({
          VULN_ATTRIBUTE: 'STIGRef',
          ATTRIBUTE_DATA: `${stig.title} :: Version ${stig.version}, Release: ${stig.release} Benchmark Date: ${stig.benchmarkDate}`
        })
        // CCI_REFs
        if (r.ccis) {
          const ccis = r.ccis.split(',')
          for (const cci of ccis) {
            vulnObj.STIG_DATA.push({
              VULN_ATTRIBUTE: 'CCI_REF',
              ATTRIBUTE_DATA: `CCI-${cci}`
            })
          }
        }
        vulnArray.push(vulnObj)        
      }
      cklJs.CHECKLIST.STIGS.iSTIG.push(iStigJs)
    }

    return ({assetName: resultGetAsset[0].name, cklJs, revisionStrResolved})

  }
  catch (e) {
    throw (e)
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}

/**
 * Create an Asset
 *
 * body Asset  (optional)
 * returns Asset
 **/
exports.createAsset = async function(body, projection, elevate, userObject) {
  try {
    let row = await _this.addOrUpdateAsset(dbUtils.WRITE_ACTION.CREATE, null, body, projection, elevate, userObject)
    return (row)
  }
  finally {}
}


/**
 * Delete an Asset
 *
 * assetId Integer A path parameter that indentifies an Asset
 * returns Asset
 **/
exports.deleteAsset = async function(assetId, projection, elevate, userObject) {
  try {
    let rows = await _this.queryAssets(projection, {assetId: assetId}, elevate, userObject)
    let sqlDelete = `DELETE FROM asset where assetId = ?`
    await dbUtils.pool.query(sqlDelete, [assetId])
    return (rows[0])
  }
  catch (err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}

exports.attachStigToAsset = async function (assetId, benchmarkId, elevate, userObject ) {
  try {
    let sqlInsert = `INSERT IGNORE INTO stig_asset_map (assetId, benchmarkId) VALUES (?, ?)`
    await dbUtils.pool.query(sqlInsert, [assetId, benchmarkId])
    let rows = await _this.queryStigsByAsset( {
      assetId: assetId
    }, elevate, userObject)
    return (rows)
  }
  catch (err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}

exports.removeStigFromAsset = async function (assetId, benchmarkId, elevate, userObject ) {
  try {
    let sqlDelete = `DELETE FROM stig_asset_map where assetId = ? and benchmarkId = ?`
    await dbUtils.pool.query(sqlDelete, [assetId, benchmarkId])
    let rows = await _this.queryStigsByAsset( {
      assetId: assetId
    }, elevate, userObject)
    return (rows)
  }
  catch (err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}

exports.removeStigsFromAsset = async function (assetId, elevate, userObject ) {
  try {
    let sqlDelete = `DELETE FROM stig_asset_map where assetId = ?`
    await dbUtils.pool.query(sqlDelete, [assetId])
    let rows = await _this.queryStigsByAsset( {assetId: assetId}, elevate, userObject)
    return (rows)
  }
  catch (err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}

exports.deleteAssetStigGrant = async function (assetId, benchmarkId, userId, elevate, userObject ) {
  try {
    // TODO
  }
  catch (err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}

/**
 * Return an Asset
 *
 * assetId Integer A path parameter that indentifies an Asset
 * returns AssetDetail
 **/
exports.getAsset = async function(assetId, projection, elevate, userObject) {
  try {
    let rows = await _this.queryAssets(projection, {
      assetId: assetId
    }, elevate, userObject)
  return (rows[0])
  }
  catch (err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}


/**
 * Return a list of Assets accessible to the user
 *
 * collectionId Integer Selects Assets mapped to a Collection (optional)
 * benchmarkId String Selects Assets mapped to a STIG (optional)
 * dept String Selects Assets exactly matching a department string (optional)
 * returns List
 **/
exports.getAssets = async function(collectionId, labelIds, name, nameMatch, benchmarkId, metadata, projection, elevate, userObject) {
  try {
    let rows = await _this.queryAssets(projection, {
      collectionId,
      labelIds,
      name,
      nameMatch,
      benchmarkId,
      metadata
    }, elevate, userObject)
    return (rows)
  }
  catch (err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}

exports.getStigsByAsset = async function (assetId, elevate, userObject ) {
  try {
    let rows = await _this.queryStigsByAsset({
      assetId: assetId
    }, elevate, userObject)
    return (rows)
  }
  catch (err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }

}

exports.getUsersByAssetStig = async function (assetId, benchmarkId, elevate, userObject ) {
  try {
    let rows = await _this.queryUsersByAssetStig({
      assetId: assetId,
      benchmarkId: benchmarkId
    }, elevate, userObject)
    return (rows)
  }
  catch (err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}

exports.getChecklistByAssetStig = async function(assetId, benchmarkId, revisionStr, format, elevate, userObject) {
  try {
    switch (format) {
      case 'json':
        let rows = await _this.queryChecklist(null, {
          assetId: assetId,
          benchmarkId: benchmarkId,
          revisionStr: revisionStr
        }, elevate, userObject)
        return (rows)
      case 'ckl':
        const benchmark = revisionStr === 'latest' ? benchmarkId : `${benchmarkId}-${revisionStr}`
        let cklObject = await _this.cklFromAssetStigs(assetId, [benchmark], elevate, userObject)
        return (cklObject)
    }
  }
  catch (err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}

exports.getChecklistByAsset = async function(assetId, benchmarks, format, elevate, userObject) {
  try {
    switch (format) {
      case 'ckl':
        let cklObject = await _this.cklFromAssetStigs(assetId, benchmarks, elevate, userObject)
        return (cklObject)
    }
  }
  catch (err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}


exports.getAssetsByStig = async function( collectionId, benchmarkId, labelId, projection, elevate, userObject) {
  try {
    let rows = await _this.queryStigAssets(projection, {
      collectionId,
      benchmarkId,
      labelId
    }, elevate, userObject)
    return (rows)

  }
  catch (err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}


exports.attachAssetsToStig = async function(collectionId, benchmarkId, assetIds, projection, elevate, userObject) {
  let connection
  try {
    connection = await dbUtils.pool.getConnection()
    await connection.query('START TRANSACTION')

    let sqlDeleteBenchmarks = `
    DELETE FROM 
      stig_asset_map
    WHERE 
      benchmarkId = ?`
    if (assetIds.length > 0) {
      sqlDeleteBenchmarks += ' and assetId NOT IN ?'
    }  
    // DELETE from stig_asset_map, which will cascade into user_stig_aset_map
    await connection.query( sqlDeleteBenchmarks, [ benchmarkId, [assetIds] ] )
    
    // Push any bind values
    let binds = []
    assetIds.forEach( assetId => {
      binds.push([benchmarkId, assetId])
    })
    if (binds.length > 0) {
      // INSERT into stig_asset_map
      let sqlInsertBenchmarks = `
      INSERT IGNORE INTO 
        stig_asset_map (benchmarkId, assetId)
      VALUES
        ?`
      await connection.query(sqlInsertBenchmarks, [ binds ])
    }
    await dbUtils.updateStatsAssetStig( connection, {
      collectionId: collectionId,
      benchmarkId: benchmarkId
    })
    // Commit the changes
    await connection.commit()
  }
  catch (err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}
/**
 * Merge updates to an Asset
 *
 * body Asset  (optional)
 * projection
 * assetId Integer A path parameter that indentifies an Asset
 * returns AssetDetail
 **/
exports.updateAsset = async function( assetId, body, projection, transferring, userObject ) {
  try {
    let row = await _this.addOrUpdateAsset(dbUtils.WRITE_ACTION.UPDATE, assetId, body, projection, transferring, userObject)
    return (row)
  } 
  catch (err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}




exports.getAssetMetadataKeys = async function ( assetId ) {
  const binds = []
  let sql = `
    select
      JSON_KEYS(metadata) as keyArray
    from 
      asset
    where 
      assetId = ?`
  binds.push(assetId)
  let [rows] = await dbUtils.pool.query(sql, binds)
  return rows.length > 0 ? rows[0].keyArray : []
}

exports.getAssetMetadata = async function ( assetId ) {
  const binds = []
  let sql = `
    select
      metadata 
    from 
      asset
    where 
      assetId = ?`
  binds.push(assetId)
  let [rows] = await dbUtils.pool.query(sql, binds)
  return rows.length > 0 ? rows[0].metadata : {}
}

exports.patchAssetMetadata = async function ( assetId, metadata ) {
  const binds = []
  let sql = `
    update
      asset 
    set 
      metadata = JSON_MERGE_PATCH(metadata, ?)
    where 
      assetId = ?`
  binds.push(JSON.stringify(metadata), assetId)
  let [rows] = await dbUtils.pool.query(sql, binds)
  return true
}

exports.putAssetMetadata = async function ( assetId, metadata ) {
  const binds = []
  let sql = `
    update
      asset
    set 
      metadata = ?
    where 
      assetId = ?`
  binds.push(JSON.stringify(metadata), assetId)
  let [rows] = await dbUtils.pool.query(sql, binds)
  return true
}

exports.getAssetMetadataValue = async function ( assetId, key ) {
  const binds = []
  let sql = `
    select
      JSON_EXTRACT(metadata, ?) as value
    from 
      asset
    where 
      assetId = ?`
  binds.push(`$."${key}"`, assetId)
  let [rows] = await dbUtils.pool.query(sql, binds)
  return rows.length > 0 ? rows[0].value : ""
}

exports.putAssetMetadataValue = async function ( assetId, key, value ) {
  const binds = []
  let sql = `
    update
      asset
    set 
      metadata = JSON_SET(metadata, ?, ?)
    where 
      assetId = ?`
  binds.push(`$."${key}"`, value, assetId)
  let [rows] = await dbUtils.pool.query(sql, binds)
  return rows.length > 0 ? rows[0].value : ""
}

exports.deleteAssetMetadataKey = async function ( assetId, key ) {
  const binds = []
  let sql = `
    update
      asset
    set 
      metadata = JSON_REMOVE(metadata, ?)
    where 
      assetId = ?`
  binds.push(`$."${key}"`, assetId)
  let [rows] = await dbUtils.pool.query(sql, binds)
  return rows.length > 0 ? rows[0].value : ""
}