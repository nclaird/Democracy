$( document )
    .ready( function () {


      var margin = {top: 5, right: 5, bottom: 5, left: 5},
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
                      .attr( 'height', svgHt )
                      .attr( 'width', svgWid ),

          dateFormat = d3.time.format( '%Y-%m-%d' ),

          curve = d3.svg.line()
                    .interpolate( "cardinal" )
                    .x( function (d) { return toX( d.date ); } )
                    .y( function (d) { return toY( d.normValue ); } ),


          OFFICIAL,
          AGGREGATE;


      /**
       * Data shape:
       {
         streams: [
         {
           name: Twitter
           values: [ {date, num}  ]

         }

         ]

      * }
       *
       * **/

      d3.json( 'assets/data.json', function (err, data) {

        var streams = prepData( data );

        toX.domain( [ d3.min( d3.values( streams ), function (stream) {
          return d3.min( stream.values, function (d) {return d.date} );
        } ), d3.max( d3.values( streams ), function (stream) {
          return d3.max( stream.values, function (d) {return d.date} );
        } ) ] );


        OFFICIAL = svg.append('g')
            .attr('class', 'official')
           .append('path')
                .attr( "d", curve(streams.official.values));


      } );

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

      function mergeStreams(toMerge, mergeInto, weight) {

      }

      function drawStream(stream) {
        var g = svg.append( 'g' )
                   .attr( 'class', '.stream-' + stream.name );
      }


    } );

