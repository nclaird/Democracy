$( document )
    .ready( function () {

      var
          margin = {top: 55, right: 10, bottom: 50, left: 10},
          padding = 5,

          windowWid = $( document )
              .width(),
          windowHt = $( document )
              .height(),

          svgHt = windowHt - margin.top - margin.bottom,
          svgWid = windowWid - margin.left - margin.right,

          toX = d3.scale.linear()
                  .range( [ 0, svgWid - padding ] ),

          toY = d3.scale.linear()
                  .domain( [ 0, 1 ] ) // we already know the domain of this bc we're normalizing
                  .range( [ svgHt - padding, 0 ] ),

          target = d3.select( '.target' ),

          svg = target.append( 'svg' )
                      .attr( 'height', svgHt )
                      .attr( 'width', svgWid ),

          dateFormat = d3.time.format( '%Y-%m-%d' ),

          curve = d3.svg.line()
                    .interpolate( "basis" )
                    .x( function (d) { return toX( d.date ); } )
                    .y( function (d) { return toY( d.normValue ); } ),

          SELECTED_COMPONENTS = [];


      d3.json( 'data/data-final.json', function (err, data) {

        var streams = prepData( data ),
            dateMaps = makeDateMaps(streams);
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
             .attr( 'class', 'stream ' + streamName )
             .append( 'path' )
             .attr( "d", curve( streamData.values ) );


          /**
           * add hover listeners
           */
          $( '.' + streamName + '.entry' )
              .hover( function () {
                    $( 'g.' + streamName ).addClass( 'visible' );
                    $( '.target' ).addClass( 'hovered' )
                  }, function () {

                    $( 'g.' + streamName ).removeClass( 'visible' );
                    $( '.target' )
                        .removeClass( 'hovered' );

                  }
              );

          /**
           * add click listeners
           */
          $( '.' + streamName + '.entry .title' )
              .click( function () {
                if (isCurrentlySelected( streamName )) {
                  //we're removing it from the equation
                  SELECTED_COMPONENTS = SELECTED_COMPONENTS.filter( function (entry) { return entry.stream !== streamName} );
                  $( '.weight.' + streamName )
                      .removeClass( 'active' )

                } else {
                  //we're adding it to the equation
                  SELECTED_COMPONENTS.push( {stream: streamName, weight: 1} );
                  $( '.weight.' + streamName )
                      .addClass( 'active' )
                  $( '.title.' + streamName )
                      .addClass( 'active' )
                }

                redrawAggregateStream();

              } );
/*
            $('.weight.' + streamName).change(function(change){
              SELECTED_COMPONENTS = _.map(SELECTED_COMPONENTS, function(comp){
                if (comp.stream == streamName){
                  return {
                    stream: comp.stream,
                    weight: parseInt($( '.weight.' + streamName ).val())
                  }
                } else return comp;
              })
            })*/




        } );


        function redrawAggregateStream() {
          //TODO we want to do an attrtween to animate  this instead of removing / redrawing
          svg.selectAll( '.aggregate' )
             .remove();

          if (SELECTED_COMPONENTS.length == 0) {
            return;
          }

          //temporary hack to only use shared dates
          var sharedDates = _.intersection(_.map(SELECTED_COMPONENTS, function(comp){
            return _.map(streams[comp.stream].values, function(entry){return entry.date})
          }))[0];


          var result = _.map(sharedDates, function(date){
            var values = _.reduce(SELECTED_COMPONENTS, function(result, comp){
              for (var i = 0; i < comp.weight; i++){
                result.push(dateMaps[comp.stream][date]);
              }
              return result;
            }, []);

            var mergedValue = _.reduce(values, function(sum, next){return sum + next}) / values.length;
            return {
              date: date,
              value: mergedValue,
              normValue:  mergedValue //they're already normalized
            }
          });


          svg.append( 'g' ).attr( 'class', 'aggregate' )
             .append( 'path' )
             .attr( "d", curve( result ) );




        }


      } );


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
            } ).sort( function (x, y) {return x.date - y.date} )
          }
        } );
        debugger;

        return returnVal;
      }

      function makeDateMaps(streams){
        return _.reduce(streams, function(outerResult, stream){
          outerResult[stream.title] = _.reduce(stream.values, function(innerResult, val){
            innerResult[val.date] = val.normValue;
            return innerResult;
          }, {});
          return outerResult;
        }, {})
      }


    } );


