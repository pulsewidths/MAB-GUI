class Connection
{

    constructor( provide, use )
    {

        this.provide = provide;
        this.use = use;

        this.provideOffset = 15;
        this.useOffset = -10;

        this.initKonva( );
        this.initListeners( );

        this.provide.connections.push( this );
        this.use.connections.push( this );
        this.provide.component.connections.push( this );
        this.use.component.connections.push( this );

    }

    initKonva( )
    {

        let midpoint = this.getMidpoint( );

        let points = [ this.provide.selectSymbol.getAbsolutePosition( ).x + this.provideOffset - 5,
            this.provide.selectSymbol.getAbsolutePosition( ).y,
            midpoint.x,
            this.provide.selectSymbol.getAbsolutePosition( ).y,
            midpoint.x,
            this.use.selectSymbol.getAbsolutePosition( ).y,
            this.use.selectSymbol.getAbsolutePosition( ).x + this.useOffset,
            this.use.selectSymbol.getAbsolutePosition( ).y ];

        this.shape = new Konva.Line( {
            points: points,
            stroke: 'black', strokeWidth: 1,
            name: 'connection',
            lineCap: 'round', lineJoin: 'round'
        } );

        this.gate1 = new Konva.Line( {
            points: this.getPointsGate1( ),
            stroke: 'black', strokeWidth: 1,
            name: 'gate',
            lineCap: 'round', lineJoin: 'round', tension: 0,
            opacity: 1
        } );
        this.gate2 = new Konva.Line( {
            points: this.getPointsGate2( ),
            stroke: 'black', strokeWidth: 1,
            name: 'gate',
            lineCap: 'round', lineJoin: 'round', tension: 0,
            opacity: 1
        } );

        this.group = new Konva.Group( {
            name: 'group'
        })

        this.provide.outerSymbol.opacity( 1 );
        this.use.innerSymbol.opacity( 1 );

        this.group.add( this.shape );
        this.group.add( this.gate1 );
        this.group.add( this.gate2 );

        mabGUI.layer.add( this.group );

    }

    initListeners( )
    {

        let updateShapes = this.updateShapes.bind( this );

        this.provide.selectSymbol.on( 'xChange yChange', updateShapes );
        this.use.selectSymbol.on( 'xChange yChange', updateShapes );
        this.provide.component.group.on( 'xChange yChange', updateShapes  );
        this.use.component.group.on( 'xChange yChange', updateShapes );

    }

    updateShapes( )
    {
        let midpoint = this.getMidpoint( );
        
        let points = [ this.provide.selectSymbol.getAbsolutePosition( ).x + this.provideOffset - 5,
            this.provide.selectSymbol.getAbsolutePosition( ).y,
            midpoint.x,
            this.provide.selectSymbol.getAbsolutePosition( ).y,
            midpoint.x,
            this.use.selectSymbol.getAbsolutePosition( ).y,
            this.use.selectSymbol.getAbsolutePosition( ).x + this.useOffset,
            this.use.selectSymbol.getAbsolutePosition( ).y ];

        this.shape.setPoints( points);

        this.gate1.setPoints( this.getPointsGate1( ) );
        this.gate2.setPoints( this.getPointsGate2( ) );

    }

    // @todo: can this be placed somewhere better? or abstracted? x1+x2/2, y1+y2/2?
    getMidpoint( )
    {

        let x = ( this.provide.selectSymbol.getAbsolutePosition( ).x + this.provideOffset + this.use.selectSymbol.getAbsolutePosition( ).x ) / 2;
        let y = ( this.provide.selectSymbol.getAbsolutePosition( ).y + this.use.selectSymbol.getAbsolutePosition( ).y ) / 2;


        return { x: x, y: y };

    }

    // @todo: could these be abstracted better?
    getPointsGate1( )
    {

        let points = [ ];
        let midpoint = this.getMidpoint( );
        
        if( this.provide.selectSymbol.getAbsolutePosition( ).y > this.use.selectSymbol.getAbsolutePosition( ).y ||
            this.provide.selectSymbol.getAbsolutePosition( ).y < this.use.selectSymbol.getAbsolutePosition( ).y )
        { // for vertical connection
            points = [ midpoint.x - 15, midpoint.y + 5, midpoint.x + 15, midpoint.y + 5 ];
        } else { // for horizontal connection
            points = [ midpoint.x - 5, midpoint.y - 15, midpoint.x - 5, midpoint.y + 15 ];
        }

        return points;

    }

    getPointsGate2( )
    {

        let points = [ ];
        let midpoint = this.getMidpoint( );

        if( this.provide.selectSymbol.getAbsolutePosition( ).y > this.use.selectSymbol.getAbsolutePosition( ).y ||
            this.provide.selectSymbol.getAbsolutePosition( ).y < this.use.selectSymbol.getAbsolutePosition( ).y )
        {
            // for vertical connection
            points = [ midpoint.x - 15, midpoint.y - 5, midpoint.x + 15, midpoint.y - 5 ];
        } else {
            // for horizontal connection
            points = [ midpoint.x + 5, midpoint.y - 15, midpoint.x + 5, midpoint.y + 15 ];
        }

        return points;

    }

    remove( )
    {

        let index = this.provide.connections.indexOf( this );
        this.provide.connections.splice( index, 1 );

        index = this.use.connections.indexOf( this );
        this.use.connections.splice( index, 1 );

        index = this.provide.component.connections.indexOf( this );
        this.provide.component.connections.splice( index, 1 );

        index = this.use.component.connections.indexOf( this );
        this.use.component.connections.splice( index, 1 );

        this.provide.outerSymbol.opacity( 0 );
        this.use.innerSymbol.opacity( 0 );

        this.group.destroy( );

    }



}