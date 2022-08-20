class Dependency {

    constructor( source, serviceData )
    {

        this.type = 'dependency'; // @todo: would typeof (or something similar) be able to make this variable redundant?
        this.name = 'Dependency_' + ( source.component.dependencies.length + 1 );
        this.index = source.component.dependencies.length + 1;

        this.source = source;
        this.serviceData = serviceData; // service dependency v. data dependency

        this.component = source.component;
        this.connections = [];

        this.enabled = false;

        this.initKonva( );
        this.initTooltip( );
        this.initListeners( );

        this.source.dependencies.push( this );
        this.component.dependencies.push( this );

    }

    initKonva( )
    {

        this.initOffset( );

        this.group = new Konva.Group( {
            name: 'dependencyGroup'
        } );

        if( this.serviceData == 'service' )
        {
            this.initServiceKonva( );
        }
        if( this.serviceData == 'data' )
        {
            this.initDataKonva( );
        }

        if( this.source.type == 'place' ) // provide
        {
            this.outerSymbol.opacity( 0 );
        }
        else if( this.source.type == 'transition' ) // use
        {
            this.innerSymbol.opacity( 0 );
        }

        this.group.add( this.line );
        this.group.add( this.stem );
        this.group.add( this.innerSymbol );
        this.group.add( this.outerSymbol );
        this.group.add( this.selectSymbol );
        this.component.group.add( this.group );

        this.source.shape.moveToTop( );
        this.selectSymbol.moveToTop( );

    }

    initServiceKonva( )
    {

        if( this.source.type == 'place' ) // provide
        {
            var anchor = this.source.shape;
            this.symbolDistance = 0; // @todo: better name?
        }
        else if( this.source.type == 'transition' ) // use
        {
            var anchor = this.source.selectShape;
            this.symbolDistance = -15;
        }

        this.line = new Konva.Line( {
            points: [ anchor.getX( ),
                      anchor.getY( ),
                    ( this.component.shape.getX( ) + this.horizontalOffset ),
                      anchor.getY( ) + this.verticalOffset ],
            stroke: 'black', strokeWidth: 1,
            name: 'dependency', dash: [ 10, 5 ], listening: true
        } );
        this.stem = new Konva.Line( {
            points: [ this.component.shape.getX( ) + this.horizontalOffset,
                      anchor.getY( ) + this.verticalOffset,
                    ( this.component.shape.getX( ) + this.horizontalOffset ) + this.stemLength,
                      anchor.getY( ) + this.verticalOffset ],
            stroke: 'black', strokeWidth: 1,
            name: 'stem'
        } );

        this.innerSymbol = new Konva.Circle( {
            x: this.line.points( )[ 2 ] + this.stemLength + this.symbolDistance,
            y: this.line.points( )[ 3 ],
            ShadowBlur: 1, radius: 8,
            stroke: 'black', strokeWidth: 1, fill: 'black'
        } );
        this.outerSymbol = new Konva.Arc( {
            x: this.innerSymbol.getX( ),
            y: this.innerSymbol.getY( ),
            innerRadius: 15, outerRadius: 16,
            angle: 180, rotation: 270,
            stroke: 'black', strokeWidth: 1,
        });

        this.selectSymbol = this.innerSymbol; // circle included in icon; easy to click

    }

    initDataKonva( )
    {

        if( this.source.type == 'place' ) // provide
        {
            var anchor = this.source.shape;
            this.symbolsOffset = 0;
        }
        else if( this.source.type == 'transition' ) // use
        {
            var anchor = this.source.selectShape;
            this.symbolsOffset = 0;
        }

        this.line = new Konva.Line( {
            points: [ anchor.getX( ),
                      anchor.getY( ),
                      this.component.shape.getX( ) + this.horizontalOffset,
                      anchor.getY( ) + this.verticalOffset ],
            stroke: 'black', strokeWidth: 1,
            name: 'dependency', dash: [ 10, 5 ], listening: true
        } );
        this.stem = new Konva.Line( {
            points: [ this.component.shape.getX( ) + this.horizontalOffset,
                      anchor.getY( ) + this.verticalOffset,
                      this.component.shape.getX( ) + this.horizontalOffset + this.stemLength,
                      anchor.getY( ) + this.verticalOffset ],
                      stroke: 'black', strokeWidth: 1,
                      name: 'stem'
        } );

        if( this.source.type == 'place' ) // provide
        {

            // invisible circle for selection
            this.selectSymbol = new Konva.Circle( {
                x: this.line.points( )[ 2 ] + this.stemLength + 5,
                y: this.line.points( )[ 3 ],
                ShadowBlue: 1, radius: 15,
                stroke: 'black', strokeWidth: 1,
                name: 'stub', opacity: 0
            } );

            this.innerSymbol = new Konva.Line( {
                points: [ this.line.points( )[ 2 ] + this.stemLength - 5,
                          this.line.points( )[ 3 ] + 5,
                          this.line.points( )[ 2 ] + this.stemLength,
                          this.line.points( )[ 3 ],
                          this.line.points( )[ 2 ] + this.stemLength - 5,
                          this.line.points( )[ 3 ] - 5 ],
                stroke: 'black', strokeWidth: 2,
                name: 'innerSymbol',
                lineCap: 'round', lineJoin: 'round',
                opacity: 1
            } );
            this.outerSymbol = new Konva.Line( {
                points: [ this.line.points( )[ 2 ] + this.stemLength,
                          this.line.points( )[ 3 ] + 10,
                          this.line.points( )[ 2 ] + this.stemLength + 10,
                          this.line.points( )[ 3 ],
                          this.line.points( )[ 2 ] + this.stemLength,
                          this.line.points( )[ 3 ] - 10 ],
                stroke: 'black', strokeWidth: 1,
                name: 'outerSymbol',
                lineCap: 'round', lineJoin: 'round'
            } );

        } else if( this.source.type == 'transition' ) // use
        {

            // invisible circle for selection
            this.selectSymbol = new Konva.Circle( {
                x: this.line.points( )[ 2 ] + this.stemLength - 5,
                y: this.line.points( )[ 3 ],
                ShadowBlue: 1, radius: 15,
                stroke: 'black', strokeWidth: 1,
                name: 'stub', opacity: 0
            } );

            this.outerSymbol = new Konva.Line( {
                points: [ this.line.points( )[ 2 ] + this.stemLength - 10,
                          this.line.points( )[ 3 ] + 10,
                          this.line.points( )[ 2 ] + this.stemLength,
                          this.line.points( )[ 3 ],
                          this.line.points( )[ 2 ] + this.stemLength - 10,
                          this.line.points( )[ 3 ] - 10 ],
                stroke: 'black', strokeWidth: 2,
                name: 'outerSymbol',
                lineCap: 'round', lineJoin: 'round'
            } );
            this.innerSymbol = new Konva.Line( {
                points: [ this.line.points( )[ 2 ] + this.stemLength - 15,
                          this.line.points( )[ 3 ] + 5,
                          this.line.points( )[ 2 ] + this.stemLength - 10,
                          this.line.points( )[ 3 ],
                          this.line.points( )[ 2 ] + this.stemLength - 15,
                          this.line.points( )[ 3 ] - 5 ],
                stroke: 'black', strokeWidth: 1,
                name: 'innerSymbol',
                lineCap: 'round', lineJoin: 'round',
                opacity: 1
            } );
        }

        this.group.add( this.selectSymbol );

    }

    initOffset( )
    {

        if( this.source.type == 'transition' ) // use
        {
            this.horizontalOffset = 0;
            this.stemLength = -20;
        }
        if( this.source.type == 'place' ) // provide
        {
            this.horizontalOffset = this.component.shape.getWidth( ) * this.component.shape.scaleX( );
            this.stemLength = 20;
        }

        let verticalOffset;
        let parallelOffset = 0;

        if( this.source.type == 'transition' )
        {
            parallelOffset = this.source.offset * 5;
        }

        switch( this.source.dependencies.length )
        {
            case 0:
                verticalOffset = 0;
                break;
            case 1:
                verticalOffset = 50;
                break;
            case 2:
                verticalOffset = -50;
                break;
        }

        verticalOffset += parallelOffset;

        this.verticalOffset = verticalOffset;

    }

    initTooltip( )
    {

        this.tooltip = new Konva.Text( {
            text: '',
            fontFamily: 'Calibri', fontSize: 12,
            textFill: 'white', fill: 'black',
            padding: 5, alpha: 0.75, visible: false
        } );

        this.component.tooltipLayer.add( this.tooltip );

    }

    initListeners( )
    {

        let leftClickListener = this.leftClickListener.bind( this );
        this.selectSymbol.on( 'click', leftClickListener );

        this.initRightClickListeners( );
        this.initMovementListeners( );

    }

    leftClickListener( event )
    {

        if( event.evt.button == 0 )
        {
            if( mabGUI.selectedDependency == this )
            {
                mabGUI.deselectDependency( );
                return;
            }
            mabGUI.deselectDependency( );
            mabGUI.selectDependency( this );
        }

    }

    initRightClickListeners( )
    {
        let dependency = this;

        this.selectSymbol.on( 'click',
            function( event )
            {
                if( event.evt.button == 2 )
                {
                    if( !mabGUI.selectedDependency || mabGUI.selectedDependency == dependency )
                    {
                        mabGUI.deselectDependency( );
                        ipcRenderer.send( 'changeDependencyDetails-createwindow',
                                        dependency.component.name, dependency.name );
                        return;
                    }
                    mabGUI.assembly.addConnection( mabGUI.selectedDependency, dependency );
                    mabGUI.deselectDependency( );
                }
            } );

    }

    initMovementListeners( )
    {

        let dependency = this;
        let remove = this.remove.bind( this );

        if( this.source.type == 'transition' )
        {
            var anchor = this.source.selectShape;
        }
        if( this.source.type == 'place' )
        {
            var anchor = this.source.shape;
        }

        this.selectSymbol.on( 'mousemove',
            function( )
            {
                let mousePos = mabGUI.stage.getPointerPosition( );
                dependency.tooltip.position( {
                    x: mousePos.x + 10,
                    y: mousePos.y + 10
                } );
                dependency.tooltip.text( dependency.component.name + ' - ' + dependency.name );
                dependency.tooltip.show( );
                mabGUI.stage.batchDraw( );
            } );

        this.selectSymbol.on( 'mouseenter',
            function( )
            {
                window.addEventListener( 'keydown', remove );
            } );

        this.selectSymbol.on( 'mouseout',
            function( )
            {
                dependency.tooltip.hide( );
                window.removeEventListener( 'keydown', remove );
                mabGUI.stage.batchDraw( );
            } );

        anchor.on( 'xChange yChange',
            function( )
            {

                dependency.line.setPoints( [ anchor.getX( ),
                                             anchor.getY( ),
                                             dependency.component.shape.getX( ) + dependency.horizontalOffset,
                                             anchor.getY( ) + dependency.verticalOffset ] );
                dependency.stem.setPoints( [ dependency.component.shape.getX( ) + dependency.horizontalOffset,
                                             anchor.getY( ) + dependency.verticalOffset,
                                             ( dependency.component.shape.getX( ) + dependency.horizontalOffset ) + dependency.stemLength,
                                             anchor.getY( ) + dependency.verticalOffset ] );

                if( dependency.serviceData == 'data' )
                {

                    if( dependency.source.type == 'transition' )
                    {
                        dependency.selectSymbol.position( {
                            x: dependency.line.points( )[ 2 ] + dependency.stemLength - 5,
                            y: dependency.line.points( )[ 3 ],
                        } );
                        dependency.outerSymbol.setPoints( [ dependency.line.points( )[ 2 ] + dependency.stemLength - 10,
                                                    dependency.line.points( )[ 3 ] + 10,
                                                    dependency.line.points( )[ 2 ] + dependency.stemLength,
                                                    dependency.line.points( )[ 3 ],
                                                    dependency.line.points( )[ 2 ] + dependency.stemLength - 10,
                                                    dependency.line.points( )[ 3 ] - 10 ] );
                        dependency.innerSymbol.setPoints( [ dependency.line.points( )[ 2 ] + dependency.stemLength - 15,
                                                    dependency.line.points( )[ 3 ] + 5,
                                                    dependency.line.points( )[ 2 ] + dependency.stemLength - 10,
                                                    dependency.line.points( )[ 3 ],
                                                    dependency.line.points( )[ 2 ] + dependency.stemLength - 15,
                                                    dependency.line.points( )[ 3 ] - 5 ] );
                    } else { // place
                        dependency.selectSymbol.position( {
                            x: dependency.line.points( )[ 2 ] + dependency.stemLength + 5,
                            y: dependency.line.points( )[ 3 ]
                        } );
                        dependency.innerSymbol.setPoints( [ dependency.line.points( )[ 2 ] + dependency.stemLength - 5,
                                                    dependency.line.points( )[ 3 ] + 5,
                                                    dependency.line.points( )[ 2 ] + dependency.stemLength,
                                                    dependency.line.points( )[ 3 ],
                                                    dependency.line.points( )[ 2 ] + dependency.stemLength - 5,
                                                    dependency.line.points( )[ 3 ] - 5 ] );
                        dependency.outerSymbol.setPoints( [ dependency.line.points( )[ 2 ] + dependency.stemLength,
                                                    dependency.line.points( )[ 3 ] + 10,
                                                    dependency.line.points( )[ 2 ] + dependency.stemLength + 10,
                                                    dependency.line.points( )[ 3 ],
                                                    dependency.line.points( )[ 2 ] + dependency.stemLength,
                                                    dependency.line.points( )[ 3 ] - 10 ] );

                    }

                } else if( dependency.serviceData == 'service' )
                {

                    dependency.innerSymbol.position( {
                        x: dependency.line.points( )[ 2 ] + dependency.stemLength + dependency.symbolDistance,
                        y: dependency.line.points( )[ 3 ]
                    } );
                    dependency.outerSymbol.position( {
                        x: dependency.innerSymbol.getX( ),
                        y: dependency.innerSymbol.getY( )
                    } );

                }

                if( dependency.innerSymbol != dependency.selectSymbol )
                {
                    dependency.selectSymbol.position( {
                        x: dependency.line.points( )[ 2 ] + dependency.stemLength,
                        y: dependency.line.points( )[ 3 ]
                    } );
                }

            } );

    }

    remove( event )
    {
        if( event != null )
        {

            if( !( event.keyCode == 46 || event.keyCode == 8 ) )
            {
                return;
            }
            
            if( !confirm( 'Are you sure you want to delete this dependency?' ) )
            {
                return;
            }

        }

        while( this.connections.length != 0 )
        {
            this.connections[ 0 ].remove( );
        }

        mabGUI.selectedDependency = null;

        let index = this.source.dependencies.indexOf( this );
        this.source.dependencies.splice( index, 1 );
        index = this.component.dependencies.indexOf( this );
        this.component.dependencies.splice( index, 1 );

        this.tooltip.destroy( );
        this.line.destroy( );
        this.stem.destroy( );
        this.innerSymbol.destroy( );
        this.outerSymbol.destroy( );
        this.group.destroy( );

        let remove = this.remove.bind( this );
        window.removeEventListener( 'keydown', remove );

        mabGUI.stage.batchDraw( );


    }

}

function hideTransitionSelectionArea(source_obj){
    if(source_obj.type != "Transition"){
        return;
    } else {
        if(source_obj.transition_selection_area.opacity() == 1 && source_obj.dependency_count == 0){
            source_obj.transition_selection_area.opacity(0);
        }
    }
}

// Catch new stub name from ipcMain
ipcRenderer.on("stub->renderer", function(event, args) {
    changeStubName(args.component, args.old_name, args.new_name);
});
