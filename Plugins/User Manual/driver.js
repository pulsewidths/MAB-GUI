const { ipcRenderer } = require('electron');

function usermanual( )
{
    ipcRenderer.send( 'usermanual-open' );
}

module.exports = usermanual;