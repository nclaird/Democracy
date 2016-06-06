$( document )
    .ready( function () {

      var
          margin = {top: 55, right: 10, bottom: 15, left: 10},
          padding = 10,
          windowWid = $( '.target' )
              .width(),
          windowHt = $( '.target' )
              .height(),

          svgHt = windowHt - margin.top - margin.bottom,
          svgWid = windowWid - margin.left - margin.right,

          toX = d3.scale.linear()
                  .range( [ 0, svgWid ] ),

          toY = d3.scale.linear()
                  .domain( [ 0, 1 ] ) // we already know the domain of this bc we're normalizing
                  .range( [ 0, svgHt ] ),

          target = d3.select( '.target' ),

          svg = target.append( 'svg' )
                      .attr( 'height', svgHt - padding )
                      .attr( 'width', svgWid - padding ),

          dateFormat = d3.time.format( '%Y-%m-%d' ),

          curve = d3.svg.line()
                    .interpolate( "cardinal" )
                    .x( function (d) { return toX( d.date ); } )
                    .y( function (d) { return toY( d.normValue ); } ),

          SELECTED_COMPONENTS = [];


      d3.json( 'assets/data.json', function (err, data) {

        var streams = prepData( data );

        svg.append( 'g' )
            .attr( 'class', 'aggregate' )
            .append( 'path' );

        toX.domain( [ d3.min( d3.values( streams ), function (stream) {
          return d3.min( stream.values, function (d) {return d.date} );
        } ), d3.max( d3.values( streams ), function (stream) {
          return d3.max( stream.values, function (d) {return d.date} );
        } ) ] );


        _.forOwn( streams, function (streamData, streamName) {


          svg.append( 'g' )
             .attr( 'class', streamName )
             .append( 'path' )
             .attr( "d", curve( streamData.values ) );


          /**
           * add hover listeners
           */
          $( '.' + streamName + '.entry' )
              .hover( function () {
                $( 'g.' + streamName )
                    .addClass( 'active' );
              }, function () {
                $( 'g.' + streamName )
                    .removeClass( 'active' );
              } );

          /**
           * add click listeners
           */
          $( '.' + streamName + '.entry .title' )
              .click( function () {
                if (isCurrentlySelected( streamName )) {
                  SELECTED_COMPONENTS = SELECTED_COMPONENTS.filter( function (entry) { return entry.stream !== streamName} );
                  $( '.weight.' + streamName )
                      .removeClass( 'active' )

                } else {
                  SELECTED_COMPONENTS.push( {stream: streamName, weight: 1} );

                  $( '.weight.' + streamName )
                      .addClass( 'active' )
                }

                redrawAggregateStream();

              } );


        } );


        function redrawAggregateStream() {
          //TODO we want to do an attrtween to animate  this instead of removing / redrawing
          svg.selectAll( '.aggregate' )
             .remove();
          
          if (SELECTED_COMPONENTS.length == 0) {
            return;
          }

         var vals = {};

          SELECTED_COMPONENTS.forEach( function (entry, idx) {
            streams[ entry.stream ].values.forEach( function (val) {
              if (!vals.hasOwnProperty(val.date)){
                vals[val.date] = {
                  date: val.date,
                  nums: []
                };
              }
              vals[val.date].nums.push(val.value);
            } )
          } );

          var result = _.transform(vals, function(result, entry, date){
            var avg = _.reduce(entry.nums, function(sum, val){ return sum + val}) / entry.nums.length;

                result.push({
                  date: entry.date,
                  value: avg
                            });

            return result;
          }, []);


          var min = d3.min( result, function (d) { return d.value } ),
              max = d3.max( result, function (d) { return d.value } ),
              normalize = d3.scale.linear()
                            .domain( [ min, max ] )
                            .range( [ 0, 1 ] );


          result.forEach(function(entry){
            entry.normValue = normalize(entry.value);
          });

          svg.append('g').attr('class', 'aggregate')
             .append('path')
             .attr( "d", curve( result ) );


          debugger;




        }


      });




        function isCurrentlySelected(stream) {
          return _.some( SELECTED_COMPONENTS, function (cmp) { return cmp.stream === stream} );
        }


        function addListeners() {


        }


        function prepData(data) {

          var returnVal = {};

          _.forOwn( data.streams, function (entries, key) {

            var min = d3.min( entries, function (d) { return d.value } ),
                max = d3.max( entries, function (d) { return d.value } ),
                normalize = d3.scale.linear()
                              .domain( [ min, max ] )
                              .range( [ 0, 1 ] );

            returnVal[ key ] = {
              title : key,
              values: _.map( entries, function (entry) {
                return {
                  value    : entry.value,
                  normValue: normalize( entry.value ),
                  date     : dateFormat.parse( entry.date )
                }
              } )
            }
          } );
          return returnVal;
        }


      } );


