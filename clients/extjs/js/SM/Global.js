var appName = 'STIG Manager';
var appVersion = "3.0";
var copyrightStr = '';
var licenseStr = "This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.\
\n\nThis program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.\
\n\nThe GNU General Public License is available at  <http://www.gnu.org/licenses/>.";

var curUser, appConfig;

Ext.ns('SM')
SM.GetUserObject = async function () {
    try {
        let result = await Ext.Ajax.requestPromise({
            url: `${STIGMAN.Env.apiBase}/user`,
            method: 'GET'
        })
        curUser = JSON.parse(result.response.responseText)
        return curUser
    }
    catch (e) {
        alert(e.message)
    }
}

SM.styledEmptyRenderer = v => v ? v : '<span class="sm-empty-cell" />'