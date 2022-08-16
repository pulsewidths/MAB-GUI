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

        this.provide.component.connections.provide.push( this );
        this.use.component.connections.use.push( this );

    }

    initKonva( )
    {

        let midpoint = this.getMidpoint( );

        this.shape = new Konva.Line( {
            points: [ this.provide.stub.getAbsolutePosition( ).x + this.provideOffset,
                      this.provide.stub.getAbsolutePosition( ).y,
                      midpoint.x,
                      this.provide.stub.getAbsolutePosition( ).y,
                      midpoint.x,
                      this.use.stub.getAbsolutePosition( ).y,
                      this.use.stub.getAbsolutePosition( ).x + this.useOffset,
                      this.use.stub.getAbsolutePosition( ).y ],
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

        this.provide.symbol.opacity( 1 );
        this.use.stub.opacity( 1 );

        this.group.add( this.shape );
        this.group.add( this.gate1 );
        this.group.add( this.gate2 );

        mabGUI.layer.add( this.group );

    }

    initListeners( )
    {

        let updateShapes = this.updateShapes.bind( this );

        this.provide.stub.on( 'xChange yChange', updateShapes ); // shape?
        this.use.stub.on( 'xChange yChange', updateShapes ); // shape?
        this.provide.component.group.on( 'xChange yChange', updateShapes  );
        this.use.component.group.on( 'xChange yChange', updateShapes );

    }

    updateShapes( )
    {

        let midpoint = this.getMidpoint( );

        this.shape.setPoints( [ this.provide.stub.getAbsolutePosition( ).x + this.provideOffset,
                                this.provide.stub.getAbsolutePosition( ).y,
                                midpoint.x,
                                this.provide.stub.getAbsolutePosition( ).y,
                                midpoint.x,
                                this.use.stub.getAbsolutePosition( ).y,
                                this.use.stub.getAbsolutePosition( ).x + this.useOffset,
                                this.use.stub.getAbsolutePosition( ).y ] );

        this.gate1.setPoints( this.getPointsGate1( ) );
        this.gate2.setPoints( this.getPointsGate2( ) );

    }

    // @todo: can this be placed somewhere better? or abstracted? x1+x2/2, y1+y2/2?
    getMidpoint( )
    {

        let x = ( this.provide.stub.getAbsolutePosition( ).x + this.provideOffset + this.use.stub.getAbsolutePosition( ).x + this.useOffset ) / 2;
        let y = ( this.provide.stub.getAbsolutePosition( ).y + this.use.stub.getAbsolutePosition( ).y ) / 2;

        return { x: x, y: y };

    }

    // @todo: could these be abstracted better?
    getPointsGate1( )
    {

        let points = [ ];
        let midpoint = this.getMidpoint( );
        
        if( this.provide.stub.getAbsolutePosition( ).y > this.use.stub.getAbsolutePosition( ).y ||
            this.provide.stub.getAbsolutePosition( ).y < this.use.stub.getAbsolutePosition( ).y )
        {
            points = [ midpoint.x - 15, midpoint.y + 5, midpoint.x + 15, midpoint.y + 5 ];
        } else {
            points = [ midpoint.x - 5, midpoint.y - 15, midpoint.x - 5, midpoint.y + 15 ];
        }

        return points;

    }

    getPointsGate2( )
    {

        let points = [ ];
        let midpoint = this.getMidpoint( );
        if( this.provide.stub.getAbsolutePosition( ).y > this.use.stub.getAbsolutePosition( ).y ||
            this.provide.stub.getAbsolutePosition( ).y < this.use.stub.getAbsolutePosition( ).y )
        {
            points = [ midpoint.x - 15, midpoint.y - 5, midpoint.x + 15, midpoint.y - 5 ];
        } else {
            points = [ midpoint.x + 5, midpoint.y - 15, midpoint.x + 5, midpoint.y + 15 ];
        }
        return points;

    }



}