class Component
{

    constructor( name, pos )
    {

        this.type = 'component';
        this.name = name;
        this.index = mabGUI.assembly.components.length;

        this.connections = [ ];
        this.places = [ ];
        this.transitions = [ ];
        this.dependencies = [ ];

        this.initKonva( pos );
        this.initTooltip( );
        this.initListeners( );

        mabGUI.assembly.components.push( this );

    }

    initKonva( pos )
    {

        this.group = new Konva.Group( {
            x: pos.x, y: pos.y,
            width: 300, height: 350,
            draggable: true, name: 'componentGroup'
        } );
        this.shape = new Konva.Rect( {
            x: 0, y: 0,
            width: 300, height: 350,
            stroke: 'black', name: 'component',
            strokeWidth: 0.5
        } );

        this.useSelectionArea = new Konva.Rect( {
            x: 0, y: 0,
            width: 15, height: 350,
            opacity: 0, name: 'useSelectionArea'
        } );
        this.provideSelectionArea = new Konva.Rect( {
            x: this.shape.getWidth( ) - 15, y: 0,
            width: 15, height: 350,
            opacity: 0, name: 'provideSelectionArea'
        } );

        this.group.add( this.shape );
        this.group.add( this.useSelectionArea );
        this.group.add( this.provideSelectionArea );

        mabGUI.layer.add( this.group );

    }

    initTooltip( )
    {

        this.tooltipLayer = new Konva.Layer( );

        this.tooltip = new Konva.Text( {
            text: '', fontFamily: 'Calibri', fontsize: 12,
            padding: 5, textFill: 'white', fill: 'black',
            alpha: 0.75, visible: false
        } );

        this.tooltipLayer.add( this.tooltip );

        mabGUI.stage.add( this.tooltipLayer );

    }

    initListeners( )
    {

        this.initLeftClickListeners( ); // single & double.
        this.initRightClickListeners( );
        this.initMovementListeners( );

    }

    initLeftClickListeners( )
    {

        let component = this;

        // single-click on stage.
        // @todo: should this be somewhere else...?
        mabGUI.stage.on( 'click',
            function( event )
            {

                if( event.evt.button === 0 )
                {
                    // if clicking on empty area...
                    if( event.target === mabGUI.stage )
                    {
                        mabGUI.deselectAll( );
                        mabGUI.stage.find( 'Transformer' ).destroy( ); // deselect
                        mabGUI.layer.draw( );
                        return;
                    }
                    // @todo: should this be somewhere else? 
                    // if clicking on a component...
                    if ( event.target.hasName( 'component' ) )
                    {
                        // remove any current selection
                        mabGUI.stage.find( 'Transformer' ).destroy( );
                        var transformer = new Konva.Transformer(
                            { rotateEnabled: false,
                              enabledAnchors: ['middle-right', 'bottom-center', 'bottom-right'] }
                        );
                        event.target.getParent( ).add( transformer );
                        transformer.attachTo( event.target );
                        mabGUI.layer.draw( );
                    }
                }

            }

        );

        // double-click in component.
        this.shape.on( 'dblclick',
            function( event )
            {

                if( event.evt.button === 0 )
                {

                    var transform = component.shape.getParent( ).getAbsoluteTransform( ).copy( );

                    // get relative position
                    transform.invert( );
                    var pos = mabGUI.stage.getPointerPosition( );
                    var placePos = transform.point( pos );

                    component.addPlace( placePos );

                }
            } );

    }

    initRightClickListeners( )
    {

        var component = this;

        // when this component is right-clicked...
        this.shape.on( 'click',
            function( event )
            {
                if( event.evt.button === 2 ) // rmb.
                {

                    component.shape.stroke( 'blue' );
                    component.shape.strokeWidth( 3 );
                    component.shape.draw( );

                    // send signal to driver.js, with name of component to be changed
                    ipcRenderer.send( 'changeComponentDetails-createwindow', component.name );

                }
            }
        );

    }

    initMovementListeners( )
    {

        let component = this;
        let remove = component.remove.bind( this );

        this.shape.on( 'xChange yChange',
            function( )
            {
                component.useSelectionArea.position(
                    { x: component.shape.getX( ),
                      y: component.shape.getY( ) }
                );
                component.useSelectionArea.height( component.shape.getHeight( ) * component.shape.scaleY( ) );

                component.provideSelectionArea.position(
                    { x: component.shape.getX() + ( component.shape.getWidth( ) * component.shape.scaleX( ) ) - 15,
                      y: component.shape.getY() }
                    );
                component.provideSelectionArea.height( component.shape.getHeight( ) * component.shape.scaleY( ) );
            });

        this.group.on( 'dragmove',
            function( )
            {
                component.tooltip.hide( );
                component.tooltipLayer.draw( );
            } );

        this.group.on( 'dragend',
            function( )
            {
                component.group.position(
                    { x: MabGUI.snapCoords( component.group.x( ) ),
                      y: MabGUI.snapCoords( component.group.y( ) ) }
                );
            } );

        this.shape.on( 'mousemove',
            function( )
            {
                var mousePos = mabGUI.stage.getPointerPosition( );
                component.tooltip.position( { x: mousePos.x + 10, y: mousePos.y + 10 } );
                component.tooltip.text( component.name );
                component.tooltip.show( );
            } );

        this.shape.on( 'mouseover',
            function( )
            {
                window.addEventListener( 'keydown', remove );
            } );

        this.shape.on( 'mouseout',
            function( )
            {
                component.shape.stroke( 'black' );
                component.shape.strokeWidth( 1 );
                component.tooltip.hide( );
                component.tooltipLayer.draw( );
                window.removeEventListener( 'keydown', remove );
            });

    }

    getPlace( placeName )
    {
        for( let index = 0; index < this.places.length; index++ )
        {
            if( this.places[ index ].name == placeName )
            {
                return this.places[ index ];
            }
        }
    }

    getTransition( transitionName )
    {
        for( let index = 0; index < this.transitions.length; index++ )
        {
            if( this.transitions[ index ].name == transitionName )
            {
                return this.transitions[ index ];
            }
        }
    }

    getDependency( dependencyName )
    {
        for( let index = 0; index < this.dependencies.length; index++ )
        {
            if( this.dependencies[ index ].name == dependencyName )
            {
                return this.dependencies[ index ];
            }
        }
    }

    addPlace( pos )
    {

        let name = 'Place_' + ( this.places.length + 1 );
        let place = new Place( name, this, pos );
        mabGUI.deselectPlace( );
        mabGUI.stage.batchDraw( );

        return place;

    }

    addDependency( source, serviceData = null )
    {

        if( serviceData == null )
        {
            var serviceData = ipcRenderer.sendSync( 'dependency-servicedataprompt' );
        }

        let dependency = new Dependency( source, serviceData );

        mabGUI.deselectTransition( );
        mabGUI.deselectPlace( );

        mabGUI.stage.batchDraw( );

        return dependency;

    }

    addTransition( source, destination )
    {

        const MAX_TRANSITIONS = 5;

        if( this.validTransition( source, destination ) )
        {

            let name = 'Transition_' + this.transitions.length;
            let func = 'defaultFunction' + this.transitions.length;

            var transition = new Transition( name, source, destination, func );

        } else {
            alert('Can\'t create more than ' + MAX_TRANSITIONS + ' transitions, or create a cycle.');
            return;
        }

        mabGUI.stage.container( ).style.cursor = 'default';
        mabGUI.deselectPlace( );
        destination.shape.stroke( 'black' );
        destination.shape.strokeWidth( 1 );
        mabGUI.stage.batchDraw( );

        return transition;

    }

    // @todo: bugs exist.
    validTransition( source, destination )
    {

        const MAX_TRANSITIONS = 5;

        let name = 'Transition_' + this.transitions.length;
        let func = 'defaultFunction' + this.transitions.length;

        let transition = new Transition( name, source, destination, func );

        if ( source.transitions.out.length > MAX_TRANSITIONS ||
            destination.transitions.in.length > MAX_TRANSITIONS )
        {
            transition.remove( );
            return false;
        }

        if ( source.component != destination.component || source == destination )
        {
            transition.remove( );
            return false;
        }
        if (source.component.transitions.length == 0 )
        {
            transition.remove( );
            return true;
        }

        let roots = source.component.getRoots( );

        if( roots.length == 0 )
        {
            transition.remove( );
            return false;
        }

        for( let rootIndex = 0; rootIndex < roots.length; rootIndex++ )
        {
            let root = roots[ rootIndex ];

            let valid = !this.isCyclic( root );

            if( !valid )
            {
                transition.remove( );
                return false;
            }

        }

        transition.remove( );

        return true;

    }

    // dfs for cycle
    isCyclic( place, visited=[ ] )
    {

        // check for current place in visited list.
        for( let index = 0; index < visited.length; index++ )
        {
            if( visited[ index ] == place )
            {
                return true;
            }
        }

        // place is now visited
        visited.push( place );

        // recurse for each transition out.
        for( let transitionIndex = 0; transitionIndex < place.transitions.out.length; transitionIndex++ )
        {
            let cyclic = this.isCyclic( place.transitions.out[ transitionIndex ].destination, visited );
            visited.pop( );
            if( cyclic ) { return true; }
        }

        return false;

    }

    getRoots( )
    {

        let roots = [ ];

        for( let placeIndex = 0; placeIndex < this.places.length; placeIndex++ )
        {

            if( this.places[ placeIndex ].transitions.in.length == 0 )
            {
                roots.push( this.places[ placeIndex ] );
            } else {
                return roots;
            }

        }

    }

    remove( event )
    {

        if( event != null )
        {

            if( !( event.keyCode == 46 || event.keyCode == 8 ) )
            {
                return;
            }
            
            if( !confirm( 'Are you sure you want to delete this component?' ) )
            {
                return;
            }

        }

        while( this.connections.length != 0 )
        {
            this.connections[ 0 ].remove( );
        }
        while( this.dependencies.length != 0 )
        {
            this.dependencies[ 0 ].remove( );
        }
        while( this.transitions.length != 0 )
        {
            this.transitions[ 0 ].remove( );
        }
        while( this.places.length != 0 )
        {
            this.places[ 0 ].remove( );
        }

        let index = mabGUI.assembly.components.indexOf( this );
        mabGUI.assembly.components.splice( index, 1 );

        this.tooltipLayer.destroy( );
        mabGUI.stage.find( 'Transformer' ).destroy( ); // deselect

        this.group.destroy( );

        mabGUI.stage.batchDraw( );

    }

}

module.export = Component;