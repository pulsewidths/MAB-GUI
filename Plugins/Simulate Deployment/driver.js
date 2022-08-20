const electron = require('electron');
const Stopwatch = require('timer-stopwatch');
const TweenMax = require( 'gsap' );
const ipcRenderer = electron.ipcRenderer;

const app = electron.remote;
var dialog = app.dialog;

var tokens = [ ];
var tweens = [ ];
var timerLabels = [ ];
var tweenDurationDict = { };
var simMode = true;

class Token
{
    constructor( name, startPosition )
    {
        this.name = name;
        this.startPosition = startPosition;
        this.circle;
        this.tween;
    }
}

class Tween
{
    constructor( name, tweens, component, tokenColor, timerLabel )
    {
        this.name = name;
        this.tweens = tweens;
        this.component = component;
        this.tokenColor = tokenColor;
        this.timerLabel = timerLabel;
    }
}

class TimerLabel
{
    constructor( name, label, parent_component )
    {
        this.name = name;
        this.label = label;
        this.isRunning = false;
        this.parentComponent = parentComponent;
    }
}

function bootstrap( mabGUI )
{

    let components = mabGUI.assembly.components;
    let connections = mabGUI.assembly.connections;

    // check if component exists
    if( components.length > 0 )
    {
        // create animation layer
        var simulationLayer = new Konva.Layer();
        mabGUI.stage.add( simulationLayer );
    } else {
        return;
    }

    // Send message to main thread to change to the simulator menu
    ipcRenderer.send( 'simulator-setmenu' );

    // create a konva group for tokens
    var simulationGroup = new Konva.Group();

    // create simulator button
    let simulatorLabel = createSimulatorLabel();
    simulationGroup.add( simulatorLabel );

    simulationLayer.add( simulationGroup );
    mabGUI.stage.add( simulationLayer );

    ipcRenderer.on('simulator-exit',
        function( event )
        {
            // for every component
            for ( let componentIndex = 0; componentIndex < components.length; componentIndex++ )
            {
                setListening( components[ componentIndex ], mabGUI );
            }
            //resetHighlights(animLayer); // tween still plays
            destroyTokens( );
            destroyTweenObjList( );
            resetConnectionsAndDependencies( connections );
            mabGUI.layer.draw( );
            resetTransitionCurrentDuration( components );
            
            tokens = [ ];
            tweens = [ ];
            tweenDurationDict = {};
            simulationGroup.destroy();
            simulationLayer.destroy();
            stopwatch.stop();
            simMode = false;
    });

    // start global timer
    var stopwatch = new Stopwatch();
    stopwatch.start();
    // for every component
    for ( let componentIndex = 0; componentIndex < components.length; componentIndex++ )
    {
        // check if component has places
        if( components[ componentIndex ].places.length > 0 )
        {
            // create timer label
            let timerLabel = createTimerLabel( components[ componentIndex ].shape );
            simulationGroup.add( timerLabel );
            // push timer label obj to global list 
            timerLabels.push( timerLabel );
            // set not listening 
            setNotListening( components[ componentIndex ], mabGUI );
            // set token color for this component
            var tokenColor = getRandomColor( );
            // create tween obj name
            var tweenName = "tween " + componentIndex;
            // create tween list
            var tweensList = [];
            // create tween obj
            var tween = new Tween( tweenName, tweensList, components[ componentIndex ], tokenColor, timerLabel );
            // build the animation
            buildTokenTween( tween, simulationLayer, connections );
            // tokenHandler(sd_comp_list[i], place_num, animLayer, tokenColor, timerLabel);
            tweens.push( tween );
        }
    }

    // Fires every 50ms by default. Change setting the 'refreshRateMS' options
    stopwatch.onTime(
            function( time)
            {
                updateTimerLabels( time );
            } );

    // animLayer.add(tokenGroup);
    simulationLayer.draw( );
}

function buildTokenTween( tween, simulationLayer, connections )
{
    // create tweenMax
    var tweenLine = new TimelineMax( { onCompleteParams: [ tween ], onComplete: finishTween } );
    // add tweenMax to tweenlist
    tween.tweens.push( tweenLine );
    // create reference to this tweens parent component
    var component = tween.component;
    component.places = sortPlaceList( component );

    // for every place in components place list
    for ( let placeIndex = 0; placeIndex < component.places.length; placeIndex++ )
    {
        // set max delay for current place
        setTransitionMaxDelay( component.places[ placeIndex ] );
        // add label to timeline for when this place's outbound transitions should start
        tweenLine.add( 'place_' + placeIndex + '_delay', getPlaceDelay( component.places[ placeIndex ] ) );
        // set current place obj reference
        let place = component.places[ placeIndex ];
        // for every outbound transition out of the current place
        for ( let transitionIndex = 0; transitionIndex < place.transitions.out.length; transitionIndex++ )
        {
            // set current tran obj reference
            let transition = place.transitions.out[ transitionIndex ];
            // generate duration
            let duration = getRandomDuration( transition.minDuration, transition.maxDuration );
            transition.currentDuration = duration;
            // get token starting position
            let tokenStartPos = place.shape.getAbsolutePosition( );
            // create token
            let token = createToken( tokenStartPos, tween.tokenColor );
            simulationLayer.add( token );
            tokens.push( token );
            // get transition konva line position
            let transitionPosition = transition.shape.getAbsolutePosition( );
            let midpoint = { x: transitionPosition.x + transition.shape.points( )[ 2 ], y: transitionPosition.y + transition.shape.points( )[ 3 ] };
            let destination = { x: transitionPosition.x + transition.shape.points( )[ 4 ], y: transitionPosition.y + transition.shape.points( )[ 5 ] };
            
            // tween to next place
            let nextTween = TweenMax.to( token, duration,
                                   { konva: { bezier: { curviness: 3, values: [ { x: midpoint.x, y: midpoint.y },
                                                                                { x: destination.x, y: destination.y }
                                                                              ]
                                                      }
                                              },
                                     onStartParams: [ token, transition, connections, mabGUI ],
                                     onStart: startTween,
                                     onCompleteParams: [ token, place, connections, mabGUI ],
                                     onComplete: endTween }
                                    );
            // subTweenLine.add( tween, 0 );
            tweenLine.add( nextTween, 'place_' + placeIndex + '_delay' );
        }
        // tweenline.add(subTweenLine, 'place_' + place_num + '_delay');
    }
}

// sets the max delay from one place to another place in tween_duration_dict
function setTransitionMaxDelay( place )
{

    // first place in graph
    if( place.transitions.in.length == 0 )
    {
        tweenDurationDict[ place.name ] = 0;
    }
    
    let placeMaxDelay = 0;
    // for every inbound transition into place
    for ( let transitionIndex = 0; transitionIndex < place.transitions.in.length; transitionIndex++ )
    {
        let transition = place.transitions.in[ transitionIndex ];
        let sourceMaxDelay = getPlaceDelay( transition.source );
        let placeDelay = sourceMaxDelay + transition.currentDuration;
        // find the previous place with highest duration
        if( placeDelay > placeMaxDelay )
        {
            placeMaxDelay = placeDelay;
        }
    }

    // add the place name to delay dict with max delay to it
    tweenDurationDict[ place.name ] = placeMaxDelay;

}

// return the delay from one place to another place from tween duration dict
function getPlaceDelay( place )
{
    return tweenDurationDict[ place.name ];
}

function sortPlaceList( component )
{
    let roots = component.getRoots( );
    let places = [];
    for( let rootIndex = 0; rootIndex < roots.length; rootIndex++ )
    {
        traversePlaces( roots[ rootIndex ], places );
    }
    return places;
}

function traversePlaces( place, places )
{
    if( containsObject(place, places) )
    {
        places.move( places.indexOf( place ), places.length );
    } else {
        places.push( place );
    }
    traverseTransitions( place );
    function traverseTransitions( place )
    {
        for( let transitionIndex = 0; transitionIndex < place.transitions.out.length; transitionIndex++ )
        {
            traversePlaces( place.transitions.out[ transitionIndex ].destination, places );
        }
    }
}

function containsObject( obj, list )
{
    let x;
    for ( x in list )
    {
        if( list.hasOwnProperty( x ) && list[ x ] === obj )
        {
            return true;
        }
    }
    return false;
}

Array.prototype.move = function ( from, to )
{
    this.splice( to, 0, this.splice( from, 1 )[ 0 ] );
};

function startTween( token, transition, connections, mabGUI )
{
    showToken( token );
    // check if transition obj has dependency
    enableDependencyObj( transition );
    transitionAnim( transition );
    checkConnectionStatus( connections );
    mabGUI.layer.draw( );
}

function enableDependencyObj( source )
{
    // set every dependency obj connected to this source obj to true
    for( let dependencyIndex = 0; dependencyIndex < source.dependencies.length; dependencyIndex++ )
    {
        source.dependencies[ dependencyIndex ].enabled = true;
    }
};

function endTween( token, place, connections, mabGUI )
{
    hideToken( token );
    enableDependencyObj( place );
    // play place tween
    //placeFinishedAnim(place_obj.place_konva);
    checkConnectionStatus( connections );
    mabGUI.layer.draw( );
}

function showToken( token )
{
    token.show( );
}

function hideToken( token )
{
    token.hide( );
}

function createToken( tokenPos, tokenColor )
{
    let token = new Konva.Circle( {
        x: tokenPos.x,
        y: tokenPos.y,
        radius: 8,
        fill: tokenColor,
        opacity: 1
    } );
    token.hide( );
    return token;
}

function updateTimerLabels( time )
{
    let elapsedMilliseconds = time.ms;
    let totalSeconds = elapsedMilliseconds / 1000;
    let totalMinutes = totalSeconds / 60;
    let elapsedMinutes = Math.trunc( totalMinutes );
    let elapsedSeconds = totalSeconds;
    if( totalSeconds >= 60 ) { elapsedSeconds -= ( 60 * elapsedMinutes ); }
    
    for ( let timerLabelIndex = 0; timerLabelIndex < timerLabels.length; timerLabelIndex++ )
    {
        timerLabels[ timerLabelIndex ].text( Math.trunc( elapsedMinutes ) + ":" + Math.trunc( elapsedSeconds ) );
    }
}

// reset every curr duration of every tran obj to 0
function resetTransitionCurrentDuration( components )
{
    for ( let componentIndex = 0; componentIndex < components.length; componentIndex++ )
    {
        let component = components[ componentIndex ];
        for ( let transitionIndex = 0; transitionIndex < component.transitions.length; transitionIndex++ )
        {
            let transition = component.transitions[ transitionIndex ];
            transition.currentDuration = 0;
        }
    }
}

function finishTween( tween )
{
    stopTimerLabel( tween.timerLabel );
    componentFinishedAnim( tween.component );
}

// remove the timerLabel from the list
function stopTimerLabel( timerLabel )
{
    timerLabels.splice( timerLabels.indexOf( timerLabel ), 1 );
}

function checkConnectionStatus( connections )
{
    for( let connectionIndex = 0; connectionIndex < connections.length; connectionIndex++ )
    {
        let connection = connections[ connectionIndex ];
        if( connection.provide.enabled && connection.use.enabled )
        {
            connection.enabled = true;
            connectionEnabledAnim( connection );
        }
    }
}

function connectionEnabledAnim( connection )
{

    connection.gate1.opacity( 0 );
    connection.gate2.opacity( 0 );

    let connectionTween = new Konva.Tween( {
        node: connection.shape,
        duration: 2,
        stroke: 'green',
        easing: Konva.Easings.EaseInOut,
        onFinish:
            function()
            {
                setTimeout( function( ) { connectionTween.reverse(); }, 2000 );
            }
    });

    connectionTween.play();

}

function transitionAnim( transition )
{

    let transitionTween = new Konva.Tween( {
        node: transition.shape,
        duration: transition.currentDuration / 2,
        stroke: 'blue',
        strokeWidth: 1,
        shadowColor: 'black',
        shadowBlur: 2,
        shadowOpacity: 1,
        easing: Konva.Easings.BackEaseOut,
        onFinish:
            function( )
            {
                setTimeout( function( ) { transitionTween.reverse( ); }, 1000 );
            }
    } );

    transitionTween.play( );

}

function componentFinishedAnim( component )
{

    let componentTween = new Konva.Tween( {
        node: component.shape,
        duration: 4,
        stroke: 'green',
        easing: Konva.Easings.EaseInOut,
        onFinish:
            function()
            {
                setTimeout( function( ) { componentTween.reverse( ); }, 4000 );
            }
    } );

    componentTween.play( );

}

// returns a random time between a lower and upper bound
function getRandomDuration( min, max )
{
    min = Math.ceil( min );
    max = Math.floor( max );
    return Math.floor( Math.random( ) * ( max - min + 1 ) ) + min;
}

function getRandomColor( )
{
    let letters = '0123456789ABCDEF';
    let color = '#';
    for ( let index = 0; index < 6; index++ )
    {
      color += letters[ Math.floor( Math.random( ) * 16 ) ];
    }
    return color;
}

function createTimerLabel( componentShape ){

    let componentPosition = componentShape.getAbsolutePosition( );

    let timerLabel = new Konva.Text( {
        x: componentPosition.x + ( ( componentShape.getWidth( ) / 2 ) * componentShape.scaleX( ) ) - 30,
        y: componentPosition.y + ( componentShape.getHeight( ) * componentShape.scaleY( ) ),
        opacity: 1,
        text: '',
        fontFamily: 'Calibri',
        fontSize: 36,
        padding: 5,
        align: 'center',
        fill: 'black'
    } );

    return timerLabel;

}

function createSimulatorLabel( )
{
    let simulatorLabel = new Konva.Label( {
        x: 150,
        y: 10,
        opacity: 1
    } );

    simulatorLabel.add( new Konva.Tag( {
        fill: 'white'
    } ) );

    simulatorLabel.add( new Konva.Text( {
        text: 'Simulator Mode',
        fontFamily: 'Calibri',
        fontSize: 36,
        padding: 5,
        fill: 'black'
    } ) );
    return simulatorLabel;
}

function resetConnectionsAndDependencies( connections )
{
    for( let connectionIndex = 0; connectionIndex < connections.length; connectionIndex++ )
    {
        let connection = connections[ connectionIndex ];
        if( connection.enabled )
        {
            connection.gate1.opacity( 1 );
            connection.gate2.opacity( 1 );
            connection.enabled = false;
            connection.shape.stroke( 'black' );
            connection.provide.enabled = false;
            connection.use.enabled = false;
        }
    }
}

function destroyTokens( )
{
    while( tokens.length != 0 )
    {
        tokens[ 0 ].destroy( );
    }
}

function destroyTweenObjList( )
{
    // destory every tween
    for (var tweenIndex = 0; tweenIndex < tweens.length; tweenIndex++ )
    {
        tweens[ tweenIndex ].tweens = [];
        tweens.splice( tweens.indexOf( tweens[ tweenIndex ] ), 1 );
        tweenIndex;
    }
}

function setNotListening( component, mabGUI )
{
    component.group.listening( false );
    mabGUI.layer.drawHit();
}

function setListening( component, mabGUI )
{
    component.group.listening( true );
    mabGUI.layer.drawHit();
}

module.exports = bootstrap;