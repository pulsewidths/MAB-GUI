const fs = require('fs');
const path = require('path');

const pluginsFolder = path.join(__dirname, '../Plugins/');

let validPlugins = [];

let subFolders = fs.readdirSync( pluginsFolder );

for ( let index = 0; index < subFolders.length; index++ )
{
    if( fs.lstatSync( pluginsFolder + subFolders[ index ] + '/').isDirectory( ) )
    {
        let files = fs.readdirSync( pluginsFolder + subFolders[ index ] + '/' );

        if ( files.includes('driver.js') )
        {
            validPlugins.push(
                { name: subFolders[ index ],
                  path: pluginsFolder + subFolders[ index ] + '/' }
            );
        }

    }

}

module.exports = validPlugins;