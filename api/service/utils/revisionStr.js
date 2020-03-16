module.exports = (revisionStr) => {
    let ro = {}
    if (revisionStr !== 'latest') {
        let results = /V(\d+)R(\d+(\.\d+)?)/.exec(revisionStr)
        ro.version = results[1]
        ro.release = results[2]
        ro.table = 'stig.revision'
        ro.table_alias = 'r'
        ro.predicates = ' and r.version = ? and r.release = ?'
    } else {
        ro.version = null
        ro.release = null
        ro.table = 'stig.current_rev'
        ro.table_alias = 'cr'
        ro.predicates = ''
    }
    return ro
}